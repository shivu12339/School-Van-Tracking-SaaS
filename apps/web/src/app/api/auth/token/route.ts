import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { COOKIES } from '@/constants/cookies';

export async function GET() {
  const store = await cookies();
  const accessToken = store.get(COOKIES.ACCESS)?.value;
  if (!accessToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ accessToken });
}
