import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import {
  NotificationRedisKeys,
  NotificationRedisTtl,
} from '../constants/notification-redis.keys';

@Injectable()
export class NotificationRedisCacheService {
  constructor(private readonly redisService: RedisService) {}

  async getUnreadCount(schoolId: string, userId: string): Promise<number | null> {
    const raw = await this.redisService
      .getClient()
      .get(NotificationRedisKeys.unreadCount(schoolId, userId));
    return raw ? Number(raw) : null;
  }

  async setUnreadCount(schoolId: string, userId: string, count: number): Promise<void> {
    await this.redisService
      .getClient()
      .setex(
        NotificationRedisKeys.unreadCount(schoolId, userId),
        NotificationRedisTtl.unreadCountSeconds,
        String(count),
      );
  }

  async invalidateUnreadCount(schoolId: string, userId: string): Promise<void> {
    await this.redisService.getClient().del(NotificationRedisKeys.unreadCount(schoolId, userId));
  }

  async getSchoolAnalytics<T>(schoolId: string): Promise<T | null> {
    const raw = await this.redisService
      .getClient()
      .get(NotificationRedisKeys.schoolAnalytics(schoolId));
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async setSchoolAnalytics(schoolId: string, payload: unknown): Promise<void> {
    await this.redisService
      .getClient()
      .setex(
        NotificationRedisKeys.schoolAnalytics(schoolId),
        NotificationRedisTtl.analyticsCacheSeconds,
        JSON.stringify(payload),
      );
  }

  async setGeofenceCooldown(
    schoolId: string,
    tripId: string,
    studentId: string,
    alertType: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const key = NotificationRedisKeys.cooldown(schoolId, tripId, studentId, alertType);
    const result = await this.redisService.getClient().set(key, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async cacheDeviceTokens(userId: string, tokens: string[]): Promise<void> {
    await this.redisService
      .getClient()
      .setex(
        NotificationRedisKeys.userDevices(userId),
        NotificationRedisTtl.deviceCacheSeconds,
        JSON.stringify(tokens),
      );
  }

  async getCachedDeviceTokens(userId: string): Promise<string[] | null> {
    const raw = await this.redisService
      .getClient()
      .get(NotificationRedisKeys.userDevices(userId));
    return raw ? (JSON.parse(raw) as string[]) : null;
  }

  async invalidateDeviceTokens(userId: string): Promise<void> {
    await this.redisService.getClient().del(NotificationRedisKeys.userDevices(userId));
  }

  async invalidateSchoolAnalytics(schoolId: string): Promise<void> {
    await this.redisService.getClient().del(NotificationRedisKeys.schoolAnalytics(schoolId));
  }
}
