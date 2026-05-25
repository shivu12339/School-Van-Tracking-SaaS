import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { TenantScoped } from '../../auth/decorators/tenant-scoped.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PERMISSIONS } from '../../auth/constants/permissions';
import { RequireSubscription } from '../../common/tenant/decorators/require-subscription.decorator';
import { AuthUser } from '../../auth/types/auth-user.type';
import { CreateDriverDto } from '../dto/create-driver.dto';
import { ListDriversQueryDto } from '../dto/list-drivers-query.dto';
import {
  AssignDriverRouteDto,
  AssignDriverVanDto,
  UpdateDriverDto,
  UpdateDriverStatusDto,
} from '../dto/update-driver.dto';
import { DriversService } from '../services/drivers.service';

@ApiTags('Drivers')
@ApiBearerAuth()
@TenantScoped()
@Controller({ path: 'drivers', version: '1' })
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @ApiOperation({ summary: 'Create driver with user account' })
  @RequireSubscription({ checkLimits: 'drivers' })
  @Permissions(PERMISSIONS.DRIVERS_CREATE)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDriverDto) {
    return this.driversService.create(user, dto);
  }

  @ApiOperation({ summary: 'List drivers (paginated, searchable)' })
  @Permissions(PERMISSIONS.DRIVERS_MANAGE)
  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListDriversQueryDto) {
    return this.driversService.findAll(user, query);
  }

  @ApiOperation({ summary: 'Get driver by id' })
  @Permissions(PERMISSIONS.DRIVERS_MANAGE)
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.driversService.findOne(user, id);
  }

  @ApiOperation({ summary: 'Update driver profile' })
  @Permissions(PERMISSIONS.DRIVERS_MANAGE)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateDriverDto,
  ) {
    return this.driversService.update(user, id, dto);
  }

  @ApiOperation({ summary: 'Update driver availability status' })
  @Permissions(PERMISSIONS.DRIVERS_MANAGE)
  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateDriverStatusDto,
  ) {
    return this.driversService.updateStatus(user, id, dto);
  }

  @ApiOperation({ summary: 'Assign primary van to driver' })
  @Permissions(PERMISSIONS.DRIVERS_MANAGE)
  @Patch(':id/assign-van')
  assignVan(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AssignDriverVanDto,
  ) {
    return this.driversService.assignVan(user, id, dto);
  }

  @ApiOperation({ summary: 'Link driver to route (trip scheduling)' })
  @Permissions(PERMISSIONS.DRIVERS_MANAGE)
  @Patch(':id/assign-route')
  assignRoute(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AssignDriverRouteDto,
  ) {
    return this.driversService.assignRoute(user, id, dto);
  }

  @ApiOperation({ summary: 'Soft-delete driver' })
  @Permissions(PERMISSIONS.DRIVERS_MANAGE)
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.driversService.remove(user, id);
  }
}
