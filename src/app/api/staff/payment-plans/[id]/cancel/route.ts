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
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Payment plan cancelled by staff';

    const plan = await (prisma as any).paymentPlan.findFirst({
      where: { OR: [{ id }, { planNumber: id }] },
    });

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Payment plan not found' }, { status: 404 });
    }

    if (plan.status === 'CANCELLED' || plan.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: `Plan is already ${plan.status}.` },
        { status: 400 }
      );
    }

    const updated = await (prisma as any).paymentPlan.update({
      where: { id: plan.id },
      data: {
        status: 'CANCELLED',
        notes: plan.notes ? `${plan.notes}\n[CANCELLED]: ${reason}` : `[CANCELLED]: ${reason}`,
      },
    });

    await createAuditLog({
      actorUserId: currentUser.id,
      action: 'PAYMENT_PLAN_CANCELLED',
      entity: 'PAYMENT_PLAN',
      entityId: plan.id,
      applicantId: plan.applicantId || undefined,
      description: `Cancelled payment plan ${plan.planNumber}. Reason: ${reason}`,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Payment plan ${plan.planNumber} cancelled.`,
    });
  } catch (error: any) {
    console.error('Error cancelling payment plan:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel payment plan' },
      { status: 500 }
    );
  }
}
