import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleCode } from '@prisma/client';
import { RolesGuard } from '../../../src/auth/guards/roles.guard';
import { IS_PUBLIC_KEY } from '../../../src/auth/decorators/public.decorator';
import { ROLES_KEY } from '../../../src/auth/decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const ctx = (role?: RoleCode) =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: role ? { role } : undefined }),
      }),
    }) as ExecutionContext;

  it('allows public routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return true;
      return undefined;
    });
    expect(guard.canActivate(ctx())).toBe(true);
  });

  it('allows matching role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === ROLES_KEY) return [RoleCode.DRIVER];
      return false;
    });
    expect(guard.canActivate(ctx(RoleCode.DRIVER))).toBe(true);
  });

  it('denies wrong role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === ROLES_KEY) return [RoleCode.SCHOOL_ADMIN];
      return false;
    });
    expect(() => guard.canActivate(ctx(RoleCode.PARENT))).toThrow(ForbiddenException);
  });
});
