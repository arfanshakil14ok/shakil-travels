import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { updateProcessingCaseSchema } from '@/lib/validations/processing';
import { checkDepartureReadiness } from '@/lib/processing/state-machine';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const processingCase = await prisma.recruitmentProcessingCase.findFirst({
      where: {
        OR: [{ id }, { processingCode: id }, { applicationId: id }],
      },
      include: {
        applicant: {
          include: {
            customer: true,
            candidateSkills: true,
            candidateLanguages: true,
            candidateExperience: true,
            preferredCountry: true,
            preferredJobCategory: true,
          },
        },
        job: {
          include: {
            country: true,
            employer: true,
            jobCategory: true,
          },
        },
        employer: {
          include: {
            contacts: true,
          },
        },
        application: {
          include: {
            invoices: {
              include: {
                payments: true,
                items: true,
              },
            },
          },
        },
        assignedOfficer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        documentRequirements: {
          include: {
            document: true,
            verifiedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        medicalCase: {
          include: {
            medicalCenter: true,
            reportDocument: true,
            reviewedBy: { select: { id: true, name: true } },
          },
        },
        visaCase: {
          include: {
            visaDocument: true,
          },
        },
        clearanceCase: {
          include: {
            document: true,
          },
        },
        travelTicket: {
          include: {
            ticketDocument: true,
            issuedByUser: { select: { id: true, name: true } },
          },
        },
        departureCase: {
          include: {
            confirmedBy: { select: { id: true, name: true } },
          },
        },
        joiningCase: {
          include: {
            confirmationDocument: true,
            confirmedBy: { select: { id: true, name: true } },
          },
        },
        statusHistory: {
          include: {
            changedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!processingCase) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    // Compute live 5-pillar departure readiness
    const readiness = await checkDepartureReadiness(prisma, processingCase.id);

    return NextResponse.json({
      success: true,
      data: {
        ...processingCase,
        readiness,
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching processing case:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch processing case' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const parsed = updateProcessingCaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const targetCase = await prisma.recruitmentProcessingCase.findFirst({
      where: { OR: [{ id }, { processingCode: id }] },
    });

    if (!targetCase) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    const { assignedOfficerId, priority, expectedDepartureDate, internalNotes } = parsed.data;

    const updateData: any = {};
    if (assignedOfficerId !== undefined) updateData.assignedOfficerId = assignedOfficerId;
    if (priority !== undefined) updateData.priority = priority;
    if (expectedDepartureDate !== undefined) {
      updateData.expectedDepartureDate = expectedDepartureDate ? new Date(expectedDepartureDate) : null;
    }
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes;

    const updated = await prisma.recruitmentProcessingCase.update({
      where: { id: targetCase.id },
      data: updateData,
      include: {
        assignedOfficer: true,
        applicant: { select: { fullName: true } },
      },
    });

    await createAuditLog({
      actorId: currentUser.id,
      actorType: 'STAFF',
      action: 'UPDATE',
      entity: 'RECRUITMENT_PROCESSING_CASE',
      entityId: updated.id,
      description: `Updated processing case ${updated.processingCode} settings`,
      metadata: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Processing case updated successfully',
      data: updated,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error updating processing case:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update processing case' },
      { status: 500 }
    );
  }
}
