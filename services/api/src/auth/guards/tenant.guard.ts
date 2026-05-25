import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleCode } from '@prisma/client';
import { TENANT_SCOPED_KEY } from '../decorators/tenant-scoped.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const tenantScoped = this.reflector.getAllAndOverride<boolean>(TENANT_SCOPED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) {
      return true;
    }

    if (user.role === RoleCode.SUPER_ADMIN) {
      request.tenantSchoolId =
        this.extractSchoolId(request) ?? user.schoolId ?? null;
      return true;
    }

    if (!user.schoolId) {
      throw new ForbiddenException('Tenant context is required');
    }

    request.tenantSchoolId = user.schoolId;

    if (!tenantScoped) {
      return true;
    }

    const requestedSchoolId = this.extractSchoolId(request);
    if (requestedSchoolId && requestedSchoolId !== user.schoolId) {
      throw new ForbiddenException('Cross-tenant access denied');
    }

    return true;
  }

  private extractSchoolId(request: AuthenticatedRequest): string | undefined {
    const params = request.params as Record<string, string | undefined>;
    const query = request.query as Record<string, string | undefined>;
    const body = request.body as Record<string, string | undefined>;
    const header = request.headers['x-school-id'];
    const headerSchoolId = typeof header === 'string' ? header : undefined;
    return params.id ?? params.schoolId ?? query.schoolId ?? body?.schoolId ?? headerSchoolId;
  }
}
