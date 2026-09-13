import { NextResponse } from 'next/server';
import { clearPortalCookie, clearPortalCookieOnResponse, getCurrentApplicant } from '@/lib/portal-auth';
import { createAuditLog } from '@/lib/audit';

export async function POST() {
  try {
    const applicant = await getCurrentApplicant();
    if (applicant) {
      await createAuditLog({
        applicantId: applicant.id,
        actorType: 'APPLICANT',
        action: 'LOGOUT',
        entity: 'CANDIDATE_AUTH',
        entityId: applicant.id,
        newValue: { applicantNumber: applicant.applicantNumber },
      });
    }
  } catch {
    // Ignore logging errors on logout
  }

  await clearPortalCookie();
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  return clearPortalCookieOnResponse(response);
}

