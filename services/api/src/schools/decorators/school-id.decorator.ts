import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { type AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';

export const ResolvedSchoolId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string | null | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.tenantSchoolId;
  },
);
