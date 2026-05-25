import { Injectable } from '@nestjs/common';
import { NotificationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findForUser(
    schoolId: string,
    userId: string,
    skip: number,
    take: number,
  ) {
    return this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { schoolId, userId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({
        where: { schoolId, userId, deletedAt: null },
      }),
    ]);
  }

  findByIdForUser(schoolId: string, userId: string, id: string) {
    return this.prisma.notification.findFirst({
      where: { id, schoolId, userId, deletedAt: null },
    });
  }

  countUnread(schoolId: string, userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { schoolId, userId, readAt: null, deletedAt: null },
    });
  }

  markRead(schoolId: string, userId: string, id: string) {
    return this.prisma.notification.update({
      where: { id, schoolId, userId },
      data: { readAt: new Date() },
    });
  }

  markAllRead(schoolId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { schoolId, userId, readAt: null, deletedAt: null },
      data: { readAt: new Date() },
    });
  }

  findRetryable(schoolId: string, notificationId?: string) {
    return this.prisma.notification.findMany({
      where: {
        schoolId,
        deletedAt: null,
        ...(notificationId
          ? { id: notificationId }
          : {
              status: {
                in: [NotificationStatus.FAILED, NotificationStatus.DEAD_LETTER],
              },
            }),
      },
      take: notificationId ? 1 : 100,
      orderBy: { createdAt: 'desc' },
    });
  }

  resetForRetry(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: {
        status: NotificationStatus.QUEUED,
        lastError: null,
        failedAt: null,
      },
    });
  }

  aggregateSchoolMetrics(schoolId: string) {
    return this.prisma.$transaction([
      this.prisma.notification.count({
        where: {
          schoolId,
          status: { in: [NotificationStatus.SENT, NotificationStatus.DELIVERED] },
        },
      }),
      this.prisma.notification.count({ where: { schoolId, deliveredAt: { not: null } } }),
      this.prisma.notification.count({
        where: {
          schoolId,
          status: { in: [NotificationStatus.FAILED, NotificationStatus.DEAD_LETTER] },
        },
      }),
      this.prisma.notification.count({ where: { schoolId, readAt: { not: null } } }),
      this.prisma.notification.count({ where: { schoolId, clickedAt: { not: null } } }),
      this.prisma.notification.count({ where: { schoolId } }),
    ]);
  }

  groupByType(schoolId: string, since: Date) {
    return this.prisma.notification.groupBy({
      by: ['type', 'status'],
      where: { schoolId, createdAt: { gte: since } },
      _count: { id: true },
    });
  }
}
