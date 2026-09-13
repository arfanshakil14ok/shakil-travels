import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';
import { checkDepartureReadiness } from '@/lib/processing/state-machine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const applicant = await requireApplicantAuth();
    const { id } = await params;

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: {
        AND: [
          { OR: [{ id }, { processingCode: id }] },
          { applicantId: applicant.id },
        ],
      },
      include: {
        job: {
          select: {
            id: true,
            jobCode: true,
            title: true,
            salaryMin: true,
            salaryMax: true,
            currency: true,
            country: { select: { name: true, code: true, flag: true } },
            employer: { select: { companyName: true } },
          },
        },
        employer: {
          select: {
            companyName: true,
            country: true,
            city: true,
            website: true,
          },
        },
        documentRequirements: {
          include: {
            document: {
              select: {
                id: true,
                fileName: true,
                fileUrl: true,
                mimeType: true,
                fileSize: true,
                createdAt: true,
              },
            },
          },
          orderBy: [{ required: 'desc' }, { createdAt: 'asc' }],
        },
        medicalCase: {
          include: {
            medicalCenter: {
              select: {
                name: true,
                nameLocal: true,
                city: true,
                address: true,
                phone: true,
                isGamca: true,
              },
            },
            reportDocument: {
              select: {
                id: true,
                fileName: true,
                fileUrl: true,
              },
            },
          },
        },
        visaCase: {
          include: {
            visaDocument: {
              select: {
                id: true,
                fileName: true,
                fileUrl: true,
              },
            },
          },
        },
        clearanceCase: {
          include: {
            document: {
              select: {
                id: true,
                fileName: true,
                fileUrl: true,
              },
            },
          },
        },
        travelTicket: {
          include: {
            ticketDocument: {
              select: {
                id: true,
                fileName: true,
                fileUrl: true,
              },
            },
          },
        },
        departureCase: true,
        joiningCase: {
          include: {
            confirmationDocument: {
              select: {
                id: true,
                fileName: true,
                fileUrl: true,
              },
            },
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            fromStage: true,
            toStage: true,
            reason: true,
            createdAt: true,
          },
        },
      },
    });

    if (!pc) {
      return NextResponse.json(
        { success: false, error: 'Processing case not found or access denied' },
        { status: 404 }
      );
    }

    const readiness = await checkDepartureReadiness(prisma, pc.id);

    return NextResponse.json({
      success: true,
      data: {
        ...pc,
        readiness,
      },
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Portal processing detail error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch processing case details' }, { status: 500 });
  }
}
