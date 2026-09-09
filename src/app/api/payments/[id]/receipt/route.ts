import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('RECEIPT_VIEW');
    const { id } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            applicant: true,
            customer: true,
            items: true,
          },
        },
        customer: true,
        receivedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment record not found' }, { status: 404 });
    }

    // Fetch agency organization settings
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            'company_name',
            'license_number',
            'company_phone',
            'company_email',
            'company_address',
          ],
        },
      },
    });

    const config = settings.reduce((acc: any, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});

    const receipt = {
      receiptNumber: payment.receiptNumber,
      paymentNumber: payment.paymentNumber,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber,
      amount: payment.amount,
      currency: payment.currency,
      notes: payment.notes,
      invoice: {
        invoiceNumber: payment.invoice.invoiceNumber,
        totalAmount: payment.invoice.totalAmount,
        paidAmount: payment.invoice.paidAmount,
        dueAmount: payment.invoice.dueAmount,
        items: payment.invoice.items,
      },
      customer: payment.customer,
      applicant: payment.invoice.applicant,
      receivedBy: payment.receivedBy,
      organization: {
        name: config.company_name || 'SHAKIL GLOBAL MANPOWER',
        license: config.license_number || 'RL-1892',
        phone: config.company_phone || '01913681771',
        email: config.company_email || 'info@shakilglobal.com',
        address: config.company_address || 'ইসলামপুর মোড় , ডায়াবেটিক হাসপাতালের সামনে , পাসপোর্ট অফিস রোড , নেত্রকোনা -২৪০০',
      },
    };

    return NextResponse.json({ success: true, data: receipt });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching receipt data:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch receipt' }, { status: 500 });
  }
}
