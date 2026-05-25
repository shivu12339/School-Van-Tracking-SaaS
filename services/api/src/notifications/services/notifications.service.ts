import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { AuthUser } from '../../auth/types/auth-user.type';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { toPagination } from '../../common/utils/pagination.util';
import { BroadcastNotificationDto } from '../dto/broadcast-notification.dto';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { BulkNotificationService } from './bulk-notification.service';
import { NotificationAnalyticsService } from './notification-analytics.service';
import { NotificationDispatcherService } from './notification-dispatcher.service';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationRedisCacheService } from './notification-redis-cache.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly repository: NotificationsRepository,
    private readonly tenantContext: TenantContextService,
    private readonly dispatcher: NotificationDispatcherService,
    private readonly analyticsService: NotificationAnalyticsService,
    private readonly bulkNotificationService: BulkNotificationService,
    private readonly queueService: NotificationQueueService,
    private readonly redisCache: NotificationRedisCacheService,
  ) {}

  async list(user: AuthUser, page?: number, limit?: number) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const { skip, take } = toPagination(page, limit);
    const safePage = page && page > 0 ? page : 1;
    const safeLimit = limit && limit > 0 ? limit : 20;
    const [items, total] = await this.repository.findForUser(schoolId, user.id, skip, take);
    return { items, meta: { total, page: safePage, limit: safeLimit } };
  }

  async unreadCount(user: AuthUser) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const cached = await this.redisCache.getUnreadCount(schoolId, user.id);
    if (cached !== null) {
      return { unread: cached };
    }
    const unread = await this.repository.countUnread(schoolId, user.id);
    await this.redisCache.setUnreadCount(schoolId, user.id, unread);
    return { unread };
  }

  async markClicked(user: AuthUser, notificationId: string) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const notification = await this.repository.findByIdForUser(schoolId, user.id, notificationId);
    if (!notification) throw new NotFoundException('Notification not found');
    await this.analyticsService.trackClicked(notificationId, user.id);
    return { id: notificationId, clickedAt: new Date() };
  }

  async markRead(user: AuthUser, notificationId: string) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const notification = await this.repository.findByIdForUser(schoolId, user.id, notificationId);
    if (!notification) throw new NotFoundException('Notification not found');
    await this.redisCache.invalidateUnreadCount(schoolId, user.id);
    return this.repository.markRead(schoolId, user.id, notificationId);
  }

  async markAllRead(user: AuthUser) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const result = await this.repository.markAllRead(schoolId, user.id);
    await this.redisCache.invalidateUnreadCount(schoolId, user.id);
    return { updated: result.count };
  }

  async sendTest(user: AuthUser) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    return this.dispatcher.dispatch({
      schoolId,
      userId: user.id,
      type: NotificationType.SCHOOL_ANNOUNCEMENT,
      title: 'Test notification',
      body: 'Push notification test successful.',
      deepLink: 'schoolvan://home',
      dedupScope: `test:${Date.now()}`,
      dedupCooldownSeconds: 1,
    });
  }

  broadcast(actor: AuthUser, dto: BroadcastNotificationDto) {
    return this.bulkNotificationService.enqueueSchoolBroadcast(actor, dto);
  }

  getAnalytics(user: AuthUser, schoolId?: string) {
    const scopedSchoolId = this.tenantContext.resolveSchoolId(user, schoolId);
    return this.analyticsService.getSchoolMetrics(scopedSchoolId);
  }

  async retryFailed(actor: AuthUser, notificationId?: string) {
    const schoolId = this.tenantContext.resolveSchoolId(actor);
    const rows = await this.repository.findRetryable(schoolId, notificationId);
    let requeued = 0;
    for (const row of rows) {
      await this.repository.resetForRetry(row.id);
      await this.queueService.enqueuePush({ notificationId: row.id });
      requeued += 1;
    }
    return { requeued, notificationId: notificationId ?? null };
  }

  async listFailed(actor: AuthUser, limit = 50) {
    const schoolId = this.tenantContext.resolveSchoolId(actor);
    return this.repository.findRetryable(schoolId).then((rows) => rows.slice(0, limit));
  }
}
