/**
 * Redis cache key layout and TTL strategy for realtime tracking.
 * Keys are namespaced per school for tenant isolation.
 */

export const RedisCacheTtl = {
  /** Active trip snapshot — refreshed on each GPS write */
  activeTripSeconds: 86_400,
  /** Latest van coordinates — short TTL, high churn */
  vanLocationSeconds: 120,
  /** Trip-scoped location for parent map */
  tripLocationSeconds: 120,
  /** Driver heartbeat / online flag */
  driverOnlineSeconds: 90,
  /** ETA per student — recalculated on movement */
  etaSeconds: 60,
  /** Geofence notification dedup */
  geofenceDedupSeconds: 3_600,
  /** Session / refresh metadata (if cached) */
  sessionSeconds: 604_800,
} as const;

export const RedisCacheKeys = {
  activeTrip: (schoolId: string, tripId: string) =>
    `svt:school:${schoolId}:trip:active:${tripId}`,
  activeTripsSet: (schoolId: string) => `svt:school:${schoolId}:trips:active`,
  vanLocation: (schoolId: string, vanId: string) =>
    `svt:school:${schoolId}:van:${vanId}:loc`,
  tripLocation: (schoolId: string, tripId: string) =>
    `svt:school:${schoolId}:trip:${tripId}:loc`,
  driverOnline: (schoolId: string, driverId: string) =>
    `svt:school:${schoolId}:driver:${driverId}:online`,
  eta: (schoolId: string, tripId: string, studentId: string) =>
    `svt:school:${schoolId}:eta:${tripId}:${studentId}`,
  session: (userId: string, deviceId: string) => `svt:session:${userId}:${deviceId}`,
  trackingBatchQueue: () => 'svt:tracking:batch:queue',
  geofenceDedup: (schoolId: string, tripId: string, studentId: string, type: string) =>
    `svt:school:${schoolId}:geofence:${tripId}:${studentId}:${type}`,
} as const;
