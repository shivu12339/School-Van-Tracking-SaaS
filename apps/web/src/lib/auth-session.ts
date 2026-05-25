import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { COOKIES } from '@/constants/cookies';
import { getJwtSecret } from '@/lib/env';
import type { RoleCode } from '@/constants/roles';

export interface SessionPayload {
  sub: string;
  email: string;
  role: RoleCode;
  schoolId: string | null;
}

export async function getAccessToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(COOKIES.ACCESS)?.value;
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(getJwtSecret());
    const { payload } = await jwtVerify(token, secret);
    return {
      sub: String(payload.sub),
      email: String(payload.email ?? ''),
      role: String(payload.role) as RoleCode,
      schoolId: payload.schoolId ? String(payload.schoolId) : null,
    };
  } catch {
    return null;
  }
}
