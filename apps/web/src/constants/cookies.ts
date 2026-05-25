export const COOKIES = {
  ACCESS: 'sv_access_token',
  REFRESH: 'sv_refresh_token',
  ROLE: 'sv_role',
  SCHOOL_ID: 'sv_school_id',
} as const;

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};
