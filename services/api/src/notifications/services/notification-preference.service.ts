import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../auth/types/auth-user.type';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { UpdateNotificationPreferenceDto } from '../dto/update-notification-preference.dto';

@Injectable()
export class NotificationPreferenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async get(user: AuthUser) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    return this.prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, schoolId, enabled: true, locale: 'en' },
    });
  }

  async update(user: AuthUser, dto: UpdateNotificationPreferenceDto) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    return this.prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {
        enabled: dto.enabled,
        enabledTypes: dto.enabledTypes as Prisma.InputJsonValue,
        quietHoursStart: dto.quietHoursStart,
        quietHoursEnd: dto.quietHoursEnd,
        locale: dto.locale,
      },
      create: {
        userId: user.id,
        schoolId,
        enabled: dto.enabled ?? true,
        enabledTypes: dto.enabledTypes as Prisma.InputJsonValue,
        quietHoursStart: dto.quietHoursStart,
        quietHoursEnd: dto.quietHoursEnd,
        locale: dto.locale ?? 'en',
      },
    });
  }

  isTypeEnabled(
    prefs: { enabled: boolean; enabledTypes?: unknown } | null,
    type: NotificationType,
  ): boolean {
    if (!prefs?.enabled) return false;
    if (!prefs.enabledTypes) return true;
    const enabled = prefs.enabledTypes as string[];
    return !Array.isArray(enabled) || enabled.includes(type);
  }
}
