import { RoleCode } from '@prisma/client';
import { PermissionService } from '../../src/auth/services/permission.service';

describe('PermissionService.resolvePrimaryRole', () => {
  const service = new PermissionService({} as never, {} as never, {} as never);

  it('prefers SUPER_ADMIN when multiple roles', () => {
    expect(
      service.resolvePrimaryRole([RoleCode.PARENT, RoleCode.SUPER_ADMIN, RoleCode.DRIVER]),
    ).toBe(RoleCode.SUPER_ADMIN);
  });

  it('falls back to first role', () => {
    expect(service.resolvePrimaryRole([RoleCode.DRIVER])).toBe(RoleCode.DRIVER);
  });
});
