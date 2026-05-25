import { type Response } from 'express';
import { type ConfigService } from '@nestjs/config';
import { REFRESH_COOKIE_NAME } from '../constants/auth.constants';
import { parseJwtTtlToSeconds } from './jwt.util';

export function setRefreshTokenCookie(
  res: Response,
  refreshToken: string,
  config: ConfigService,
): void {
  const refreshTtl = config.get<string>('jwt.refreshTtl', '30d');
  const maxAgeMs = parseJwtTtlToSeconds(refreshTtl) * 1000;
  const nodeEnv = config.get<string>('NODE_ENV') ?? process.env.NODE_ENV ?? 'development';
  const isProduction = nodeEnv === 'production';

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: maxAgeMs,
    path: '/api/v1/auth',
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    path: '/api/v1/auth',
  });
}

export function extractRefreshToken(
  bodyToken?: string,
  cookies?: Record<string, string>,
): string | undefined {
  return bodyToken ?? cookies?.[REFRESH_COOKIE_NAME];
}
