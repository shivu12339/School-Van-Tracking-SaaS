import { NextResponse, type NextRequest } from 'next/server';
import { COOKIES } from '@/constants/cookies';
import { ROLES, getRoleHomePath, type RoleCode } from '@/constants/roles';

const PUBLIC_PATHS = [
  '/login',
  '/forgot-password',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/token',
  '/api/backend/health',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/api/backend/health') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIES.ACCESS)?.value;
  const role = request.cookies.get(COOKIES.ROLE)?.value as RoleCode | undefined;

  if (!token || !role) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const login = new URL('/login', request.url);
    login.searchParams.set('redirect', pathname);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith('/super-admin') && role !== ROLES.SUPER_ADMIN) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (pathname.startsWith('/admin') && role !== ROLES.SCHOOL_ADMIN) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL(getRoleHomePath(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\..*).*)'],
};
