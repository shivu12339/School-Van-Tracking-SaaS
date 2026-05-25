import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditLogService } from '../../auth/services/audit-log.service';
import { AuthUser } from '../../auth/types/auth-user.type';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { FleetAssignmentService } from '../../fleet/services/fleet-assignment.service';
import { buildPaginatedResult } from '../../fleet/utils/paginated-result.util';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionService } from '../../schools/services/subscription.service';
import { FleetSearchQueryDto } from '../../fleet/dto/search-query.dto';
import { CreateVanDto } from '../dto/create-van.dto';
import { AssignVanRouteDto, UpdateVanDto } from '../dto/update-van.dto';
import { VansRepository } from '../repositories/vans.repository';

@Injectable()
export class VansService {
  constructor(
    private readonly vansRepository: VansRepository,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly subscriptionService: SubscriptionService,
    private readonly fleetAssignment: FleetAssignmentService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(user: AuthUser, dto: CreateVanDto) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    await this.subscriptionService.assertWithinLimits(schoolId, 'vans');

    const exists = await this.prisma.van.findFirst({
      where: { schoolId, registrationNo: dto.registrationNo, deletedAt: null },
    });
    if (exists) {
      throw new ConflictException('Registration number already exists');
    }

    const van = await this.prisma.van.create({
      data: {
        schoolId,
        registrationNo: dto.registrationNo,
        label: dto.label,
        capacity: dto.capacity,
        gpsDeviceCode: dto.gpsDeviceCode,
        isActive: true,
      },
    });

    await this.auditLogService.log({
      schoolId,
      actorUserId: user.id,
      action: AuditAction.CREATE,
      entityType: 'van',
      entityId: van.id,
    });
    return van;
  }

  async findAll(user: AuthUser, query: FleetSearchQueryDto & { isActive?: boolean }) {
    const [items, total] = await this.vansRepository.findMany(user, query);
    return buildPaginatedResult(items, total, query.page, query.limit);
  }

  async findOne(user: AuthUser, id: string) {
    const van = await this.vansRepository.findById(user, id);
    if (!van) {
      throw new NotFoundException('Van not found');
    }
    return van;
  }

  async update(user: AuthUser, id: string, dto: UpdateVanDto) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const van = await this.vansRepository.findById(user, id);
    if (!van) {
      throw new NotFoundException('Van not found');
    }

    if (dto.registrationNo && dto.registrationNo !== van.registrationNo) {
      const taken = await this.prisma.van.findFirst({
        where: {
          schoolId,
          registrationNo: dto.registrationNo,
          deletedAt: null,
          id: { not: id },
        },
      });
      if (taken) {
        throw new ConflictException('Registration number already exists');
      }
    }

    if (dto.capacity && dto.capacity < van.capacity) {
      const studentsOnRoutes = await this.prisma.student.count({
        where: { schoolId, route: { vanId: id }, deletedAt: null },
      });
      if (studentsOnRoutes > dto.capacity) {
        throw new ConflictException('Capacity cannot be less than assigned students');
      }
    }

    const updated = await this.vansRepository.update(schoolId, id, dto);
    await this.auditLogService.log({
      schoolId,
      actorUserId: user.id,
      action: AuditAction.UPDATE,
      entityType: 'van',
      entityId: id,
    });
    return updated;
  }

  async assignRoute(user: AuthUser, id: string, dto: AssignVanRouteDto) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    return this.fleetAssignment.assignVanToRoute(schoolId, dto.routeId, id);
  }

  async remove(user: AuthUser, id: string) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    await this.fleetAssignment.assertNoActiveTripForVan(schoolId, id);
    const van = await this.vansRepository.findById(user, id);
    if (!van) {
      throw new NotFoundException('Van not found');
    }
    await this.prisma.van.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    await this.auditLogService.log({
      schoolId,
      actorUserId: user.id,
      action: AuditAction.DELETE,
      entityType: 'van',
      entityId: id,
    });
    return { success: true };
  }
}
