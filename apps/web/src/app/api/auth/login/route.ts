import { NextResponse } from 'next/server';
import { COOKIES, COOKIE_OPTIONS } from '@/constants/cookies';
import { getServerApiUrl } from '@/lib/env';
import type { AuthTokens } from '@/types/auth';
import type { ApiSuccess } from '@/types/api';

export async function POST(request: Request) {
  const body = await request.json();
  const res = await fetch(`${getServerApiUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiSuccess<AuthTokens> | { message: string };
  if (!res.ok) {
    return NextResponse.json(json, { status: res.status });
  }
  const { accessToken, refreshToken, user } = (json as ApiSuccess<AuthTokens>).data;
  const response = NextResponse.json({ user });
  response.cookies.set(COOKIES.ACCESS, accessToken, { ...COOKIE_OPTIONS, maxAge: 60 * 15 });
  response.cookies.set(COOKIES.REFRESH, refreshToken, { ...COOKIE_OPTIONS, maxAge: 60 * 60 * 24 * 30 });
  response.cookies.set(COOKIES.ROLE, user.role, { ...COOKIE_OPTIONS, httpOnly: false, maxAge: 60 * 60 * 24 * 30 });
  if (user.schoolId) {
    response.cookies.set(COOKIES.SCHOOL_ID, user.schoolId, { ...COOKIE_OPTIONS, httpOnly: false, maxAge: 60 * 60 * 24 * 30 });
  }
  return response;
}
