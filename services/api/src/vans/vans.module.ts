import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FleetModule } from '../fleet/fleet.module';
import { SchoolsModule } from '../schools/schools.module';
import { TenantModule } from '../common/tenant/tenant.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VansController } from './controllers/vans.controller';
import { VansRepository } from './repositories/vans.repository';
import { VansService } from './services/vans.service';

@Module({
  imports: [PrismaModule, AuthModule, TenantModule, SchoolsModule, FleetModule],
  controllers: [VansController],
  providers: [VansRepository, VansService],
  exports: [VansService, VansRepository],
})
export class VansModule {}
