import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: { OR: [{ id }, { processingCode: id }] },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    if (pc.overallStatus !== 'ON_HOLD') {
      return NextResponse.json(
        { success: false, error: 'Processing case is not currently on hold' },
        { status: 400 }
      );
    }

    const restoredStage = pc.previousStage || 'DOCUMENT_PROCESSING';

    const updated = await prisma.$transaction(async (tx) => {
      const resumed = await tx.recruitmentProcessingCase.update({
        where: { id: pc.id },
        data: {
          overallStatus: 'ACTIVE',
          currentStage: restoredStage,
          holdReason: null,
          previousStage: null,
        },
      });

      await tx.processingStatusHistory.create({
        data: {
          processingCaseId: pc.id,
          fromStage: 'ON_HOLD',
          toStage: restoredStage,
          changedById: currentUser.id,
          changedByRole: currentUser.role.name,
          reason: 'Hold resolved / Resumed',
          notes: `Processing resumed to stage: ${restoredStage}`,
        },
      });

      return resumed;
    });

    await createAuditLog({
      actorId: currentUser.id,
      actorType: 'STAFF',
      action: 'STATUS_CHANGE',
      entity: 'RECRUITMENT_PROCESSING_CASE',
      entityId: pc.id,
      description: `Resumed processing case ${pc.processingCode} back to ${restoredStage}`,
      metadata: { restoredStage },
    });

    return NextResponse.json({
      success: true,
      message: `Processing case resumed to ${restoredStage} successfully`,
      data: updated,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error resuming processing case:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resume processing case' },
      { status: 500 }
    );
  }
}
