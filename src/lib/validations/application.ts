import { z } from 'zod';

export const applicationCreateSchema = z.object({
  applicantId: z.string().min(1, 'Applicant is required'),
  jobId: z.string().min(1, 'Job vacancy is required'),
  appliedStage: z.string().optional().default('APPLIED'),
  priority: z.enum(['LOW', 'NORMAL', 'MEDIUM', 'HIGH', 'URGENT']).default('NORMAL'),
  source: z.string().optional().default('DIRECT_VISIT'),
  assignedToId: z.string().optional().nullable(),
  assignedStaffId: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const createApplicationSchema = applicationCreateSchema;

export const applicationStatusChangeSchema = z.object({
  toStatus: z.string().min(1, 'Target status is required'),
  status: z.string().optional(),
  reason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  allowVacancyOverride: z.boolean().optional().default(false),
  forceOverride: z.boolean().optional().default(false),
});

export const updateApplicationStatusSchema = applicationStatusChangeSchema;

export const bulkUpdateApplicationStatusSchema = z.object({
  applicationIds: z.array(z.string()).min(1, 'At least one application must be selected'),
  toStatus: z.string().min(1, 'Target status is required'),
  notes: z.string().optional().nullable(),
});

export const applicationAssignSchema = z.object({
  assignedToId: z.string().optional().nullable(),
  assignedStaffId: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const assignApplicationSchema = applicationAssignSchema;

export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>;
export type ApplicationStatusChangeInput = z.infer<typeof applicationStatusChangeSchema>;
export type ApplicationAssignInput = z.infer<typeof applicationAssignSchema>;
