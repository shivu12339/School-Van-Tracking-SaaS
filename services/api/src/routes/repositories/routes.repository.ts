import { Injectable } from '@nestjs/common';
import { Prisma, TripDirection } from '@prisma/client';
import { TenantAwareRepository } from '../../common/tenant/tenant-aware.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { AuthUser } from '../../auth/types/auth-user.type';
import { toPagination } from '../../common/utils/pagination.util';

@Injectable()
export class RoutesRepository extends TenantAwareRepository {
  constructor(prisma: PrismaService, tenantContext: TenantContextService) {
    super(prisma, tenantContext);
  }

  findMany(
    user: AuthUser,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      isActive?: boolean;
      direction?: TripDirection;
    },
  ) {
    const schoolId = this.scopedSchoolId(user);
    const { skip, take } = toPagination(query.page, query.limit);
    const where: Prisma.RouteWhereInput = {
      schoolId,
      deletedAt: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.direction ? { direction: query.direction } : {}),
      ...(query.search
        ? {
            OR: [
              { routeCode: { contains: query.search, mode: 'insensitive' } },
              { routeName: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.prisma.$transaction([
      this.prisma.route.findMany({
        where,
        skip,
        take,
        orderBy: { routeCode: 'asc' },
        include: {
          van: { select: { id: true, registrationNo: true, label: true, capacity: true } },
          stops: { where: { deletedAt: null }, orderBy: { stopOrder: 'asc' } },
          _count: { select: { students: true, trips: true } },
        },
      }),
      this.prisma.route.count({ where }),
    ]);
  }

  findById(user: AuthUser, id: string) {
    const schoolId = this.scopedSchoolId(user);
    return this.prisma.route.findFirst({
      where: { id, schoolId, deletedAt: null },
      include: {
        van: true,
        stops: { where: { deletedAt: null }, orderBy: { stopOrder: 'asc' } },
        students: { where: { deletedAt: null }, select: { id: true, fullName: true } },
      },
    });
  }
}
