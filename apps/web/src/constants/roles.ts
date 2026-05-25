import { ROLES } from '@schoolvan/shared';
import type { RoleCode } from '@schoolvan/shared';

export { ROLES };
export type { RoleCode };

export const ADMIN_ROLES: RoleCode[] = [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN];

export function getRoleHomePath(role: RoleCode): string {
  if (role === ROLES.SUPER_ADMIN) return '/super-admin';
  if (role === ROLES.SCHOOL_ADMIN) return '/admin';
  return '/unauthorized';
}
