import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { TenantScoped } from '../../auth/decorators/tenant-scoped.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PERMISSIONS } from '../../auth/constants/permissions';
import { AuthUser } from '../../auth/types/auth-user.type';
import { FleetSearchQueryDto } from '../../fleet/dto/search-query.dto';
import { CreateParentDto } from '../dto/create-parent.dto';
import { UpdateParentDto } from '../dto/update-parent.dto';
import { ParentsService } from '../services/parents.service';

@ApiTags('Parents')
@ApiBearerAuth()
@TenantScoped()
@Controller({ path: 'parents', version: '1' })
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Permissions(PERMISSIONS.PARENTS_MANAGE)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateParentDto) {
    return this.parentsService.create(user, dto);
  }

  @Permissions(PERMISSIONS.PARENTS_MANAGE)
  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: FleetSearchQueryDto) {
    return this.parentsService.findAll(user, query);
  }

  @Permissions(PERMISSIONS.PARENTS_MANAGE)
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.parentsService.findOne(user, id);
  }

  @Permissions(PERMISSIONS.PARENTS_MANAGE)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateParentDto,
  ) {
    return this.parentsService.update(user, id, dto);
  }

  @Permissions(PERMISSIONS.PARENTS_MANAGE)
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.parentsService.remove(user, id);
  }
}
