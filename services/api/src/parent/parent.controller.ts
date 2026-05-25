import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleCode } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/constants/permissions';
import { AuthUser } from '../auth/types/auth-user.type';
import { ParentService } from './parent.service';

@ApiTags('Parent')
@ApiBearerAuth()
@Roles(RoleCode.PARENT)
@Permissions(PERMISSIONS.TRIPS_TRACK)
@Controller({ path: 'parent', version: '1' })
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  @ApiOperation({ summary: 'List children linked to parent' })
  @Get('children')
  children(@CurrentUser() user: AuthUser) {
    return this.parentService.listChildren(user);
  }

  @ApiOperation({ summary: 'Active in-progress trip for child' })
  @Get('children/:studentId/active-trip')
  activeTrip(@CurrentUser() user: AuthUser, @Param('studentId') studentId: string) {
    return this.parentService.getActiveTrip(user, studentId);
  }

  @ApiOperation({ summary: 'Trip overview with student status' })
  @Get('trips/:tripId/students/:studentId')
  tripOverview(
    @CurrentUser() user: AuthUser,
    @Param('tripId') tripId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.parentService.getTripOverview(user, tripId, studentId);
  }

  @ApiOperation({ summary: 'Live van location' })
  @Get('trips/:tripId/live')
  live(
    @CurrentUser() user: AuthUser,
    @Param('tripId') tripId: string,
    @Query('studentId') studentId: string,
  ) {
    return this.parentService.getLiveLocation(user, tripId, studentId);
  }

  @ApiOperation({ summary: 'ETA for child on trip' })
  @Get('trips/:tripId/eta')
  eta(
    @CurrentUser() user: AuthUser,
    @Param('tripId') tripId: string,
    @Query('studentId') studentId: string,
  ) {
    return this.parentService.getEta(user, tripId, studentId);
  }

  @ApiOperation({ summary: 'Route playback points' })
  @Get('trips/:tripId/playback')
  playback(
    @CurrentUser() user: AuthUser,
    @Param('tripId') tripId: string,
    @Query('studentId') studentId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.parentService.getPlayback(user, tripId, studentId, from, to);
  }

  @ApiOperation({ summary: 'Trip history for child' })
  @Get('children/:studentId/trip-history')
  history(@CurrentUser() user: AuthUser, @Param('studentId') studentId: string) {
    return this.parentService.getTripHistory(user, studentId);
  }
}
