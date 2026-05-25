import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AuditAction, RoleCode } from '@prisma/client';
import { AuthService } from '../../auth/services/auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../auth/services/audit-log.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { TenantCacheService } from '../../common/tenant/tenant-cache.service';
import { AuthUser } from '../../auth/types/auth-user.type';
import { AssignSubscriptionDto } from '../dto/assign-subscription.dto';
import { CreateSchoolDto } from '../dto/create-school.dto';
import { ListSchoolsQueryDto } from '../dto/list-schools-query.dto';
import { UpdateSchoolDto } from '../dto/update-school.dto';
import { UpdateSchoolStatusDto } from '../dto/update-school-status.dto';
import { SchoolsRepository } from '../repositories/schools.repository';
import { SchoolOnboardingService } from './school-onboarding.service';
import { SchoolAnalyticsService } from './school-analytics.service';
import { SubscriptionService } from './subscription.service';
import { SchoolSettingsService } from './school-settings.service';
import { UpdateSchoolSettingsDto } from '../dto/update-school-settings.dto';

@Injectable()
export class SchoolsService {
  constructor(
    private readonly schoolsRepository: SchoolsRepository,
    private readonly onboardingService: SchoolOnboardingService,
    private readonly subscriptionService: SubscriptionService,
    private readonly analyticsService: SchoolAnalyticsService,
    private readonly tenantContext: TenantContextService,
    private readonly tenantCache: TenantCacheService,
    private readonly auditLogService: AuditLogService,
    private readonly authService: AuthService,
    private readonly schoolSettingsService: SchoolSettingsService,
    private readonly prisma: PrismaService,
  ) {}

  listPlans() {
    return this.subscriptionService.listPlanCatalog();
  }

  getSubscriptionStatus(user: AuthUser, schoolId: string) {
    const scopedId = this.tenantContext.resolveSchoolId(user, schoolId);
    return this.subscriptionService.getSubscriptionStatus(scopedId);
  }

  create(dto: CreateSchoolDto, actor: AuthUser) {
    this.tenantContext.assertSuperAdmin(actor);
    return this.onboardingService.onboard(dto, actor);
  }

  async findAll(user: AuthUser, query: ListSchoolsQueryDto) {
    const [items, total] = await this.schoolsRepository.findMany(user, query);
    return {
      items,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
      },
    };
  }

  async findOne(user: AuthUser, schoolId: string) {
    const school = await this.schoolsRepository.findById(user, schoolId);
    if (!school) {
      throw new NotFoundException('School not found');
    }
    return school;
  }

  async update(user: AuthUser, schoolId: string, dto: UpdateSchoolDto) {
    const scopedId = this.tenantContext.resolveSchoolId(user, schoolId);
    if (user.role !== RoleCode.SUPER_ADMIN && user.role !== RoleCode.SCHOOL_ADMIN) {
      throw new ForbiddenException('Insufficient permissions to update school');
    }
    const school = await this.schoolsRepository.update(scopedId, dto);
    await this.tenantCache.invalidateSchool(scopedId);
    await this.auditLogService.log({
      schoolId: scopedId,
      actorUserId: user.id,
      action: AuditAction.UPDATE,
      entityType: 'school',
      entityId: scopedId,
    });
    return school;
  }

  async updateStatus(user: AuthUser, schoolId: string, dto: UpdateSchoolStatusDto) {
    this.tenantContext.assertSuperAdmin(user);
    const school = await this.schoolsRepository.update(schoolId, {
      status: dto.status,
      isActive: dto.isActive ?? dto.status === 'ACTIVE',
    });
    await this.tenantCache.invalidateSchool(schoolId);
    return school;
  }

  async assignSubscription(user: AuthUser, schoolId: string, dto: AssignSubscriptionDto) {
    this.tenantContext.assertSuperAdmin(user);
    await this.findOne(user, schoolId);
    return this.subscriptionService.assignSubscription(schoolId, dto);
  }

  getAnalytics(user: AuthUser, schoolId: string) {
    return this.analyticsService.getSchoolAnalytics(user, schoolId);
  }

  getSuperAdminAnalytics(user: AuthUser) {
    this.tenantContext.assertSuperAdmin(user);
    return this.analyticsService.getSuperAdminDashboard();
  }

  async updateSettings(user: AuthUser, schoolId: string, dto: UpdateSchoolSettingsDto) {
    const scopedId = this.tenantContext.resolveSchoolId(user, schoolId);
    const settings = await this.schoolSettingsService.update(scopedId, dto);
    await this.auditLogService.log({
      schoolId: scopedId,
      actorUserId: user.id,
      action: AuditAction.UPDATE,
      entityType: 'school_settings',
      entityId: scopedId,
    });
    return settings;
  }

  async remove(user: AuthUser, schoolId: string) {
    this.tenantContext.assertSuperAdmin(user);
    await this.findOne(user, schoolId);
    const school = await this.schoolsRepository.softDelete(schoolId);
    await this.tenantCache.invalidateSchool(schoolId);
    await this.auditLogService.log({
      schoolId,
      actorUserId: user.id,
      action: AuditAction.DELETE,
      entityType: 'school',
      entityId: schoolId,
    });
    return school;
  }

  async impersonate(user: AuthUser, schoolId: string, meta: { ipAddress?: string; userAgent?: string }) {
    this.tenantContext.assertSuperAdmin(user);
    const school = await this.findOne(user, schoolId);
    const admin = await this.prisma.user.findFirst({
      where: {
        schoolId: school.id,
        userRoles: { some: { role: { code: RoleCode.SCHOOL_ADMIN } } },
        isActive: true,
      },
    });
    if (!admin) {
      throw new NotFoundException('School admin user not found');
    }

    return this.authService.impersonateSchoolAdmin(user, admin.id, meta);
  }
}
