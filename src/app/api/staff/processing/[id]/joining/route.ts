import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { joiningConfirmSchema } from '@/lib/validations/processing';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: { OR: [{ id }, { processingCode: id }] },
      select: { id: true },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    const joiningCase = await prisma.joiningCase.findUnique({
      where: { processingCaseId: pc.id },
      include: {
        employer: true,
        confirmationDocument: true,
      },
    });

    return NextResponse.json({ success: true, data: joiningCase });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching joining case:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch joining case' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const parsed = joiningConfirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { joiningDate, joiningLocation, employerContact, confirmationDocumentId, notes } = parsed.data;

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: { OR: [{ id }, { processingCode: id }] },
      include: { employer: true },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    const jDate = new Date(joiningDate);

    const joiningCase = await prisma.joiningCase.upsert({
      where: { processingCaseId: pc.id },
      create: {
        processingCaseId: pc.id,
        candidateId: pc.applicantId,
        employerId: pc.employerId,
        joiningDate: jDate,
        joiningLocation: joiningLocation || pc.employer?.city || null,
        employerContact: employerContact || pc.employer?.phone || null,
        status: body.status || 'JOINED',
        confirmationDocumentId: confirmationDocumentId || null,
        notes: notes || (body.candidateFeedback ? `Feedback: ${body.candidateFeedback}` : null),
      },
      update: {
        joiningDate: jDate,
        joiningLocation: joiningLocation || undefined,
        employerContact: employerContact || undefined,
        status: body.status || undefined,
        confirmationDocumentId: confirmationDocumentId || undefined,
        notes: notes || (body.candidateFeedback ? `Feedback: ${body.candidateFeedback}` : undefined),
      },
    });

    await createAuditLog({
      actorId: currentUser.id,
      actorType: 'STAFF',
      action: 'UPDATE',
      entity: 'JOINING_CASE',
      entityId: joiningCase.id,
      description: `Updated joining record for case ${pc.processingCode}`,
      metadata: { processingCaseId: pc.id, joiningDate: jDate },
    });

    return NextResponse.json({
      success: true,
      message: 'Joining case record updated successfully',
      data: joiningCase,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error updating joining case:', error);
    return NextResponse.json({ success: false, error: 'Failed to update joining case' }, { status: 500 });
  }
}
