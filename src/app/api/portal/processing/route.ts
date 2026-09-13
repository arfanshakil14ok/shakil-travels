import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';

export async function GET() {
  try {
    const applicant = await requireApplicantAuth();

    const processingCases = await prisma.recruitmentProcessingCase.findMany({
      where: { applicantId: applicant.id },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          select: {
            id: true,
            jobCode: true,
            title: true,
            country: { select: { name: true, flag: true } },
            employer: { select: { companyName: true } },
          },
        },
        employer: {
          select: {
            id: true,
            companyName: true,
            country: true,
            city: true,
          },
        },
        medicalCase: {
          select: {
            status: true,
            result: true,
            appointmentDate: true,
            medicalCenter: { select: { name: true, city: true } },
            medicalCenterName: true,
          },
        },
        visaCase: {
          select: {
            status: true,
            country: true,
            visaType: true,
            approvedDate: true,
            expiryDate: true,
          },
        },
        clearanceCase: {
          select: {
            status: true,
            clearanceType: true,
            smartCardNumber: true,
            issueDate: true,
          },
        },
        travelTicket: {
          select: {
            airline: true,
            flightNumber: true,
            departureAirport: true,
            arrivalAirport: true,
            departureDate: true,
            departureTime: true,
            status: true,
          },
        },
        departureCase: {
          select: {
            departureStatus: true,
            departureDate: true,
            reportingTime: true,
            meetingPoint: true,
            airport: true,
            flightNumber: true,
          },
        },
        joiningCase: {
          select: {
            status: true,
            joiningDate: true,
            joiningLocation: true,
          },
        },
        _count: {
          select: {
            documentRequirements: true,
            statusHistory: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: processingCases,
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Portal processing list error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch processing records' }, { status: 500 });
  }
}
