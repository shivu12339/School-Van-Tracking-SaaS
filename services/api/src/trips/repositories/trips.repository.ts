import { Injectable } from '@nestjs/common';
import { Prisma, TripDirection, TripStatus } from '@prisma/client';
import { TenantAwareRepository } from '../../common/tenant/tenant-aware.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { AuthUser } from '../../auth/types/auth-user.type';
import { toPagination } from '../../common/utils/pagination.util';

@Injectable()
export class TripsRepository extends TenantAwareRepository {
  constructor(prisma: PrismaService, tenantContext: TenantContextService) {
    super(prisma, tenantContext);
  }

  private tripInclude = {
    van: { select: { id: true, registrationNo: true, label: true } },
    route: { select: { id: true, routeName: true, routeCode: true, direction: true } },
    driver: {
      select: {
        id: true,
        licenseNumber: true,
        user: { select: { firstName: true, lastName: true, phone: true } },
      },
    },
    _count: { select: { tripStudents: true, trackingLogs: true } },
  } as const;

  findMany(
    user: AuthUser,
    query: {
      page?: number;
      limit?: number;
      status?: TripStatus;
      direction?: TripDirection;
      driverId?: string;
      vanId?: string;
      routeId?: string;
      from?: string;
      to?: string;
    },
  ) {
    const schoolId = this.scopedSchoolId(user);
    const { skip, take } = toPagination(query.page, query.limit);
    const where: Prisma.TripWhereInput = {
      schoolId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.direction ? { direction: query.direction } : {}),
      ...(query.driverId ? { driverId: query.driverId } : {}),
      ...(query.vanId ? { vanId: query.vanId } : {}),
      ...(query.routeId ? { routeId: query.routeId } : {}),
      ...(query.from || query.to
        ? {
            tripDate: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    return this.prisma.$transaction([
      this.prisma.trip.findMany({
        where,
        skip,
        take,
        orderBy: { tripDate: 'desc' },
        include: this.tripInclude,
      }),
      this.prisma.trip.count({ where }),
    ]);
  }

  findById(user: AuthUser, tripId: string) {
    const schoolId = this.scopedSchoolId(user);
    return this.prisma.trip.findFirst({
      where: { id: tripId, schoolId, deletedAt: null },
      include: {
        ...this.tripInclude,
        tripStudents: {
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                grade: true,
                section: true,
                homeLatitude: true,
                homeLongitude: true,
              },
            },
            stop: { select: { id: true, stopName: true, stopOrder: true } },
          },
        },
      },
    });
  }

  findActiveForDriver(schoolId: string, driverId: string) {
    return this.prisma.trip.findFirst({
      where: {
        schoolId,
        driverId,
        status: TripStatus.IN_PROGRESS,
        deletedAt: null,
      },
    });
  }

  countByStatus(schoolId: string, from: Date, to: Date) {
    return this.prisma.trip.groupBy({
      by: ['status', 'direction'],
      where: {
        schoolId,
        deletedAt: null,
        tripDate: { gte: from, lte: to },
      },
      _count: { id: true },
    });
  }
}
