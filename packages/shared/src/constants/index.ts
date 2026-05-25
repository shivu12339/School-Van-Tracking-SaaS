/** Cross-platform API contract constants */

export const API_PREFIX = 'api' as const;
export const API_VERSION = 'v1' as const;
export const API_BASE_PATH = `/${API_PREFIX}/${API_VERSION}` as const;

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SCHOOL_ADMIN: 'SCHOOL_ADMIN',
  DRIVER: 'DRIVER',
  PARENT: 'PARENT',
} as const;

export const SOCKET_NAMESPACES = {
  TRACKING: '/tracking',
  NOTIFICATIONS: '/notifications',
} as const;

export const SOCKET_EVENTS = {
  VAN_LOCATION: 'van:location',
  TRIP_STATUS: 'trip:status',
  STUDENT_PICKED: 'student:picked',
  STUDENT_DROPPED: 'student:dropped',
  ETA_UPDATE: 'eta:update',
  NOTIFICATION_NEW: 'notification:new',
} as const;

export const GEOFENCE_RADIUS_METERS = {
  ONE_KM: 1000,
  FIVE_HUNDRED_M: 500,
} as const;

export const GPS_THROTTLE_MS = 4000;
