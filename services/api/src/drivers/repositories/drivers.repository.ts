import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TenantAwareRepository } from '../../common/tenant/tenant-aware.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { AuthUser } from '../../auth/types/auth-user.type';
import { toPagination } from '../../common/utils/pagination.util';

@Injectable()
export class DriversRepository extends TenantAwareRepository {
  constructor(prisma: PrismaService, tenantContext: TenantContextService) {
    super(prisma, tenantContext);
  }

  findMany(
    user: AuthUser,
    query: { page?: number; limit?: number; search?: string; isAvailable?: boolean },
  ) {
    const schoolId = this.scopedSchoolId(user);
    const { skip, take } = toPagination(query.page, query.limit);
    const where: Prisma.DriverWhereInput = {
      schoolId,
      deletedAt: null,
      ...(query.isAvailable !== undefined ? { isAvailable: query.isAvailable } : {}),
      ...(query.search
        ? {
            OR: [
              { licenseNumber: { contains: query.search, mode: 'insensitive' } },
              { employeeCode: { contains: query.search, mode: 'insensitive' } },
              {
                user: {
                  OR: [
                    { email: { contains: query.search, mode: 'insensitive' } },
                    { firstName: { contains: query.search, mode: 'insensitive' } },
                    { lastName: { contains: query.search, mode: 'insensitive' } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    return this.prisma.$transaction([
      this.prisma.driver.findMany({
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
        },
      }),
      this.prisma.driver.count({ where }),
    ]);
  }

  findById(user: AuthUser, id: string) {
    const schoolId = this.scopedSchoolId(user);
    return this.prisma.driver.findFirst({
      where: { id, schoolId, deletedAt: null },
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
        trips: {
          where: { status: 'IN_PROGRESS' },
          take: 1,
          select: { id: true, status: true, tripDate: true },
        },
      },
    });
  }

  create(data: Prisma.DriverCreateInput) {
    return this.prisma.driver.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });
  }

  update(schoolId: string, id: string, data: Prisma.DriverUpdateInput) {
    return this.prisma.driver.update({
      where: { id, schoolId },
      data,
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
      },
    });
  }
}
