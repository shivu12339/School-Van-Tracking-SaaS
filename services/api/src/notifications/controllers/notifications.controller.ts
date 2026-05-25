import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleCode } from '@prisma/client';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { TenantScoped } from '../../auth/decorators/tenant-scoped.decorator';
import { PERMISSIONS } from '../../auth/constants/permissions';
import { AuthUser } from '../../auth/types/auth-user.type';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RegisterDeviceDto } from '../dto/register-device.dto';
import { BroadcastNotificationDto } from '../dto/broadcast-notification.dto';
import { RetryNotificationDto } from '../dto/retry-notification.dto';
import { DeviceTokenService } from '../services/device-token.service';
import { NotificationsService } from '../services/notifications.service';
import { NotificationPreferenceService } from '../services/notification-preference.service';
import { UpdateNotificationPreferenceDto } from '../dto/update-notification-preference.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly deviceTokenService: DeviceTokenService,
    private readonly preferenceService: NotificationPreferenceService,
  ) {}

  @ApiOperation({ summary: 'Register or refresh FCM device token' })
  @Post('register-device')
  registerDevice(@CurrentUser() user: AuthUser, @Body() dto: RegisterDeviceDto) {
    return this.deviceTokenService.register(user, dto);
  }

  @ApiOperation({ summary: 'Unregister device (logout)' })
  @Delete('devices/:deviceId')
  unregisterDevice(@CurrentUser() user: AuthUser, @Param('deviceId') deviceId: string) {
    return this.deviceTokenService.unregister(user, deviceId);
  }

  @ApiOperation({ summary: 'Get notification preferences' })
  @Get('preferences')
  preferences(@CurrentUser() user: AuthUser) {
    return this.preferenceService.get(user);
  }

  @ApiOperation({ summary: 'Update notification preferences' })
  @Patch('preferences')
  updatePreferences(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateNotificationPreferenceDto,
  ) {
    return this.preferenceService.update(user, dto);
  }

  @ApiOperation({ summary: 'Unread notification count' })
  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.notificationsService.unreadCount(user);
  }

  @ApiOperation({ summary: 'List user notifications' })
  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.notificationsService.list(user, query.page, query.limit);
  }

  @ApiOperation({ summary: 'Mark all notifications as read' })
  @Patch('read-all')
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notificationsService.markAllRead(user);
  }

  @ApiOperation({ summary: 'Mark notification as read' })
  @Patch(':id/read')
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notificationsService.markRead(user, id);
  }

  @ApiOperation({ summary: 'Track notification click (deep link opened)' })
  @Patch(':id/click')
  markClicked(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notificationsService.markClicked(user, id);
  }

  @ApiOperation({ summary: 'Send test push to current user' })
  @Post('test')
  test(@CurrentUser() user: AuthUser) {
    return this.notificationsService.sendTest(user);
  }

  @TenantScoped()
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @Permissions(PERMISSIONS.SCHOOLS_MANAGE)
  @ApiOperation({ summary: 'Broadcast school announcement (queued batches)' })
  @Post('broadcast')
  broadcast(@CurrentUser() user: AuthUser, @Body() dto: BroadcastNotificationDto) {
    return this.notificationsService.broadcast(user, dto);
  }

  @TenantScoped()
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Notification delivery analytics' })
  @Get('analytics')
  analytics(@CurrentUser() user: AuthUser, @Query('schoolId') schoolId?: string) {
    return this.notificationsService.getAnalytics(user, schoolId);
  }

  @TenantScoped()
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'List failed / dead-letter notifications' })
  @Get('admin/failed')
  listFailed(@CurrentUser() user: AuthUser, @Query('limit') limit?: number) {
    return this.notificationsService.listFailed(user, limit ? Number(limit) : 50);
  }

  @TenantScoped()
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Retry failed push deliveries' })
  @Post('admin/retry')
  retryFailed(@CurrentUser() user: AuthUser, @Body() dto: RetryNotificationDto) {
    return this.notificationsService.retryFailed(user, dto.notificationId);
  }
}
