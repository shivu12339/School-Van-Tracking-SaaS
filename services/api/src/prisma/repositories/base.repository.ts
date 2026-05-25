import { type PrismaService } from '../prisma.service';

/**
 * Base data-access layer — extend for domain repositories.
 * Tenant-scoped queries use {@link TenantAwareRepository}.
 */
export abstract class BaseRepository {
  constructor(protected readonly prisma: PrismaService) {}
}
