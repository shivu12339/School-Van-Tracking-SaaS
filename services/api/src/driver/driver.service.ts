import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RoleCode, TripStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/types/auth-user.type';

@Injectable()
export class DriverService {
  constructor(private readonly prisma: PrismaService) {}

  private async getDriverProfile(user: AuthUser) {
    if (user.role !== RoleCode.DRIVER) {
      throw new ForbiddenException('Driver access only');
    }
    const driver = await this.prisma.driver.findFirst({
      where: { userId: user.id, schoolId: user.schoolId ?? undefined },
    });
    if (!driver) throw new ForbiddenException('Driver profile not found');
    return driver;
  }

  async listTrips(user: AuthUser, status?: TripStatus) {
    const driver = await this.getDriverProfile(user);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.trip.findMany({
      where: {
        driverId: driver.id,
        schoolId: driver.schoolId,
        tripDate: { gte: startOfDay, lte: endOfDay },
        ...(status ? { status } : {}),
        deletedAt: null,
      },
      orderBy: { tripDate: 'asc' },
      include: {
        van: { select: { id: true, registrationNo: true, label: true } },
        route: { select: { id: true, routeName: true, routeCode: true } },
        _count: { select: { tripStudents: true } },
      },
    });
  }

  async getTrip(user: AuthUser, tripId: string) {
    const driver = await this.getDriverProfile(user);
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, driverId: driver.id, schoolId: driver.schoolId, deletedAt: null },
      include: {
        van: { select: { id: true, registrationNo: true, label: true } },
        route: { select: { id: true, routeName: true, routeCode: true } },
      },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  async listTripStudents(user: AuthUser, tripId: string) {
    const driver = await this.getDriverProfile(user);
    await this.getTrip(user, tripId);
    return this.prisma.tripStudent.findMany({
      where: { tripId, schoolId: driver.schoolId },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            homeLatitude: true,
            homeLongitude: true,
            grade: true,
          },
        },
        stop: { select: { id: true, stopName: true, stopLatitude: true, stopLongitude: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async tripHistory(user: AuthUser, limit = 20) {
    const driver = await this.getDriverProfile(user);
    return this.prisma.trip.findMany({
      where: {
        driverId: driver.id,
        schoolId: driver.schoolId,
        status: { in: [TripStatus.COMPLETED, TripStatus.CANCELLED] },
        deletedAt: null,
      },
      orderBy: { endedAt: 'desc' },
      take: limit,
      include: {
        van: { select: { registrationNo: true, label: true } },
        route: { select: { routeName: true, routeCode: true } },
      },
    });
  }
}
