import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FleetModule } from '../fleet/fleet.module';
import { SchoolsModule } from '../schools/schools.module';
import { TenantModule } from '../common/tenant/tenant.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StudentsController } from './controllers/students.controller';
import { StudentsRepository } from './repositories/students.repository';
import { StudentsService } from './services/students.service';

@Module({
  imports: [PrismaModule, AuthModule, TenantModule, SchoolsModule, FleetModule],
  controllers: [StudentsController],
  providers: [StudentsRepository, StudentsService],
  exports: [StudentsService, StudentsRepository],
})
export class StudentsModule {}
