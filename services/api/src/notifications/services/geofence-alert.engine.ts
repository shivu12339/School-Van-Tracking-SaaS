import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { NotificationRedisTtl } from '../constants/notification-redis.keys';
import { GeofenceJob } from '../interfaces/notification-job.interface';
import { NotificationDispatcherService } from './notification-dispatcher.service';
import { NotificationRedisCacheService } from './notification-redis-cache.service';
import { RadiusCalculationService } from './radius-calculation.service';

@Injectable()
export class GeofenceAlertEngine {
  private readonly logger = new Logger(GeofenceAlertEngine.name);

  constructor(
    private readonly radiusService: RadiusCalculationService,
    private readonly dispatcher: NotificationDispatcherService,
    private readonly redisCache: NotificationRedisCacheService,
  ) {}

  async evaluate(job: GeofenceJob): Promise<void> {
    const students = await this.radiusService.findPendingStudentsWithDistance({
      schoolId: job.schoolId,
      tripId: job.tripId,
      latitude: job.latitude,
      longitude: job.longitude,
    });

    for (const row of students) {
      const distance = row.distanceMeters;
      if (distance <= job.radius500m) {
        await this.dispatchProximity(
          job,
          row,
          NotificationType.VAN_WITHIN_500M,
          distance,
          NotificationRedisTtl.geofenceCooldown500m,
        );
      } else if (distance <= job.radius1Km) {
        await this.dispatchProximity(
          job,
          row,
          NotificationType.VAN_WITHIN_1KM,
          distance,
          NotificationRedisTtl.geofenceCooldown1km,
        );
      }
    }
  }

  private async dispatchProximity(
    job: GeofenceJob,
    row: {
      studentId: string;
      parentId: string;
      parentUserId: string;
      distanceMeters: number;
    },
    type: NotificationType,
    distanceMeters: number,
    cooldownSeconds: number,
  ): Promise<void> {
    const cooldownOk = await this.redisCache.setGeofenceCooldown(
      job.schoolId,
      job.tripId,
      row.studentId,
      type,
      cooldownSeconds,
    );
    if (!cooldownOk) {
      return;
    }

    const id = await this.dispatcher.dispatch({
      schoolId: job.schoolId,
      userId: row.parentUserId,
      parentId: row.parentId,
      tripId: job.tripId,
      type,
      context: { tripId: job.tripId, distanceMeters: Math.round(distanceMeters) },
      dedupScope: `${job.tripId}:${row.studentId}:${type}`,
      dedupCooldownSeconds: cooldownSeconds,
    });

    if (id) {
      this.logger.log(`Geofence alert queued ${type} student=${row.studentId}`);
    }
  }
}
