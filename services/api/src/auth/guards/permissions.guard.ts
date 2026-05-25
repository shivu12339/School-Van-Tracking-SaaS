import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PermissionKey, resolvePermissionKey } from '../constants/permissions';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const required = this.reflector.getAllAndOverride<PermissionKey[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userPermissions = new Set(request.user?.permissions ?? []);
    const hasAll = required.every((permission) =>
      userPermissions.has(resolvePermissionKey(permission)),
    );
    if (!hasAll) {
      throw new ForbiddenException('Missing required permissions');
    }
    return true;
  }
}
