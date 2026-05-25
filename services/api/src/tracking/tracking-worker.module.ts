import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetricsModule } from '../core/metrics/metrics.module';
import { PrismaModule } from '../prisma/prisma.module';
import { QueuesModule } from '../queues/queues.module';
import { RedisModule } from '../redis/redis.module';
import { TrackingWorkersService } from './workers/tracking-workers.service';

/** BullMQ workers for GPS persistence and tracking analytics (worker process only). */
@Module({
  imports: [ConfigModule, PrismaModule, RedisModule, QueuesModule, MetricsModule],
  providers: [TrackingWorkersService],
})
export class TrackingWorkerModule {}
