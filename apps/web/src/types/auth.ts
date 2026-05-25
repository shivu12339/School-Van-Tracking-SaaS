import type { RoleCode } from '@/constants/roles';

export interface AuthUser {
  id: string;
  email: string;
  schoolId: string | null;
  role: RoleCode;
  sessionId: string;
  permissions: string[];
  firstName: string;
  lastName: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
  schoolCode?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
