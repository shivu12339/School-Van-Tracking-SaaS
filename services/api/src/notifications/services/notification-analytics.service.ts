import { Injectable } from '@nestjs/common';
import { NotificationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { NotificationRedisCacheService } from './notification-redis-cache.service';

export interface SchoolNotificationMetrics {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  read: number;
  clicked: number;
  deliveryRate: number;
  readRate: number;
}

@Injectable()
export class NotificationAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: NotificationsRepository,
    private readonly redisCache: NotificationRedisCacheService,
  ) {}

  async trackDelivered(notificationId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id: notificationId },
      data: { status: NotificationStatus.DELIVERED, deliveredAt: new Date() },
    });
  }

  async trackClicked(notificationId: string, userId: string): Promise<void> {
    const row = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { clickedAt: new Date() },
    });
    if (row.count > 0) {
      const notification = await this.prisma.notification.findUnique({
        where: { id: notificationId },
        select: { schoolId: true },
      });
      if (notification?.schoolId) {
        await this.redisCache.invalidateSchoolAnalytics(notification.schoolId);
      }
    }
  }

  async getSchoolMetrics(schoolId: string): Promise<SchoolNotificationMetrics> {
    const cached = await this.redisCache.getSchoolAnalytics<SchoolNotificationMetrics>(schoolId);
    if (cached) return cached;

    const [sent, delivered, failed, read, clicked, total] =
      await this.repository.aggregateSchoolMetrics(schoolId);

    const metrics: SchoolNotificationMetrics = {
      total,
      sent,
      delivered,
      failed,
      read,
      clicked,
      deliveryRate: total > 0 ? Math.round((delivered / total) * 100) : 0,
      readRate: total > 0 ? Math.round((read / total) * 100) : 0,
    };

    await this.redisCache.setSchoolAnalytics(schoolId, metrics);
    return metrics;
  }
}
