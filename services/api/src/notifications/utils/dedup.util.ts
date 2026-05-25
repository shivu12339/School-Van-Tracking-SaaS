import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { RedisService } from '../../redis/redis.service';
import { NotificationRedisKeys } from '../constants/notification-redis.keys';

@Injectable()
export class NotificationDedupService {
  constructor(private readonly redisService: RedisService) {}

  private key(
    schoolId: string,
    userId: string,
    type: NotificationType,
    scope: string,
  ): string {
    return NotificationRedisKeys.dedup(schoolId, userId, type, scope);
  }

  async shouldSend(
    schoolId: string,
    userId: string,
    type: NotificationType,
    scope: string,
    cooldownSeconds: number,
  ): Promise<boolean> {
    const result = await this.redisService
      .getClient()
      .set(this.key(schoolId, userId, type, scope), '1', 'EX', cooldownSeconds, 'NX');
    return result === 'OK';
  }
}
