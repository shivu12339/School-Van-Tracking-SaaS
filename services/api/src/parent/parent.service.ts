import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RoleCode, TripStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/types/auth-user.type';
import { EtaService } from '../tracking/services/eta.service';
import { TrackingService } from '../tracking/services/tracking.service';

@Injectable()
export class ParentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly etaService: EtaService,
    private readonly trackingService: TrackingService,
  ) {}

  private async getParentProfile(user: AuthUser) {
    if (user.role !== RoleCode.PARENT) {
      throw new ForbiddenException('Parent access only');
    }
    const parent = await this.prisma.parent.findFirst({
      where: { userId: user.id, schoolId: user.schoolId ?? undefined },
    });
    if (!parent) throw new ForbiddenException('Parent profile not found');
    return parent;
  }

  private async assertStudentAccess(user: AuthUser, studentId: string) {
    const parent = await this.getParentProfile(user);
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, parentId: parent.id, schoolId: parent.schoolId, deletedAt: null },
    });
    if (!student) throw new NotFoundException('Student not found');
    return { parent, student };
  }

  async listChildren(user: AuthUser) {
    const parent = await this.getParentProfile(user);
    return this.prisma.student.findMany({
      where: { parentId: parent.id, schoolId: parent.schoolId, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        grade: true,
        section: true,
        admissionNumber: true,
        homeLatitude: true,
        homeLongitude: true,
      },
    });
  }

  async getActiveTrip(user: AuthUser, studentId: string) {
    await this.assertStudentAccess(user, studentId);
    const row = await this.prisma.tripStudent.findFirst({
      where: {
        studentId,
        trip: { status: TripStatus.IN_PROGRESS },
      },
      include: {
        trip: {
          include: {
            van: { select: { id: true, registrationNo: true, label: true } },
            route: { select: { routeName: true, direction: true } },
            driver: {
              select: {
                id: true,
                user: { select: { firstName: true, lastName: true, phone: true } },
              },
            },
          },
        },
        student: { select: { fullName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return row;
  }

  async getTripOverview(user: AuthUser, tripId: string, studentId: string) {
    await this.assertStudentAccess(user, studentId);
    const tripStudent = await this.prisma.tripStudent.findFirst({
      where: { tripId, studentId },
      include: {
        trip: {
          include: {
            van: true,
            route: true,
            driver: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
          },
        },
      },
    });
    if (!tripStudent) throw new NotFoundException('Trip not found for student');
    return tripStudent;
  }

  async getLiveLocation(user: AuthUser, tripId: string, studentId: string) {
    await this.assertStudentAccess(user, studentId);
    return this.trackingService.getLiveLocation(user, tripId);
  }

  async getPlayback(user: AuthUser, tripId: string, studentId: string, from?: string, to?: string) {
    await this.assertStudentAccess(user, studentId);
    return this.trackingService.getPlayback(user, tripId, from, to);
  }

  async getEta(user: AuthUser, tripId: string, studentId: string) {
    await this.assertStudentAccess(user, studentId);
    return this.etaService.getCachedEta(tripId, studentId);
  }

  async getTripHistory(user: AuthUser, studentId: string, limit = 30) {
    await this.assertStudentAccess(user, studentId);
    return this.prisma.tripStudent.findMany({
      where: {
        studentId,
        trip: { status: { in: [TripStatus.COMPLETED, TripStatus.CANCELLED] } },
      },
      include: {
        trip: {
          include: {
            route: { select: { routeName: true } },
            van: { select: { registrationNo: true } },
          },
        },
      },
      orderBy: { trip: { endedAt: 'desc' } },
      take: limit,
    });
  }
}
