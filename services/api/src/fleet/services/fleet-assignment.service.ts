import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TripStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FleetCacheService } from './fleet-cache.service';
import { assertValidCoordinates } from '../utils/geo-validation.util';

@Injectable()
export class FleetAssignmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fleetCache: FleetCacheService,
  ) {}

  async assertSchoolEntity<T>(
    _schoolId: string,
    finder: () => Promise<T | null>,
    label: string,
  ): Promise<T> {
    const row = await finder();
    if (!row) {
      throw new NotFoundException(`${label} not found`);
    }
    return row;
  }

  async assertNoActiveTripForDriver(schoolId: string, driverId: string): Promise<void> {
    const active = await this.prisma.trip.findFirst({
      where: { schoolId, driverId, status: TripStatus.IN_PROGRESS, deletedAt: null },
    });
    if (active) {
      throw new ConflictException('Driver has an active trip in progress');
    }
  }

  async assertNoActiveTripForVan(schoolId: string, vanId: string): Promise<void> {
    const active = await this.prisma.trip.findFirst({
      where: { schoolId, vanId, status: TripStatus.IN_PROGRESS, deletedAt: null },
    });
    if (active) {
      throw new ConflictException('Van has an active trip in progress');
    }
  }

  async assignVanToRoute(schoolId: string, routeId: string, vanId: string) {
    await this.assertSchoolEntity(
      schoolId,
      () => this.prisma.route.findFirst({ where: { id: routeId, schoolId, deletedAt: null } }),
      'Route',
    );
    const van = await this.assertSchoolEntity(
      schoolId,
      () => this.prisma.van.findFirst({ where: { id: vanId, schoolId, deletedAt: null } }),
      'Van',
    );
    if (!van.isActive) {
      throw new BadRequestException('Van is not active');
    }

    const studentCount = await this.prisma.student.count({
      where: { schoolId, routeId, deletedAt: null },
    });
    if (studentCount > van.capacity) {
      throw new BadRequestException(
        `Route has ${studentCount} students but van capacity is ${van.capacity}`,
      );
    }

    const route = await this.prisma.route.update({
      where: { id: routeId },
      data: { vanId },
      include: { van: true, stops: { where: { deletedAt: null }, orderBy: { stopOrder: 'asc' } } },
    });
    await this.fleetCache.invalidateRoute(schoolId, routeId);
    return route;
  }

  async assignStudentToRoute(schoolId: string, studentId: string, routeId: string | null) {
    const student = await this.assertSchoolEntity(
      schoolId,
      () => this.prisma.student.findFirst({ where: { id: studentId, schoolId, deletedAt: null } }),
      'Student',
    );

    if (routeId) {
      const route = await this.assertSchoolEntity(
        schoolId,
        () => this.prisma.route.findFirst({ where: { id: routeId, schoolId, deletedAt: null } }),
        'Route',
      );
      if (!route.isActive) {
        throw new BadRequestException('Route is not active');
      }
      if (route.vanId) {
        const van = await this.prisma.van.findUnique({ where: { id: route.vanId } });
        const onRoute = await this.prisma.student.count({
          where: { schoolId, routeId, deletedAt: null, id: { not: studentId } },
        });
        if (van && onRoute + 1 > van.capacity) {
          throw new BadRequestException('Van capacity exceeded for this route');
        }
      }
    }

    return this.prisma.student.update({
      where: { id: student.id },
      data: { routeId },
      include: { parent: true, route: true },
    });
  }

  async assignParentToStudent(schoolId: string, studentId: string, parentId: string) {
    await this.assertSchoolEntity(
      schoolId,
      () => this.prisma.student.findFirst({ where: { id: studentId, schoolId, deletedAt: null } }),
      'Student',
    );
    await this.assertSchoolEntity(
      schoolId,
      () => this.prisma.parent.findFirst({ where: { id: parentId, schoolId, deletedAt: null } }),
      'Parent',
    );
    return this.prisma.student.update({
      where: { id: studentId },
      data: { parentId },
      include: { parent: true, route: true },
    });
  }

  async assignDriverToVan(schoolId: string, driverId: string, vanId: string) {
    await this.assertSchoolEntity(
      schoolId,
      () => this.prisma.driver.findFirst({ where: { id: driverId, schoolId, deletedAt: null } }),
      'Driver',
    );
    const van = await this.assertSchoolEntity(
      schoolId,
      () => this.prisma.van.findFirst({ where: { id: vanId, schoolId, deletedAt: null } }),
      'Van',
    );
    if (!van.isActive) {
      throw new BadRequestException('Van is not active');
    }

    const existingVanDriver = await this.fleetCache.getDriverVanAssignment(schoolId, driverId);
    if (existingVanDriver && existingVanDriver !== vanId) {
      await this.assertNoActiveTripForDriver(schoolId, driverId);
    }

    await this.fleetCache.setDriverVanAssignment(schoolId, driverId, vanId);
    return { driverId, vanId, schoolId };
  }

  async assertRouteBelongsToSchool(schoolId: string, routeId: string): Promise<void> {
    await this.assertSchoolEntity(
      schoolId,
      () => this.prisma.route.findFirst({ where: { id: routeId, schoolId, deletedAt: null } }),
      'Route',
    );
  }

  async assertVanBelongsToSchool(schoolId: string, vanId: string): Promise<void> {
    await this.assertSchoolEntity(
      schoolId,
      () => this.prisma.van.findFirst({ where: { id: vanId, schoolId, deletedAt: null } }),
      'Van',
    );
  }

  async assertDriverBelongsToSchool(schoolId: string, driverId: string): Promise<void> {
    await this.assertSchoolEntity(
      schoolId,
      () => this.prisma.driver.findFirst({ where: { id: driverId, schoolId, deletedAt: null } }),
      'Driver',
    );
  }

  validateStopCoordinates(latitude?: number, longitude?: number): void {
    assertValidCoordinates(latitude, longitude, 'Stop');
  }

  validateHomeCoordinates(latitude?: number, longitude?: number): void {
    assertValidCoordinates(latitude, longitude, 'Home');
  }
}
