import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleCode, TripStatus } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/constants/permissions';
import { AuthUser } from '../auth/types/auth-user.type';
import { DriverService } from './driver.service';

@ApiTags('Driver')
@ApiBearerAuth()
@Roles(RoleCode.DRIVER)
@Permissions(PERMISSIONS.TRIPS_TRACK)
@Controller({ path: 'driver', version: '1' })
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @ApiOperation({ summary: 'List driver trips for today' })
  @Get('trips')
  listTrips(@CurrentUser() user: AuthUser, @Query('status') status?: TripStatus) {
    return this.driverService.listTrips(user, status);
  }

  @ApiOperation({ summary: 'Trip history' })
  @Get('trips/history')
  history(@CurrentUser() user: AuthUser) {
    return this.driverService.tripHistory(user);
  }

  @ApiOperation({ summary: 'Get trip detail' })
  @Get('trips/:tripId')
  getTrip(@CurrentUser() user: AuthUser, @Param('tripId') tripId: string) {
    return this.driverService.getTrip(user, tripId);
  }

  @ApiOperation({ summary: 'Students on trip' })
  @Get('trips/:tripId/students')
  listStudents(@CurrentUser() user: AuthUser, @Param('tripId') tripId: string) {
    return this.driverService.listTripStudents(user, tripId);
  }
}
