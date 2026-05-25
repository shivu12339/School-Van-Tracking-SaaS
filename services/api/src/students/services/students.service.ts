import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { AuditLogService } from '../../auth/services/audit-log.service';
import { AuthUser } from '../../auth/types/auth-user.type';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { FleetAssignmentService } from '../../fleet/services/fleet-assignment.service';
import { buildPaginatedResult } from '../../fleet/utils/paginated-result.util';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionService } from '../../schools/services/subscription.service';
import { CreateStudentDto } from '../dto/create-student.dto';
import { ListStudentsQueryDto } from '../dto/list-students-query.dto';
import { AssignStudentRouteDto, UpdateStudentDto } from '../dto/update-student.dto';
import { StudentsRepository } from '../repositories/students.repository';

@Injectable()
export class StudentsService {
  constructor(
    private readonly studentsRepository: StudentsRepository,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly subscriptionService: SubscriptionService,
    private readonly fleetAssignment: FleetAssignmentService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(user: AuthUser, dto: CreateStudentDto) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    await this.subscriptionService.assertWithinLimits(schoolId, 'students');
    this.fleetAssignment.validateHomeCoordinates(dto.homeLatitude, dto.homeLongitude);

    const dup = await this.prisma.student.findFirst({
      where: { schoolId, admissionNumber: dto.admissionNumber, deletedAt: null },
    });
    if (dup) {
      throw new ConflictException('Admission number already exists');
    }

    const student = await this.prisma.student.create({
      data: {
        schoolId,
        parentId: dto.parentId,
        admissionNumber: dto.admissionNumber,
        fullName: dto.fullName,
        grade: dto.grade,
        section: dto.section,
        homeAddress: dto.homeAddress,
        homeLatitude: dto.homeLatitude,
        homeLongitude: dto.homeLongitude,
        routeId: dto.routeId,
      },
      include: { parent: true, route: true },
    });

    if (dto.routeId) {
      await this.fleetAssignment.assignStudentToRoute(schoolId, student.id, dto.routeId);
    }

    await this.auditLogService.log({
      schoolId,
      actorUserId: user.id,
      action: AuditAction.CREATE,
      entityType: 'student',
      entityId: student.id,
    });
    return student;
  }

  async bulkImport(user: AuthUser, students: CreateStudentDto[]) {
    const results: { created: number; errors: string[] } = { created: 0, errors: [] };

    for (let i = 0; i < students.length; i++) {
      const row = students[i];
      if (!row) continue;
      try {
        await this.create(user, row);
        results.created += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        results.errors.push(`Row ${i + 1}: ${message}`);
      }
    }
    return results;
  }

  async findAll(user: AuthUser, query: ListStudentsQueryDto) {
    const [items, total] = await this.studentsRepository.findMany(user, query);
    return buildPaginatedResult(items, total, query.page, query.limit);
  }

  async findOne(user: AuthUser, id: string) {
    const student = await this.studentsRepository.findById(user, id);
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return student;
  }

  async update(user: AuthUser, id: string, dto: UpdateStudentDto) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const existing = await this.studentsRepository.findById(user, id);
    if (!existing) {
      throw new NotFoundException('Student not found');
    }

    this.fleetAssignment.validateHomeCoordinates(dto.homeLatitude, dto.homeLongitude);

    if (dto.parentId && dto.parentId !== existing.parentId) {
      await this.fleetAssignment.assignParentToStudent(schoolId, id, dto.parentId);
    }

    if (dto.routeId !== undefined) {
      await this.fleetAssignment.assignStudentToRoute(
        schoolId,
        id,
        dto.routeId ?? null,
      );
    }

    const data: Prisma.StudentUpdateInput = {
      ...(dto.fullName ? { fullName: dto.fullName } : {}),
      ...(dto.grade !== undefined ? { grade: dto.grade } : {}),
      ...(dto.section !== undefined ? { section: dto.section } : {}),
      ...(dto.homeAddress !== undefined ? { homeAddress: dto.homeAddress } : {}),
      ...(dto.homeLatitude !== undefined ? { homeLatitude: dto.homeLatitude } : {}),
      ...(dto.homeLongitude !== undefined ? { homeLongitude: dto.homeLongitude } : {}),
    };

    const updated = await this.prisma.student.update({
      where: { id },
      data,
      include: { parent: true, route: true },
    });

    await this.auditLogService.log({
      schoolId,
      actorUserId: user.id,
      action: AuditAction.UPDATE,
      entityType: 'student',
      entityId: id,
    });
    return updated;
  }

  async assignRoute(user: AuthUser, id: string, dto: AssignStudentRouteDto) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    return this.fleetAssignment.assignStudentToRoute(schoolId, id, dto.routeId ?? null);
  }

  async remove(user: AuthUser, id: string) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const student = await this.studentsRepository.findById(user, id);
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    await this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date(), routeId: null },
    });
    await this.auditLogService.log({
      schoolId,
      actorUserId: user.id,
      action: AuditAction.DELETE,
      entityType: 'student',
      entityId: id,
    });
    return { success: true };
  }
}
