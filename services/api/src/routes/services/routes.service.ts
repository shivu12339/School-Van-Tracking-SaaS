import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { AuditLogService } from '../../auth/services/audit-log.service';
import { AuthUser } from '../../auth/types/auth-user.type';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { FleetAssignmentService } from '../../fleet/services/fleet-assignment.service';
import { FleetCacheService } from '../../fleet/services/fleet-cache.service';
import { buildPaginatedResult } from '../../fleet/utils/paginated-result.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRouteDto } from '../dto/create-route.dto';
import { CreateRouteStopDto, ReorderRouteStopsDto } from '../dto/create-route-stop.dto';
import { ListRoutesQueryDto } from '../dto/list-routes-query.dto';
import { UpdateRouteDto } from '../dto/update-route.dto';
import { RoutesRepository } from '../repositories/routes.repository';

@Injectable()
export class RoutesService {
  constructor(
    private readonly routesRepository: RoutesRepository,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly fleetAssignment: FleetAssignmentService,
    private readonly fleetCache: FleetCacheService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(user: AuthUser, dto: CreateRouteDto) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const exists = await this.prisma.route.findFirst({
      where: { schoolId, routeCode: dto.routeCode, deletedAt: null },
    });
    if (exists) {
      throw new ConflictException('Route code already exists');
    }

    const route = await this.prisma.route.create({
      data: {
        schoolId,
        routeCode: dto.routeCode,
        routeName: dto.routeName,
        direction: dto.direction,
        vanId: dto.vanId,
        isActive: true,
      },
      include: { van: true, stops: true },
    });

    await this.auditLogService.log({
      schoolId,
      actorUserId: user.id,
      action: AuditAction.CREATE,
      entityType: 'route',
      entityId: route.id,
    });
    return route;
  }

  async findAll(user: AuthUser, query: ListRoutesQueryDto) {
    const [items, total] = await this.routesRepository.findMany(user, query);
    return buildPaginatedResult(items, total, query.page, query.limit);
  }

  async findOne(user: AuthUser, id: string) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const cached = await this.fleetCache.getRouteDetail(schoolId, id);
    if (cached) {
      return cached;
    }

    const route = await this.routesRepository.findById(user, id);
    if (!route) {
      throw new NotFoundException('Route not found');
    }

    const enriched = {
      ...route,
      analytics: {
        studentCount: route.students.length,
        stopCount: route.stops.length,
      },
    };
    await this.fleetCache.setRouteDetail(schoolId, id, enriched);
    return enriched;
  }

  async update(user: AuthUser, id: string, dto: UpdateRouteDto) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const route = await this.routesRepository.findById(user, id);
    if (!route) {
      throw new NotFoundException('Route not found');
    }

    if (dto.routeCode && dto.routeCode !== route.routeCode) {
      const taken = await this.prisma.route.findFirst({
        where: { schoolId, routeCode: dto.routeCode, deletedAt: null, id: { not: id } },
      });
      if (taken) {
        throw new ConflictException('Route code already exists');
      }
    }

    if (dto.vanId) {
      const assigned = await this.fleetAssignment.assignVanToRoute(schoolId, id, dto.vanId);
      await this.auditLogService.log({
        schoolId,
        actorUserId: user.id,
        action: AuditAction.UPDATE,
        entityType: 'route',
        entityId: id,
        metadata: { vanAssigned: true },
      });
      return assigned;
    }

    const data: Prisma.RouteUpdateInput = {
      ...(dto.routeCode ? { routeCode: dto.routeCode } : {}),
      ...(dto.routeName ? { routeName: dto.routeName } : {}),
      ...(dto.direction ? { direction: dto.direction } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    };

    const updated = await this.prisma.route.update({
      where: { id },
      data,
      include: { van: true, stops: { where: { deletedAt: null }, orderBy: { stopOrder: 'asc' } } },
    });

    await this.fleetCache.invalidateRoute(schoolId, id);
    await this.auditLogService.log({
      schoolId,
      actorUserId: user.id,
      action: AuditAction.UPDATE,
      entityType: 'route',
      entityId: id,
    });
    return updated;
  }

  async addStop(user: AuthUser, routeId: string, dto: CreateRouteStopDto) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const route = await this.routesRepository.findById(user, routeId);
    if (!route) {
      throw new NotFoundException('Route not found');
    }

    this.fleetAssignment.validateStopCoordinates(dto.stopLatitude, dto.stopLongitude);

    const orderTaken = await this.prisma.routeStop.findFirst({
      where: { routeId, stopOrder: dto.stopOrder, deletedAt: null },
    });
    if (orderTaken) {
      throw new ConflictException(`Stop order ${dto.stopOrder} already exists`);
    }

    const stop = await this.prisma.routeStop.create({
      data: {
        schoolId,
        routeId,
        stopName: dto.stopName,
        stopOrder: dto.stopOrder,
        stopLatitude: dto.stopLatitude,
        stopLongitude: dto.stopLongitude,
      },
    });

    await this.fleetCache.invalidateRoute(schoolId, routeId);
    return stop;
  }

  async reorderStops(user: AuthUser, routeId: string, dto: ReorderRouteStopsDto) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    await this.routesRepository.findById(user, routeId);

    await this.prisma.$transaction(
      dto.stopIds.map((stopId, index) =>
        this.prisma.routeStop.update({
          where: { id: stopId, routeId, schoolId },
          data: { stopOrder: index + 1 },
        }),
      ),
    );

    await this.fleetCache.invalidateRoute(schoolId, routeId);
    return this.findOne(user, routeId);
  }

  async removeStop(user: AuthUser, routeId: string, stopId: string) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const stop = await this.prisma.routeStop.findFirst({
      where: { id: stopId, routeId, schoolId, deletedAt: null },
    });
    if (!stop) {
      throw new NotFoundException('Stop not found');
    }
    await this.prisma.routeStop.update({
      where: { id: stopId },
      data: { deletedAt: new Date() },
    });
    await this.fleetCache.invalidateRoute(schoolId, routeId);
    return { success: true };
  }

  async remove(user: AuthUser, id: string) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const route = await this.routesRepository.findById(user, id);
    if (!route) {
      throw new NotFoundException('Route not found');
    }

    const activeTrips = await this.prisma.trip.count({
      where: { routeId: id, status: 'IN_PROGRESS' },
    });
    if (activeTrips > 0) {
      throw new ConflictException('Route has active trips');
    }

    await this.prisma.route.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    await this.fleetCache.invalidateRoute(schoolId, id);
    await this.auditLogService.log({
      schoolId,
      actorUserId: user.id,
      action: AuditAction.DELETE,
      entityType: 'route',
      entityId: id,
    });
    return { success: true };
  }
}
