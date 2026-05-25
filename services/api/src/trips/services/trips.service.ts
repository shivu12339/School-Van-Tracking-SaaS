import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, TripDirection, TripStatus } from '@prisma/client';
import { AuditLogService } from '../../auth/services/audit-log.service';
import { AuthUser } from '../../auth/types/auth-user.type';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { FleetAssignmentService } from '../../fleet/services/fleet-assignment.service';
import { FleetCacheService } from '../../fleet/services/fleet-cache.service';
import { buildPaginatedResult } from '../../fleet/utils/paginated-result.util';
import { PrismaService } from '../../prisma/prisma.service';
import { TrackingCacheService } from '../../tracking/redis/tracking-cache.service';
import { CreateTripDto } from '../dto/create-trip.dto';
import { ListTripsQueryDto } from '../dto/list-trips-query.dto';
import { ScheduleTripsDto } from '../dto/schedule-trips.dto';
import { UpdateTripDto } from '../dto/update-trip.dto';
import { TripsRepository } from '../repositories/trips.repository';
import { TripLifecycleValidator } from '../validators/trip-lifecycle.validator';
import { buildTripAnalytics } from '../utils/trip-analytics.util';
import { canTransition } from '../../common/trips/trip-state-machine';

@Injectable()
export class TripsService {
  constructor(
    private readonly tripsRepository: TripsRepository,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly fleetAssignment: FleetAssignmentService,
    private readonly fleetCache: FleetCacheService,
    private readonly auditLogService: AuditLogService,
    private readonly trackingCache: TrackingCacheService,
  ) {}

  async list(user: AuthUser, query: ListTripsQueryDto) {
    const [items, total] = await this.tripsRepository.findMany(user, query);
    return buildPaginatedResult(items, total, query.page ?? 1, query.limit ?? 20);
  }

  async getById(user: AuthUser, tripId: string) {
    const trip = await this.tripsRepository.findById(user, tripId);
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  async getActive(user: AuthUser) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const tripIds = await this.trackingCache.listActiveTripIds(schoolId);
    if (tripIds.length === 0) {
      const dbActive = await this.prisma.trip.findMany({
        where: { schoolId, status: TripStatus.IN_PROGRESS, deletedAt: null },
        include: {
          van: { select: { id: true, registrationNo: true, label: true } },
          driver: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });
      return dbActive;
    }

    const trips = await Promise.all(
      tripIds.map((id) => this.tripsRepository.findById(user, id)),
    );
    return trips.filter(Boolean);
  }

  async create(user: AuthUser, dto: CreateTripDto) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    await this.fleetAssignment.assertRouteBelongsToSchool(schoolId, dto.routeId);
    await this.fleetAssignment.assertVanBelongsToSchool(schoolId, dto.vanId);
    await this.fleetAssignment.assertDriverBelongsToSchool(schoolId, dto.driverId);

    const route = await this.prisma.route.findFirstOrThrow({
      where: { id: dto.routeId, schoolId, deletedAt: null },
    });

    const duplicate = await this.prisma.trip.findFirst({
      where: {
        schoolId,
        routeId: dto.routeId,
        driverId: dto.driverId,
        direction: dto.direction,
        tripDate: new Date(dto.tripDate),
        deletedAt: null,
        status: { not: TripStatus.CANCELLED },
      },
    });
    if (duplicate) {
      throw new ConflictException('A trip already exists for this route, driver, date, and direction');
    }

    const trip = await this.prisma.$transaction(async (tx) => {
      const created = await tx.trip.create({
        data: {
          schoolId,
          routeId: dto.routeId,
          vanId: dto.vanId,
          driverId: dto.driverId,
          tripDate: new Date(dto.tripDate),
          direction: dto.direction,
          status: TripStatus.SCHEDULED,
        },
      });

      const studentIds =
        dto.students?.map((s) => s.studentId) ??
        (
          await tx.student.findMany({
            where: { schoolId, routeId: route.id, deletedAt: null },
            select: { id: true },
          })
        ).map((s) => s.id);

      if (studentIds.length > 0) {
        await tx.tripStudent.createMany({
          data: studentIds.map((studentId) => {
            const assign = dto.students?.find((s) => s.studentId === studentId);
            return {
              schoolId,
              tripId: created.id,
              studentId,
              stopId: assign?.stopId,
            };
          }),
          skipDuplicates: true,
        });
      }

      return created;
    });

    await this.auditLogService.log({
      schoolId,
      actorUserId: user.id,
      action: AuditAction.CREATE,
      entityType: 'trip',
      entityId: trip.id,
    });

    return this.getById(user, trip.id);
  }

  async update(user: AuthUser, tripId: string, dto: UpdateTripDto) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const existing = await this.getById(user, tripId);

    if (dto.status && dto.status !== existing.status) {
      TripLifecycleValidator.assertTransition(existing.status, dto.status);
    } else if (existing.status !== TripStatus.SCHEDULED) {
      TripLifecycleValidator.assertSchedulable(existing.status);
    }

    if (dto.driverId) {
      await this.fleetAssignment.assertSchoolEntity(
        schoolId,
        () =>
          this.prisma.driver.findFirst({
            where: { id: dto.driverId, schoolId, deletedAt: null },
          }),
        'Driver',
      );
    }
    if (dto.vanId) {
      await this.fleetAssignment.assertSchoolEntity(
        schoolId,
        () => this.prisma.van.findFirst({ where: { id: dto.vanId, schoolId, deletedAt: null } }),
        'Van',
      );
    }
    if (dto.routeId) {
      await this.fleetAssignment.assertSchoolEntity(
        schoolId,
        () => this.prisma.route.findFirst({ where: { id: dto.routeId, schoolId, deletedAt: null } }),
        'Route',
      );
    }

    await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        ...(dto.routeId ? { routeId: dto.routeId } : {}),
        ...(dto.vanId ? { vanId: dto.vanId } : {}),
        ...(dto.driverId ? { driverId: dto.driverId } : {}),
        ...(dto.tripDate ? { tripDate: new Date(dto.tripDate) } : {}),
        ...(dto.direction ? { direction: dto.direction } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
    });

    return this.getById(user, tripId);
  }

  async cancel(user: AuthUser, tripId: string) {
    const trip = await this.getById(user, tripId);
    if (!canTransition(trip.status, TripStatus.CANCELLED)) {
      throw new BadRequestException(`Cannot cancel trip in status ${trip.status}`);
    }
    if (trip.status === TripStatus.IN_PROGRESS) {
      throw new BadRequestException('Stop an in-progress trip before cancelling');
    }

    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data: { status: TripStatus.CANCELLED },
    });

    await this.trackingCache.clearActiveTrip(trip.schoolId, tripId);
    return updated;
  }

  async scheduleDaily(user: AuthUser, dto: ScheduleTripsDto) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const route = await this.prisma.route.findFirst({
      where: { id: dto.routeId, schoolId, deletedAt: null, isActive: true },
      include: { van: true },
    });
    if (!route) throw new NotFoundException('Route not found');

    const vanId = dto.vanId ?? route.vanId;
    if (!vanId) {
      throw new BadRequestException('Route must have a van assigned before scheduling trips');
    }
    let driverId = dto.driverId;
    if (!driverId) {
      driverId = (await this.fleetCache.getVanDriverAssignment(schoolId, vanId)) ?? undefined;
    }
    if (!driverId) {
      throw new BadRequestException(
        'Assign a driver to the van (or pass driverId) before scheduling trips',
      );
    }

    const tripDate = new Date(dto.tripDate);
    const legs: TripDirection[] = [TripDirection.PICKUP, TripDirection.DROPOFF];
    const created: string[] = [];

    for (const direction of legs) {
      const exists = await this.prisma.trip.findFirst({
        where: {
          schoolId,
          routeId: route.id,
          direction,
          tripDate,
          deletedAt: null,
          status: { not: TripStatus.CANCELLED },
        },
      });
      if (exists) continue;

      const trip = await this.create(user, {
        routeId: route.id,
        vanId,
        driverId,
        tripDate: tripDate.toISOString(),
        direction,
      });
      created.push(trip.id);
    }

    return { createdCount: created.length, tripIds: created };
  }

  async analytics(user: AuthUser, from?: string, to?: string) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const rangeFrom = from ? new Date(from) : new Date(new Date().setDate(1));
    const rangeTo = to ? new Date(to) : new Date();
    const rows = await this.tripsRepository.countByStatus(schoolId, rangeFrom, rangeTo);
    return buildTripAnalytics(rows);
  }
}
