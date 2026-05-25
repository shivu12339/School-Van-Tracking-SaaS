import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, RoleCode, TripDirection, TripStatus } from '@prisma/client';
import { TrackingNotificationService } from '../../notifications/services/tracking-notification.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../auth/types/auth-user.type';
import { AuditLogService } from '../../auth/services/audit-log.service';
import { FleetAssignmentService } from '../../fleet/services/fleet-assignment.service';
import { TrackingCacheService } from '../redis/tracking-cache.service';
import { TripLifecycleValidator } from '../../common/trips/trip-lifecycle.validator';

@Injectable()
export class TripSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trackingCache: TrackingCacheService,
    private readonly auditLogService: AuditLogService,
    private readonly trackingNotifications: TrackingNotificationService,
    private readonly fleetAssignment: FleetAssignmentService,
  ) {}

  private async getDriverForUser(user: AuthUser) {
    const driver = await this.prisma.driver.findFirst({
      where: { userId: user.id, schoolId: user.schoolId ?? undefined },
    });
    if (!driver) throw new ForbiddenException('Driver profile not found');
    return driver;
  }

  async startTrip(user: AuthUser, tripId: string) {
    if (user.role !== RoleCode.DRIVER) {
      throw new ForbiddenException('Only drivers can start trips');
    }
    const driver = await this.getDriverForUser(user);
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, schoolId: user.schoolId!, driverId: driver.id },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.status === TripStatus.IN_PROGRESS) {
      throw new BadRequestException('Trip already in progress');
    }
    TripLifecycleValidator.assertTransition(trip.status, TripStatus.IN_PROGRESS);
    await this.fleetAssignment.assertNoActiveTripForDriver(user.schoolId!, driver.id);
    await this.fleetAssignment.assertNoActiveTripForVan(user.schoolId!, trip.vanId);

    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data: { status: TripStatus.IN_PROGRESS, startedAt: new Date() },
    });
    await this.trackingCache.setDriverOnline(user.schoolId!, driver.id, true);
    await this.auditLogService.log({
      schoolId: user.schoolId,
      actorUserId: user.id,
      action: AuditAction.START_TRIP,
      entityType: 'trip',
      entityId: tripId,
    });
    void this.trackingNotifications.onTripStarted(
      user.schoolId!,
      tripId,
      trip.direction as TripDirection,
    );
    return updated;
  }

  async stopTrip(user: AuthUser, tripId: string) {
    if (user.role !== RoleCode.DRIVER) {
      throw new ForbiddenException('Only drivers can stop trips');
    }
    const driver = await this.getDriverForUser(user);
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, schoolId: user.schoolId!, driverId: driver.id },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    TripLifecycleValidator.assertTransition(trip.status, TripStatus.COMPLETED);

    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data: { status: TripStatus.COMPLETED, endedAt: new Date() },
    });
    await this.trackingCache.clearActiveTrip(user.schoolId!, tripId, driver.id);
    await this.trackingCache.setDriverOnline(user.schoolId!, driver.id, false);
    await this.auditLogService.log({
      schoolId: user.schoolId,
      actorUserId: user.id,
      action: AuditAction.STOP_TRIP,
      entityType: 'trip',
      entityId: tripId,
    });
    void this.trackingNotifications.onTripCompleted(
      user.schoolId!,
      tripId,
      trip.direction as TripDirection,
    );
    return updated;
  }

  async assertActiveDriverTrip(user: AuthUser, tripId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        status: TripStatus.IN_PROGRESS,
        schoolId: user.schoolId ?? undefined,
      },
      include: { van: true, driver: true },
    });
    if (!trip) throw new BadRequestException('Trip is not active');

    if (user.role === RoleCode.DRIVER) {
      const driver = await this.getDriverForUser(user);
      if (trip.driverId !== driver.id) {
        throw new ForbiddenException('Trip is not assigned to this driver');
      }
    }
    return trip;
  }
}
