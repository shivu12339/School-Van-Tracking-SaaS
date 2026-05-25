import { Injectable, Logger } from '@nestjs/common';
import { NotificationType, RoleCode, TripDirection, TripStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationDispatcherService } from './notification-dispatcher.service';

@Injectable()
export class TrackingNotificationService {
  private readonly logger = new Logger(TrackingNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatcher: NotificationDispatcherService,
  ) {}

  async onStudentPicked(schoolId: string, tripId: string, studentId: string): Promise<void> {
    const row = await this.prisma.tripStudent.findFirst({
      where: { tripId, studentId, schoolId },
      include: { student: { include: { parent: true } } },
    });
    if (!row) return;
    await this.dispatcher.dispatch({
      schoolId,
      userId: row.student.parent.userId,
      parentId: row.student.parentId,
      tripId,
      type: NotificationType.STUDENT_PICKED,
      context: { tripId, studentName: row.student.fullName },
      dedupScope: `${tripId}:${studentId}:picked`,
      dedupCooldownSeconds: 86400,
    });
  }

  async onStudentDropped(schoolId: string, tripId: string, studentId: string): Promise<void> {
    const row = await this.prisma.tripStudent.findFirst({
      where: { tripId, studentId, schoolId },
      include: { student: { include: { parent: true } } },
    });
    if (!row) return;
    await this.dispatcher.dispatch({
      schoolId,
      userId: row.student.parent.userId,
      parentId: row.student.parentId,
      tripId,
      type: NotificationType.STUDENT_DROPPED,
      context: { tripId, studentName: row.student.fullName },
      dedupScope: `${tripId}:${studentId}:dropped`,
      dedupCooldownSeconds: 86400,
    });
  }

  async onSosTriggered(
    schoolId: string,
    tripId: string,
    description?: string,
  ): Promise<void> {
    const count = await this.dispatcher.dispatchToParentsOfTripStudents(
      schoolId,
      tripId,
      NotificationType.SOS_EMERGENCY,
      { tripId, description },
    );
    const admins = await this.prisma.userRoleAssignment.findMany({
      where: { schoolId, role: { code: RoleCode.SCHOOL_ADMIN } },
      select: { userId: true },
    });
    for (const admin of admins) {
      await this.dispatcher.dispatch({
        schoolId,
        userId: admin.userId,
        tripId,
        type: NotificationType.SOS_EMERGENCY,
        context: { tripId, description },
        dedupScope: `${tripId}:sos:admin:${admin.userId}`,
        dedupCooldownSeconds: 300,
      });
    }
    this.logger.warn(`SOS notifications queued count=${count} trip=${tripId}`);
  }

  async onTripStarted(schoolId: string, tripId: string, direction: TripDirection): Promise<void> {
    if (direction === TripDirection.RETURN) {
      await this.dispatcher.dispatchToParentsOfTripStudents(
        schoolId,
        tripId,
        NotificationType.RETURN_TRIP_STARTED,
        { tripId },
      );
    }
  }

  async onTripCompleted(schoolId: string, tripId: string, direction: TripDirection): Promise<void> {
    if (direction === TripDirection.PICKUP) {
      await this.dispatcher.dispatchToParentsOfTripStudents(
        schoolId,
        tripId,
        NotificationType.VAN_REACHED_SCHOOL,
        { tripId },
      );
    }
  }

  async onDriverOffline(schoolId: string, driverId: string): Promise<void> {
    const activeTrip = await this.prisma.trip.findFirst({
      where: { schoolId, driverId, status: TripStatus.IN_PROGRESS },
    });
    if (!activeTrip) return;
    await this.dispatcher.dispatchToParentsOfTripStudents(
      schoolId,
      activeTrip.id,
      NotificationType.DRIVER_OFFLINE,
      { tripId: activeTrip.id },
    );
  }

  async onTripDelayed(
    schoolId: string,
    tripId: string,
    studentId: string,
    delayMinutes: number,
  ): Promise<void> {
    const row = await this.prisma.tripStudent.findFirst({
      where: { tripId, studentId, schoolId },
      include: { student: { include: { parent: true } } },
    });
    if (!row) return;
    await this.dispatcher.dispatch({
      schoolId,
      userId: row.student.parent.userId,
      parentId: row.student.parentId,
      tripId,
      type: NotificationType.TRIP_DELAYED,
      context: { tripId, delayMinutes },
      dedupScope: `${tripId}:${studentId}:delayed`,
      dedupCooldownSeconds: 1800,
    });
  }
}
