import { describe, expect, it } from 'vitest';
import { getRoleHomePath, ROLES } from './roles';

describe('roles', () => {
  it('maps super admin home', () => {
    expect(getRoleHomePath(ROLES.SUPER_ADMIN)).toBe('/super-admin');
  });

  it('maps school admin home', () => {
    expect(getRoleHomePath(ROLES.SCHOOL_ADMIN)).toBe('/admin');
  });
});
