import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleCode } from '@prisma/client';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { TenantScoped } from '../../auth/decorators/tenant-scoped.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PERMISSIONS } from '../../auth/constants/permissions';
import { RequireSubscription } from '../../common/tenant/decorators/require-subscription.decorator';
import { AuthUser } from '../../auth/types/auth-user.type';
import { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';
import { AssignSubscriptionDto } from '../dto/assign-subscription.dto';
import { CreateSchoolDto } from '../dto/create-school.dto';
import { ListSchoolsQueryDto } from '../dto/list-schools-query.dto';
import { UpdateSchoolDto } from '../dto/update-school.dto';
import { UpdateSchoolStatusDto } from '../dto/update-school-status.dto';
import { UpdateSchoolSettingsDto } from '../dto/update-school-settings.dto';
import { SchoolsService } from '../services/schools.service';

@ApiTags('Schools')
@ApiBearerAuth()
@Controller({ path: 'schools', version: '1' })
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @ApiOperation({ summary: 'Super admin: onboard new school' })
  @Roles(RoleCode.SUPER_ADMIN)
  @Permissions(PERMISSIONS.SCHOOLS_MANAGE)
  @Post()
  create(@Body() dto: CreateSchoolDto, @CurrentUser() user: AuthUser) {
    return this.schoolsService.create(dto, user);
  }

  @ApiOperation({ summary: 'List subscription plan catalog' })
  @Permissions(PERMISSIONS.SCHOOLS_VIEW)
  @Get('plans/catalog')
  listPlans() {
    return this.schoolsService.listPlans();
  }

  @ApiOperation({ summary: 'List schools (scoped by role)' })
  @Permissions(PERMISSIONS.SCHOOLS_VIEW)
  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListSchoolsQueryDto) {
    return this.schoolsService.findAll(user, query);
  }

  @ApiOperation({ summary: 'Super admin platform analytics' })
  @Roles(RoleCode.SUPER_ADMIN)
  @Get('analytics/platform')
  platformAnalytics(@CurrentUser() user: AuthUser) {
    return this.schoolsService.getSuperAdminAnalytics(user);
  }

  @ApiOperation({ summary: 'Get school by id' })
  @TenantScoped()
  @Permissions(PERMISSIONS.SCHOOLS_VIEW)
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.schoolsService.findOne(user, id);
  }

  @ApiOperation({ summary: 'Get subscription status and usage for school' })
  @TenantScoped()
  @Permissions(PERMISSIONS.SCHOOLS_VIEW)
  @Get(':id/subscription/status')
  subscriptionStatus(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.schoolsService.getSubscriptionStatus(user, id);
  }

  @ApiOperation({ summary: 'Update school profile/branding' })
  @TenantScoped()
  @Permissions(PERMISSIONS.SCHOOLS_MANAGE)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateSchoolDto,
  ) {
    return this.schoolsService.update(user, id, dto);
  }

  @ApiOperation({ summary: 'Update school operational settings (geofence, notifications)' })
  @TenantScoped()
  @Permissions(PERMISSIONS.SCHOOLS_MANAGE)
  @Patch(':id/settings')
  updateSettings(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateSchoolSettingsDto,
  ) {
    return this.schoolsService.updateSettings(user, id, dto);
  }

  @ApiOperation({ summary: 'Super admin: activate/suspend school' })
  @Roles(RoleCode.SUPER_ADMIN)
  @Permissions(PERMISSIONS.SCHOOLS_MANAGE)
  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateSchoolStatusDto,
  ) {
    return this.schoolsService.updateStatus(user, id, dto);
  }

  @ApiOperation({ summary: 'Super admin: assign/upgrade subscription plan' })
  @Roles(RoleCode.SUPER_ADMIN)
  @Permissions(PERMISSIONS.SUBSCRIPTIONS_MANAGE)
  @Post(':id/subscription')
  assignSubscription(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AssignSubscriptionDto,
  ) {
    return this.schoolsService.assignSubscription(user, id, dto);
  }

  @ApiOperation({ summary: 'School analytics dashboard' })
  @TenantScoped()
  @RequireSubscription({ requireAnalytics: true })
  @Permissions(PERMISSIONS.REPORTS_VIEW)
  @Get(':id/analytics')
  analytics(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.schoolsService.getAnalytics(user, id);
  }

  @ApiOperation({ summary: 'Super admin impersonate school admin session' })
  @Roles(RoleCode.SUPER_ADMIN)
  @Permissions(PERMISSIONS.SCHOOLS_MANAGE)
  @Post(':id/impersonate')
  impersonate(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.schoolsService.impersonate(user, id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @ApiOperation({ summary: 'Super admin: soft-delete school' })
  @Roles(RoleCode.SUPER_ADMIN)
  @Permissions(PERMISSIONS.SCHOOLS_MANAGE)
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.schoolsService.remove(user, id);
  }
}
