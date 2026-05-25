export const AUTH_REDIS_PREFIX = 'auth';
export const LOGIN_ATTEMPTS_PREFIX = `${AUTH_REDIS_PREFIX}:login:attempts`;
export const SESSION_CACHE_PREFIX = `${AUTH_REDIS_PREFIX}:session`;
export const TOKEN_BLACKLIST_PREFIX = `${AUTH_REDIS_PREFIX}:blacklist:access`;
export const PERMISSIONS_CACHE_PREFIX = `${AUTH_REDIS_PREFIX}:permissions`;

export const REFRESH_TOKEN_BYTES = 64;
export const PASSWORD_RESET_TOKEN_BYTES = 32;
export const REFRESH_COOKIE_NAME = 'svt_refresh';
export const REFRESH_TOKEN_CONTEXT_KEY = 'refreshTokenContext';
