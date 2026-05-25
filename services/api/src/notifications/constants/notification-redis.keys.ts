export const NotificationRedisKeys = {
  dedup: (schoolId: string, userId: string, type: string, scope: string) =>
    `notify:dedup:${schoolId}:${userId}:${type}:${scope}`,
  rateLimit: (schoolId: string, userId: string, type: string) =>
    `notify:rate:${schoolId}:${userId}:${type}`,
  cooldown: (schoolId: string, tripId: string, studentId: string, alertType: string) =>
    `notify:cooldown:${schoolId}:${tripId}:${studentId}:${alertType}`,
  userDevices: (userId: string) => `notify:devices:${userId}`,
  unreadCount: (schoolId: string, userId: string) => `notify:unread:${schoolId}:${userId}`,
  schoolAnalytics: (schoolId: string) => `notify:analytics:${schoolId}`,
} as const;

export const NotificationRedisTtl = {
  deviceCacheSeconds: 300,
  unreadCountSeconds: 120,
  analyticsCacheSeconds: 60,
  geofenceCooldown500m: 1800,
  geofenceCooldown1km: 3600,
} as const;
