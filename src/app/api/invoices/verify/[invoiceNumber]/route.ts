import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceNumber: string }> }
) {
  try {
    const { invoiceNumber } = await params;
    const cleanInvoiceNumber = decodeURIComponent(invoiceNumber).trim();

    if (!cleanInvoiceNumber) {
      return NextResponse.json(
        { success: false, error: 'Invoice number is required' },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [
          { invoiceNumber: cleanInvoiceNumber },
          { id: cleanInvoiceNumber },
        ],
      },
      include: {
        customer: { select: { name: true } },
        applicant: { select: { fullName: true } },
        application: {
          include: {
            job: { select: { title: true, country: { select: { name: true } } } },
          },
        },
        items: {
          select: {
            description: true,
            quantity: true,
            serviceCode: true,
          },
        },
        payments: {
          select: {
            paymentDate: true,
            amount: true,
            paymentMethod: true,
            receiptNumber: true,
          },
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice not found in the official registry. Please verify the invoice number.',
        },
        { status: 404 }
      );
    }

    const billedTo = invoice.applicant?.fullName || invoice.customer?.name || 'Authorized Client';
    const targetJob = invoice.application?.job
      ? `${invoice.application.job.title} (${invoice.application.job.country?.name || 'Overseas'})`
      : null;

    const publicVerificationData = {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.invoiceDate || invoice.createdAt,
      invoiceDate: invoice.invoiceDate || invoice.createdAt,
      dueDate: invoice.dueDate,
      status: invoice.status,
      currency: invoice.currency || 'BDT',
      totalAmount: Number(invoice.totalAmount),
      paidAmount: Number(invoice.paidAmount),
      dueAmount: Number(invoice.dueAmount),
      billedTo,
      targetJob,
      services: invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        serviceCode: item.serviceCode,
      })),
      paymentsCount: invoice.payments.length,
      lastPaymentDate: invoice.payments[0]?.paymentDate || null,
      verifiedAt: new Date().toISOString(),
      agencyName: 'SHAKIL GLOBAL MANPOWER',
      agencyLicense: 'RL-1892',
      bmetApproved: true,
      isAuthentic: invoice.status !== 'VOID',
    };

    return NextResponse.json(
      {
        success: true,
        data: publicVerificationData,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error: any) {
    console.error('Invoice verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification service error' },
      { status: 500 }
    );
  }
}
