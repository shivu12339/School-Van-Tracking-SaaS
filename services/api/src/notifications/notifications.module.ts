import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TenantModule } from '../common/tenant/tenant.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { MetricsModule } from '../core/metrics/metrics.module';
import { FirebaseModule } from './providers/firebase.module';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationGateway } from './gateways/notification.gateway';
import { NotificationsRepository } from './repositories/notifications.repository';
import { BulkNotificationService } from './services/bulk-notification.service';
import { DeviceTokenService } from './services/device-token.service';
import { GeofenceAlertEngine } from './services/geofence-alert.engine';
import { NotificationAnalyticsService } from './services/notification-analytics.service';
import { NotificationDispatcherService } from './services/notification-dispatcher.service';
import { NotificationPreferenceService } from './services/notification-preference.service';
import { NotificationQueueService } from './services/notification-queue.service';
import { NotificationRateLimitService } from './services/notification-rate-limit.service';
import { NotificationRedisCacheService } from './services/notification-redis-cache.service';
import { NotificationsService } from './services/notifications.service';
import { PushDeliveryService } from './services/push-delivery.service';
import { RadiusCalculationService } from './services/radius-calculation.service';
import { TrackingNotificationService } from './services/tracking-notification.service';
import { SubscriptionNotificationService } from './services/subscription-notification.service';
import { NotificationDedupService } from './utils/dedup.util';
import { NotificationWorkersService } from './workers/notification-workers.service';

const processRole = process.env.PROCESS_ROLE ?? 'all';
const enableWorkers = processRole === 'all' || processRole === 'worker';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    FirebaseModule,
    TenantModule,
    ConfigModule,
    MetricsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('jwt.accessSecret'),
      }),
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsRepository,
    NotificationQueueService,
    NotificationDedupService,
    NotificationRateLimitService,
    NotificationRedisCacheService,
    NotificationDispatcherService,
    DeviceTokenService,
    PushDeliveryService,
    RadiusCalculationService,
    GeofenceAlertEngine,
    NotificationsService,
    BulkNotificationService,
    NotificationAnalyticsService,
    NotificationPreferenceService,
    TrackingNotificationService,
    SubscriptionNotificationService,
    ...(enableWorkers ? [NotificationWorkersService] : []),
    NotificationGateway,
  ],
  exports: [
    NotificationDispatcherService,
    NotificationQueueService,
    GeofenceAlertEngine,
    TrackingNotificationService,
    SubscriptionNotificationService,
  ],
})
export class NotificationsModule {}
