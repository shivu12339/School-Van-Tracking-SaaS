import { RoleCode } from '@prisma/client';

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
} as const;

export const ROLE_PERMISSION_MAP: Record<RoleCode, string[]> = {
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

export const DEFAULT_SEED_PASSWORD = 'Admin@12345';
