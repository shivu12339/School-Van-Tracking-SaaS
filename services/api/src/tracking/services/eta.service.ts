import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { TrackingRedisKeys } from '../redis/tracking-redis.keys';
import { EtaPayload } from '../interfaces/tracking-payload.interface';

@Injectable()
export class EtaService {
  constructor(private readonly redisService: RedisService) {}

  /** Haversine ETA estimate; swap with Google Distance Matrix in production. */
  calculateEtaMinutes(
    vanLat: number,
    vanLng: number,
    destLat: number,
    destLng: number,
    avgSpeedKmh = 25,
  ): { etaMinutes: number; distanceMeters: number } {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const earthRadius = 6371000;
    const dLat = toRad(destLat - vanLat);
    const dLng = toRad(destLng - vanLng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(vanLat)) * Math.cos(toRad(destLat)) * Math.sin(dLng / 2) ** 2;
    const distanceMeters = 2 * earthRadius * Math.asin(Math.sqrt(a));
    const speedMps = (avgSpeedKmh * 1000) / 3600;
    const etaMinutes = Math.max(1, Math.ceil(distanceMeters / speedMps / 60));
    return { etaMinutes, distanceMeters };
  }

  async cacheEta(payload: EtaPayload): Promise<void> {
    await this.redisService
      .getClient()
      .setex(TrackingRedisKeys.eta(payload.tripId, payload.studentId), 60, JSON.stringify(payload));
  }

  async getCachedEta(tripId: string, studentId: string): Promise<EtaPayload | null> {
    const raw = await this.redisService
      .getClient()
      .get(TrackingRedisKeys.eta(tripId, studentId));
    return raw ? (JSON.parse(raw) as EtaPayload) : null;
  }
}
