import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('VISA_VIEW');

    const now = new Date();

    const [
      total,
      notStarted,
      documentPending,
      documentReady,
      submitted,
      underReview,
      additionalDocuments,
      approved,
      rejected,
      expired,
      upcomingAppointments,
    ] = await Promise.all([
      prisma.visaApplication.count(),
      prisma.visaApplication.count({ where: { status: 'NOT_STARTED' } }),
      prisma.visaApplication.count({ where: { status: 'DOCUMENT_PENDING' } }),
      prisma.visaApplication.count({ where: { status: 'DOCUMENT_READY' } }),
      prisma.visaApplication.count({ where: { status: 'SUBMITTED' } }),
      prisma.visaApplication.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.visaApplication.count({ where: { status: 'ADDITIONAL_DOCUMENT_REQUESTED' } }),
      prisma.visaApplication.count({ where: { status: 'APPROVED' } }),
      prisma.visaApplication.count({ where: { status: 'REJECTED' } }),
      prisma.visaApplication.count({
        where: {
          OR: [
            { status: 'EXPIRED' },
            { visaExpiryDate: { lt: now } },
          ],
        },
      }),
      prisma.visaAppointment.count({
        where: {
          appointmentDate: { gte: now },
          status: 'SCHEDULED',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        total,
        notStarted,
        documentPending,
        documentReady,
        submitted,
        underReview,
        additionalDocuments,
        approved,
        rejected,
        expired,
        upcomingAppointments,
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching visa stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch visa statistics' }, { status: 500 });
  }
}
