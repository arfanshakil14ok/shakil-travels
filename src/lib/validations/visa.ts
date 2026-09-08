import { z } from 'zod';

export const VISA_STATUSES = [
  'NOT_STARTED',
  'DOCUMENT_PENDING',
  'DOCUMENT_READY',
  'SUBMITTED',
  'UNDER_REVIEW',
  'BIOMETRICS',
  'MEDICAL',
  'ADDITIONAL_DOCUMENT_REQUESTED',
  'INTERVIEW',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
  'EXPIRED',
  'COMPLETED',
] as const;

export type VisaStatus = (typeof VISA_STATUSES)[number];

export const VISA_TYPES = [
  'WORK_VISA',
  'EMPLOYMENT_VISA',
  'WORK_PERMIT',
  'SKILLED_WORK_VISA',
  'TEMPORARY_WORK_VISA',
  'SEASONAL_WORK_VISA',
  'OTHER',
] as const;

export type VisaType = (typeof VISA_TYPES)[number];

export const createVisaApplicationSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
  applicantId: z.string().optional(),
  countryId: z.string().optional(),
  visaType: z.string().default('WORK_VISA'),
  assignedStaffId: z.string().optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateVisaStatusSchema = z.object({
  toStatus: z.enum(VISA_STATUSES),
  status: z.enum(VISA_STATUSES).optional(),
  reason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  submissionDate: z.string().optional().nullable(),
  appointmentDate: z.string().optional().nullable(),
  biometricsDate: z.string().optional().nullable(),
  medicalDate: z.string().optional().nullable(),
  decisionDate: z.string().optional().nullable(),
  visaExpiryDate: z.string().optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
});

export const visaAppointmentSchema = z.object({
  appointmentType: z.enum(['BIOMETRICS', 'EMBASSY', 'MEDICAL', 'INTERVIEW']),
  appointmentDate: z.string().min(1, 'Appointment date is required'),
  location: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  status: z.enum(['SCHEDULED', 'ATTENDED', 'CANCELLED', 'RESCHEDULED']).default('SCHEDULED'),
  notes: z.string().optional().nullable(),
});

export const visaInformationSchema = z.object({
  countryId: z.string().min(1, 'Country is required'),
  visaType: z.string().default('WORK_VISA'),
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  overview: z.string().optional().nullable(),
  eligibility: z.string().optional().nullable(),
  requiredDocuments: z.string().optional().nullable(),
  applicationProcess: z.string().optional().nullable(),
  processingInformation: z.string().optional().nullable(),
  feesInformation: z.string().optional().nullable(),
  validityInformation: z.string().optional().nullable(),
  workRights: z.string().optional().nullable(),
  restrictions: z.string().optional().nullable(),
  officialSourceName: z.string().optional().nullable(),
  officialSourceUrl: z.string().url('Must be a valid URL').optional().nullable().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export type CreateVisaApplicationInput = z.infer<typeof createVisaApplicationSchema>;
export type UpdateVisaStatusInput = z.infer<typeof updateVisaStatusSchema>;
export type VisaAppointmentInput = z.infer<typeof visaAppointmentSchema>;
export type VisaInformationInput = z.infer<typeof visaInformationSchema>;
