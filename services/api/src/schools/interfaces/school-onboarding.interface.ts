import { type PlanTier } from '@prisma/client';

export interface SchoolOnboardingInput {
  code: string;
  name: string;
  email?: string;
  phone?: string;
  timezone?: string;
  address?: string;
  planTier: PlanTier;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName?: string;
  trialDays?: number;
}
