import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FleetModule } from '../fleet/fleet.module';
import { SchoolsModule } from '../schools/schools.module';
import { TenantModule } from '../common/tenant/tenant.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DriversController } from './controllers/drivers.controller';
import { DriversRepository } from './repositories/drivers.repository';
import { DriversService } from './services/drivers.service';

@Module({
  imports: [PrismaModule, AuthModule, TenantModule, SchoolsModule, FleetModule],
  controllers: [DriversController],
  providers: [DriversRepository, DriversService],
  exports: [DriversService, DriversRepository],
})
export class DriversModule {}
