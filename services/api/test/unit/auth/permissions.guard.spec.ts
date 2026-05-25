import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../../../src/auth/guards/permissions.guard';
import { IS_PUBLIC_KEY } from '../../../src/auth/decorators/public.decorator';
import { PERMISSIONS_KEY } from '../../../src/auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../../../src/auth/constants/permissions';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  const ctx = (permissions: string[]) =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { permissions },
        }),
      }),
    }) as ExecutionContext;

  it('allows public routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return true;
      return undefined;
    });
    expect(guard.canActivate(ctx([]))).toBe(true);
  });

  it('allows when user has required permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === PERMISSIONS_KEY) return [PERMISSIONS.TRIPS_TRACK];
      return false;
    });
    expect(guard.canActivate(ctx([PERMISSIONS.TRIPS_TRACK]))).toBe(true);
  });

  it('resolves permission aliases', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === PERMISSIONS_KEY) return ['manage_tracking'];
      return false;
    });
    expect(guard.canActivate(ctx([PERMISSIONS.TRIPS_TRACK]))).toBe(true);
  });

  it('denies missing permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === PERMISSIONS_KEY) return [PERMISSIONS.SCHOOLS_MANAGE];
      return false;
    });
    expect(() => guard.canActivate(ctx([PERMISSIONS.TRIPS_TRACK]))).toThrow(
      ForbiddenException,
    );
  });
});
