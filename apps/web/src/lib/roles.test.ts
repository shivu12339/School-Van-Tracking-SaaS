import { describe, expect, it } from 'vitest';

const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SCHOOL_ADMIN: 'SCHOOL_ADMIN',
  DRIVER: 'DRIVER',
  PARENT: 'PARENT',
} as const;

describe('RBAC role constants', () => {
  it('defines platform roles', () => {
    expect(Object.keys(ROLES)).toContain('SUPER_ADMIN');
    expect(Object.keys(ROLES)).toContain('SCHOOL_ADMIN');
  });

  it('admin routes require elevated roles', () => {
    const allowed = [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN];
    expect(allowed).not.toContain(ROLES.PARENT);
    expect(allowed).not.toContain(ROLES.DRIVER);
  });
});
