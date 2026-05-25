import { ForbiddenException, Injectable } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { AuthUser } from '../../auth/types/auth-user.type';

@Injectable()
export class TenantContextService {
  resolveSchoolId(user: AuthUser, requestedSchoolId?: string | null): string {
    if (user.role === RoleCode.SUPER_ADMIN) {
      if (requestedSchoolId) {
        return requestedSchoolId;
      }
      if (user.schoolId) {
        return user.schoolId;
      }
      throw new ForbiddenException('schoolId is required for this operation');
    }

    if (!user.schoolId) {
      throw new ForbiddenException('Tenant context is required');
    }

    if (requestedSchoolId && requestedSchoolId !== user.schoolId) {
      throw new ForbiddenException('Cross-tenant access denied');
    }

    return user.schoolId;
  }

  assertSuperAdmin(user: AuthUser): void {
    if (user.role !== RoleCode.SUPER_ADMIN) {
      throw new ForbiddenException('Super admin access required');
    }
  }

  buildTenantWhere(user: AuthUser, requestedSchoolId?: string): { schoolId: string } {
    return { schoolId: this.resolveSchoolId(user, requestedSchoolId) };
  }
}
