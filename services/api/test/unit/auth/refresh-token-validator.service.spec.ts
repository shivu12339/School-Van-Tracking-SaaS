import { UnauthorizedException } from '@nestjs/common';
import { SessionStatus } from '@prisma/client';
import { RefreshTokenValidatorService } from '../../../src/auth/services/refresh-token-validator.service';
import { hashToken } from '../../../src/auth/utils/token-hash.util';

describe('RefreshTokenValidatorService', () => {
  const prisma = { refreshToken: { findFirst: jest.fn(), updateMany: jest.fn() } };
  let service: RefreshTokenValidatorService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RefreshTokenValidatorService(prisma as never);
  });

  it('validates active refresh token', async () => {
    const raw = 'valid-refresh-token-abcdef';
    prisma.refreshToken.findFirst.mockResolvedValue({
      userId: 'u1',
      schoolId: 's1',
      id: 'rt1',
      familyId: 'fam1',
    });
    const ctx = await service.validate(raw);
    expect(ctx.userId).toBe('u1');
    expect(prisma.refreshToken.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tokenHash: hashToken(raw) }),
      }),
    );
  });

  it('detects reuse of revoked token', async () => {
    const raw = 'revoked-token-abcdefgh';
    prisma.refreshToken.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ familyId: 'fam1', status: SessionStatus.REVOKED });
    await expect(service.validate(raw)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
  });
});
