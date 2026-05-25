/** Tenant-scoped Redis keys for fleet operational cache */
export const FleetRedisKeys = {
  routeDetail: (schoolId: string, routeId: string) =>
    `school:${schoolId}:route:${routeId}:detail`,
  routesList: (schoolId: string, hash: string) => `school:${schoolId}:routes:list:${hash}`,
  driverVanAssignment: (schoolId: string, driverId: string) =>
    `school:${schoolId}:driver:${driverId}:van`,
  vanDriverAssignment: (schoolId: string, vanId: string) =>
    `school:${schoolId}:van:${vanId}:driver`,
  activeDrivers: (schoolId: string) => `school:${schoolId}:drivers:active`,
  studentTripHint: (schoolId: string, studentId: string) =>
    `school:${schoolId}:student:${studentId}:trip`,
} as const;

export const FleetRedisTtl = {
  routeDetailSeconds: 300,
  listSeconds: 120,
  assignmentSeconds: 3600,
} as const;
