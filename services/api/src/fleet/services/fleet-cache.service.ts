import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { FleetRedisKeys, FleetRedisTtl } from '../constants/fleet-redis.keys';

@Injectable()
export class FleetCacheService {
  constructor(private readonly redis: RedisService) {}

  private client() {
    return this.redis.getClient();
  }

  async getRouteDetail<T>(schoolId: string, routeId: string): Promise<T | null> {
    const raw = await this.client().get(FleetRedisKeys.routeDetail(schoolId, routeId));
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async setRouteDetail(schoolId: string, routeId: string, value: unknown): Promise<void> {
    await this.client().setex(
      FleetRedisKeys.routeDetail(schoolId, routeId),
      FleetRedisTtl.routeDetailSeconds,
      JSON.stringify(value),
    );
  }

  async invalidateRoute(schoolId: string, routeId: string): Promise<void> {
    await this.client().del(FleetRedisKeys.routeDetail(schoolId, routeId));
    const listKeys = await this.client().keys(`school:${schoolId}:routes:list:*`);
    if (listKeys.length) {
      await this.client().del(...listKeys);
    }
  }

  async setDriverVanAssignment(
    schoolId: string,
    driverId: string,
    vanId: string,
  ): Promise<void> {
    const client = this.client();
    await client.setex(
      FleetRedisKeys.driverVanAssignment(schoolId, driverId),
      FleetRedisTtl.assignmentSeconds,
      vanId,
    );
    await client.setex(
      FleetRedisKeys.vanDriverAssignment(schoolId, vanId),
      FleetRedisTtl.assignmentSeconds,
      driverId,
    );
  }

  async getDriverVanAssignment(schoolId: string, driverId: string): Promise<string | null> {
    return this.client().get(FleetRedisKeys.driverVanAssignment(schoolId, driverId));
  }

  async getVanDriverAssignment(schoolId: string, vanId: string): Promise<string | null> {
    return this.client().get(FleetRedisKeys.vanDriverAssignment(schoolId, vanId));
  }

  async clearDriverVanAssignment(
    schoolId: string,
    driverId: string,
    vanId?: string,
  ): Promise<void> {
    const client = this.client();
    await client.del(FleetRedisKeys.driverVanAssignment(schoolId, driverId));
    if (vanId) {
      await client.del(FleetRedisKeys.vanDriverAssignment(schoolId, vanId));
    }
  }
}
