import { NextResponse } from 'next/server';
import { getCurrentApplicant } from '@/lib/portal-auth';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Check Candidate Portal session
    const applicant = await getCurrentApplicant();
    if (applicant) {
      return NextResponse.json({
        authenticated: true,
        type: 'APPLICANT',
        role: 'CANDIDATE',
        user: {
          id: applicant.id,
          name: applicant.fullName,
          phone: applicant.phone,
          email: applicant.email,
          applicantNumber: applicant.applicantNumber,
          avatarUrl: applicant.profilePhoto || (applicant as any).profile?.photoUrl || null,
        },
        dashboardUrl: '/portal',
      });
    }

    // 2. Check Staff / Admin session
    const staffUser = await getCurrentUser();
    if (staffUser) {
      const roleName = staffUser.role?.name || 'STAFF';
      const isAdmin = roleName === 'SUPER_ADMIN' || roleName === 'ADMIN';

      return NextResponse.json({
        authenticated: true,
        type: 'STAFF',
        role: roleName,
        user: {
          id: staffUser.id,
          name: staffUser.name,
          email: staffUser.email,
          roleTitle: staffUser.role?.description || roleName,
          avatarUrl: (staffUser as any).avatarUrl || null,
        },
        dashboardUrl: isAdmin ? '/admin/dashboard' : '/staff/dashboard',
      });
    }

    // 3. Unauthenticated
    return NextResponse.json({
      authenticated: false,
      user: null,
      dashboardUrl: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { authenticated: false, error: error.message },
      { status: 200 }
    );
  }
}
