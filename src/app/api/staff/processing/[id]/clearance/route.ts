import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { clearanceSubmitSchema } from '@/lib/validations/processing';
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

    const clearanceCase = await prisma.clearanceCase.findUnique({
      where: { processingCaseId: pc.id },
      include: { document: true },
    });

    return NextResponse.json({ success: true, data: clearanceCase });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching clearance case:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch clearance case' }, { status: 500 });
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

    const parsed = clearanceSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { clearanceType, referenceNumber, applicationDate, notes } = parsed.data;

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: { OR: [{ id }, { processingCode: id }] },
      include: { applicant: true, job: true },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    if (pc.overallStatus === 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'Cannot submit clearance for a cancelled case' }, { status: 400 });
    }

    const appDate = applicationDate ? new Date(applicationDate) : new Date();

    const clearanceCase = await prisma.clearanceCase.upsert({
      where: { processingCaseId: pc.id },
      create: {
        processingCaseId: pc.id,
        candidateId: pc.applicantId,
        clearanceType: clearanceType || 'BMET_EMIGRATION',
        referenceNumber: referenceNumber || null,
        applicationDate: appDate,
        status: 'SUBMITTED',
        notes: notes || null,
      },
      update: {
        clearanceType: clearanceType || undefined,
        referenceNumber: referenceNumber || undefined,
        applicationDate: appDate,
        status: 'SUBMITTED',
        notes: notes || undefined,
      },
    });

    const previousStage = pc.currentStage;
    const newStage = 'CLEARANCE_PROCESSING';

    await prisma.$transaction([
      prisma.recruitmentProcessingCase.update({
        where: { id: pc.id },
        data: { currentStage: newStage },
      }),
      prisma.processingStatusHistory.create({
        data: {
          processingCaseId: pc.id,
          fromStage: previousStage,
          toStage: newStage,
          changedById: currentUser.id,
          reason: `Clearance application submitted (${clearanceType || 'BMET_EMIGRATION'})`,
          notes: notes || `Ref: ${referenceNumber || 'N/A'}`,
        },
      }),
      prisma.notification.create({
        data: {
          applicantId: pc.applicantId,
          title: 'BMET / Clearance Processing Started / বিএমইটি প্রসেসিং শুরু হয়েছে',
          message: `Your BMET smart card and emigration clearance processing for ${pc.job.title} has begun.`,
          type: 'INFO',
          link: `/portal/processing/${pc.id}`,
        },
      }),
    ]);

    await createAuditLog({
      actorId: currentUser.id,
      actorType: 'STAFF',
      action: 'UPDATE',
      entity: 'CLEARANCE_CASE',
      entityId: clearanceCase.id,
      description: `Clearance processing initiated for case ${pc.processingCode}`,
      metadata: { processingCaseId: pc.id, clearanceType, referenceNumber },
    });

    return NextResponse.json({
      success: true,
      message: 'Clearance application submitted successfully',
      data: clearanceCase,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error submitting clearance:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit clearance' }, { status: 500 });
  }
}
