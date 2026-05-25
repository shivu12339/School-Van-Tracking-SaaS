import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoleCode, TripStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantCacheService } from '../../common/tenant/tenant-cache.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { TenantRedisTtl } from '../../common/tenant/tenant-redis.keys';
import { AuthUser } from '../../auth/types/auth-user.type';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class SchoolAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly tenantCache: TenantCacheService,
    private readonly subscriptionService: SubscriptionService,
    private readonly configService: ConfigService,
  ) {}

  async getSuperAdminDashboard() {
    const cached = await this.tenantCache.get<Record<string, number>>(
      'platform',
      'analytics:dashboard',
    );
    if (cached) {
      return cached;
    }
    const [totalSchools, activeSchools, activeTrips, driversOnline] =
      await this.prisma.$transaction([
        this.prisma.school.count({ where: { deletedAt: null } }),
        this.prisma.school.count({
          where: { deletedAt: null, isActive: true, status: 'ACTIVE' },
        }),
        this.prisma.trip.count({ where: { status: TripStatus.IN_PROGRESS } }),
        this.prisma.driver.count({ where: { isAvailable: true, deletedAt: null } }),
      ]);

    const subscriptions = await this.prisma.schoolSubscription.findMany({
      include: { planCatalog: true },
    });
    const revenue = subscriptions.reduce(
      (sum, sub) => sum + Number(sub.planCatalog.monthlyPrice),
      0,
    );

    const dashboard = {
      totalSchools,
      activeSchools,
      activeTrips,
      driversOnline,
      estimatedMonthlyRevenue: revenue,
    };
    const ttl = this.configService.get<number>(
      'saas.platformAnalyticsCacheTtlSeconds',
      TenantRedisTtl.platformAnalyticsSeconds,
    );
    await this.tenantCache.set('platform', 'analytics:dashboard', dashboard, ttl);
    return dashboard;
  }

  async getSchoolDashboard(user: AuthUser, requestedSchoolId?: string) {
    const schoolId = this.tenantContext.resolveSchoolId(user, requestedSchoolId);
    await this.subscriptionService.assertAnalyticsEnabled(schoolId);

    const cacheKey = 'analytics:dashboard';
    const cached = await this.tenantCache.get<Record<string, number>>(schoolId, cacheKey);
    if (cached) {
      return cached;
    }

    const school = await this.prisma.school.findFirst({
      where: { id: schoolId, deletedAt: null },
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    const [activeVans, studentsOnboard, activeDrivers, activeTrips, completedTripsToday] =
      await this.prisma.$transaction([
        this.prisma.van.count({
          where: { schoolId, isActive: true, deletedAt: null },
        }),
        this.prisma.student.count({ where: { schoolId, deletedAt: null } }),
        this.prisma.driver.count({
          where: { schoolId, isAvailable: true, deletedAt: null },
        }),
        this.prisma.trip.count({
          where: { schoolId, status: TripStatus.IN_PROGRESS },
        }),
        this.prisma.trip.count({
          where: {
            schoolId,
            status: TripStatus.COMPLETED,
            endedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        }),
      ]);

    const dashboard = {
      activeVans,
      studentsOnboard,
      activeDrivers,
      activeTrips,
      completedTripsToday,
    };
    const ttl = this.configService.get<number>(
      'saas.analyticsCacheTtlSeconds',
      TenantRedisTtl.analyticsSeconds,
    );
    await this.tenantCache.set(schoolId, cacheKey, dashboard, ttl);
    return dashboard;
  }

  async getSchoolAnalytics(user: AuthUser, schoolId: string) {
    if (user.role !== RoleCode.SUPER_ADMIN) {
      this.tenantContext.resolveSchoolId(user, schoolId);
    }
    return this.getSchoolDashboard(user, schoolId);
  }
}
