import { type Prisma } from '@prisma/client';
import { type TenantContextService } from '../../common/tenant/tenant-context.service';
import { type AuthUser } from '../../auth/types/auth-user.type';
import { mergeSchoolIdWhere } from '../../../prisma/helpers/tenant-scope.helper';
import { type PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

/**
 * Repository base that merges tenant schoolId into Prisma where clauses.
 * Use alongside Prisma tenant middleware + request-scoped ALS for defense in depth.
 */
export abstract class TenantScopedRepository extends BaseRepository {
  protected constructor(
    prisma: PrismaService,
    protected readonly tenantContext: TenantContextService,
  ) {
    super(prisma);
  }

  protected schoolIdFor(user: AuthUser, requestedSchoolId?: string): string {
    return this.tenantContext.resolveSchoolId(user, requestedSchoolId);
  }

  protected whereForSchool<T extends Record<string, unknown>>(
    user: AuthUser,
    where?: T,
    requestedSchoolId?: string,
  ): T & { schoolId: string } {
    const schoolId = this.schoolIdFor(user, requestedSchoolId);
    return mergeSchoolIdWhere(where, schoolId);
  }

  protected tx<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn as never) as Promise<T>;
  }
}
