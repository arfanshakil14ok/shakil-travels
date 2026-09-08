import { Prisma } from '@prisma/client';

export interface InvoiceItemInput {
  serviceId?: string | null;
  serviceCode?: string | null;
  description?: string;
  quantity: number;
  unitPrice: number | string | Prisma.Decimal;
  discount?: number | string | Prisma.Decimal;
  tax?: number | string | Prisma.Decimal;
}

export interface CalculatedItem {
  quantity: number;
  unitPrice: Prisma.Decimal;
  discount: Prisma.Decimal;
  tax: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
}

export interface CalculatedInvoiceTotals {
  subtotal: Prisma.Decimal;
  discount: Prisma.Decimal;
  tax: Prisma.Decimal;
  adjustment: Prisma.Decimal;
  total: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  paid: Prisma.Decimal;
  paidAmount: Prisma.Decimal;
  due: Prisma.Decimal;
  dueAmount: Prisma.Decimal;
  items: Array<InvoiceItemInput & CalculatedItem>;
}

/**
 * Ensures strict 2-decimal place precision for all monetary numbers
 */
export function toDecimal(val: number | string | Prisma.Decimal | null | undefined): Prisma.Decimal {
  if (val === null || val === undefined || val === '') {
    return new Prisma.Decimal(0);
  }
  return new Prisma.Decimal(val).toDecimalPlaces(2);
}

/**
 * Calculates a single invoice item line total: (qty * unitPrice) - discount + tax
 */
export function calculateLineItem(item: InvoiceItemInput): CalculatedItem {
  const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
  const unitPrice = toDecimal(item.unitPrice);
  const discount = toDecimal(item.discount);
  const tax = toDecimal(item.tax);

  const basePrice = unitPrice.mul(qty);
  const lineTotal = basePrice.sub(discount).add(tax).toDecimalPlaces(2);

  return {
    quantity: qty,
    unitPrice,
    discount,
    tax,
    lineTotal: lineTotal.lessThan(0) ? new Prisma.Decimal(0) : lineTotal,
  };
}

/**
 * Server-side invoice totals calculation
 */
export function calculateInvoiceTotals(
  items: InvoiceItemInput[],
  discountTotal: number | string | Prisma.Decimal = 0,
  taxTotal: number | string | Prisma.Decimal = 0,
  adjustment: number | string | Prisma.Decimal = 0,
  paidAmount: number | string | Prisma.Decimal = 0
): CalculatedInvoiceTotals {
  let subtotal = new Prisma.Decimal(0);
  const calculatedItems: Array<InvoiceItemInput & CalculatedItem> = [];

  for (const item of items) {
    const calc = calculateLineItem(item);
    subtotal = subtotal.add(calc.lineTotal);
    calculatedItems.push({
      ...item,
      ...calc,
    });
  }

  const discount = toDecimal(discountTotal);
  const tax = toDecimal(taxTotal);
  const adj = toDecimal(adjustment);
  const paid = toDecimal(paidAmount);

  // total = subtotal - discount + tax + adjustment
  let total = subtotal.sub(discount).add(tax).add(adj).toDecimalPlaces(2);
  if (total.lessThan(0)) total = new Prisma.Decimal(0);

  let due = total.sub(paid).toDecimalPlaces(2);
  if (due.lessThan(0)) due = new Prisma.Decimal(0);

  return {
    subtotal: subtotal.toDecimalPlaces(2),
    discount,
    tax,
    adjustment: adj,
    total,
    totalAmount: total,
    paid,
    paidAmount: paid,
    due,
    dueAmount: due,
    items: calculatedItems,
  };
}
