import { Injectable, Logger } from '@nestjs/common';
import { NotificationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { buildDeepLinkDataPayload } from '../templates/notification.templates';
import { FcmProvider } from '../providers/fcm.provider';
import { NOTIFICATION_SOCKET_EVENTS } from '../events/notification.events';
import { NotificationGateway } from '../gateways/notification.gateway';
import { DeviceTokenService } from './device-token.service';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationRedisCacheService } from './notification-redis-cache.service';
import { NotificationsRepository } from '../repositories/notifications.repository';

@Injectable()
export class PushDeliveryService {
  private readonly logger = new Logger(PushDeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: NotificationsRepository,
    private readonly fcmProvider: FcmProvider,
    private readonly deviceTokenService: DeviceTokenService,
    private readonly queueService: NotificationQueueService,
    private readonly notificationGateway: NotificationGateway,
    private readonly redisCache: NotificationRedisCacheService,
  ) {}

  async deliver(notificationId: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) return;

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: NotificationStatus.PROCESSING, attemptCount: { increment: 1 } },
    });

    const tokens = await this.deviceTokenService.getActiveTokens(notification.userId);
    if (!tokens.length) {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: NotificationStatus.FAILED,
          failedAt: new Date(),
          lastError: 'No active device tokens',
        },
      });
      return;
    }

    try {
      const data = buildDeepLinkDataPayload({
        notificationId: notification.id,
        type: notification.type,
        schoolId: notification.schoolId,
        tripId: notification.tripId,
        deepLink: notification.deepLink,
        metadata: notification.metadata,
      });

      const result = await this.fcmProvider.sendMulticast({
        tokens,
        title: notification.title,
        body: notification.body,
        data,
      });

      if (result.invalidTokens.length) {
        await this.deviceTokenService.deactivateTokens(result.invalidTokens);
      }

      const status =
        result.successCount > 0 ? NotificationStatus.SENT : NotificationStatus.FAILED;
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status,
          sentAt: result.successCount > 0 ? new Date() : undefined,
          deliveredAt: result.successCount > 0 ? new Date() : undefined,
          failedAt: result.successCount > 0 ? undefined : new Date(),
          lastError:
            result.failureCount > 0 ? `FCM failures: ${result.failureCount}` : null,
          providerRef: result.messageId ?? null,
        },
      });

      await this.queueService.analyticsQueue.add('track', {
        notificationId,
        successCount: result.successCount,
        failureCount: result.failureCount,
      });

      if (result.successCount > 0) {
        await this.redisCache.invalidateUnreadCount(notification.schoolId, notification.userId);
        const unread = await this.repository.countUnread(
          notification.schoolId,
          notification.userId,
        );

        this.notificationGateway.emitToUser(
          notification.userId,
          NOTIFICATION_SOCKET_EVENTS.SERVER.NEW,
          {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            body: notification.body,
            deepLink: notification.deepLink,
            tripId: notification.tripId,
          },
        );
        this.notificationGateway.emitToUser(
          notification.userId,
          NOTIFICATION_SOCKET_EVENTS.SERVER.BADGE,
          { unread },
        );
      }
    } catch (error) {
      const attempts = notification.attemptCount + 1;
      const message = error instanceof Error ? error.message : 'FCM send failed';
      if (attempts < 5) {
        await this.prisma.notification.update({
          where: { id: notificationId },
          data: {
            status: NotificationStatus.QUEUED,
            lastError: message,
          },
        });
        await this.queueService.enqueueRetry(
          { notificationId },
          Math.min(60_000, 2000 * 2 ** attempts),
        );
      } else {
        await this.prisma.notification.update({
          where: { id: notificationId },
          data: {
            status: NotificationStatus.DEAD_LETTER,
            failedAt: new Date(),
            lastError: message,
          },
        });
        await this.queueService.moveToDlq({
          notificationId,
          reason: message,
          attempts,
        });
      }
      this.logger.error(`Push delivery failed id=${notificationId}`, error as Error);
    }
  }
}
