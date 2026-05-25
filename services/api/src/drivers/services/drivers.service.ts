import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, RoleCode } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuditLogService } from '../../auth/services/audit-log.service';
import { AuthUser } from '../../auth/types/auth-user.type';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { FleetAssignmentService } from '../../fleet/services/fleet-assignment.service';
import { FleetCacheService } from '../../fleet/services/fleet-cache.service';
import { buildPaginatedResult } from '../../fleet/utils/paginated-result.util';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionService } from '../../schools/services/subscription.service';
import { CreateDriverDto } from '../dto/create-driver.dto';
import {
  AssignDriverRouteDto,
  AssignDriverVanDto,
  UpdateDriverDto,
  UpdateDriverStatusDto,
} from '../dto/update-driver.dto';
import { ListDriversQueryDto } from '../dto/list-drivers-query.dto';
import { DriversRepository } from '../repositories/drivers.repository';

@Injectable()
export class DriversService {
  constructor(
    private readonly driversRepository: DriversRepository,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly subscriptionService: SubscriptionService,
    private readonly fleetAssignment: FleetAssignmentService,
    private readonly fleetCache: FleetCacheService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(user: AuthUser, dto: CreateDriverDto) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    await this.subscriptionService.assertWithinLimits(schoolId, 'drivers');

    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), schoolId },
    });
    if (existing) {
      throw new ConflictException('Email already registered for this school');
    }

    const licenseTaken = await this.prisma.driver.findFirst({
      where: { schoolId, licenseNumber: dto.licenseNumber, deletedAt: null },
    });
    if (licenseTaken) {
      throw new ConflictException('License number already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const driver = await this.prisma.$transaction(async (tx) => {
      let role = await tx.role.findFirst({
        where: { schoolId, code: RoleCode.DRIVER, deletedAt: null },
      });
      if (!role) {
        role = await tx.role.create({
          data: {
            schoolId,
            code: RoleCode.DRIVER,
            name: 'Driver',
            isSystem: true,
          },
        });
      }

      const createdUser = await tx.user.create({
        data: {
          schoolId,
          email: dto.email.toLowerCase(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          isActive: true,
        },
      });

      await tx.userRoleAssignment.create({
        data: { schoolId, userId: createdUser.id, roleId: role.id },
      });

      return tx.driver.create({
        data: {
          schoolId,
          userId: createdUser.id,
          licenseNumber: dto.licenseNumber,
          licenseValidTill: dto.licenseValidTill ? new Date(dto.licenseValidTill) : null,
          employeeCode: dto.employeeCode,
          isAvailable: true,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      });
    });

    await this.auditLogService.log({
      schoolId,
      actorUserId: user.id,
      action: AuditAction.CREATE,
      entityType: 'driver',
      entityId: driver.id,
    });

    return driver;
  }

  async findAll(user: AuthUser, query: ListDriversQueryDto) {
    const [items, total] = await this.driversRepository.findMany(user, query);
    return buildPaginatedResult(items, total, query.page, query.limit);
  }

  async findOne(user: AuthUser, id: string) {
    const driver = await this.driversRepository.findById(user, id);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const assignedVanId = await this.fleetCache.getDriverVanAssignment(schoolId, id);
    return { ...driver, assignedVanId };
  }

  async update(user: AuthUser, id: string, dto: UpdateDriverDto) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const driver = await this.driversRepository.findById(user, id);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (dto.licenseNumber && dto.licenseNumber !== driver.licenseNumber) {
      const taken = await this.prisma.driver.findFirst({
        where: {
          schoolId,
          licenseNumber: dto.licenseNumber,
          deletedAt: null,
          id: { not: id },
        },
      });
      if (taken) {
        throw new ConflictException('License number already exists');
      }
    }

    await this.prisma.user.update({
      where: { id: driver.userId },
      data: {
        ...(dto.firstName ? { firstName: dto.firstName } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      },
    });

    const updated = await this.driversRepository.update(schoolId, id, {
      ...(dto.licenseNumber ? { licenseNumber: dto.licenseNumber } : {}),
      ...(dto.licenseValidTill
        ? { licenseValidTill: new Date(dto.licenseValidTill) }
        : {}),
      ...(dto.employeeCode !== undefined ? { employeeCode: dto.employeeCode } : {}),
      ...(dto.isAvailable !== undefined ? { isAvailable: dto.isAvailable } : {}),
    });

    await this.auditLogService.log({
      schoolId,
      actorUserId: user.id,
      action: AuditAction.UPDATE,
      entityType: 'driver',
      entityId: id,
    });

    return updated;
  }

  async updateStatus(user: AuthUser, id: string, dto: UpdateDriverStatusDto) {
    if (dto.isAvailable === false) {
      const schoolId = this.tenantContext.resolveSchoolId(user);
      await this.fleetAssignment.assertNoActiveTripForDriver(schoolId, id);
    }
    return this.update(user, id, { isAvailable: dto.isAvailable });
  }

  async assignVan(user: AuthUser, id: string, dto: AssignDriverVanDto) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    await this.driversRepository.findById(user, id);
    return this.fleetAssignment.assignDriverToVan(schoolId, id, dto.vanId);
  }

  async assignRoute(user: AuthUser, id: string, dto: AssignDriverRouteDto) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const driver = await this.driversRepository.findById(user, id);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    const route = await this.prisma.route.findFirst({
      where: { id: dto.routeId, schoolId, deletedAt: null },
    });
    if (!route) {
      throw new NotFoundException('Route not found');
    }
    return { driverId: id, routeId: dto.routeId, note: 'Driver-route link applies to scheduled trips' };
  }

  async remove(user: AuthUser, id: string) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    await this.fleetAssignment.assertNoActiveTripForDriver(schoolId, id);
    const driver = await this.driversRepository.findById(user, id);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    await this.prisma.driver.update({
      where: { id },
      data: { deletedAt: new Date(), isAvailable: false },
    });
    await this.prisma.user.update({
      where: { id: driver.userId },
      data: { isActive: false },
    });
    await this.fleetCache.clearDriverVanAssignment(schoolId, id);
    await this.auditLogService.log({
      schoolId,
      actorUserId: user.id,
      action: AuditAction.DELETE,
      entityType: 'driver',
      entityId: id,
    });
    return { success: true };
  }
}
