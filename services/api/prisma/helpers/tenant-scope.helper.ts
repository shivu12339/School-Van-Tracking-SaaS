/** Models that always require `schoolId` on tenant-scoped reads/writes */
export const TENANT_SCOPED_MODELS = new Set<string>([
  'SubscriptionPlan',
  'Driver',
  'Parent',
  'Student',
  'Van',
  'Route',
  'RouteStop',
  'Trip',
  'TripStudent',
  'TrackingLog',
  'Notification',
  'EmergencyAlert',
]);

export function isTenantScopedModel(model?: string): boolean {
  return Boolean(model && TENANT_SCOPED_MODELS.has(model));
}

export function mergeSchoolIdWhere<T extends Record<string, unknown>>(
  where: T | undefined,
  schoolId: string,
): T & { schoolId: string } {
  return { ...(where ?? {}), schoolId } as T & { schoolId: string };
}

export function assertSchoolIdOnCreate(
  data: Record<string, unknown>,
  schoolId: string,
): Record<string, unknown> {
  if (data.schoolId && data.schoolId !== schoolId) {
    throw new Error('Cross-tenant schoolId injection blocked');
  }
  return { ...data, schoolId };
}

export type TenantBypassFlag = { bypassTenantScope?: boolean };

export function shouldBypassTenant(args?: TenantBypassFlag): boolean {
  return args?.bypassTenantScope === true;
}
