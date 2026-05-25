import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { TenantScoped } from '../../auth/decorators/tenant-scoped.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PERMISSIONS } from '../../auth/constants/permissions';
import { AuthUser } from '../../auth/types/auth-user.type';
import { CreateRouteDto } from '../dto/create-route.dto';
import { CreateRouteStopDto, ReorderRouteStopsDto } from '../dto/create-route-stop.dto';
import { ListRoutesQueryDto } from '../dto/list-routes-query.dto';
import { UpdateRouteDto } from '../dto/update-route.dto';
import { RoutesService } from '../services/routes.service';

@ApiTags('Routes')
@ApiBearerAuth()
@TenantScoped()
@Controller({ path: 'routes', version: '1' })
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Permissions(PERMISSIONS.ROUTES_MANAGE)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRouteDto) {
    return this.routesService.create(user, dto);
  }

  @Permissions(PERMISSIONS.ROUTES_MANAGE)
  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListRoutesQueryDto) {
    return this.routesService.findAll(user, query);
  }

  @Permissions(PERMISSIONS.ROUTES_MANAGE)
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.routesService.findOne(user, id);
  }

  @Permissions(PERMISSIONS.ROUTES_MANAGE)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateRouteDto,
  ) {
    return this.routesService.update(user, id, dto);
  }

  @Permissions(PERMISSIONS.ROUTES_MANAGE)
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.routesService.remove(user, id);
  }

  @ApiOperation({ summary: 'Add stop to route' })
  @Permissions(PERMISSIONS.ROUTES_MANAGE)
  @Post(':id/stops')
  addStop(
    @CurrentUser() user: AuthUser,
    @Param('id') routeId: string,
    @Body() dto: CreateRouteStopDto,
  ) {
    return this.routesService.addStop(user, routeId, dto);
  }

  @ApiOperation({ summary: 'Reorder route stops' })
  @Permissions(PERMISSIONS.ROUTES_MANAGE)
  @Patch(':id/stops/reorder')
  reorderStops(
    @CurrentUser() user: AuthUser,
    @Param('id') routeId: string,
    @Body() dto: ReorderRouteStopsDto,
  ) {
    return this.routesService.reorderStops(user, routeId, dto);
  }

  @Permissions(PERMISSIONS.ROUTES_MANAGE)
  @Delete(':id/stops/:stopId')
  removeStop(
    @CurrentUser() user: AuthUser,
    @Param('id') routeId: string,
    @Param('stopId') stopId: string,
  ) {
    return this.routesService.removeStop(user, routeId, stopId);
  }
}
