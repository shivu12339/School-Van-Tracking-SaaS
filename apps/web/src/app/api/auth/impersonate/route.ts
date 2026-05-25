import { NextResponse } from 'next/server';
import { COOKIES, COOKIE_OPTIONS } from '@/constants/cookies';

export async function POST(request: Request) {
  const body = await request.json();
  const { accessToken, refreshToken, user } = body;
  if (!accessToken || !refreshToken || !user) {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
  }
  const response = NextResponse.json({ user });
  response.cookies.set(COOKIES.ACCESS, accessToken, { ...COOKIE_OPTIONS, maxAge: 60 * 15 });
  response.cookies.set(COOKIES.REFRESH, refreshToken, { ...COOKIE_OPTIONS, maxAge: 60 * 60 * 24 * 30 });
  response.cookies.set(COOKIES.ROLE, user.role, { ...COOKIE_OPTIONS, httpOnly: false, maxAge: 60 * 60 * 24 * 30 });
  if (user.schoolId) {
    response.cookies.set(COOKIES.SCHOOL_ID, user.schoolId, { ...COOKIE_OPTIONS, httpOnly: false, maxAge: 60 * 60 * 24 * 30 });
  }
  return response;
}
