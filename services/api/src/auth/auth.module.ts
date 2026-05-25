import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { AuthController } from './controllers/auth.controller';
import { AuditLogService } from './services/audit-log.service';
import { AuthService } from './services/auth.service';
import { LoginProtectionService } from './services/login-protection.service';
import { PermissionService } from './services/permission.service';
import { RefreshTokenValidatorService } from './services/refresh-token-validator.service';
import { SessionService } from './services/session.service';
import { TokenService } from './services/token.service';
import { AuthRepository } from './repositories/auth.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { TenantGuard } from './guards/tenant.guard';
import { AuthActivityMiddleware } from './middleware/auth-activity.middleware';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('jwt.accessSecret'),
        signOptions: {
          expiresIn: config.getOrThrow<string>('jwt.accessTtl') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthRepository,
    AuthService,
    TokenService,
    SessionService,
    PermissionService,
    LoginProtectionService,
    AuditLogService,
    RefreshTokenValidatorService,
    JwtStrategy,
    JwtAuthGuard,
    RefreshTokenGuard,
    RolesGuard,
    PermissionsGuard,
    TenantGuard,
    AuthActivityMiddleware,
  ],
  exports: [
    AuthService,
    AuthRepository,
    JwtAuthGuard,
    RefreshTokenGuard,
    RolesGuard,
    PermissionsGuard,
    TenantGuard,
    PermissionService,
    TokenService,
    SessionService,
    AuditLogService,
  ],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthActivityMiddleware).forRoutes(AuthController);
  }
}
