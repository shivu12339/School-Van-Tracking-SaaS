import { UnauthorizedException } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { type JwtService } from '@nestjs/jwt';
import { SessionStatus } from '@prisma/client';
import { TokenService } from '../../../src/auth/services/token.service';
import { hashToken } from '../../../src/auth/utils/token-hash.util';

describe('TokenService', () => {
  const jwtService = { signAsync: jest.fn().mockResolvedValue('access') } as unknown as JwtService;
  const configService = {
    get: jest.fn((key: string, def?: unknown) => {
      if (key === 'jwt.refreshTtl') return '30d';
      return def;
    }),
    getOrThrow: jest.fn((key: string) => {
      if (key === 'jwt.accessSecret') return 'test-access-secret-min-32-chars-long';
      if (key === 'jwt.accessTtl') return '900s';
      return '';
    }),
  } as unknown as ConfigService;

  const prisma = {
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const redisClient = { setex: jest.fn() };
  const redisService = { getClient: () => redisClient };

  let service: TokenService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TokenService(
      jwtService,
      configService,
      prisma as never,
      redisService as never,
    );
  });

  it('issues access token with user claims', async () => {
    const user = {
      id: 'u1',
      email: 'a@b.com',
      schoolId: 's1',
      role: 'PARENT',
      sessionId: 'sess1',
      permissions: ['trips.track'],
      firstName: 'A',
      lastName: null,
    };
    await service.issueAccessToken(user as never);
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: 'u1',
        schoolId: 's1',
        permissions: ['trips.track'],
      }),
      expect.any(Object),
    );
  });

  it('revokes token family on refresh reuse', async () => {
    const raw = 'reused-refresh-token-value-1234567890';
    void hashToken(raw);
    prisma.refreshToken.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'rt1',
      familyId: 'fam1',
      status: SessionStatus.REVOKED,
    });

    await expect(service.rotateRefreshToken(raw)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ familyId: 'fam1' }) }),
    );
  });
});
