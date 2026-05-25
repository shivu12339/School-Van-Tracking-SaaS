import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, RoleCode } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuditLogService } from '../../auth/services/audit-log.service';
import { AuthUser } from '../../auth/types/auth-user.type';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { buildPaginatedResult } from '../../fleet/utils/paginated-result.util';
import { FleetSearchQueryDto } from '../../fleet/dto/search-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateParentDto } from '../dto/create-parent.dto';
import { UpdateParentDto } from '../dto/update-parent.dto';
import { ParentsRepository } from '../repositories/parents.repository';

@Injectable()
export class ParentsService {
  constructor(
    private readonly parentsRepository: ParentsRepository,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(user: AuthUser, dto: CreateParentDto) {
    const schoolId = this.tenantContext.resolveSchoolId(user);

    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), schoolId },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const parent = await this.prisma.$transaction(async (tx) => {
      let role = await tx.role.findFirst({
        where: { schoolId, code: RoleCode.PARENT, deletedAt: null },
      });
      if (!role) {
        role = await tx.role.create({
          data: { schoolId, code: RoleCode.PARENT, name: 'Parent', isSystem: true },
        });
      }

      const createdUser = await tx.user.create({
        data: {
          schoolId,
          email: dto.email.toLowerCase(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.emergencyContact ?? dto.phone,
          isActive: true,
        },
      });

      await tx.userRoleAssignment.create({
        data: { schoolId, userId: createdUser.id, roleId: role.id },
      });

      const profile = await tx.parent.create({
        data: {
          schoolId,
          userId: createdUser.id,
          relationship: dto.relationship,
        },
        include: { user: true, students: true },
      });

      await tx.notificationPreference.create({
        data: { userId: createdUser.id, schoolId, enabled: true },
      });

      return profile;
    });

    await this.auditLogService.log({
      schoolId,
      actorUserId: user.id,
      action: AuditAction.CREATE,
      entityType: 'parent',
      entityId: parent.id,
    });
    return parent;
  }

  async findAll(user: AuthUser, query: FleetSearchQueryDto) {
    const [items, total] = await this.parentsRepository.findMany(user, query);
    return buildPaginatedResult(items, total, query.page, query.limit);
  }

  async findOne(user: AuthUser, id: string) {
    const parent = await this.parentsRepository.findById(user, id);
    if (!parent) {
      throw new NotFoundException('Parent not found');
    }
    return parent;
  }

  async update(user: AuthUser, id: string, dto: UpdateParentDto) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const parent = await this.parentsRepository.findById(user, id);
    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    await this.prisma.user.update({
      where: { id: parent.userId },
      data: {
        ...(dto.firstName ? { firstName: dto.firstName } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      },
    });

    const updated = await this.prisma.parent.update({
      where: { id },
      data: {
        ...(dto.relationship !== undefined ? { relationship: dto.relationship } : {}),
      },
      include: { user: true, students: { where: { deletedAt: null } } },
    });

    await this.auditLogService.log({
      schoolId,
      actorUserId: user.id,
      action: AuditAction.UPDATE,
      entityType: 'parent',
      entityId: id,
    });
    return updated;
  }

  async remove(user: AuthUser, id: string) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const parent = await this.parentsRepository.findById(user, id);
    if (!parent) {
      throw new NotFoundException('Parent not found');
    }
    const childCount = await this.prisma.student.count({
      where: { parentId: id, deletedAt: null },
    });
    if (childCount > 0) {
      throw new ConflictException('Cannot delete parent with linked students');
    }

    await this.prisma.parent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.prisma.user.update({
      where: { id: parent.userId },
      data: { isActive: false },
    });

    await this.auditLogService.log({
      schoolId,
      actorUserId: user.id,
      action: AuditAction.DELETE,
      entityType: 'parent',
      entityId: id,
    });
    return { success: true };
  }
}
