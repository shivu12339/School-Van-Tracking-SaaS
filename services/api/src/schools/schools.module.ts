import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TenantModule } from '../common/tenant/tenant.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SchoolsController } from './controllers/schools.controller';
import { SubscriptionGuard } from './guards/subscription.guard';
import { SchoolsRepository } from './repositories/schools.repository';
import { SchoolAnalyticsService } from './services/school-analytics.service';
import { SchoolOnboardingService } from './services/school-onboarding.service';
import { SchoolSettingsService } from './services/school-settings.service';
import { SchoolsService } from './services/schools.service';
import { SubscriptionService } from './services/subscription.service';

@Module({
  imports: [PrismaModule, AuthModule, TenantModule],
  controllers: [SchoolsController],
  providers: [
    SchoolsRepository,
    SchoolsService,
    SchoolOnboardingService,
    SchoolSettingsService,
    SchoolAnalyticsService,
    SubscriptionService,
    SubscriptionGuard,
  ],
  exports: [
    SchoolsService,
    SubscriptionService,
    SubscriptionGuard,
    SchoolsRepository,
    SchoolSettingsService,
  ],
})
export class SchoolsModule {}
