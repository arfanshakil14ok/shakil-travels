import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('INVOICE_VIEW');

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        applicant: true,
      },
    });

    const headers = [
      'Invoice Number',
      'Customer Number',
      'Applicant Name',
      'Applicant Number',
      'Issue Date',
      'Due Date',
      'Currency',
      'Subtotal',
      'Discount',
      'Tax',
      'Total Amount',
      'Paid Amount',
      'Due Amount',
      'Status',
    ];

    const rows = invoices.map((inv) => [
      `"${inv.invoiceNumber}"`,
      `"${inv.customer?.name || 'N/A'}"`,
      `"${inv.applicant?.fullName || 'N/A'}"`,
      `"${inv.applicant?.applicantNumber || 'N/A'}"`,
      `"${inv.invoiceDate.toISOString().split('T')[0]}"`,
      `"${inv.dueDate ? inv.dueDate.toISOString().split('T')[0] : 'N/A'}"`,
      `"${inv.currency}"`,
      `"${inv.subtotal.toFixed(2)}"`,
      `"${inv.discount.toFixed(2)}"`,
      `"${inv.tax.toFixed(2)}"`,
      `"${inv.totalAmount.toFixed(2)}"`,
      `"${inv.paidAmount.toFixed(2)}"`,
      `"${inv.dueAmount.toFixed(2)}"`,
      `"${inv.status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="invoices-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error exporting invoices:', error);
    return NextResponse.json({ success: false, error: 'Failed to export invoices' }, { status: 500 });
  }
}
