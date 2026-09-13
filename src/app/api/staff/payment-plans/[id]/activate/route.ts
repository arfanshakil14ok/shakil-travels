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

    const plan = await (prisma as any).paymentPlan.findFirst({
      where: { OR: [{ id }, { planNumber: id }] },
    });

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Payment plan not found' }, { status: 404 });
    }

    if (plan.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: `Plan is already in ${plan.status} status.` },
        { status: 400 }
      );
    }

    const updated = await (prisma as any).paymentPlan.update({
      where: { id: plan.id },
      data: {
        status: 'ACTIVE',
        approvedById: currentUser.id,
      },
      include: {
        installments: { orderBy: { installmentNumber: 'asc' } },
      },
    });

    await createAuditLog({
      actorUserId: currentUser.id,
      action: 'PAYMENT_PLAN_ACTIVATED',
      entity: 'PAYMENT_PLAN',
      entityId: plan.id,
      applicantId: plan.applicantId || undefined,
      description: `Activated payment plan ${plan.planNumber}`,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Payment plan ${plan.planNumber} activated.`,
    });
  } catch (error: any) {
    console.error('Error activating payment plan:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to activate payment plan' },
      { status: 500 }
    );
  }
}
