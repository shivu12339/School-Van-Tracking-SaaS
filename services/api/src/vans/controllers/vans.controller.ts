import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { TenantScoped } from '../../auth/decorators/tenant-scoped.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PERMISSIONS } from '../../auth/constants/permissions';
import { RequireSubscription } from '../../common/tenant/decorators/require-subscription.decorator';
import { AuthUser } from '../../auth/types/auth-user.type';
import { FleetSearchQueryDto } from '../../fleet/dto/search-query.dto';
import { CreateVanDto } from '../dto/create-van.dto';
import { AssignVanRouteDto, UpdateVanDto } from '../dto/update-van.dto';
import { VansService } from '../services/vans.service';

@ApiTags('Vans')
@ApiBearerAuth()
@TenantScoped()
@Controller({ path: 'vans', version: '1' })
export class VansController {
  constructor(private readonly vansService: VansService) {}

  @RequireSubscription({ checkLimits: 'vans' })
  @Permissions(PERMISSIONS.VANS_MANAGE)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateVanDto) {
    return this.vansService.create(user, dto);
  }

  @Permissions(PERMISSIONS.VANS_MANAGE)
  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: FleetSearchQueryDto) {
    return this.vansService.findAll(user, query);
  }

  @Permissions(PERMISSIONS.VANS_MANAGE)
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.vansService.findOne(user, id);
  }

  @Permissions(PERMISSIONS.VANS_MANAGE)
  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateVanDto) {
    return this.vansService.update(user, id, dto);
  }

  @ApiOperation({ summary: 'Assign van to route' })
  @Permissions(PERMISSIONS.ROUTES_MANAGE)
  @Patch(':id/assign-route')
  assignRoute(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AssignVanRouteDto,
  ) {
    return this.vansService.assignRoute(user, id, dto);
  }

  @Permissions(PERMISSIONS.VANS_MANAGE)
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.vansService.remove(user, id);
  }
}
