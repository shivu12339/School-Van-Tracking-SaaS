import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BillingStatus,
  PlanTier,
  SchoolOperationalStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantCacheService } from '../../common/tenant/tenant-cache.service';
import { TenantRedisTtl } from '../../common/tenant/tenant-redis.keys';
import { AssignSubscriptionDto } from '../dto/assign-subscription.dto';
import { SubscriptionStatusView } from '../types/subscription-status.type';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantCache: TenantCacheService,
    private readonly configService: ConfigService,
  ) {}

  async listPlanCatalog() {
    return this.prisma.planCatalog.findMany({ orderBy: { monthlyPrice: 'asc' } });
  }

  async getPlanCatalog(tier: PlanTier) {
    const plan = await this.prisma.planCatalog.findUnique({ where: { tier } });
    if (!plan) {
      throw new NotFoundException(`Plan ${tier} not found`);
    }
    return plan;
  }

  async getSubscriptionStatus(schoolId: string): Promise<SubscriptionStatusView> {
    const cached = await this.tenantCache.get<SubscriptionStatusView>(schoolId, 'subscription:status');
    if (cached) {
      return cached;
    }

    const school = await this.prisma.school.findFirst({
      where: { id: schoolId, deletedAt: null },
      include: {
        subscription: { include: { planCatalog: true } },
      },
    });
    if (!school?.subscription) {
      throw new BadRequestException('School has no subscription');
    }

    const sub = school.subscription;
    const plan = sub.planCatalog;
    const now = new Date();
    const usage = await this.getResourceCounts(schoolId);

    const inTrial = sub.billingStatus === BillingStatus.TRIAL;
    const isExpired = Boolean(sub.endsAt && sub.endsAt < now);
    const inGracePeriod = Boolean(
      isExpired && sub.graceEndsAt && sub.graceEndsAt > now,
    );
    const cancelled = sub.billingStatus === BillingStatus.CANCELLED;
    const schoolInactive =
      !school.isActive ||
      school.status === SchoolOperationalStatus.SUSPENDED ||
      school.status === SchoolOperationalStatus.PENDING;

    let canAccessPlatform = !schoolInactive && !cancelled;
    let message: string | undefined;

    if (schoolInactive) {
      canAccessPlatform = false;
      message = 'School is not active';
    } else if (cancelled) {
      canAccessPlatform = false;
      message = 'Subscription cancelled';
    } else if (isExpired && !inGracePeriod) {
      canAccessPlatform = false;
      message = 'Subscription expired';
    } else if (inGracePeriod) {
      message = 'Subscription in grace period';
    } else if (inTrial && sub.trialEndsAt && sub.trialEndsAt < now) {
      canAccessPlatform = false;
      message = 'Trial period ended';
    }

    const view: SubscriptionStatusView = {
      schoolId,
      planTier: plan.tier,
      billingStatus: sub.billingStatus,
      canAccessPlatform,
      inTrial,
      inGracePeriod,
      isExpired,
      trialEndsAt: sub.trialEndsAt,
      endsAt: sub.endsAt,
      graceEndsAt: sub.graceEndsAt,
      message,
      features: {
        maxVans: plan.maxVans,
        maxDrivers: plan.maxDrivers,
        maxStudents: plan.maxStudents,
        trackingLogsPerDay: plan.trackingLogsPerDay,
        analyticsEnabled: plan.analyticsEnabled,
      },
      usage,
    };

    await this.tenantCache.set(
      schoolId,
      'subscription:status',
      view,
      TenantRedisTtl.subscriptionStatusSeconds,
    );
    return view;
  }

  async assertActiveSubscription(schoolId: string): Promise<void> {
    const status = await this.getSubscriptionStatus(schoolId);
    if (!status.canAccessPlatform) {
      throw new BadRequestException(status.message ?? 'Subscription inactive');
    }
  }

  async assertWithinLimits(
    schoolId: string,
    resource: 'vans' | 'drivers' | 'students',
  ): Promise<void> {
    await this.assertActiveSubscription(schoolId);
    const status = await this.getSubscriptionStatus(schoolId);
    const { features, usage } = status;

    if (resource === 'vans' && usage.vans >= features.maxVans) {
      throw new BadRequestException('Van limit reached for current plan');
    }
    if (resource === 'drivers' && usage.drivers >= features.maxDrivers) {
      throw new BadRequestException('Driver limit reached for current plan');
    }
    if (resource === 'students' && usage.students >= features.maxStudents) {
      throw new BadRequestException('Student limit reached for current plan');
    }
  }

  async assertAnalyticsEnabled(schoolId: string): Promise<void> {
    const status = await this.getSubscriptionStatus(schoolId);
    if (!status.features.analyticsEnabled) {
      throw new BadRequestException('Analytics not available on current plan');
    }
  }

  private async getResourceCounts(schoolId: string) {
    const cached = await this.tenantCache.get<{ vans: number; drivers: number; students: number }>(
      schoolId,
      'usage:counts',
    );
    if (cached) {
      return cached;
    }

    const [vans, drivers, students] = await this.prisma.$transaction([
      this.prisma.van.count({ where: { schoolId, deletedAt: null } }),
      this.prisma.driver.count({ where: { schoolId, deletedAt: null } }),
      this.prisma.student.count({ where: { schoolId, deletedAt: null } }),
    ]);
    const counts = { vans, drivers, students };
    await this.tenantCache.set(schoolId, 'usage:counts', counts, TenantRedisTtl.usageCountsSeconds);
    return counts;
  }

  async assignSubscription(schoolId: string, dto: AssignSubscriptionDto) {
    const plan = await this.getPlanCatalog(dto.planTier);
    const graceDays = this.configService.get<number>('saas.defaultGracePeriodDays', 7);
    const startsAt = new Date();

    let graceEndsAt = dto.graceEndsAt ? new Date(dto.graceEndsAt) : null;
    if (!graceEndsAt && dto.endsAt) {
      graceEndsAt = new Date(new Date(dto.endsAt).getTime() + graceDays * 86_400_000);
    }

    const subscription = await this.prisma.schoolSubscription.upsert({
      where: { schoolId },
      update: {
        planCatalogId: plan.id,
        billingStatus: dto.billingStatus ?? BillingStatus.ACTIVE,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        graceEndsAt,
      },
      create: {
        schoolId,
        planCatalogId: plan.id,
        billingStatus: dto.billingStatus ?? BillingStatus.ACTIVE,
        startsAt,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        graceEndsAt,
      },
      include: { planCatalog: true },
    });

    await this.tenantCache.invalidateSchool(schoolId);
    return subscription;
  }

  async createTrialSubscription(
    schoolId: string,
    planTier: PlanTier,
    trialDays: number,
  ): Promise<void> {
    const plan = await this.getPlanCatalog(planTier);
    const trialEndsAt = new Date(Date.now() + trialDays * 86_400_000);
    const graceEndsAt = new Date(
      trialEndsAt.getTime() +
        this.configService.get<number>('saas.defaultGracePeriodDays', 7) * 86_400_000,
    );

    await this.prisma.schoolSubscription.create({
      data: {
        schoolId,
        planCatalogId: plan.id,
        billingStatus: BillingStatus.TRIAL,
        startsAt: new Date(),
        trialEndsAt,
        endsAt: trialEndsAt,
        graceEndsAt,
      },
    });
    await this.prisma.school.update({
      where: { id: schoolId },
      data: {
        status: SchoolOperationalStatus.TRIAL,
        trialEndsAt,
      },
    });
    await this.tenantCache.invalidateSchool(schoolId);
  }
}
