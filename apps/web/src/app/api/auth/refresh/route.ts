import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { COOKIES, COOKIE_OPTIONS } from '@/constants/cookies';
import { getServerApiUrl } from '@/lib/env';
import type { ApiSuccess } from '@/types/api';

export async function POST() {
  const store = await cookies();
  const refreshToken = store.get(COOKIES.REFRESH)?.value;
  if (!refreshToken) {
    return NextResponse.json({ message: 'No refresh token' }, { status: 401 });
  }
  const res = await fetch(`${getServerApiUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const json = await res.json();
  if (!res.ok) {
    return NextResponse.json(json, { status: res.status });
  }
  const { accessToken, refreshToken: newRefresh } = (json as ApiSuccess<{
    accessToken: string;
    refreshToken: string;
  }>).data;
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIES.ACCESS, accessToken, { ...COOKIE_OPTIONS, maxAge: 60 * 15 });
  response.cookies.set(COOKIES.REFRESH, newRefresh, { ...COOKIE_OPTIONS, maxAge: 60 * 60 * 24 * 30 });
  return response;
}
