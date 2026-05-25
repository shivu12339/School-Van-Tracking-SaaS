import { Injectable, Logger } from '@nestjs/common';
import { BillingStatus, NotificationType, RoleCode } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationDispatcherService } from './notification-dispatcher.service';

@Injectable()
export class SubscriptionNotificationService {
  private readonly logger = new Logger(SubscriptionNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatcher: NotificationDispatcherService,
  ) {}

  async notifyExpiringSubscriptions(withinDays = 7): Promise<number> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + withinDays);

    const subscriptions = await this.prisma.schoolSubscription.findMany({
      where: {
        endsAt: { lte: threshold, gte: new Date() },
        billingStatus: { in: [BillingStatus.ACTIVE, BillingStatus.TRIAL] },
      },
      include: { school: true },
    });

    let queued = 0;
    for (const sub of subscriptions) {
      const admins = await this.prisma.userRoleAssignment.findMany({
        where: { schoolId: sub.schoolId, role: { code: RoleCode.SCHOOL_ADMIN } },
        select: { userId: true },
      });
      for (const admin of admins) {
        const id = await this.dispatcher.dispatch({
          schoolId: sub.schoolId,
          userId: admin.userId,
          type: NotificationType.SUBSCRIPTION_EXPIRY,
          context: { schoolName: sub.school.name, endsAt: sub.endsAt?.toISOString() },
          dedupScope: `subscription:${sub.id}:${admin.userId}`,
          dedupCooldownSeconds: 86400,
        });
        if (id) queued += 1;
      }
    }
    this.logger.log(`Subscription expiry notifications queued=${queued}`);
    return queued;
  }
}
