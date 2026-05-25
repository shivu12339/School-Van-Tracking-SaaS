import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { RoleCode } from '@prisma/client';
import { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';
import { runWithTenantContext } from '../../prisma/tenant-context.store';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
    const headerSchoolId = req.headers['x-school-id'];
    const requestedSchoolId =
      typeof headerSchoolId === 'string' && headerSchoolId.length > 0
        ? headerSchoolId
        : undefined;

    if (requestedSchoolId) {
      req.headers['x-tenant-school-id'] = requestedSchoolId;
    }

    if (req.user?.schoolId) {
      req.tenantSchoolId = req.user.schoolId;
    }

    const schoolId =
      req.user?.role === RoleCode.SUPER_ADMIN && requestedSchoolId
        ? requestedSchoolId
        : req.user?.schoolId;

    if (!schoolId) {
      next();
      return;
    }

    runWithTenantContext(
      {
        schoolId,
        userId: req.user?.id,
        bypassTenantScope: req.user?.role === RoleCode.SUPER_ADMIN && !requestedSchoolId,
      },
      () => next(),
    );
  }
}
