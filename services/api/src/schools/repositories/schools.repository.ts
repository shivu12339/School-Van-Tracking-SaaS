import { Injectable } from '@nestjs/common';
import { Prisma, SchoolOperationalStatus } from '@prisma/client';
import { TenantAwareRepository } from '../../common/tenant/tenant-aware.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { AuthUser } from '../../auth/types/auth-user.type';
import { toPagination } from '../../common/utils/pagination.util';

@Injectable()
export class SchoolsRepository extends TenantAwareRepository {
  constructor(prisma: PrismaService, tenantContext: TenantContextService) {
    super(prisma, tenantContext);
  }

  findMany(
    user: AuthUser,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: SchoolOperationalStatus;
    },
  ) {
    const { skip, take } = toPagination(query.page, query.limit);
    const where: Prisma.SchoolWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { code: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    if (user.role !== 'SUPER_ADMIN') {
      where.id = this.scopedSchoolId(user);
    }

    return this.prisma.$transaction([
      this.prisma.school.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: { include: { planCatalog: true } },
          settings: true,
        },
      }),
      this.prisma.school.count({ where }),
    ]);
  }

  findById(user: AuthUser, schoolId: string) {
    const scopedId = this.scopedSchoolId(user, schoolId);
    return this.prisma.school.findFirst({
      where: { id: scopedId, deletedAt: null },
      include: {
        subscription: { include: { planCatalog: true } },
        settings: true,
      },
    });
  }

  findByCode(code: string) {
    return this.prisma.school.findFirst({
      where: { code, deletedAt: null },
    });
  }

  create(data: Prisma.SchoolCreateInput) {
    return this.prisma.school.create({ data });
  }

  update(schoolId: string, data: Prisma.SchoolUpdateInput) {
    return this.prisma.school.update({
      where: { id: schoolId },
      data,
      include: {
        subscription: { include: { planCatalog: true } },
        settings: true,
      },
    });
  }

  softDelete(schoolId: string) {
    return this.prisma.school.update({
      where: { id: schoolId },
      data: {
        deletedAt: new Date(),
        isActive: false,
        status: SchoolOperationalStatus.SUSPENDED,
      },
    });
  }
}
