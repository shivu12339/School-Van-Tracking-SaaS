import { type BillingStatus, type PlanTier } from '@prisma/client';

export interface SubscriptionStatusView {
  schoolId: string;
  planTier: PlanTier;
  billingStatus: BillingStatus;
  canAccessPlatform: boolean;
  inTrial: boolean;
  inGracePeriod: boolean;
  isExpired: boolean;
  trialEndsAt: Date | null;
  endsAt: Date | null;
  graceEndsAt: Date | null;
  message?: string;
  features: {
    maxVans: number;
    maxDrivers: number;
    maxStudents: number;
    trackingLogsPerDay: number;
    analyticsEnabled: boolean;
  };
  usage: {
    vans: number;
    drivers: number;
    students: number;
  };
}
