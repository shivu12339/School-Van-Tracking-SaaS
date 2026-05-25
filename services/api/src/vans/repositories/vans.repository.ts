import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TenantAwareRepository } from '../../common/tenant/tenant-aware.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { AuthUser } from '../../auth/types/auth-user.type';
import { toPagination } from '../../common/utils/pagination.util';

@Injectable()
export class VansRepository extends TenantAwareRepository {
  constructor(prisma: PrismaService, tenantContext: TenantContextService) {
    super(prisma, tenantContext);
  }

  findMany(
    user: AuthUser,
    query: { page?: number; limit?: number; search?: string; isActive?: boolean },
  ) {
    const schoolId = this.scopedSchoolId(user);
    const { skip, take } = toPagination(query.page, query.limit);
    const where: Prisma.VanWhereInput = {
      schoolId,
      deletedAt: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search
        ? {
            OR: [
              { registrationNo: { contains: query.search, mode: 'insensitive' } },
              { label: { contains: query.search, mode: 'insensitive' } },
              { gpsDeviceCode: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.prisma.$transaction([
      this.prisma.van.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          routes: { where: { deletedAt: null }, select: { id: true, routeCode: true, routeName: true } },
        },
      }),
      this.prisma.van.count({ where }),
    ]);
  }

  findById(user: AuthUser, id: string) {
    const schoolId = this.scopedSchoolId(user);
    return this.prisma.van.findFirst({
      where: { id, schoolId, deletedAt: null },
      include: {
        routes: { where: { deletedAt: null } },
        trips: {
          where: { status: 'IN_PROGRESS' },
          take: 1,
          select: { id: true, status: true },
        },
      },
    });
  }

  update(schoolId: string, id: string, data: Prisma.VanUpdateInput) {
    return this.prisma.van.update({ where: { id, schoolId }, data });
  }
}
