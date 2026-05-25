import { ForbiddenException } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { WsTenantAccessService } from '../../src/common/tenant/ws-tenant-access.service';

describe('WsTenantAccessService', () => {
  const prisma = {
    trip: { findFirst: jest.fn() },
    driver: { findFirst: jest.fn() },
    parent: { findFirst: jest.fn() },
    tripStudent: { findFirst: jest.fn() },
  };
  const service = new WsTenantAccessService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('denies cross-tenant school admin', async () => {
    prisma.trip.findFirst.mockResolvedValue({ schoolId: 'school-b', driverId: 'd1' });
    await expect(
      service.assertTripAccess(
        {
          id: 'u1',
          email: 'a@b.com',
          schoolId: 'school-a',
          role: RoleCode.SCHOOL_ADMIN,
          sessionId: 's1',
          permissions: [],
          firstName: '',
          lastName: null,
          jti: 'j1',
        },
        'trip-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows super admin on any trip', async () => {
    prisma.trip.findFirst.mockResolvedValue({ schoolId: 'school-b', driverId: 'd1' });
    const result = await service.assertTripAccess(
      {
        id: 'u1',
        email: 'sa@b.com',
        schoolId: null,
        role: RoleCode.SUPER_ADMIN,
        sessionId: 's1',
        permissions: [],
        firstName: '',
        lastName: null,
        jti: 'j1',
      },
      'trip-1',
    );
    expect(result.schoolId).toBe('school-b');
  });

  it('denies parent without student on trip', async () => {
    prisma.trip.findFirst.mockResolvedValue({ schoolId: 'school-a', driverId: 'd1' });
    prisma.parent.findFirst.mockResolvedValue({ id: 'p1' });
    prisma.tripStudent.findFirst.mockResolvedValue(null);
    await expect(
      service.assertTripAccess(
        {
          id: 'u1',
          email: 'p@b.com',
          schoolId: 'school-a',
          role: RoleCode.PARENT,
          sessionId: 's1',
          permissions: [],
          firstName: '',
          lastName: null,
          jti: 'j1',
        },
        'trip-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('assertSchoolRoomAccess blocks cross-tenant', () => {
    expect(() =>
      service.assertSchoolRoomAccess(
        {
          id: 'u1',
          email: 'a@b.com',
          schoolId: 'school-a',
          role: RoleCode.SCHOOL_ADMIN,
          sessionId: 's1',
          permissions: [],
          firstName: '',
          lastName: null,
          jti: 'j1',
        },
        'school-b',
      ),
    ).toThrow(ForbiddenException);
  });
});
