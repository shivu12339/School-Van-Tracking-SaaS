import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TenantAwareRepository } from '../../common/tenant/tenant-aware.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { AuthUser } from '../../auth/types/auth-user.type';
import { toPagination } from '../../common/utils/pagination.util';

@Injectable()
export class StudentsRepository extends TenantAwareRepository {
  constructor(prisma: PrismaService, tenantContext: TenantContextService) {
    super(prisma, tenantContext);
  }

  findMany(
    user: AuthUser,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      routeId?: string;
      parentId?: string;
    },
  ) {
    const schoolId = this.scopedSchoolId(user);
    const { skip, take } = toPagination(query.page, query.limit);
    const where: Prisma.StudentWhereInput = {
      schoolId,
      deletedAt: null,
      ...(query.routeId ? { routeId: query.routeId } : {}),
      ...(query.parentId ? { parentId: query.parentId } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: 'insensitive' } },
              { admissionNumber: { contains: query.search, mode: 'insensitive' } },
              { grade: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.prisma.$transaction([
      this.prisma.student.findMany({
        where,
        skip,
        take,
        orderBy: { fullName: 'asc' },
        include: {
          parent: { include: { user: { select: { email: true, phone: true } } } },
          route: { select: { id: true, routeCode: true, routeName: true } },
        },
      }),
      this.prisma.student.count({ where }),
    ]);
  }

  findById(user: AuthUser, id: string) {
    const schoolId = this.scopedSchoolId(user);
    return this.prisma.student.findFirst({
      where: { id, schoolId, deletedAt: null },
      include: {
        parent: { include: { user: true } },
        route: { include: { stops: { where: { deletedAt: null }, orderBy: { stopOrder: 'asc' } } } },
      },
    });
  }
}
