import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  maxLoginAttempts: Number(process.env.AUTH_MAX_LOGIN_ATTEMPTS ?? 5),
  lockDurationMinutes: Number(process.env.AUTH_LOCK_DURATION_MINUTES ?? 15),
  lockWindowSeconds: Number(process.env.AUTH_LOCK_WINDOW_SECONDS ?? 900),
  passwordResetTtlMinutes: Number(process.env.AUTH_PASSWORD_RESET_TTL_MINUTES ?? 30),
  sessionCacheTtlSeconds: Number(process.env.AUTH_SESSION_CACHE_TTL_SECONDS ?? 900),
  permissionsCacheTtlSeconds: Number(process.env.AUTH_PERMISSIONS_CACHE_TTL_SECONDS ?? 300),
  useSecureCookies: process.env.AUTH_USE_SECURE_COOKIES !== 'false',
}));
