import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { holdProcessingCaseSchema } from '@/lib/validations/processing';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const parsed = holdProcessingCaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { holdReason, notes } = parsed.data;

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: { OR: [{ id }, { processingCode: id }] },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    if (pc.overallStatus === 'ON_HOLD') {
      return NextResponse.json(
        { success: false, error: 'Processing case is already ON HOLD' },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const held = await tx.recruitmentProcessingCase.update({
        where: { id: pc.id },
        data: {
          overallStatus: 'ON_HOLD',
          currentStage: 'ON_HOLD',
          previousStage: pc.currentStage,
          holdReason,
        },
      });

      await tx.processingStatusHistory.create({
        data: {
          processingCaseId: pc.id,
          fromStage: pc.currentStage,
          toStage: 'ON_HOLD',
          changedById: currentUser.id,
          changedByRole: currentUser.role.name,
          reason: holdReason,
          notes: notes || `Case placed on hold. Previous stage: ${pc.currentStage}`,
        },
      });

      return held;
    });

    await createAuditLog({
      actorId: currentUser.id,
      actorType: 'STAFF',
      action: 'STATUS_CHANGE',
      entity: 'RECRUITMENT_PROCESSING_CASE',
      entityId: pc.id,
      description: `Placed processing case ${pc.processingCode} on hold: ${holdReason}`,
      metadata: { holdReason, previousStage: pc.currentStage },
    });

    return NextResponse.json({
      success: true,
      message: 'Processing case placed on hold',
      data: updated,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error placing processing case on hold:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to place processing case on hold' },
      { status: 500 }
    );
  }
}
