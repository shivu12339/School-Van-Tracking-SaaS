import { Injectable, Logger } from '@nestjs/common';
import { NotificationStatus, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { buildNotificationTemplate } from '../templates/notification.templates';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationDedupService } from '../utils/dedup.util';
import { NotificationRateLimitService } from './notification-rate-limit.service';

export interface DispatchNotificationInput {
  schoolId: string;
  userId: string;
  type: NotificationType;
  parentId?: string;
  tripId?: string;
  context?: Record<string, string | number | undefined>;
  title?: string;
  body?: string;
  deepLink?: string;
  locale?: string;
  metadata?: Prisma.InputJsonValue;
  dedupScope?: string;
  dedupCooldownSeconds?: number;
}

@Injectable()
export class NotificationDispatcherService {
  private readonly logger = new Logger(NotificationDispatcherService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: NotificationQueueService,
    private readonly dedupService: NotificationDedupService,
    private readonly rateLimitService: NotificationRateLimitService,
  ) {}

  async dispatch(input: DispatchNotificationInput): Promise<string | null> {
    const withinLimit = await this.rateLimitService.allow(
      input.schoolId,
      input.userId,
      input.type,
    );
    if (!withinLimit) {
      return null;
    }

    if (input.dedupScope) {
      const allowed = await this.dedupService.shouldSend(
        input.schoolId,
        input.userId,
        input.type,
        input.dedupScope,
        input.dedupCooldownSeconds ?? 300,
      );
      if (!allowed) {
        return null;
      }
    }

    const prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId: input.userId },
    });
    if (prefs && !prefs.enabled) {
      return null;
    }
    if (prefs?.enabledTypes) {
      const enabled = prefs.enabledTypes as string[];
      if (Array.isArray(enabled) && !enabled.includes(input.type)) {
        return null;
      }
    }

    const template = buildNotificationTemplate(input.type, input.context ?? {});
    const locale = input.locale ?? prefs?.locale ?? 'en';

    const notification = await this.prisma.notification.create({
      data: {
        schoolId: input.schoolId,
        userId: input.userId,
        parentId: input.parentId,
        tripId: input.tripId,
        type: input.type,
        status: NotificationStatus.QUEUED,
        title: input.title ?? template.title,
        body: input.body ?? template.body,
        deepLink: input.deepLink ?? template.deepLink,
        locale,
        metadata: input.metadata,
      },
    });

    await this.queueService.enqueuePush({ notificationId: notification.id });
    this.logger.debug(`Queued notification ${notification.id} type=${input.type}`);
    return notification.id;
  }

  async dispatchToParentsOfTripStudents(
    schoolId: string,
    tripId: string,
    type: NotificationType,
    context?: Record<string, string | number | undefined>,
  ): Promise<number> {
    const rows = await this.prisma.tripStudent.findMany({
      where: { tripId, schoolId },
      include: { student: { include: { parent: true } } },
    });
    let count = 0;
    for (const row of rows) {
      const parentUserId = row.student.parent.userId;
      const id = await this.dispatch({
        schoolId,
        userId: parentUserId,
        parentId: row.student.parentId,
        tripId,
        type,
        context: { ...context, studentName: row.student.fullName },
        dedupScope: `${tripId}:${row.studentId}:${type}`,
      });
      if (id) count += 1;
    }
    return count;
  }
}
