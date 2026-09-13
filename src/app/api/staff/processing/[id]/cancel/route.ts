import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { cancelProcessingCaseSchema } from '@/lib/validations/processing';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const parsed = cancelProcessingCaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { cancellationReason, notes } = parsed.data;

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: { OR: [{ id }, { processingCode: id }] },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    if (pc.overallStatus === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'Processing case is already cancelled' },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.recruitmentProcessingCase.update({
        where: { id: pc.id },
        data: {
          overallStatus: 'CANCELLED',
          currentStage: 'CANCELLED',
          cancellationReason,
          internalNotes: notes
            ? `${pc.internalNotes ? pc.internalNotes + '\n' : ''}[Cancellation: ${cancellationReason}] ${notes}`
            : pc.internalNotes,
        },
      });

      await tx.processingStatusHistory.create({
        data: {
          processingCaseId: pc.id,
          fromStage: pc.currentStage,
          toStage: 'CANCELLED',
          changedById: currentUser.id,
          changedByRole: currentUser.role.name,
          reason: cancellationReason,
          notes,
        },
      });

      return cancelled;
    });

    await createAuditLog({
      actorId: currentUser.id,
      actorType: 'STAFF',
      action: 'CANCEL',
      entity: 'RECRUITMENT_PROCESSING_CASE',
      entityId: pc.id,
      description: `Cancelled processing case ${pc.processingCode} due to ${cancellationReason}`,
      metadata: { cancellationReason, notes },
    });

    return NextResponse.json({
      success: true,
      message: 'Processing case cancelled successfully',
      data: updated,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error cancelling processing case:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel processing case' },
      { status: 500 }
    );
  }
}
