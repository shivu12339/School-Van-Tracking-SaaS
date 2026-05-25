import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { RedisService } from '../../redis/redis.service';
import { NotificationRedisKeys } from '../constants/notification-redis.keys';

const TYPE_LIMITS: Partial<Record<NotificationType, { max: number; windowSec: number }>> = {
  SCHOOL_ANNOUNCEMENT: { max: 5, windowSec: 3600 },
  SOS_EMERGENCY: { max: 10, windowSec: 300 },
  VAN_WITHIN_1KM: { max: 20, windowSec: 3600 },
  VAN_WITHIN_500M: { max: 20, windowSec: 3600 },
};

@Injectable()
export class NotificationRateLimitService {
  constructor(private readonly redisService: RedisService) {}

  async allow(schoolId: string, userId: string, type: NotificationType): Promise<boolean> {
    const rule = TYPE_LIMITS[type] ?? { max: 60, windowSec: 3600 };
    const key = NotificationRedisKeys.rateLimit(schoolId, userId, type);
    const count = await this.redisService.getClient().incr(key);
    if (count === 1) {
      await this.redisService.getClient().expire(key, rule.windowSec);
    }
    return count <= rule.max;
  }
}
