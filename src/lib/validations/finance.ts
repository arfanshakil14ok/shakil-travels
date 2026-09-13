import { z } from 'zod';

export const invoiceCategoryEnum = z.enum([
  'PROCESSING_FEE',
  'SERVICE_FEE',
  'VISA_FEE',
  'MEDICAL_FEE',
  'TRAINING_FEE',
  'DOCUMENTATION_FEE',
  'BMET_FEE',
  'TICKET_FEE',
  'CONSULTANCY_FEE',
  'OTHER',
]);

export const paymentMethodEnum = z.enum([
  'CASH',
  'BANK_TRANSFER',
  'MOBILE_BANKING',
  'CARD',
  'CHEQUE',
  'OTHER',
]);

export const paymentStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'REJECTED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'VOID',
]);

export const costCategoryEnum = z.enum([
  'MEDICAL',
  'VISA',
  'BMET',
  'DOCUMENTATION',
  'TRAINING',
  'TICKET',
  'ACCOMMODATION',
  'TRANSPORT',
  'AGENCY_COST',
  'EMPLOYER_COST',
  'OTHER',
]);

export const paymentPlanFrequencyEnum = z.enum([
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
  'CUSTOM',
]);

export const invoiceItemCreateSchema = z.object({
  serviceId: z.string().optional().nullable(),
  serviceCode: z.string().optional().nullable(),
  description: z.string().min(1, 'Description is required'),
  descriptionLocal: z.string().optional().nullable(),
  category: invoiceCategoryEnum.default('PROCESSING_FEE'),
  quantity: z.coerce.number().int().min(1).default(1),
  unitPrice: z.coerce.number().min(0, 'Unit price must be >= 0'),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
});

export const invoiceCreateSchema = z.object({
  candidateId: z.string().optional().nullable(),
  applicantId: z.string().optional().nullable(),
  applicationId: z.string().optional().nullable(),
  processingCaseId: z.string().optional().nullable(),
  employerId: z.string().optional().nullable(),
  jobId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  currency: z.string().default('BDT'),
  items: z.array(invoiceItemCreateSchema).min(1, 'At least one line item is required'),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  adjustment: z.coerce.number().default(0),
  status: z.enum(['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID', 'CANCELLED']).default('DRAFT'),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
});

export const invoiceUpdateSchema = z.object({
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  discount: z.coerce.number().min(0).optional(),
  tax: z.coerce.number().min(0).optional(),
  adjustment: z.coerce.number().optional(),
  status: z.enum(['DRAFT', 'ISSUED', 'CANCELLED', 'VOID']).optional(),
});

export const paymentRecordSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  candidateId: z.string().optional().nullable(),
  applicantId: z.string().optional().nullable(),
  applicationId: z.string().optional().nullable(),
  processingCaseId: z.string().optional().nullable(),
  amount: z.coerce.number().gt(0, 'Payment amount must be greater than 0'),
  currency: z.string().default('BDT'),
  paymentMethod: paymentMethodEnum.default('CASH'),
  paymentDate: z.string().optional(),
  referenceNumber: z.string().optional().nullable(),
  transactionId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  autoConfirm: z.boolean().default(true),
});

export const paymentConfirmSchema = z.object({
  notes: z.string().optional().nullable(),
});

export const paymentRejectSchema = z.object({
  reason: z.string().min(3, 'Rejection reason is required'),
});

export const refundRequestSchema = z.object({
  paymentId: z.string().optional().nullable(),
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  candidateId: z.string().optional().nullable(),
  applicantId: z.string().optional().nullable(),
  applicationId: z.string().optional().nullable(),
  amount: z.coerce.number().gt(0, 'Refund amount must be greater than 0'),
  currency: z.string().default('BDT'),
  reason: z.string().min(3, 'Refund reason is required'),
  refundMethod: paymentMethodEnum.default('CASH'),
  notes: z.string().optional().nullable(),
  autoApprove: z.boolean().default(false),
});

export const adjustmentCreateSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  candidateId: z.string().optional().nullable(),
  applicantId: z.string().optional().nullable(),
  applicationId: z.string().optional().nullable(),
  type: z.enum(['DISCOUNT', 'WAIVER', 'CREDIT', 'DEBIT', 'CORRECTION', 'ROUNDING']).default('DISCOUNT'),
  amount: z.coerce.number().gt(0, 'Adjustment amount must be greater than 0'),
  reason: z.string().min(3, 'Adjustment reason is required'),
  autoApprove: z.boolean().default(true),
});

export const paymentPlanCreateSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  candidateId: z.string().optional().nullable(),
  applicantId: z.string().optional().nullable(),
  applicationId: z.string().optional().nullable(),
  processingCaseId: z.string().optional().nullable(),
  totalAmount: z.coerce.number().gt(0, 'Total amount must be greater than 0'),
  numberOfInstallments: z.coerce.number().int().min(2, 'At least 2 installments are required').max(36),
  frequency: paymentPlanFrequencyEnum.default('MONTHLY'),
  startDate: z.string().min(1, 'Start date is required'),
  customAmounts: z.array(z.coerce.number().gt(0)).optional(),
  notes: z.string().optional().nullable(),
  autoActivate: z.boolean().optional().default(true),
});

export const recruitmentCostCreateSchema = z.object({
  candidateId: z.string().optional().nullable(),
  applicantId: z.string().optional().nullable(),
  applicationId: z.string().optional().nullable(),
  processingCaseId: z.string().optional().nullable(),
  jobId: z.string().optional().nullable(),
  employerId: z.string().optional().nullable(),
  category: costCategoryEnum.default('OTHER'),
  description: z.string().min(2, 'Description is required'),
  amount: z.coerce.number().gt(0, 'Cost amount must be greater than 0'),
  currency: z.string().default('BDT'),
  costDate: z.string().optional(),
  vendor: z.string().optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'VOID']).default('APPROVED'),
  notes: z.string().optional().nullable(),
});

export const financeFilterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  candidateId: z.string().optional(),
  applicantId: z.string().optional(),
  applicationId: z.string().optional(),
  processingCaseId: z.string().optional(),
  employerId: z.string().optional(),
  jobId: z.string().optional(),
  paymentMethod: z.string().optional(),
  category: z.string().optional(),
  isOverdue: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Backward-compatible and controller alias exports
export const createInvoiceSchema = invoiceCreateSchema;
export const updateInvoiceSchema = invoiceUpdateSchema;
export const invoiceItemSchema = invoiceItemCreateSchema;
export const recordPaymentSchema = paymentRecordSchema;
export const confirmPaymentSchema = paymentConfirmSchema;
export const rejectPaymentSchema = paymentRejectSchema;
export const requestRefundSchema = refundRequestSchema;
export const approveRefundSchema = z.object({
  notes: z.string().optional().nullable(),
});
export const createAdjustmentSchema = adjustmentCreateSchema;
export const createPaymentPlanSchema = paymentPlanCreateSchema;
export const recruitmentCostSchema = recruitmentCostCreateSchema;

