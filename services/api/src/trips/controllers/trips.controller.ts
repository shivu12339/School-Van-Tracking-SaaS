import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleCode } from '@prisma/client';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { TenantScoped } from '../../auth/decorators/tenant-scoped.decorator';
import { PERMISSIONS } from '../../auth/constants/permissions';
import { AuthUser } from '../../auth/types/auth-user.type';
import { CreateTripDto } from '../dto/create-trip.dto';
import { ListTripsQueryDto } from '../dto/list-trips-query.dto';
import { ScheduleTripsDto } from '../dto/schedule-trips.dto';
import { UpdateTripDto } from '../dto/update-trip.dto';
import { TripsService } from '../services/trips.service';

@ApiTags('Trips')
@ApiBearerAuth()
@TenantScoped()
@Controller({ path: 'trips', version: '1' })
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Permissions(PERMISSIONS.TRIPS_MANAGE, PERMISSIONS.TRIPS_TRACK)
  @ApiOperation({ summary: 'List trips for school' })
  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListTripsQueryDto) {
    return this.tripsService.list(user, query);
  }

  @Permissions(PERMISSIONS.TRIPS_MANAGE, PERMISSIONS.TRIPS_TRACK)
  @ApiOperation({ summary: 'Live active trips (in progress)' })
  @Get('active')
  active(@CurrentUser() user: AuthUser) {
    return this.tripsService.getActive(user);
  }

  @Permissions(PERMISSIONS.TRIPS_MANAGE, PERMISSIONS.REPORTS_VIEW)
  @ApiOperation({ summary: 'Trip analytics summary' })
  @Get('analytics')
  analytics(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.tripsService.analytics(user, from, to);
  }

  @Permissions(PERMISSIONS.TRIPS_MANAGE)
  @Roles(RoleCode.SCHOOL_ADMIN, RoleCode.SUPER_ADMIN)
  @ApiOperation({ summary: 'Schedule morning pickup + evening dropoff for route' })
  @Post('schedule')
  schedule(@CurrentUser() user: AuthUser, @Body() dto: ScheduleTripsDto) {
    return this.tripsService.scheduleDaily(user, dto);
  }

  @Permissions(PERMISSIONS.TRIPS_MANAGE)
  @Roles(RoleCode.SCHOOL_ADMIN, RoleCode.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create trip' })
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTripDto) {
    return this.tripsService.create(user, dto);
  }

  @Permissions(PERMISSIONS.TRIPS_MANAGE, PERMISSIONS.TRIPS_TRACK)
  @ApiOperation({ summary: 'Get trip by id' })
  @Get(':tripId')
  get(@CurrentUser() user: AuthUser, @Param('tripId') tripId: string) {
    return this.tripsService.getById(user, tripId);
  }

  @Permissions(PERMISSIONS.TRIPS_MANAGE)
  @Roles(RoleCode.SCHOOL_ADMIN, RoleCode.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update trip' })
  @Patch(':tripId')
  update(
    @CurrentUser() user: AuthUser,
    @Param('tripId') tripId: string,
    @Body() dto: UpdateTripDto,
  ) {
    return this.tripsService.update(user, tripId, dto);
  }

  @Permissions(PERMISSIONS.TRIPS_MANAGE)
  @Roles(RoleCode.SCHOOL_ADMIN, RoleCode.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cancel scheduled trip' })
  @Post(':tripId/cancel')
  cancel(@CurrentUser() user: AuthUser, @Param('tripId') tripId: string) {
    return this.tripsService.cancel(user, tripId);
  }
}
