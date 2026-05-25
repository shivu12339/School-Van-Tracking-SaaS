import { Test } from '@nestjs/testing';
import { NotificationType } from '@prisma/client';
import { NotificationRateLimitService } from '../../src/notifications/services/notification-rate-limit.service';
import { RedisService } from '../../src/redis/redis.service';
import { createRedisServiceMock } from '../mocks/redis.mock';

describe('NotificationRateLimitService', () => {
  let rateLimit: NotificationRateLimitService;
  let redisMock: ReturnType<typeof createRedisServiceMock>;

  beforeEach(async () => {
    redisMock = createRedisServiceMock();
    const module = await Test.createTestingModule({
      providers: [
        NotificationRateLimitService,
        { provide: RedisService, useValue: redisMock },
      ],
    }).compile();
    rateLimit = module.get(NotificationRateLimitService);
  });

  it('allows sends under the limit', async () => {
    const ok = await rateLimit.allow('school-1', 'user-1', NotificationType.SCHOOL_ANNOUNCEMENT);
    expect(ok).toBe(true);
  });
});
