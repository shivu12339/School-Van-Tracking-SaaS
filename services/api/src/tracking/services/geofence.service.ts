import { Injectable, Logger } from '@nestjs/common';
import { NotificationQueueService } from '../../notifications/services/notification-queue.service';
import { TrackingCacheService } from '../redis/tracking-cache.service';

@Injectable()
export class GeofenceService {
  private readonly logger = new Logger(GeofenceService.name);

  constructor(
    private readonly notificationQueue: NotificationQueueService,
    private readonly trackingCache: TrackingCacheService,
  ) {}

  async evaluateTripProximity(input: {
    schoolId: string;
    tripId: string;
    latitude: number;
    longitude: number;
    radius1Km: number;
    radius500m: number;
  }): Promise<void> {
    const throttleKey = `${input.tripId}:${input.latitude.toFixed(4)}:${input.longitude.toFixed(4)}`;
    if (await this.trackingCache.shouldThrottle(`geofence:${throttleKey}`, 5000)) {
      return;
    }

    await this.notificationQueue.enqueueGeofence(input);
    this.logger.debug(`Geofence job enqueued trip=${input.tripId}`);
  }
}
