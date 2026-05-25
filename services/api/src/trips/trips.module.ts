import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TenantModule } from '../common/tenant/tenant.module';
import { FleetModule } from '../fleet/fleet.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TrackingModule } from '../tracking/tracking.module';
import { TripsController } from './controllers/trips.controller';
import { TripsRepository } from './repositories/trips.repository';
import { TripsService } from './services/trips.service';

@Module({
  imports: [PrismaModule, TenantModule, FleetModule, AuthModule, TrackingModule],
  controllers: [TripsController],
  providers: [TripsRepository, TripsService],
  exports: [TripsService, TripsRepository],
})
export class TripsModule {}
