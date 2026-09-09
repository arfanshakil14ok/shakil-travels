import { NextResponse } from 'next/server';
import { clearPortalCookie, clearPortalCookieOnResponse } from '@/lib/portal-auth';

export async function POST() {
  await clearPortalCookie();
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  return clearPortalCookieOnResponse(response);
}

