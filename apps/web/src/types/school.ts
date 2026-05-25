export type SchoolStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
export type PlanTier = 'BASIC' | 'STANDARD' | 'PREMIUM';
export type BillingStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'GRACE';

export interface School {
  id: string;
  code: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status: SchoolStatus;
  isActive: boolean;
  timezone?: string;
  address?: string | null;
  createdAt: string;
  subscription?: {
    billingStatus: BillingStatus;
    endsAt?: string | null;
    planCatalog?: { tier: PlanTier; monthlyPrice: string | number };
  } | null;
}

export interface PlatformAnalytics {
  totalSchools: number;
  activeSchools: number;
  activeTrips: number;
  driversOnline: number;
  estimatedMonthlyRevenue: number;
}

export interface SchoolDashboardAnalytics {
  activeVans: number;
  studentsOnboard: number;
  activeDrivers: number;
  activeTrips: number;
  completedTripsToday: number;
}
