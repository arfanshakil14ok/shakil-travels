import { NextResponse } from 'next/server';
import { clearPortalCookie } from '@/lib/portal-auth';

export async function POST() {
  await clearPortalCookie();
  return NextResponse.json({ success: true, message: 'Logged out successfully' });
}
