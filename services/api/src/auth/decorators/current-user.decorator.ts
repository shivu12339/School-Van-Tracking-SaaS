import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { type AuthUser } from '../types/auth-user.type';
import { type AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
