import { type RoleCode } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  schoolId: string | null;
  role: RoleCode;
  sessionId: string;
  permissions: string[];
  firstName: string;
  lastName: string | null;
  jti?: string;
}
