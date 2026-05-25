import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { TenantModule } from '../common/tenant/tenant.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { TrackingController } from './controllers/tracking.controller';
import { TrackingGateway } from './gateways/tracking.gateway';
import { WsAuthGuard } from './guards/ws-auth.guard';
import { TrackingCacheService } from './redis/tracking-cache.service';
import { TrackingPubSubService } from './redis/tracking-pubsub.service';
import { EtaService } from './services/eta.service';
import { GeofenceService } from './services/geofence.service';
import { TrackingBatchService } from './services/tracking-batch.service';
import { TrackingService } from './services/tracking.service';
import { TripSessionService } from './services/trip-session.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { FleetModule } from '../fleet/fleet.module';
import { QueuesModule } from '../queues/queues.module';
import { MetricsModule } from '../core/metrics/metrics.module';
import { GpsIntegrityService } from './services/gps-integrity.service';
import { TrackingQueueService } from './queues/tracking-queue.service';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    QueuesModule,
    FleetModule,
    AuthModule,
    TenantModule,
    NotificationsModule,
    MetricsModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('jwt.accessSecret'),
      }),
    }),
  ],
  controllers: [TrackingController],
  providers: [
    TrackingGateway,
    TrackingService,
    TripSessionService,
    TrackingCacheService,
    TrackingPubSubService,
    TrackingBatchService,
    TrackingQueueService,
    GeofenceService,
    EtaService,
    GpsIntegrityService,
    WsAuthGuard,
  ],
  exports: [
    TrackingService,
    TrackingCacheService,
    TrackingPubSubService,
    TripSessionService,
    TrackingQueueService,
    EtaService,
  ],
})
export class TrackingModule {}
