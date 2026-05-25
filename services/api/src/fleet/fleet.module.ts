import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { FleetAssignmentService } from './services/fleet-assignment.service';
import { FleetCacheService } from './services/fleet-cache.service';

@Global()
@Module({
  imports: [PrismaModule, RedisModule],
  providers: [FleetAssignmentService, FleetCacheService],
  exports: [FleetAssignmentService, FleetCacheService],
})
export class FleetModule {}
