import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FleetModule } from '../fleet/fleet.module';
import { TenantModule } from '../common/tenant/tenant.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RoutesController } from './controllers/routes.controller';
import { RoutesRepository } from './repositories/routes.repository';
import { RoutesService } from './services/routes.service';

@Module({
  imports: [PrismaModule, AuthModule, TenantModule, FleetModule],
  controllers: [RoutesController],
  providers: [RoutesRepository, RoutesService],
  exports: [RoutesService, RoutesRepository],
})
export class RoutesModule {}
