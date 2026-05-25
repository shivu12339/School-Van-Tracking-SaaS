import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantCacheService } from '../../common/tenant/tenant-cache.service';
import { UpdateSchoolSettingsDto } from '../dto/update-school-settings.dto';

@Injectable()
export class SchoolSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantCache: TenantCacheService,
  ) {}

  async getBySchoolId(schoolId: string) {
    const settings = await this.prisma.schoolSettings.findUnique({
      where: { schoolId },
    });
    if (!settings) {
      throw new NotFoundException('School settings not found');
    }
    return settings;
  }

  async update(schoolId: string, dto: UpdateSchoolSettingsDto) {
    const data: Prisma.SchoolSettingsUpdateInput = {
      ...(dto.pickupRadius1Km !== undefined ? { pickupRadius1Km: dto.pickupRadius1Km } : {}),
      ...(dto.pickupRadius500m !== undefined ? { pickupRadius500m: dto.pickupRadius500m } : {}),
      ...(dto.notificationsEnabled !== undefined
        ? { notificationsEnabled: dto.notificationsEnabled }
        : {}),
      ...(dto.liveTrackingEnabled !== undefined
        ? { liveTrackingEnabled: dto.liveTrackingEnabled }
        : {}),
      ...(dto.sosEnabled !== undefined ? { sosEnabled: dto.sosEnabled } : {}),
      ...(dto.contactEmail !== undefined ? { contactEmail: dto.contactEmail } : {}),
      ...(dto.contactPhone !== undefined ? { contactPhone: dto.contactPhone } : {}),
      ...(dto.metadata !== undefined
        ? { metadata: dto.metadata as Prisma.InputJsonValue }
        : {}),
    };

    const settings = await this.prisma.schoolSettings.upsert({
      where: { schoolId },
      update: data,
      create: {
        schoolId,
        pickupRadius1Km: dto.pickupRadius1Km ?? 1000,
        pickupRadius500m: dto.pickupRadius500m ?? 500,
        notificationsEnabled: dto.notificationsEnabled ?? true,
        liveTrackingEnabled: dto.liveTrackingEnabled ?? true,
        sosEnabled: dto.sosEnabled ?? true,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        metadata: dto.metadata as Prisma.InputJsonValue | undefined,
      },
    });

    if (dto.schoolBranding) {
      await this.prisma.school.update({
        where: { id: schoolId },
        data: {
          ...(dto.schoolBranding.logoUrl !== undefined
            ? { logoUrl: dto.schoolBranding.logoUrl }
            : {}),
          ...(dto.schoolBranding.primaryColor !== undefined
            ? { primaryColor: dto.schoolBranding.primaryColor }
            : {}),
          ...(dto.schoolBranding.secondaryColor !== undefined
            ? { secondaryColor: dto.schoolBranding.secondaryColor }
            : {}),
          ...(dto.schoolBranding.language !== undefined
            ? { language: dto.schoolBranding.language }
            : {}),
          ...(dto.schoolBranding.timezone !== undefined
            ? { timezone: dto.schoolBranding.timezone }
            : {}),
        },
      });
    }

    await this.tenantCache.invalidateSchool(schoolId);
    return settings;
  }
}
