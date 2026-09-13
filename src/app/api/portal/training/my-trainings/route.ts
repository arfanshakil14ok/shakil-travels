import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const applicant = await requireApplicantAuth();

    const [applications, enrollments, certificates] = await Promise.all([
      prisma.trainingApplication.findMany({
        where: { applicantId: applicant.id },
        include: {
          course: {
            include: { category: true },
          },
          batch: {
            include: { center: true },
          },
        },
        orderBy: { appliedAt: 'desc' },
      }),
      prisma.trainingEnrollment.findMany({
        where: { applicantId: applicant.id },
        include: {
          batch: {
            include: {
              course: { include: { category: true } },
              center: true,
              instructor: true,
            },
          },
          attendance: {
            orderBy: { date: 'desc' },
            take: 30,
          },
          progress: {
            orderBy: { updatedAt: 'desc' },
          },
          assessments: {
            orderBy: { assessmentDate: 'desc' },
          },
          certificate: true,
        },
        orderBy: { enrolledAt: 'desc' },
      }),
      prisma.trainingCertificate.findMany({
        where: { applicantId: applicant.id },
        include: {
          course: true,
          center: true,
        },
        orderBy: { issueDate: 'desc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        applications,
        enrollments,
        certificates,
        candidateType: applicant.candidateType,
      },
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching my-trainings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch candidate trainings' },
      { status: 500 }
    );
  }
}
