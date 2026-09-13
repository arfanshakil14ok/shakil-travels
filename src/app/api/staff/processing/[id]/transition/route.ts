import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { stageTransitionSchema } from '@/lib/validations/processing';
import { validateStageTransition } from '@/lib/processing/state-machine';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const parsed = stageTransitionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { targetStage, forceOverride, overrideReason, notes } = parsed.data;

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: { OR: [{ id }, { processingCode: id }] },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    // Gate validation
    const gateCheck = await validateStageTransition(prisma, pc.id, targetStage, forceOverride);
    if (!gateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: gateCheck.reason || 'Stage transition gate requirements not met',
          blockers: gateCheck.blockers || [],
        },
        { status: 422 }
      );
    }

    // Perform atomic transition
    const updatedCase = await prisma.$transaction(async (tx) => {
      const updatePayload: any = {
        currentStage: targetStage,
      };

      if (targetStage === 'COMPLETED') {
        updatePayload.completedAt = new Date();
        updatePayload.overallStatus = 'COMPLETED';
      }

      const updated = await tx.recruitmentProcessingCase.update({
        where: { id: pc.id },
        data: updatePayload,
      });

      await tx.processingStatusHistory.create({
        data: {
          processingCaseId: pc.id,
          fromStage: pc.currentStage,
          toStage: targetStage,
          changedById: currentUser.id,
          changedByRole: currentUser.role.name,
          reason: overrideReason || (forceOverride ? 'Privileged Manager Force Override' : 'Routine Stage Transition'),
          notes: notes || `Progressed recruitment processing stage to ${targetStage}`,
        },
      });

      return updated;
    });

    await createAuditLog({
      actorId: currentUser.id,
      actorType: 'STAFF',
      action: 'STATUS_CHANGE',
      entity: 'RECRUITMENT_PROCESSING_CASE',
      entityId: pc.id,
      description: `Transitioned case ${pc.processingCode} stage from ${pc.currentStage} to ${targetStage}`,
      metadata: {
        fromStage: pc.currentStage,
        toStage: targetStage,
        forceOverride,
        overrideReason,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Stage transitioned to ${targetStage} successfully`,
      data: updatedCase,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error transitioning processing stage:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to transition processing stage' },
      { status: 500 }
    );
  }
}
