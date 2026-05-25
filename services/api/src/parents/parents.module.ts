import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FleetModule } from '../fleet/fleet.module';
import { TenantModule } from '../common/tenant/tenant.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ParentsController } from './controllers/parents.controller';
import { ParentsRepository } from './repositories/parents.repository';
import { ParentsService } from './services/parents.service';

@Module({
  imports: [PrismaModule, AuthModule, TenantModule, FleetModule],
  controllers: [ParentsController],
  providers: [ParentsRepository, ParentsService],
  exports: [ParentsService, ParentsRepository],
})
export class ParentsModule {}
