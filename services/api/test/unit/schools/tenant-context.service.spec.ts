import { ForbiddenException } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { TenantContextService } from '../../../src/common/tenant/tenant-context.service';

describe('TenantContextService', () => {
  const service = new TenantContextService();

  it('blocks cross-tenant access for school admin', () => {
    expect(() =>
      service.resolveSchoolId(
        {
          id: 'u1',
          schoolId: 'school-a',
          role: RoleCode.SCHOOL_ADMIN,
        } as never,
        'school-b',
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows super admin to target specific school', () => {
    const id = service.resolveSchoolId(
      {
        id: 'u1',
        schoolId: null,
        role: RoleCode.SUPER_ADMIN,
      } as never,
      'school-b',
    );
    expect(id).toBe('school-b');
  });
});
