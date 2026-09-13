import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { paymentSchema } from '@/lib/validations/accounting';
import { recordPayment } from '@/lib/accounting/payment';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('PAYMENT_CREATE');
    const { id } = await params;
    const body = await request.json();

    const parsed = paymentSchema.safeParse({
      ...body,
      invoiceId: id,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Use atomic payment processor
    const payment = await recordPayment(prisma, {
      invoiceId: id,
      customerId: data.customerId || null,
      amount: data.amount,
      currency: data.currency || 'BDT',
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber || null,
      receivedById: currentUser.id,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
      notes: data.notes || null,
    });

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: { invoiceNumber: true, applicantId: true, totalAmount: true, dueAmount: true },
    });

    await createAuditLog({
      userId: currentUser.id,
      applicantId: invoice?.applicantId || undefined,
      actorType: 'STAFF',
      action: 'PAYMENT_CREATE',
      entity: 'PAYMENT',
      entityId: payment.id,
      description: `Payment ${payment.paymentNumber} of ${payment.currency} ${payment.amount} recorded against Invoice ${invoice?.invoiceNumber || id}. Receipt: ${payment.receiptNumber}`,
      newValue: {
        paymentNumber: payment.paymentNumber,
        receiptNumber: payment.receiptNumber,
        amount: payment.amount.toString(),
        method: payment.paymentMethod,
        invoiceNumber: invoice?.invoiceNumber,
        applicantId: invoice?.applicantId,
      },
    });

    if (invoice?.applicantId) {
      await prisma.notification.create({
        data: {
          applicantId: invoice.applicantId,
          type: 'PAYMENT_RECEIVED',
          title: 'পেমেন্ট জমা সম্পন্ন',
          message: `ইনভয়েস #${invoice.invoiceNumber} এর অনুকূলে ৳${Number(payment.amount).toLocaleString()} পেমেন্ট সফলভাবে জমা হয়েছে। রসিদ নম্বর: #${payment.receiptNumber}।`,
          link: '/portal/payments',
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: payment,
        message: `Payment ${payment.paymentNumber} recorded successfully. Receipt #${payment.receiptNumber}`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record payment' },
      { status: 400 }
    );
  }
}
