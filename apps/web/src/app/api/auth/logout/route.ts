import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { COOKIES } from '@/constants/cookies';
import { getServerApiUrl } from '@/lib/env';

export async function POST() {
  const store = await cookies();
  const refreshToken = store.get(COOKIES.REFRESH)?.value;
  const accessToken = store.get(COOKIES.ACCESS)?.value;
  if (refreshToken && accessToken) {
    await fetch(`${getServerApiUrl()}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined);
  }
  const response = NextResponse.json({ ok: true });
  [COOKIES.ACCESS, COOKIES.REFRESH, COOKIES.ROLE, COOKIES.SCHOOL_ID].forEach((name) => {
    response.cookies.delete(name);
  });
  return response;
}
