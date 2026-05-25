import { ForbiddenException, Injectable } from '@nestjs/common';
import { NotificationType, RoleCode } from '@prisma/client';
import { AuthUser } from '../../auth/types/auth-user.type';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BroadcastNotificationDto } from '../dto/broadcast-notification.dto';
import { NotificationQueueService } from './notification-queue.service';

@Injectable()
export class BulkNotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly queueService: NotificationQueueService,
  ) {}

  assertBroadcastAuthorized(actor: AuthUser): void {
    if (actor.role !== RoleCode.SUPER_ADMIN && actor.role !== RoleCode.SCHOOL_ADMIN) {
      throw new ForbiddenException('Only admins can broadcast notifications');
    }
  }

  async enqueueSchoolBroadcast(actor: AuthUser, dto: BroadcastNotificationDto) {
    this.assertBroadcastAuthorized(actor);
    const schoolId = this.tenantContext.resolveSchoolId(actor, dto.schoolId);

    const userIds =
      dto.userIds ??
      (
        await this.prisma.parent.findMany({
          where: { schoolId, deletedAt: null },
          select: { userId: true },
        })
      ).map((p) => p.userId);

    const chunkSize = 200;
    let jobs = 0;
    for (let i = 0; i < userIds.length; i += chunkSize) {
      const chunk = userIds.slice(i, i + chunkSize);
      await this.queueService.enqueueBroadcast({
        schoolId,
        userIds: chunk,
        title: dto.title,
        body: dto.body,
        deepLink: dto.deepLink ?? 'schoolvan://announcements',
        locale: dto.locale,
        type: NotificationType.SCHOOL_ANNOUNCEMENT,
      });
      jobs += 1;
    }

    return { queuedBatches: jobs, targets: userIds.length };
  }
}
