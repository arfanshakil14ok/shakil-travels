import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';
import { evaluateDepartureReadiness } from '@/lib/visa/readiness';

export async function GET() {
  try {
    const applicant = await requireApplicantAuth();

    const visaApplications = await prisma.visaApplication.findMany({
      where: { applicantId: applicant.id },
      take: 20,
      include: {
        country: {
          select: {
            id: true,
            name: true,
            code: true,
            flag: true,
            recruitmentStatus: true,
          },
        },
        applicant: {
          include: {
            profile: true,
            documents: {
              include: { documentType: true },
            },
          },
        },
        application: {
          include: {
            job: {
              include: {
                employer: true,
              },
            },
            documents: {
              include: { documentType: true },
            },
          },
        },
        appointments: {
          orderBy: { appointmentDate: 'asc' },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            oldStatus: true,
            newStatus: true,
            reason: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Evaluate departure readiness in-memory with zero redundant DB queries
    const results = await Promise.all(
      visaApplications.map(async (visa) => {
        const readiness = await evaluateDepartureReadiness(prisma, visa.id, visa);
        return {
          ...visa,
          readiness,
        };
      })
    );

    // Also fetch post-selection records for this applicant (bounded)
    const [medicalRecords, clearanceRecords, departureRecords] = await Promise.all([
      prisma.medicalRecord.findMany({
        where: { applicantId: applicant.id },
        take: 50,
        include: {
          application: { select: { id: true, applicationCode: true, job: { select: { title: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.clearanceRecord.findMany({
        where: { applicantId: applicant.id },
        take: 50,
        include: {
          application: { select: { id: true, applicationCode: true, job: { select: { title: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.departureRecord.findMany({
        where: { applicantId: applicant.id },
        take: 50,
        include: {
          application: { select: { id: true, applicationCode: true, job: { select: { title: true } } } },
        },
        orderBy: { departureDate: 'asc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: results,
      medicalRecords,
      clearanceRecords,
      departureRecords,
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Portal visa error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch visa records' }, { status: 500 });
  }
}
