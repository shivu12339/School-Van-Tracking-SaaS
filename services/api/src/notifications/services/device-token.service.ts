import { Injectable } from '@nestjs/common';
import { Prisma, PushPlatform } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../auth/types/auth-user.type';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { RegisterDeviceDto } from '../dto/register-device.dto';
import { NotificationAccessValidator } from '../validators/notification-access.validator';
import { NotificationRedisCacheService } from './notification-redis-cache.service';

@Injectable()
export class DeviceTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly redisCache: NotificationRedisCacheService,
  ) {}

  async register(user: AuthUser, dto: RegisterDeviceDto) {
    const schoolId = this.tenantContext.resolveSchoolId(user, dto.schoolId);
    NotificationAccessValidator.assertTokenOwnership(user, schoolId);

    const token = await this.prisma.devicePushToken.upsert({
      where: {
        userId_deviceId: {
          userId: user.id,
          deviceId: dto.deviceId,
        },
      },
      update: {
        fcmToken: dto.fcmToken,
        platform: dto.platform as PushPlatform,
        appVersion: dto.appVersion,
        deviceInfo: dto.deviceInfo as Prisma.InputJsonValue | undefined,
        schoolId,
        isActive: true,
        lastActiveAt: new Date(),
      },
      create: {
        userId: user.id,
        schoolId,
        deviceId: dto.deviceId,
        fcmToken: dto.fcmToken,
        platform: dto.platform as PushPlatform,
        appVersion: dto.appVersion,
        deviceInfo: dto.deviceInfo as Prisma.InputJsonValue | undefined,
        isActive: true,
        lastActiveAt: new Date(),
      },
    });

    await this.redisCache.invalidateDeviceTokens(user.id);
    return token;
  }

  async getActiveTokens(userId: string): Promise<string[]> {
    const cached = await this.redisCache.getCachedDeviceTokens(userId);
    if (cached?.length) {
      return cached;
    }

    const tokens = await this.prisma.devicePushToken.findMany({
      where: { userId, isActive: true },
      select: { fcmToken: true },
    });
    const fcmTokens = tokens.map((t) => t.fcmToken);
    if (fcmTokens.length) {
      await this.redisCache.cacheDeviceTokens(userId, fcmTokens);
    }
    return fcmTokens;
  }

  async deactivateTokens(tokens: string[]): Promise<void> {
    if (!tokens.length) return;
    const rows = await this.prisma.devicePushToken.findMany({
      where: { fcmToken: { in: tokens } },
      select: { userId: true },
    });
    await this.prisma.devicePushToken.updateMany({
      where: { fcmToken: { in: tokens } },
      data: { isActive: false },
    });
    const userIds = [...new Set(rows.map((r) => r.userId))];
    await Promise.all(userIds.map((id) => this.redisCache.invalidateDeviceTokens(id)));
  }

  async unregister(user: AuthUser, deviceId: string): Promise<void> {
    await this.prisma.devicePushToken.updateMany({
      where: { userId: user.id, deviceId },
      data: { isActive: false },
    });
    await this.redisCache.invalidateDeviceTokens(user.id);
  }
}
