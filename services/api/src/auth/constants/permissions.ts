/** Canonical permission keys (stored in DB / JWT claims). */
export const PERMISSIONS = {
  SCHOOLS_MANAGE: 'schools.manage',
  SCHOOLS_VIEW: 'schools.view',
  DRIVERS_CREATE: 'drivers.create',
  DRIVERS_MANAGE: 'drivers.manage',
  STUDENTS_CREATE: 'students.create',
  STUDENTS_MANAGE: 'students.manage',
  PARENTS_MANAGE: 'parents.manage',
  VANS_MANAGE: 'vans.manage',
  ROUTES_MANAGE: 'routes.manage',
  TRIPS_TRACK: 'trips.track',
  TRIPS_MANAGE: 'trips.manage',
  REPORTS_VIEW: 'reports.view',
  USERS_MANAGE: 'users.manage',
  SUBSCRIPTIONS_MANAGE: 'subscriptions.manage',
  NOTIFICATIONS_SEND: 'notifications.send',
} as const;

/** Human-friendly aliases → canonical keys (for docs / legacy decorators). */
export const PERMISSION_ALIASES = {
  create_school: PERMISSIONS.SCHOOLS_MANAGE,
  manage_school: PERMISSIONS.SCHOOLS_MANAGE,
  create_driver: PERMISSIONS.DRIVERS_CREATE,
  create_student: PERMISSIONS.STUDENTS_CREATE,
  manage_routes: PERMISSIONS.ROUTES_MANAGE,
  manage_tracking: PERMISSIONS.TRIPS_TRACK,
  view_reports: PERMISSIONS.REPORTS_VIEW,
  send_notifications: PERMISSIONS.NOTIFICATIONS_SEND,
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSION_MAP: Record<string, PermissionKey[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  SCHOOL_ADMIN: [
    PERMISSIONS.DRIVERS_CREATE,
    PERMISSIONS.DRIVERS_MANAGE,
    PERMISSIONS.STUDENTS_CREATE,
    PERMISSIONS.STUDENTS_MANAGE,
    PERMISSIONS.PARENTS_MANAGE,
    PERMISSIONS.VANS_MANAGE,
    PERMISSIONS.ROUTES_MANAGE,
    PERMISSIONS.TRIPS_MANAGE,
    PERMISSIONS.TRIPS_TRACK,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.USERS_MANAGE,
  ],
  DRIVER: [PERMISSIONS.TRIPS_TRACK],
  PARENT: [PERMISSIONS.TRIPS_TRACK],
};

export function resolvePermissionKey(key: string): PermissionKey {
  if (key in PERMISSIONS) {
    return PERMISSIONS[key as keyof typeof PERMISSIONS];
  }
  const alias = PERMISSION_ALIASES[key as keyof typeof PERMISSION_ALIASES];
  if (alias) {
    return alias;
  }
  return key as PermissionKey;
}
