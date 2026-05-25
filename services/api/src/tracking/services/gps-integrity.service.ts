import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { TrackingRedisKeys } from '../redis/tracking-redis.keys';
import {
  GpsIntegrityContext,
  GpsIntegrityInput,
  GpsIntegrityResult,
  GpsIntegrityValidator,
} from '../validators/gps-integrity.validator';

@Injectable()
export class GpsIntegrityService {
  private readonly logger = new Logger(GpsIntegrityService.name);

  constructor(private readonly redisService: RedisService) {}

  async validate(tripId: string, input: GpsIntegrityInput): Promise<GpsIntegrityResult> {
    const context = await this.loadLastSample(tripId);
    const result = GpsIntegrityValidator.evaluate(input, context);

    if (result.flags.length > 0 && result.riskScore >= 50) {
      this.logger.warn(
        `GPS integrity trip=${tripId} risk=${result.riskScore} flags=${result.flags.join(',')}`,
      );
    }

    await this.saveLastSample(tripId, input);
    return result;
  }

  async assertValid(tripId: string, input: GpsIntegrityInput): Promise<void> {
    const context = await this.loadLastSample(tripId);
    const result = GpsIntegrityValidator.evaluate(input, context);
    await this.saveLastSample(tripId, input);
    if (!result.valid) {
      GpsIntegrityValidator.assertValid(input, context);
    }
  }

  private async loadLastSample(tripId: string): Promise<GpsIntegrityContext> {
    const raw = await this.redisService.getClient().get(TrackingRedisKeys.lastGpsSample(tripId));
    if (!raw) return {};
    return JSON.parse(raw) as GpsIntegrityContext;
  }

  private async saveLastSample(tripId: string, input: GpsIntegrityInput): Promise<void> {
    const payload: GpsIntegrityContext = {
      lastLatitude: input.latitude,
      lastLongitude: input.longitude,
      lastTimestamp: input.timestamp,
    };
    await this.redisService
      .getClient()
      .setex(TrackingRedisKeys.lastGpsSample(tripId), 3600, JSON.stringify(payload));
  }
}
