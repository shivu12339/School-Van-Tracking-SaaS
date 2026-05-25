import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditAction, BillingStatus, RoleCode, SchoolOperationalStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../auth/services/audit-log.service';
import { CreateSchoolDto } from '../dto/create-school.dto';
import { assertValidSchoolCode } from '../validators/school-code.validator';
import { AuthUser } from '../../auth/types/auth-user.type';

@Injectable()
export class SchoolOnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly configService: ConfigService,
  ) {}

  async onboard(dto: CreateSchoolDto, actor: AuthUser) {
    const code = assertValidSchoolCode(dto.code);
    const existing = await this.prisma.school.findFirst({ where: { code } });
    if (existing) {
      throw new ConflictException('School code already exists');
    }

    const trialDays = dto.trialDays ?? 14;

    const result = await this.prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          code,
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          timezone: dto.timezone ?? 'Asia/Kolkata',
          address: dto.address,
          status: SchoolOperationalStatus.PENDING,
          isActive: false,
        },
      });

      await tx.schoolSettings.create({
        data: {
          schoolId: school.id,
          contactEmail: dto.email,
          contactPhone: dto.phone,
        },
      });

      const plan = await tx.planCatalog.findUniqueOrThrow({
        where: { tier: dto.planTier },
      });

      const trialEndsAt = new Date(Date.now() + trialDays * 86_400_000);
      const graceDays = Number(this.configService.get<number>('saas.defaultGracePeriodDays') ?? 7);
      const graceEndsAt = new Date(trialEndsAt.getTime() + graceDays * 86_400_000);
      await tx.schoolSubscription.create({
        data: {
          schoolId: school.id,
          planCatalogId: plan.id,
          billingStatus: BillingStatus.TRIAL,
          startsAt: new Date(),
          trialEndsAt,
          endsAt: trialEndsAt,
          graceEndsAt,
        },
      });

      let adminRole = await tx.role.findFirst({
        where: { schoolId: school.id, code: RoleCode.SCHOOL_ADMIN },
      });
      if (!adminRole) {
        adminRole = await tx.role.create({
          data: {
            schoolId: school.id,
            code: RoleCode.SCHOOL_ADMIN,
            name: 'School Admin',
            isSystem: true,
          },
        });
      }

      const passwordHash = await bcrypt.hash(dto.adminPassword, 12);
      const adminUser = await tx.user.create({
        data: {
          schoolId: school.id,
          email: dto.adminEmail.toLowerCase(),
          passwordHash,
          firstName: dto.adminFirstName,
          lastName: dto.adminLastName,
          isActive: true,
        },
      });

      await tx.userRoleAssignment.create({
        data: {
          schoolId: school.id,
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      });

      const activated = await tx.school.update({
        where: { id: school.id },
        data: {
          status: SchoolOperationalStatus.ACTIVE,
          isActive: true,
          trialEndsAt,
        },
        include: {
          subscription: { include: { planCatalog: true } },
          settings: true,
        },
      });

      return { school: activated, adminUserId: adminUser.id };
    });

    await this.auditLogService.log({
      schoolId: result.school.id,
      actorUserId: actor.id,
      action: AuditAction.CREATE,
      entityType: 'school',
      entityId: result.school.id,
      metadata: { onboarding: true, planTier: dto.planTier },
    });

    return result.school;
  }
}
