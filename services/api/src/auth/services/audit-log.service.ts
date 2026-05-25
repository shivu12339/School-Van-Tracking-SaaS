import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: {
    schoolId?: string | null;
    actorUserId?: string | null;
    action: AuditAction;
    entityType: string;
    entityId?: string | null;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        schoolId: input.schoolId ?? null,
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: input.metadata,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  }
}
