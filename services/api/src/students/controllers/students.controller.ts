import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { TenantScoped } from '../../auth/decorators/tenant-scoped.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PERMISSIONS } from '../../auth/constants/permissions';
import { RequireSubscription } from '../../common/tenant/decorators/require-subscription.decorator';
import { AuthUser } from '../../auth/types/auth-user.type';
import { BulkImportStudentsDto } from '../dto/bulk-import-students.dto';
import { CreateStudentDto } from '../dto/create-student.dto';
import { ListStudentsQueryDto } from '../dto/list-students-query.dto';
import { AssignStudentRouteDto, UpdateStudentDto } from '../dto/update-student.dto';
import { StudentsService } from '../services/students.service';

@ApiTags('Students')
@ApiBearerAuth()
@TenantScoped()
@Controller({ path: 'students', version: '1' })
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @RequireSubscription({ checkLimits: 'students' })
  @Permissions(PERMISSIONS.STUDENTS_CREATE)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateStudentDto) {
    return this.studentsService.create(user, dto);
  }

  @ApiOperation({ summary: 'Bulk import students (max 500 per request)' })
  @RequireSubscription({ checkLimits: 'students' })
  @Permissions(PERMISSIONS.STUDENTS_CREATE)
  @Post('bulk')
  bulkImport(@CurrentUser() user: AuthUser, @Body() dto: BulkImportStudentsDto) {
    return this.studentsService.bulkImport(user, dto.students);
  }

  @Permissions(PERMISSIONS.STUDENTS_MANAGE)
  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListStudentsQueryDto) {
    return this.studentsService.findAll(user, query);
  }

  @Permissions(PERMISSIONS.STUDENTS_MANAGE)
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.studentsService.findOne(user, id);
  }

  @Permissions(PERMISSIONS.STUDENTS_MANAGE)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentsService.update(user, id, dto);
  }

  @Permissions(PERMISSIONS.ROUTES_MANAGE)
  @Patch(':id/assign-route')
  assignRoute(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AssignStudentRouteDto,
  ) {
    return this.studentsService.assignRoute(user, id, dto);
  }

  @Permissions(PERMISSIONS.STUDENTS_MANAGE)
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.studentsService.remove(user, id);
  }
}
