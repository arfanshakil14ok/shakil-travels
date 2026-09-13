import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { invoiceSchema } from '@/lib/validations/accounting';
import { generateFormattedId } from '@/lib/id-generator';
import { calculateInvoiceTotals, toDecimal } from '@/lib/accounting/calculations';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('INVOICE_VIEW');

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const applicantId = searchParams.get('applicantId');
    const applicationId = searchParams.get('applicationId');
    const isOverdue = searchParams.get('isOverdue');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const where: any = {};

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { applicant: { fullName: { contains: search, mode: 'insensitive' } } },
        { applicant: { applicantNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (customerId && customerId !== 'ALL') {
      where.customerId = customerId;
    }

    if (applicantId && applicantId !== 'ALL') {
      where.applicantId = applicantId;
    }

    if (applicationId && applicationId !== 'ALL') {
      where.applicationId = applicationId;
    }

    if (isOverdue === 'true') {
      where.dueDate = { lt: new Date() };
      where.status = { in: ['ISSUED', 'PARTIALLY_PAID'] };
    }

    const [total, items] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: {
            select: { id: true, name: true, customerType: true },
          },
          applicant: {
            select: { id: true, applicantNumber: true, fullName: true, phone: true },
          },
          application: {
            select: { id: true, applicationNumber: true, job: { select: { title: true } } },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { items: true, payments: true, refunds: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requirePermission('INVOICE_CREATE');
    const body = await request.json();

    const parsed = invoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Calculate totals securely with Decimal engine
    const totals = calculateInvoiceTotals(
      data.items,
      data.discount || 0,
      data.tax || 0,
      data.adjustment || 0
    );

    // Resolve or find customer
    let customerId = data.customerId || null;
    let applicantId = data.applicantId || null;

    if (applicantId && !customerId) {
      const applicant = await prisma.applicant.findUnique({
        where: { id: applicantId },
        include: { customer: true },
      });
      if (applicant?.customer) {
        customerId = applicant.customer.id;
      }
    } else if (customerId && !applicantId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: { applicant: true },
      });
      if (customer?.applicant) {
        applicantId = customer.applicant.id;
      }
    }

    // Generate unique invoice number: SGR-INV-2026-XXXXXX
    const invoiceNumber = await generateFormattedId(prisma, 'invoice');

    const invoice = await prisma.$transaction(async (tx) => {
      // 1. Create Invoice record
      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          customerId,
          applicantId,
          applicationId: data.applicationId || null,
          invoiceDate: new Date(data.invoiceDate || data.issueDate),
          dueDate: new Date(data.dueDate),
          currency: data.currency || 'BDT',
          subtotal: totals.subtotal,
          discount: totals.discount,
          tax: totals.tax,
          adjustment: totals.adjustment,
          totalAmount: totals.totalAmount,
          paidAmount: toDecimal('0.00'),
          dueAmount: totals.totalAmount,
          status: data.status || 'ISSUED',
          notes: data.notes || null,
          terms: data.terms || null,
          createdById: currentUser.id,
        },
      });

      // 2. Create Line Items
      await tx.invoiceItem.createMany({
        data: totals.items.map((item) => ({
          invoiceId: created.id,
          serviceId: item.serviceId || null,
          serviceCode: item.serviceCode || null,
          description: item.description || 'Service Fee',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          tax: item.tax,
          lineTotal: item.lineTotal,
        })),
      });

      // 3. Post debit transaction to financial ledger if officially ISSUED
      if (created.status === 'ISSUED') {
        // Calculate previous customer balance
        const lastTx = await tx.financialTransaction.findFirst({
          where: customerId ? { customerId } : { applicantId: applicantId! },
          orderBy: { createdAt: 'desc' },
        });

        const prevBalance = lastTx ? lastTx.balance : toDecimal('0.00');
        const newBalance = prevBalance.plus(created.totalAmount);

        await tx.financialTransaction.create({
          data: {
            transactionType: 'INVOICE',
            referenceNumber: created.invoiceNumber,
            customerId,
            applicantId,
            invoiceId: created.id,
            debit: created.totalAmount,
            credit: toDecimal('0.00'),
            balance: newBalance,
            notes: `Invoice issued: ${created.invoiceNumber}`,
          },
        });
      }

      return created;
    });

    await createAuditLog({
      userId: currentUser.id,
      applicantId: invoice.applicantId || undefined,
      actorType: 'STAFF',
      action: 'INVOICE_CREATE',
      entity: 'INVOICE',
      entityId: invoice.id,
      description: `Invoice ${invoice.invoiceNumber} created for ${invoice.currency} ${invoice.totalAmount} by ${currentUser.name}`,
      newValue: {
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount.toString(),
        currency: invoice.currency,
        applicantId: invoice.applicantId,
        customerId: invoice.customerId,
      },
    });

    if (invoice.applicantId) {
      await prisma.notification.create({
        data: {
          applicantId: invoice.applicantId,
          type: 'INVOICE_ISSUED',
          title: 'নতুন ইনভয়েস ইস্যু করা হয়েছে',
          message: `আপনার অ্যাকাউন্টে নতুন ইনভয়েস (${invoice.invoiceNumber}) ইস্যু করা হয়েছে। মোট প্রদেয় অর্থ: ৳${Number(invoice.totalAmount).toLocaleString()}।`,
          link: '/portal/invoices',
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: invoice,
        message: `Invoice ${invoice.invoiceNumber} created successfully`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error creating invoice:', error);
    return NextResponse.json({ success: false, error: 'Failed to create invoice' }, { status: 500 });
  }
}
