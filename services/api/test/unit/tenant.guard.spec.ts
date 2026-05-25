import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleCode } from '@prisma/client';
import { TenantGuard } from '../../src/auth/guards/tenant.guard';
import { IS_PUBLIC_KEY } from '../../src/auth/decorators/public.decorator';
import { TENANT_SCOPED_KEY } from '../../src/auth/decorators/tenant-scoped.decorator';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new TenantGuard(reflector);
  });

  const ctx = (user: object | undefined, params: Record<string, string> = {}) =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params,
          query: {},
          body: {},
          headers: {},
        }),
      }),
    }) as ExecutionContext;

  it('allows public routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return true;
      return false;
    });
    expect(guard.canActivate(ctx(undefined))).toBe(true);
  });

  it('denies cross-tenant school access', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === TENANT_SCOPED_KEY) return true;
      return false;
    });
    expect(() =>
      guard.canActivate(
        ctx(
          { id: 'u1', schoolId: 'school-a', role: RoleCode.SCHOOL_ADMIN },
          { schoolId: 'school-b' },
        ),
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows same-tenant access', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === TENANT_SCOPED_KEY) return true;
      return false;
    });
    expect(
      guard.canActivate(
        ctx(
          { id: 'u1', schoolId: 'school-a', role: RoleCode.SCHOOL_ADMIN },
          { schoolId: 'school-a' },
        ),
      ),
    ).toBe(true);
  });
});
