import { type PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from '../../prisma/repositories/base.repository';
import { type AuthUser } from '../../auth/types/auth-user.type';
import { type TenantContextService } from './tenant-context.service';

export abstract class TenantAwareRepository extends BaseRepository {
  protected constructor(
    prisma: PrismaService,
    protected readonly tenantContext: TenantContextService,
  ) {
    super(prisma);
  }

  protected scopedSchoolId(user: AuthUser, requestedSchoolId?: string): string {
    return this.tenantContext.resolveSchoolId(user, requestedSchoolId);
  }
}
