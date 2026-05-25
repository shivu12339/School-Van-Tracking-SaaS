import { Injectable } from '@nestjs/common';
import { RoleCode, SchoolOperationalStatus, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type UserWithRoles = User & {
  userRoles: { role: { code: RoleCode } }[];
};

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSchoolById(schoolId: string) {
    return this.prisma.school.findFirst({
      where: { id: schoolId, deletedAt: null },
      include: { subscription: true },
    });
  }

  async findSchoolByCode(code: string) {
    return this.prisma.school.findFirst({
      where: { code, isActive: true, deletedAt: null },
      include: {
        subscription: { include: { planCatalog: true } },
        settings: true,
      },
    });
  }

  async findUserForLogin(email: string, schoolId?: string | null): Promise<UserWithRoles | null> {
    const normalizedEmail = email.toLowerCase();
    return this.prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        schoolId: schoolId ?? null,
        deletedAt: null,
      },
      include: { userRoles: { include: { role: true } } },
    });
  }

  async findActiveUserWithRoles(userId: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findFirst({
      where: { id: userId, isActive: true, deletedAt: null },
      include: { userRoles: { include: { role: true } } },
    });
  }

  async findUserByPasswordResetHash(tokenHash: string) {
    return this.prisma.user.findFirst({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
        deletedAt: null,
      },
    });
  }

  async clearLoginFailures(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
  }

  async incrementFailedLogin(
    userId: string,
    lockUntil: Date | null,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: { increment: 1 },
        ...(lockUntil ? { lockedUntil: lockUntil } : {}),
      },
    });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  async setPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: expiresAt },
    });
  }

  isSchoolLoginAllowed(status: SchoolOperationalStatus, isActive: boolean): boolean {
    if (!isActive) return false;
    return status === SchoolOperationalStatus.ACTIVE || status === SchoolOperationalStatus.TRIAL;
  }
}
