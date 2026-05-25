/**
 * Tenant-isolated Redis key patterns.
 * All hot paths MUST include schoolId to prevent cross-tenant cache bleed.
 */
export const TenantRedisKeys = {
  schoolPrefix: (schoolId: string) => `school:${schoolId}`,

  activeTrips: (schoolId: string) => `school:${schoolId}:activeTrips`,
  activeTrip: (schoolId: string, tripId: string) => `school:${schoolId}:activeTrip:${tripId}`,

  tracking: (schoolId: string) => `school:${schoolId}:tracking`,
  tripLocation: (schoolId: string, tripId: string) => `school:${schoolId}:trip:${tripId}:loc`,

  driverOnline: (schoolId: string, driverId: string) =>
    `school:${schoolId}:driver:${driverId}:online`,
  driversOnlineSet: (schoolId: string) => `school:${schoolId}:drivers:online`,

  parentEta: (schoolId: string, tripId: string, studentId: string) =>
    `school:${schoolId}:eta:${tripId}:${studentId}`,

  analyticsDashboard: (schoolId: string) => `school:${schoolId}:analytics:dashboard`,
  platformAnalytics: () => 'platform:analytics:dashboard',

  subscriptionStatus: (schoolId: string) => `school:${schoolId}:subscription:status`,
  usageCounts: (schoolId: string) => `school:${schoolId}:usage:counts`,
} as const;

export const TenantRedisTtl = {
  analyticsSeconds: 60,
  platformAnalyticsSeconds: 120,
  subscriptionStatusSeconds: 300,
  usageCountsSeconds: 120,
  driverOnlineSeconds: 90,
} as const;
