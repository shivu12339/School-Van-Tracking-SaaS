import { type RoleCode } from '@prisma/client';

export interface JwtAccessPayload {
  sub: string;
  email: string;
  schoolId: string | null;
  role: RoleCode;
  sessionId: string;
  permissions: string[];
  jti: string;
}
