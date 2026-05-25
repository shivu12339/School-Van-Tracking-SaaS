import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { resolveEnvFilePaths } from './config/env-paths.util';
import { validationSchema } from './config/validation.schema';
import { HealthModule } from './health/health.module';
import { NotificationsWorkerModule } from './notifications/notifications-worker.module';
import { TrackingWorkerModule } from './tracking/tracking-worker.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

/** BullMQ worker process — no HTTP API except health. */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveEnvFilePaths(),
      cache: true,
      load: [configuration],
      validationSchema,
    }),
    PrismaModule,
    RedisModule,
    HealthModule,
    NotificationsWorkerModule,
    TrackingWorkerModule,
  ],
})
export class WorkerModule {}
