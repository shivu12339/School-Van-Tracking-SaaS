import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class TenantCacheService {
  constructor(private readonly redisService: RedisService) {}

  schoolKey(schoolId: string, suffix: string): string {
    return `school:${schoolId}:${suffix}`;
  }

  async get<T>(schoolId: string, suffix: string): Promise<T | null> {
    const raw = await this.redisService.getClient().get(this.schoolKey(schoolId, suffix));
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async set(schoolId: string, suffix: string, value: unknown, ttlSeconds = 300): Promise<void> {
    await this.redisService
      .getClient()
      .setex(this.schoolKey(schoolId, suffix), ttlSeconds, JSON.stringify(value));
  }

  async invalidate(schoolId: string, suffix: string): Promise<void> {
    await this.redisService.getClient().del(this.schoolKey(schoolId, suffix));
  }

  async invalidateSchool(schoolId: string): Promise<void> {
    const client = this.redisService.getClient();
    const keys = await client.keys(`school:${schoolId}:*`);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  }

  trackingRoom(schoolId: string, tripId: string): string {
    return `school:${schoolId}:trip:${tripId}`;
  }

  adminTrackingRoom(schoolId: string): string {
    return `school:${schoolId}:tracking:admin`;
  }

  parentTrackingRoom(schoolId: string, studentId: string): string {
    return `school:${schoolId}:parent:${studentId}`;
  }
}
