import { z } from 'zod';

export const serviceSchema = z.object({
  name: z.string().min(2, 'Service name is required'),
  code: z.string().min(2, 'Service code is required').toUpperCase(),
  category: z.string().default('RECRUITMENT'),
  description: z.string().optional().nullable(),
  defaultAmount: z.coerce.number().min(0, 'Price must be 0 or greater'),
  currency: z.string().default('BDT'),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
});

export const invoiceItemSchema = z.object({
  serviceId: z.string().optional().nullable(),
  serviceCode: z.string().optional().nullable(),
  description: z.string().min(1, 'Item description is required'),
  quantity: z.coerce.number().int().min(1).default(1),
  unitPrice: z.coerce.number().min(0, 'Unit price must be 0 or greater'),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
});

export const invoiceCreateSchema = z.object({
  customerId: z.string().optional().nullable(),
  applicantId: z.string().optional().nullable(),
  applicationId: z.string().optional().nullable(),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  invoiceDate: z.string().optional(),
  currency: z.string().default('BDT'),
  items: z.array(invoiceItemSchema).min(1, 'At least one invoice line item is required'),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  adjustment: z.coerce.number().default(0),
  status: z.enum(['DRAFT', 'ISSUED']).default('ISSUED'),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
});

export const invoiceSchema = invoiceCreateSchema;

export const paymentCreateSchema = z.object({
  invoiceId: z.string().optional(),
  customerId: z.string().optional().nullable(),
  amount: z.coerce.number().gt(0, 'Payment amount must be greater than zero'),
  currency: z.string().default('BDT'),
  paymentMethod: z.string().default('BANK_TRANSFER'),
  paymentDate: z.string().optional(),
  referenceNumber: z.string().optional().nullable(),
  transactionId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const paymentSchema = paymentCreateSchema;

export const refundCreateSchema = z.object({
  invoiceId: z.string().optional(),
  paymentId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  amount: z.coerce.number().gt(0, 'Refund amount must be greater than zero'),
  currency: z.string().default('BDT'),
  reason: z.string().min(3, 'Detailed refund reason is required'),
  refundMethod: z.string().default('BANK_TRANSFER'),
  refundDate: z.string().optional(),
  notes: z.string().optional().nullable(),
});

export const refundSchema = refundCreateSchema;

export const financialAdjustmentSchema = z.object({
  invoiceId: z.string().optional(),
  adjustmentType: z.enum(['DISCOUNT', 'WAIVER', 'SURCHARGE', 'PENALTY', 'WRITE_OFF', 'OTHER']).default('DISCOUNT'),
  type: z.string().optional(),
  amount: z.coerce.number().min(0, 'Adjustment amount must be positive'),
  reason: z.string().min(3, 'Detailed adjustment reason is required'),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>;
export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;
export type RefundCreateInput = z.infer<typeof refundCreateSchema>;
export type FinancialAdjustmentInput = z.infer<typeof financialAdjustmentSchema>;
