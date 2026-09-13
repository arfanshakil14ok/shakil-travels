import { PrismaClient, Prisma } from '@prisma/client';
import { generateInvoiceNumber } from '@/lib/id-generator';
import { createAuditLog } from '@/lib/audit';
import { createInvoiceLedgerEntry } from './ledger';

export interface InvoiceItemData {
  serviceId?: string | null;
  serviceCode?: string | null;
  description: string;
  descriptionLocal?: string | null;
  category?: string;
  quantity: number;
  unitPrice: number | string | Prisma.Decimal;
  discount?: number | string | Prisma.Decimal;
  tax?: number | string | Prisma.Decimal;
}

export function toDecimal(val: number | string | Prisma.Decimal | null | undefined): Prisma.Decimal {
  if (val === null || val === undefined || val === '') {
    return new Prisma.Decimal(0);
  }
  return new Prisma.Decimal(val).toDecimalPlaces(2);
}

export function calculateLineItem(item: any) {
  const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
  const unitPrice = toDecimal(item.unitPrice);
  const baseAmount = unitPrice.mul(qty).toDecimalPlaces(2);

  let discount = toDecimal(item.discount !== undefined ? item.discount : item.discountAmount);
  let tax = toDecimal(item.tax !== undefined ? item.tax : item.taxAmount);

  if (item.taxRate !== undefined && item.taxRate !== null && (!item.tax && !item.taxAmount)) {
    const rate = toDecimal(item.taxRate);
    const taxableBase = baseAmount.sub(discount);
    tax = taxableBase.greaterThan(0)
      ? taxableBase.mul(rate).div(100).toDecimalPlaces(2)
      : new Prisma.Decimal(0);
  }

  const lineTotal = baseAmount.sub(discount).add(tax).toDecimalPlaces(2);
  const finalTotal = lineTotal.lessThan(0) ? new Prisma.Decimal(0) : lineTotal;

  return {
    quantity: qty,
    unitPrice,
    amount: baseAmount,
    discount,
    discountAmount: discount,
    tax,
    taxAmount: tax,
    lineTotal: finalTotal,
    totalAmount: finalTotal,
  };
}

export function calculateInvoiceTotals(
  items: any[],
  discountTotal: number | string | Prisma.Decimal = 0,
  taxTotal: number | string | Prisma.Decimal = 0,
  adjustment: number | string | Prisma.Decimal = 0,
  paidAmount: number | string | Prisma.Decimal = 0
) {
  let subtotal = new Prisma.Decimal(0);
  let totalItemDiscount = new Prisma.Decimal(0);
  let totalItemTax = new Prisma.Decimal(0);
  const calculatedItems = [];

  for (const item of items) {
    const calc = calculateLineItem(item);
    subtotal = subtotal.add(calc.amount);
    totalItemDiscount = totalItemDiscount.add(calc.discountAmount);
    totalItemTax = totalItemTax.add(calc.taxAmount);
    calculatedItems.push({
      ...item,
      ...calc,
    });
  }

  const explicitDiscount = toDecimal(discountTotal);
  const explicitTax = toDecimal(taxTotal);
  const adj = toDecimal(adjustment);
  const paid = toDecimal(paidAmount);

  const discount = totalItemDiscount.greaterThan(0) ? totalItemDiscount : explicitDiscount;
  const tax = totalItemTax.greaterThan(0) ? totalItemTax : explicitTax;

  // total = subtotal - discount + tax + adjustment
  let total = subtotal.sub(discount).add(tax).add(adj).toDecimalPlaces(2);
  if (total.lessThan(0)) total = new Prisma.Decimal(0);

  let due = total.sub(paid).toDecimalPlaces(2);
  if (due.lessThan(0)) due = new Prisma.Decimal(0);

  return {
    subtotal,
    discount,
    discountAmount: discount,
    tax,
    taxAmount: tax,
    adjustment: adj,
    totalAmount: total,
    paidAmount: paid,
    dueAmount: due,
    items: calculatedItems,
  };
}

export function deriveInvoiceStatus(
  arg1: string | Prisma.Decimal | number,
  arg2?: Prisma.Decimal | number | string,
  arg3?: Prisma.Decimal | number | string | Date | null,
  arg4?: Date | null
): string {
  let currentStatus = 'ISSUED';
  let totalAmount: Prisma.Decimal;
  let paidAmount: Prisma.Decimal;
  let dueDate: Date | null = null;

  if (typeof arg1 === 'string' && isNaN(Number(arg1))) {
    currentStatus = arg1;
    totalAmount = toDecimal(arg2);
    paidAmount = toDecimal(arg3 as any);
    dueDate = (arg4 as Date) || null;
  } else {
    totalAmount = toDecimal(arg1);
    paidAmount = toDecimal(arg2);
    dueDate = (arg3 as Date) || null;
  }

  if (['VOID', 'CANCELLED', 'REFUNDED', 'DRAFT'].includes(currentStatus)) {
    return currentStatus;
  }

  if (paidAmount.greaterThanOrEqualTo(totalAmount) && totalAmount.greaterThan(0)) {
    return 'PAID';
  }

  if (paidAmount.greaterThan(0)) {
    return 'PARTIALLY_PAID';
  }

  if (dueDate && new Date(dueDate) < new Date() && paidAmount.lessThan(totalAmount)) {
    return 'OVERDUE';
  }

  return 'ISSUED';
}

export interface CreateInvoiceParams {
  applicantId?: string | null;
  candidateId?: string | null;
  applicationId?: string | null;
  processingCaseId?: string | null;
  employerId?: string | null;
  jobId?: string | null;
  customerId?: string | null;
  invoiceDate?: Date | string;
  dueDate?: Date | string | null;
  currency?: string;
  items: any[];
  discount?: number | string | Prisma.Decimal;
  tax?: number | string | Prisma.Decimal;
  adjustment?: number | string | Prisma.Decimal;
  status?: string; // DRAFT or ISSUED
  autoIssue?: boolean;
  notes?: string | null;
  terms?: string | null;
  createdById?: string | null;
}

export async function createInvoice(prisma: PrismaClient, params: CreateInvoiceParams) {
  const totals = calculateInvoiceTotals(
    params.items,
    params.discount,
    params.tax,
    params.adjustment,
    0
  );

  const initialStatus = params.autoIssue ? 'ISSUED' : (params.status || 'DRAFT');
  const invoiceNumber = await generateInvoiceNumber(prisma);

  return await prisma.$transaction(async (tx) => {
    // If applicantId provided, ensure customer record link if exists
    let customerId = params.customerId;
    if (!customerId && params.applicantId) {
      const cust = await tx.customer.findFirst({
        where: { applicantId: params.applicantId },
      });
      if (cust) customerId = cust.id;
    }

    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        customerId: customerId || null,
        applicantId: params.applicantId || null,
        applicationId: params.applicationId || null,
        processingCaseId: params.processingCaseId || null,
        employerId: params.employerId || null,
        jobId: params.jobId || null,
        invoiceDate: params.invoiceDate ? new Date(params.invoiceDate) : new Date(),
        dueDate: params.dueDate ? new Date(params.dueDate) : null,
        currency: params.currency || 'BDT',
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        adjustment: totals.adjustment,
        totalAmount: totals.totalAmount,
        paidAmount: new Prisma.Decimal(0),
        dueAmount: totals.totalAmount,
        status: initialStatus,
        notes: params.notes || null,
        terms: params.terms || null,
        createdById: params.createdById || null,
        items: {
          create: totals.items.map((item) => ({
            serviceId: item.serviceId || null,
            serviceCode: item.serviceCode || null,
            description: item.description,
            descriptionLocal: item.descriptionLocal || null,
            category: item.category || 'PROCESSING_FEE',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            tax: item.tax,
            lineTotal: item.lineTotal,
          })),
        },
      },
      include: {
        items: true,
        applicant: true,
        application: true,
        processingCase: true,
      },
    });

    // If issued right away and linked to an applicant, write initial debit ledger entry
    if (initialStatus === 'ISSUED' && invoice.applicantId) {
      await createInvoiceLedgerEntry(tx as any, {
        applicantId: invoice.applicantId,
        applicationId: invoice.applicationId,
        processingCaseId: invoice.processingCaseId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.totalAmount,
        currency: invoice.currency,
        createdById: params.createdById,
      });
    }

    await createAuditLog({
      actorUserId: params.createdById || null,
      action: 'CREATE',
      entity: 'INVOICE',
      entityId: invoice.id,
      applicantId: invoice.applicantId,
      description: `Created invoice ${invoice.invoiceNumber} with amount ${invoice.currency} ${invoice.totalAmount} (${initialStatus})`,
      newValue: {
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount.toString(),
        status: initialStatus,
        itemsCount: totals.items.length,
      },
    });

    return invoice;
  });
}
