import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TenantAwareRepository } from '../../common/tenant/tenant-aware.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { AuthUser } from '../../auth/types/auth-user.type';
import { toPagination } from '../../common/utils/pagination.util';

@Injectable()
export class ParentsRepository extends TenantAwareRepository {
  constructor(prisma: PrismaService, tenantContext: TenantContextService) {
    super(prisma, tenantContext);
  }

  findMany(user: AuthUser, query: { page?: number; limit?: number; search?: string }) {
    const schoolId = this.scopedSchoolId(user);
    const { skip, take } = toPagination(query.page, query.limit);
    const where: Prisma.ParentWhereInput = {
      schoolId,
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { relationship: { contains: query.search, mode: 'insensitive' } },
              {
                user: {
                  OR: [
                    { email: { contains: query.search, mode: 'insensitive' } },
                    { firstName: { contains: query.search, mode: 'insensitive' } },
                    { lastName: { contains: query.search, mode: 'insensitive' } },
                    { phone: { contains: query.search, mode: 'insensitive' } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    return this.prisma.$transaction([
      this.prisma.parent.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              isActive: true,
            },
          },
          students: {
            where: { deletedAt: null },
            select: { id: true, fullName: true, admissionNumber: true, grade: true },
          },
          _count: { select: { students: true } },
        },
      }),
      this.prisma.parent.count({ where }),
    ]);
  }

  findById(user: AuthUser, id: string) {
    const schoolId = this.scopedSchoolId(user);
    return this.prisma.parent.findFirst({
      where: { id, schoolId, deletedAt: null },
      include: {
        user: { include: { notificationPrefs: true } },
        students: { where: { deletedAt: null } },
      },
    });
  }
}
