import { SetMetadata } from '@nestjs/common';

export const REQUIRE_SUBSCRIPTION_KEY = 'requireSubscription';

export interface SubscriptionRequirement {
  /** Enforce plan resource limits (vans/drivers/students) on create routes */
  checkLimits?: 'vans' | 'drivers' | 'students';
  /** Require analytics feature on plan */
  requireAnalytics?: boolean;
}

export const RequireSubscription = (requirement: SubscriptionRequirement = {}) =>
  SetMetadata(REQUIRE_SUBSCRIPTION_KEY, requirement);
