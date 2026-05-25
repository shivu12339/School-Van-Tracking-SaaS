import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { QueuesModule } from '../queues/queues.module';
import { HealthController } from './health.controller';
import { QueueHealthService } from './queue-health.service';

@Module({
  imports: [ConfigModule, PrismaModule, RedisModule, QueuesModule],
  controllers: [HealthController],
  providers: [QueueHealthService],
})
export class HealthModule {}
