import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { TenantGuard } from './auth/guards/tenant.guard';
import { CommonModule } from './common/common.module';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { TenantModule } from './common/tenant/tenant.module';
import { configNamespaces } from './config';
import { resolveEnvFilePaths } from './config/env-paths.util';
import { validationSchema } from './config/validation.schema';
import { FeatureFlagsModule } from './core/feature-flags/feature-flags.module';
import { MetricsModule } from './core/metrics/metrics.module';
import { FleetModule } from './fleet/fleet.module';
import { DriverModule } from './driver/driver.module';
import { DriversModule } from './drivers/drivers.module';
import { HealthModule } from './health/health.module';
import { RootModule } from './root/root.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ParentModule } from './parent/parent.module';
import { ParentsModule } from './parents/parents.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueuesModule } from './queues/queues.module';
import { RedisModule } from './redis/redis.module';
import { ReportsModule } from './reports/reports.module';
import { RoutesModule } from './routes/routes.module';
import { SchoolsModule } from './schools/schools.module';
import { StudentsModule } from './students/students.module';
import { TrackingModule } from './tracking/tracking.module';
import { TripsModule } from './trips/trips.module';
import { UsersModule } from './users/users.module';
import { VansModule } from './vans/vans.module';
import { WebSocketModule } from './websocket/websocket.module';
import { SubscriptionGuard } from './schools/guards/subscription.guard';
import { TenantInterceptor } from './common/tenant/tenant.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveEnvFilePaths(),
      cache: true,
      load: [...configNamespaces],
      validationSchema,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('app.throttleTtl', 60_000),
          limit: config.get<number>('app.throttleLimit', 120),
        },
      ],
    }),
    CommonModule,
    PrismaModule,
    FleetModule,
    RedisModule,
    QueuesModule,
    TenantModule,
    RootModule,
    HealthModule,
    WebSocketModule,
    AuthModule,
    UsersModule,
    SchoolsModule,
    DriversModule,
    DriverModule,
    ParentsModule,
    ParentModule,
    StudentsModule,
    VansModule,
    RoutesModule,
    TrackingModule,
    TripsModule,
    NotificationsModule,
    ReportsModule,
    FeatureFlagsModule,
    MetricsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: SubscriptionGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware, TenantMiddleware).forRoutes('*');
  }
}
