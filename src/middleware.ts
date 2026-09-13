import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = process.env.COOKIE_NAME || 'sgr_session';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'sgr_enterprise_secret_key_change_in_production_2026_recruit_auth'
);

const PORTAL_COOKIE_NAME = 'sgr_portal_session';
const PORTAL_JWT_SECRET = new TextEncoder().encode(
  process.env.PORTAL_JWT_SECRET || process.env.JWT_SECRET || 'sgr_portal_secure_jwt_secret_applicant_2026'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith('/admin');
  const isStaffRoute = pathname.startsWith('/staff');
  const isPortalRoute = pathname.startsWith('/portal') || pathname.startsWith('/candidate');

  if (!isAdminRoute && !isStaffRoute && !isPortalRoute) {
    return NextResponse.next();
  }

  // 1. Verify Staff/Admin Session
  const staffToken = request.cookies.get(COOKIE_NAME)?.value;
  let staffPayload: any = null;

  if (staffToken) {
    try {
      const { payload } = await jwtVerify(staffToken, JWT_SECRET);
      staffPayload = payload;
    } catch {
      staffPayload = null;
    }
  }

  // 2. Verify Candidate Portal Session
  const portalToken = request.cookies.get(PORTAL_COOKIE_NAME)?.value;
  let portalPayload: any = null;

  if (portalToken) {
    try {
      const { payload } = await jwtVerify(portalToken, PORTAL_JWT_SECRET);
      portalPayload = payload;
    } catch {
      portalPayload = null;
    }
  }

  // Handle Admin Routes (/admin/*)
  if (isAdminRoute) {
    if (pathname === '/admin/login') {
      if (staffPayload) {
        if (staffPayload.role === 'SUPER_ADMIN' || staffPayload.role === 'ADMIN') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
        return NextResponse.redirect(new URL('/staff/dashboard', request.url));
      }
      return NextResponse.next();
    }

    if (!staffPayload) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based Admin Isolation: Non-admin staff cannot access /admin/*
    const isAdmin = staffPayload.role === 'SUPER_ADMIN' || staffPayload.role === 'ADMIN';
    if (!isAdmin) {
      const redirectUrl = new URL('/staff/dashboard', request.url);
      redirectUrl.searchParams.set('error', 'unauthorized_admin_access');
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  // Handle Staff Routes (/staff/*)
  if (isStaffRoute) {
    if (pathname === '/staff/login') {
      if (staffPayload) {
        return NextResponse.redirect(new URL('/staff/dashboard', request.url));
      }
      return NextResponse.next();
    }

    if (!staffPayload) {
      const loginUrl = new URL('/staff/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // Handle Candidate Portal Routes (/portal/* and /candidate/*)
  if (isPortalRoute) {
    const isPublicAuthRoute =
      pathname === '/portal/login' ||
      pathname === '/portal/register' ||
      pathname === '/portal/forgot-password' ||
      pathname === '/portal/reset-password' ||
      pathname === '/candidate/login' ||
      pathname === '/candidate/register';

    if (isPublicAuthRoute) {
      if (portalPayload) {
        return NextResponse.redirect(new URL('/portal', request.url));
      }
      return NextResponse.next();
    }

    if (!portalPayload) {
      const loginUrl = new URL('/portal/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/staff/:path*',
    '/portal/:path*',
    '/candidate/:path*',
    '/candidate',
  ],
};
