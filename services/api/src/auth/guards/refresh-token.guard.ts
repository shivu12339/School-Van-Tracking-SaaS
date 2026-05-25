import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { REFRESH_TOKEN_CONTEXT_KEY } from '../constants/auth.constants';
import { extractRefreshToken } from '../utils/cookie.util';
import { RefreshTokenValidatorService } from '../services/refresh-token-validator.service';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(private readonly validator: RefreshTokenValidatorService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const body = request.body as { refreshToken?: string };
    const cookies = request.cookies as Record<string, string> | undefined;
    const rawToken = extractRefreshToken(body?.refreshToken, cookies);
    if (!rawToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const ctx = await this.validator.validate(rawToken);
    Object.assign(request, { [REFRESH_TOKEN_CONTEXT_KEY]: ctx });
    return true;
  }
}
