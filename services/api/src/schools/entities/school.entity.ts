import { type BillingStatus, type PlanTier, type SchoolOperationalStatus } from '@prisma/client';

export interface SchoolEntity {
  id: string;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  timezone: string;
  address: string | null;
  language: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  status: SchoolOperationalStatus;
  isActive: boolean;
  trialEndsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SchoolSubscriptionEntity {
  planTier: PlanTier;
  billingStatus: BillingStatus;
  startsAt: Date;
  endsAt: Date | null;
  graceEndsAt: Date | null;
  trialEndsAt: Date | null;
  limits: {
    maxVans: number;
    maxDrivers: number;
    maxStudents: number;
    trackingLogsPerDay: number;
    analyticsEnabled: boolean;
  };
}
