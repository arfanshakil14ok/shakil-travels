import { NextResponse } from 'next/server';
import { clearSessionCookie, getCurrentUser } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (user) {
      await createAuditLog({
        userId: user.id,
        action: 'LOGOUT',
        entity: 'AUTH',
        entityId: user.id,
      });
    }
    await clearSessionCookie();
    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Logout failed' }, { status: 500 });
  }
}
