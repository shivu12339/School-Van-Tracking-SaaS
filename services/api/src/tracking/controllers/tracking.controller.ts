import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleCode } from '@prisma/client';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { TenantScoped } from '../../auth/decorators/tenant-scoped.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PERMISSIONS } from '../../auth/constants/permissions';
import { AuthUser } from '../../auth/types/auth-user.type';
import { OfflineSyncDto, TrackingUpdateDto } from '../dto/gps-location.dto';
import { SosTriggerDto, TripActionDto } from '../dto/trip-action.dto';
import { TrackingService } from '../services/tracking.service';
import { TripSessionService } from '../services/trip-session.service';

@ApiTags('Tracking')
@ApiBearerAuth()
@Controller({ path: 'tracking', version: '1' })
export class TrackingController {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly tripSessionService: TripSessionService,
  ) {}

  @Roles(RoleCode.DRIVER)
  @Permissions(PERMISSIONS.TRIPS_TRACK)
  @ApiOperation({ summary: 'Driver: start trip' })
  @Post('trips/start')
  startTrip(@CurrentUser() user: AuthUser, @Body() dto: TripActionDto) {
    return this.tripSessionService.startTrip(user, dto.tripId);
  }

  @Roles(RoleCode.DRIVER)
  @Permissions(PERMISSIONS.TRIPS_TRACK)
  @ApiOperation({ summary: 'Driver: stop trip' })
  @Post('trips/stop')
  stopTrip(@CurrentUser() user: AuthUser, @Body() dto: TripActionDto) {
    return this.tripSessionService.stopTrip(user, dto.tripId);
  }

  @Roles(RoleCode.DRIVER)
  @Permissions(PERMISSIONS.TRIPS_TRACK)
  @ApiOperation({ summary: 'Driver: push GPS location (HTTP fallback)' })
  @Post('location')
  pushLocation(@CurrentUser() user: AuthUser, @Body() dto: TrackingUpdateDto) {
    return this.trackingService.processDriverLocation(user, dto);
  }

  @Roles(RoleCode.DRIVER)
  @Permissions(PERMISSIONS.TRIPS_TRACK)
  @ApiOperation({ summary: 'Driver: sync offline GPS batch' })
  @Post('sync')
  syncOffline(@CurrentUser() user: AuthUser, @Body() dto: OfflineSyncDto) {
    return this.trackingService.syncOfflineBatch(user, dto);
  }

  @TenantScoped()
  @Permissions(PERMISSIONS.TRIPS_TRACK)
  @ApiOperation({ summary: 'Get latest live van location for trip' })
  @Get('trips/:tripId/live')
  live(@CurrentUser() user: AuthUser, @Param('tripId') tripId: string) {
    return this.trackingService.getLiveLocation(user, tripId);
  }

  @TenantScoped()
  @Permissions(PERMISSIONS.TRIPS_TRACK, PERMISSIONS.REPORTS_VIEW)
  @ApiOperation({ summary: 'Trip route playback polyline points' })
  @Get('trips/:tripId/playback')
  playback(
    @CurrentUser() user: AuthUser,
    @Param('tripId') tripId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.trackingService.getPlayback(user, tripId, from, to);
  }

  @Roles(RoleCode.DRIVER)
  @Permissions(PERMISSIONS.TRIPS_TRACK)
  @ApiOperation({ summary: 'Driver: mark student picked up' })
  @Put('trips/:tripId/students/:studentId/pickup')
  pickup(
    @CurrentUser() user: AuthUser,
    @Param('tripId') tripId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.trackingService.markStudentPicked(user, tripId, studentId);
  }

  @Roles(RoleCode.DRIVER)
  @Permissions(PERMISSIONS.TRIPS_TRACK)
  @ApiOperation({ summary: 'Driver: mark student dropped off' })
  @Put('trips/:tripId/students/:studentId/dropoff')
  dropoff(
    @CurrentUser() user: AuthUser,
    @Param('tripId') tripId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.trackingService.markStudentDropped(user, tripId, studentId);
  }

  @Roles(RoleCode.DRIVER)
  @Permissions(PERMISSIONS.TRIPS_TRACK)
  @ApiOperation({ summary: 'Driver: trigger SOS emergency alert' })
  @Post('trips/:tripId/sos')
  sos(
    @CurrentUser() user: AuthUser,
    @Param('tripId') tripId: string,
    @Body() body: Omit<SosTriggerDto, 'tripId'>,
  ) {
    return this.trackingService.triggerSos(user, tripId, body);
  }
}
