import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = process.env.COOKIE_NAME || 'sgr_session';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'sgr_enterprise_secret_key_change_in_production_2026_recruit_auth'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only handle /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch (err) {
      isAuthenticated = false;
    }
  }

  // Handle /admin/login specifically
  if (pathname === '/admin/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // All other /admin routes require authentication
  if (!isAuthenticated) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
