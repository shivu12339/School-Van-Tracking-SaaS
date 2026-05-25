import { HttpException } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { LoginProtectionService } from '../../../src/auth/services/login-protection.service';

describe('LoginProtectionService', () => {
  const redisClient = {
    get: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    del: jest.fn(),
  };
  const redisService = { getClient: () => redisClient };
  const configService = {
    get: jest.fn((key: string, def?: number) => {
      if (key === 'auth.maxLoginAttempts') return 5;
      if (key === 'auth.lockWindowSeconds') return 900;
      return def;
    }),
  } as unknown as ConfigService;

  let service: LoginProtectionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LoginProtectionService(redisService as never, configService);
  });

  it('blocks when attempts exceed max', async () => {
    redisClient.get.mockResolvedValue('5');
    await expect(
      service.assertNotRateLimited('user@test.com', '127.0.0.1'),
    ).rejects.toBeInstanceOf(HttpException);
  });

  it('increments failed attempts', async () => {
    redisClient.incr.mockResolvedValue(1);
    const count = await service.recordFailedAttempt('user@test.com', '127.0.0.1');
    expect(count).toBe(1);
    expect(redisClient.expire).toHaveBeenCalled();
  });
});
