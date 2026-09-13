import { z } from 'zod';

export const PROCESSING_STAGES = [
  'SELECTED',
  'DOCUMENT_PROCESSING',
  'DOCUMENT_VERIFICATION',
  'MEDICAL_PENDING',
  'MEDICAL_SCHEDULED',
  'MEDICAL_COMPLETED',
  'MEDICAL_PASSED',
  'MEDICAL_FAILED',
  'VISA_PREPARATION',
  'VISA_SUBMITTED',
  'VISA_PROCESSING',
  'VISA_APPROVED',
  'VISA_REJECTED',
  'CLEARANCE_PENDING',
  'CLEARANCE_PROCESSING',
  'CLEARANCE_COMPLETED',
  'TICKET_PENDING',
  'TICKET_ISSUED',
  'DEPARTURE_READY',
  'DEPARTED',
  'JOINED',
  'COMPLETED',
  'ON_HOLD',
  'CANCELLED',
] as const;

export type ProcessingStage = (typeof PROCESSING_STAGES)[number];

export const CANCELLATION_REASONS = [
  'CANDIDATE_WITHDRAWAL',
  'VISA_REJECTION',
  'MEDICAL_UNFIT',
  'EMPLOYER_CANCELLED',
  'DOCUMENT_PROBLEM',
  'PAYMENT_PROBLEM',
  'NO_SHOW',
  'OTHER',
] as const;

export const createProcessingCaseSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
  assignedOfficerId: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  expectedDepartureDate: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
});

export const updateProcessingCaseSchema = z.object({
  assignedOfficerId: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  expectedDepartureDate: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
});

export const stageTransitionSchema = z.object({
  targetStage: z.enum(PROCESSING_STAGES),
  forceOverride: z.boolean().default(false),
  overrideReason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const holdProcessingCaseSchema = z.object({
  holdReason: z.string().min(3, 'Hold reason is required (at least 3 characters)'),
  notes: z.string().optional().nullable(),
});

export const cancelProcessingCaseSchema = z.object({
  cancellationReason: z.enum(CANCELLATION_REASONS),
  notes: z.string().min(3, 'Cancellation notes are required explaining details'),
});

export const documentRequirementCreateSchema = z.object({
  documentType: z.string().min(1, 'Document type is required'),
  title: z.string().min(1, 'Document title is required'),
  titleLocal: z.string().optional().nullable(),
  required: z.boolean().default(true),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const documentVerifySchema = z.object({
  verificationNote: z.string().optional().nullable(),
});

export const documentRejectSchema = z.object({
  rejectionReason: z.string().min(3, 'Rejection reason is required'),
});

export const medicalScheduleSchema = z.object({
  medicalCenterId: z.string().optional().nullable(),
  medicalCenterName: z.string().optional().nullable(),
  appointmentDate: z.string().min(1, 'Appointment date is required'),
  appointmentTime: z.string().optional().nullable(),
  medicalType: z.string().default('GAMCA'),
  gamcaNumber: z.string().optional().nullable(),
  appointmentNotes: z.string().optional().nullable(),
});

export const medicalResultSchema = z.object({
  result: z.enum(['FIT', 'UNFIT', 'RETEST_REQUIRED', 'CONDITIONALLY_FIT']),
  fitnessExpiryDate: z.string().optional().nullable(),
  gamcaNumber: z.string().optional().nullable(),
  reportDocumentId: z.string().optional().nullable(),
  resultNotes: z.string().optional().nullable(),
});

export const visaSubmitSchema = z.object({
  country: z.string().optional().nullable(),
  visaType: z.string().default('EMPLOYMENT_VISA'),
  applicationNumber: z.string().optional().nullable(),
  sponsorName: z.string().optional().nullable(),
  sponsorReference: z.string().optional().nullable(),
  submissionDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const visaApproveSchema = z.object({
  approvedDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  visaDocumentId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const visaRejectSchema = z.object({
  rejectionReason: z.string().min(3, 'Rejection reason is required'),
  notes: z.string().optional().nullable(),
});

export const clearanceSubmitSchema = z.object({
  clearanceType: z.string().default('BMET_EMIGRATION'),
  referenceNumber: z.string().optional().nullable(),
  applicationDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const clearanceCompleteSchema = z.object({
  smartCardNumber: z.string().optional().nullable(),
  certificateNumber: z.string().optional().nullable(),
  issueDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  documentId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const ticketIssueSchema = z.object({
  airline: z.string().min(1, 'Airline is required'),
  flightNumber: z.string().min(1, 'Flight number is required'),
  bookingReference: z.string().optional().nullable(),
  ticketNumber: z.string().optional().nullable(),
  departureAirport: z.string().default('DAC - Hazrat Shahjalal International Airport, Dhaka'),
  arrivalAirport: z.string().min(1, 'Arrival airport is required'),
  departureDate: z.string().min(1, 'Departure date is required'),
  departureTime: z.string().optional().nullable(),
  arrivalDate: z.string().optional().nullable(),
  arrivalTime: z.string().optional().nullable(),
  baggageAllowance: z.string().optional().nullable(),
  ticketDocumentId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const departureConfirmSchema = z.object({
  departureDate: z.string().optional().nullable(),
  departureTime: z.string().optional().nullable(),
  airport: z.string().optional().nullable(),
  flightNumber: z.string().optional().nullable(),
  destination: z.string().optional().nullable(),
  reportingTime: z.string().optional().nullable(),
  meetingPoint: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const joiningConfirmSchema = z.object({
  joiningDate: z.string().min(1, 'Joining date is required'),
  joiningLocation: z.string().optional().nullable(),
  employerContact: z.string().optional().nullable(),
  confirmationDocumentId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const medicalCenterSchema = z.object({
  name: z.string().min(2, 'Medical center name is required'),
  nameLocal: z.string().optional().nullable(),
  country: z.string().default('Bangladesh'),
  city: z.string().default('Dhaka'),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable(),
  isGamca: z.boolean().default(true),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  notes: z.string().optional().nullable(),
});
