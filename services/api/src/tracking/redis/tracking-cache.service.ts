import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { VanLocationBroadcast } from '../interfaces/tracking-payload.interface';
import { TrackingRedisKeys } from './tracking-redis.keys';

@Injectable()
export class TrackingCacheService {
  private readonly locationTtl = 120;
  private readonly activeTripTtl = 86_400;

  constructor(private readonly redisService: RedisService) {}

  async setLatestLocation(payload: VanLocationBroadcast): Promise<void> {
    const client = this.redisService.getClient();
    const serialized = JSON.stringify(payload);
    const pipeline = client.pipeline();
    pipeline.setex(
      TrackingRedisKeys.tripLocation(payload.schoolId, payload.tripId),
      this.locationTtl,
      serialized,
    );
    pipeline.setex(
      TrackingRedisKeys.vanLocation(payload.schoolId, payload.vanId),
      this.locationTtl,
      serialized,
    );
    pipeline.sadd(TrackingRedisKeys.activeTripsSet(payload.schoolId), payload.tripId);
    pipeline.expire(TrackingRedisKeys.activeTripsSet(payload.schoolId), this.activeTripTtl);
    await pipeline.exec();
  }

  async getTripLocation(
    schoolId: string,
    tripId: string,
  ): Promise<VanLocationBroadcast | null> {
    const raw = await this.redisService
      .getClient()
      .get(TrackingRedisKeys.tripLocation(schoolId, tripId));
    return raw ? (JSON.parse(raw) as VanLocationBroadcast) : null;
  }

  async setDriverOnline(schoolId: string, driverId: string, online: boolean): Promise<void> {
    const key = TrackingRedisKeys.driverOnline(schoolId, driverId);
    if (online) {
      await this.redisService.getClient().setex(key, 90, '1');
    } else {
      await this.redisService.getClient().del(key);
    }
  }

  async shouldThrottle(tripId: string, minIntervalMs: number): Promise<boolean> {
    const key = TrackingRedisKeys.throttle(tripId);
    const client = this.redisService.getClient();
    const exists = await client.get(key);
    if (exists) return true;
    await client.setex(key, Math.ceil(minIntervalMs / 1000), '1');
    return false;
  }

  async markGeofenceSent(tripId: string, studentId: string, type: string): Promise<boolean> {
    const key = TrackingRedisKeys.geofenceDedup(tripId, studentId, type);
    const result = await this.redisService.getClient().set(key, '1', 'EX', 86_400, 'NX');
    return result === 'OK';
  }

  async setActiveTrip(schoolId: string, tripId: string, driverId: string): Promise<void> {
    const client = this.redisService.getClient();
    const pipeline = client.pipeline();
    pipeline.setex(TrackingRedisKeys.activeTrip(schoolId, tripId), this.activeTripTtl, driverId);
    pipeline.sadd(TrackingRedisKeys.activeTripsSet(schoolId), tripId);
    pipeline.setex(TrackingRedisKeys.driverActiveTrip(schoolId, driverId), this.activeTripTtl, tripId);
    pipeline.expire(TrackingRedisKeys.activeTripsSet(schoolId), this.activeTripTtl);
    await pipeline.exec();
  }

  async clearActiveTrip(schoolId: string, tripId: string, driverId?: string): Promise<void> {
    const client = this.redisService.getClient();
    const pipeline = client.pipeline();
    pipeline.del(TrackingRedisKeys.activeTrip(schoolId, tripId));
    pipeline.srem(TrackingRedisKeys.activeTripsSet(schoolId), tripId);
    if (driverId) {
      pipeline.del(TrackingRedisKeys.driverActiveTrip(schoolId, driverId));
    }
    await pipeline.exec();
  }

  async listActiveTripIds(schoolId: string): Promise<string[]> {
    return this.redisService.getClient().smembers(TrackingRedisKeys.activeTripsSet(schoolId));
  }

  async getDriverActiveTripId(schoolId: string, driverId: string): Promise<string | null> {
    return this.redisService.getClient().get(TrackingRedisKeys.driverActiveTrip(schoolId, driverId));
  }

  async setLastKnownPosition(
    _schoolId: string,
    tripId: string,
    payload: VanLocationBroadcast,
  ): Promise<void> {
    await this.redisService
      .getClient()
      .setex(
        TrackingRedisKeys.reconnectSnapshot(tripId),
        300,
        JSON.stringify(payload),
      );
    await this.setLatestLocation(payload);
  }

  async getReconnectSnapshot(tripId: string): Promise<VanLocationBroadcast | null> {
    const raw = await this.redisService
      .getClient()
      .get(TrackingRedisKeys.reconnectSnapshot(tripId));
    return raw ? (JSON.parse(raw) as VanLocationBroadcast) : null;
  }
}
