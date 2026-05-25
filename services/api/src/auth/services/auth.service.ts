import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditAction, BillingStatus, RoleCode } from '@prisma/client';
import { hashPassword, verifyPassword } from '../../common/utils/password.util';
import { PrismaService } from '../../prisma/prisma.service';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { LoginDto } from '../dto/login.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { AuthUser } from '../types/auth-user.type';
import { generateOpaqueToken, hashToken } from '../utils/token-hash.util';
import { parseJwtTtlToSeconds } from '../utils/jwt.util';
import { PASSWORD_RESET_TOKEN_BYTES } from '../constants/auth.constants';
import { AuthRepository, UserWithRoles } from '../repositories/auth.repository';
import { AuditLogService } from './audit-log.service';
import { LoginProtectionService } from './login-protection.service';
import { PermissionService } from './permission.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly permissionService: PermissionService,
    private readonly loginProtectionService: LoginProtectionService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private resolveDeviceId(dto: LoginDto): string {
    return dto.deviceId?.trim() || `web-${dto.email.toLowerCase()}`;
  }

  private async findUserForLogin(email: string, schoolCode?: string): Promise<UserWithRoles | null> {
    if (schoolCode) {
      const school = await this.authRepository.findSchoolByCode(schoolCode);
      if (!school) {
        return null;
      }
      return this.authRepository.findUserForLogin(email, school.id);
    }
    return this.authRepository.findUserForLogin(email, null);
  }

  private async assertSchoolOperational(schoolId: string | null): Promise<void> {
    if (!schoolId) {
      return;
    }
    const school = await this.authRepository.findSchoolById(schoolId);
    if (!school) {
      throw new UnauthorizedException('School not found');
    }
    if (!this.authRepository.isSchoolLoginAllowed(school.status, school.isActive)) {
      throw new UnauthorizedException('School is not active');
    }
    const billing = school.subscription?.billingStatus;
    if (billing === BillingStatus.CANCELLED) {
      throw new UnauthorizedException('School subscription is inactive');
    }
  }

  private async buildAuthUser(user: UserWithRoles, sessionId: string): Promise<AuthUser> {
    const roleCodes = user.userRoles.map((ur) => ur.role.code);
    const role = this.permissionService.resolvePrimaryRole(roleCodes);
    const permissions = await this.permissionService.getUserPermissions(user.id);
    return {
      id: user.id,
      email: user.email,
      schoolId: user.schoolId,
      role,
      sessionId,
      permissions,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  private assertAccountNotLocked(user: UserWithRoles): void {
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account is temporarily locked');
    }
  }

  private async registerFailedLogin(
    user: UserWithRoles,
    email: string,
    ip: string,
  ): Promise<void> {
    const attempts = await this.loginProtectionService.recordFailedAttempt(email, ip);
    const maxAttempts = this.configService.get<number>('auth.maxLoginAttempts', 5);
    const lockMinutes = this.configService.get<number>('auth.lockDurationMinutes', 15);
    const lockUntil =
      attempts >= maxAttempts || user.failedLoginAttempts + 1 >= maxAttempts
        ? new Date(Date.now() + lockMinutes * 60 * 1000)
        : null;
    await this.authRepository.incrementFailedLogin(user.id, lockUntil);
  }

  async login(
    dto: LoginDto,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<{ accessToken: string; refreshToken: string; user: AuthUser }> {
    await this.loginProtectionService.assertNotRateLimited(
      dto.email,
      meta.ipAddress ?? 'unknown',
    );

    const user = await this.findUserForLogin(dto.email, dto.schoolCode);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.assertAccountNotLocked(user);
    await this.assertSchoolOperational(user.schoolId);

    const valid = await verifyPassword(dto.password, user.passwordHash);
    if (!valid) {
      await this.registerFailedLogin(user, dto.email, meta.ipAddress ?? 'unknown');
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.loginProtectionService.clearAttempts(dto.email, meta.ipAddress ?? 'unknown');
    await this.authRepository.clearLoginFailures(user.id);

    const refresh = await this.tokenService.issueRefreshToken({
      userId: user.id,
      schoolId: user.schoolId,
    });

    const deviceId = this.resolveDeviceId(dto);
    const sessionId = await this.sessionService.upsertDeviceSession({
      userId: user.id,
      schoolId: user.schoolId,
      refreshTokenId: refresh.recordId,
      deviceId,
      platform: dto.platform ?? 'web',
      appVersion: dto.appVersion,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    const authUser = await this.buildAuthUser(user, sessionId);
    await this.sessionService.cacheSession(sessionId, authUser);

    const accessToken = await this.tokenService.issueAccessToken(authUser);

    await this.auditLogService.log({
      schoolId: user.schoolId,
      actorUserId: user.id,
      action: AuditAction.LOGIN,
      entityType: 'user',
      entityId: user.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: { deviceId, platform: dto.platform ?? 'web' },
    });

    return { accessToken, refreshToken: refresh.token, user: authUser };
  }

  async refresh(
    refreshToken: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const rotated = await this.tokenService.rotateRefreshToken(refreshToken);
    const user = await this.prisma.user.findUnique({
      where: { id: rotated.userId },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    await this.prisma.deviceSession.updateMany({
      where: { refreshTokenId: rotated.previousTokenId },
      data: { refreshTokenId: rotated.newTokenId, lastSeenAt: new Date() },
    });

    const session = await this.prisma.deviceSession.findFirst({
      where: { refreshTokenId: rotated.newTokenId, status: 'ACTIVE' },
    });
    const sessionId =
      session?.id ??
      (await this.sessionService.upsertDeviceSession({
        userId: user.id,
        schoolId: user.schoolId,
        refreshTokenId: rotated.newTokenId,
        deviceId: 'unknown-device',
        platform: 'unknown',
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      }));

    const authUser = await this.buildAuthUser(user, sessionId);
    await this.sessionService.cacheSession(sessionId, authUser);
    await this.sessionService.touchSession(sessionId);

    const accessToken = await this.tokenService.issueAccessToken(authUser);
    return { accessToken, refreshToken: rotated.newRefreshToken };
  }

  async logout(
    user: AuthUser,
    refreshToken?: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    if (user.jti) {
      const ttl = parseJwtTtlToSeconds(
        this.configService.getOrThrow<string>('jwt.accessTtl'),
      );
      await this.tokenService.blacklistAccessToken(user.jti, ttl);
    }
    if (refreshToken) {
      await this.tokenService.revokeRefreshToken(refreshToken);
    }
    await this.sessionService.revokeSession(user.sessionId);
    await this.auditLogService.log({
      schoolId: user.schoolId,
      actorUserId: user.id,
      action: AuditAction.LOGOUT,
      entityType: 'user',
      entityId: user.id,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  }

  async logoutAll(
    user: AuthUser,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    if (user.jti) {
      const ttl = parseJwtTtlToSeconds(
        this.configService.getOrThrow<string>('jwt.accessTtl'),
      );
      await this.tokenService.blacklistAccessToken(user.jti, ttl);
    }
    await this.tokenService.revokeAllUserRefreshTokens(user.id);
    await this.sessionService.revokeAllUserSessions(user.id);
    await this.auditLogService.log({
      schoolId: user.schoolId,
      actorUserId: user.id,
      action: AuditAction.LOGOUT,
      entityType: 'user',
      entityId: user.id,
      metadata: { scope: 'all_devices' },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  }

  me(user: AuthUser): Promise<AuthUser> {
    return Promise.resolve(user);
  }

  async changePassword(user: AuthUser, dto: ChangePasswordDto): Promise<void> {
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      throw new UnauthorizedException();
    }
    const valid = await verifyPassword(dto.currentPassword, dbUser.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    await this.authRepository.updatePassword(user.id, await hashPassword(dto.newPassword));
    await this.tokenService.revokeAllUserRefreshTokens(user.id);
    await this.sessionService.revokeAllUserSessions(user.id);
    await this.auditLogService.log({
      schoolId: user.schoolId,
      actorUserId: user.id,
      action: AuditAction.UPDATE,
      entityType: 'user',
      entityId: user.id,
      metadata: { action: 'change_password' },
    });
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.findUserForLogin(dto.email, dto.schoolCode);
    if (!user) {
      return { message: 'If the account exists, a reset link will be sent.' };
    }
    const resetToken = generateOpaqueToken(PASSWORD_RESET_TOKEN_BYTES);
    const resetHash = hashToken(resetToken);
    const expiresMinutes = this.configService.get<number>('auth.passwordResetTtlMinutes', 30);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: resetHash,
        passwordResetExpiresAt: new Date(Date.now() + expiresMinutes * 60 * 1000),
      },
    });
    // Integrate email provider in production.
    return { message: 'If the account exists, a reset link will be sent.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const resetHash = hashToken(dto.resetToken);
    const user = await this.authRepository.findUserByPasswordResetHash(resetHash);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    await this.authRepository.updatePassword(user.id, await hashPassword(dto.newPassword));
    await this.tokenService.revokeAllUserRefreshTokens(user.id);
    await this.sessionService.revokeAllUserSessions(user.id);
    await this.auditLogService.log({
      schoolId: user.schoolId,
      actorUserId: user.id,
      action: AuditAction.UPDATE,
      entityType: 'user',
      entityId: user.id,
      metadata: { action: 'reset_password' },
    });
    return { message: 'Password reset successful' };
  }

  async issueSessionForUser(
    user: UserWithRoles,
    device: { deviceId: string; platform: string; appVersion?: string },
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<{ accessToken: string; refreshToken: string; user: AuthUser }> {
    const refresh = await this.tokenService.issueRefreshToken({
      userId: user.id,
      schoolId: user.schoolId,
    });
    const sessionId = await this.sessionService.upsertDeviceSession({
      userId: user.id,
      schoolId: user.schoolId,
      refreshTokenId: refresh.recordId,
      deviceId: device.deviceId,
      platform: device.platform,
      appVersion: device.appVersion,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    const authUser = await this.buildAuthUser(user, sessionId);
    await this.sessionService.cacheSession(sessionId, authUser);
    const accessToken = await this.tokenService.issueAccessToken(authUser);
    return { accessToken, refreshToken: refresh.token, user: authUser };
  }

  async impersonateSchoolAdmin(
    actor: AuthUser,
    targetUserId: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<{ accessToken: string; refreshToken: string; user: AuthUser }> {
    if (actor.role !== RoleCode.SUPER_ADMIN) {
      throw new UnauthorizedException('Only super admin can impersonate');
    }
    const user = await this.prisma.user.findFirst({
      where: { id: targetUserId, isActive: true },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) {
      throw new UnauthorizedException('Target user not found');
    }
    await this.auditLogService.log({
      schoolId: user.schoolId,
      actorUserId: actor.id,
      action: AuditAction.LOGIN,
      entityType: 'user',
      entityId: user.id,
      metadata: { impersonation: true },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    return this.issueSessionForUser(
      user,
      { deviceId: `impersonation-${actor.id}`, platform: 'web-admin' },
      meta,
    );
  }

  async listDeviceSessions(user: AuthUser) {
    return this.sessionService.listActiveSessions(user.id);
  }

  async revokeDeviceSession(user: AuthUser, deviceId: string): Promise<{ revoked: boolean }> {
    const revoked = await this.sessionService.revokeSessionByDeviceId(user.id, deviceId);
    if (revoked) {
      await this.auditLogService.log({
        schoolId: user.schoolId,
        actorUserId: user.id,
        action: AuditAction.LOGOUT,
        entityType: 'device_session',
        metadata: { deviceId },
      });
    }
    return { revoked };
  }
}
