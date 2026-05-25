import { Test } from '@nestjs/testing';
import { NotificationType } from '@prisma/client';
import { NotificationDedupService } from '../../src/notifications/utils/dedup.util';
import { RedisService } from '../../src/redis/redis.service';
import { createRedisServiceMock } from '../mocks/redis.mock';

describe('NotificationDedupService', () => {
  let dedup: NotificationDedupService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NotificationDedupService,
        { provide: RedisService, useValue: createRedisServiceMock() },
      ],
    }).compile();
    dedup = module.get(NotificationDedupService);
  });

  it('allows first send in cooldown window', async () => {
    const ok = await dedup.shouldSend(
      'school-1',
      'user-1',
      NotificationType.VAN_WITHIN_1KM,
      'trip:student:type',
      3600,
    );
    expect(ok).toBe(true);
  });

  it('blocks duplicate within cooldown', async () => {
    const scope = 'trip-1:student-1:dup';
    await dedup.shouldSend('school-1', 'user-1', NotificationType.VAN_WITHIN_500M, scope, 3600);
    const second = await dedup.shouldSend(
      'school-1',
      'user-1',
      NotificationType.VAN_WITHIN_500M,
      scope,
      3600,
    );
    expect(second).toBe(false);
  });
});
