import { ForbiddenException } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { type AuthUser } from '../../auth/types/auth-user.type';

export class NotificationAccessValidator {
  static assertTokenOwnership(user: AuthUser, tokenSchoolId: string | null | undefined): void {
    if (user.role === RoleCode.SUPER_ADMIN) {
      return;
    }
    if (!user.schoolId || (tokenSchoolId && tokenSchoolId !== user.schoolId)) {
      throw new ForbiddenException('Device token school mismatch');
    }
  }

  static assertAdminBroadcast(actor: AuthUser): void {
    if (actor.role !== RoleCode.SUPER_ADMIN && actor.role !== RoleCode.SCHOOL_ADMIN) {
      throw new ForbiddenException('Broadcast not permitted');
    }
  }
}
