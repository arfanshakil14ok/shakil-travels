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

export const screeningChecklistSchema = z.record(
  z.string(),
  z.object({
    status: z.enum(['PASS', 'FAIL', 'PENDING', 'NOT_REQUIRED']).default('PENDING'),
    notes: z.string().optional().nullable(),
  })
);

export const applicationScreeningSchema = z.object({
  overallResult: z.enum(['PASS', 'FAIL', 'PENDING']),
  checklist: z.record(z.string(), z.any()).optional().default({}),
  notes: z.string().optional().nullable(),
  autoShortlist: z.boolean().optional().default(false),
});

export const interviewScorecardSchema = z.object({
  scorecard: z
    .object({
      technicalSkill: z.number().min(1).max(10).optional(),
      experience: z.number().min(1).max(10).optional(),
      communication: z.number().min(1).max(10).optional(),
      language: z.number().min(1).max(10).optional(),
      behaviour: z.number().min(1).max(10).optional(),
      jobUnderstanding: z.number().min(1).max(10).optional(),
      overallImpression: z.number().min(1).max(10).optional(),
      averageScore: z.number().optional(),
    })
    .optional(),
  result: z.enum(['PASS', 'FAIL', 'PENDING', 'NO_SHOW', 'RESCHEDULED', 'PASSED', 'FAILED']),
  score: z.number().optional(),
  feedback: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  candidateNotes: z.string().optional().nullable(),
});

export const applicationSelectionSchema = z.object({
  selectionNotes: z.string().optional().nullable(),
  selectedPosition: z.string().optional().nullable(),
  forceOverride: z.boolean().optional().default(false),
  overrideReason: z.string().optional().nullable(),
});

export const REJECTION_REASONS = [
  'SKILL_MISMATCH',
  'INSUFFICIENT_EXPERIENCE',
  'AGE_NOT_ELIGIBLE',
  'PASSPORT_ISSUE',
  'DOCUMENT_ISSUE',
  'LANGUAGE_REQUIREMENT',
  'INTERVIEW_FAILED',
  'EMPLOYER_REJECTED',
  'VACANCY_FILLED',
  'CANDIDATE_UNAVAILABLE',
  'OTHER',
] as const;

export const applicationRejectionSchema = z.object({
  rejectionReason: z.string().min(1, 'Rejection reason is required'),
  internalNotes: z.string().optional().nullable(),
  candidateFeedback: z.string().optional().nullable(),
});

export const applicationWithdrawalSchema = z.object({
  withdrawalReason: z.string().min(1, 'Withdrawal reason is required'),
  notes: z.string().optional().nullable(),
});

export const applicationShortlistSchema = z.object({
  notes: z.string().optional().nullable(),
});

export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>;
export type ApplicationStatusChangeInput = z.infer<typeof applicationStatusChangeSchema>;
export type ApplicationAssignInput = z.infer<typeof applicationAssignSchema>;
export type ApplicationScreeningInput = z.infer<typeof applicationScreeningSchema>;
export type InterviewScorecardInput = z.infer<typeof interviewScorecardSchema>;
export type ApplicationSelectionInput = z.infer<typeof applicationSelectionSchema>;
export type ApplicationRejectionInput = z.infer<typeof applicationRejectionSchema>;
export type ApplicationWithdrawalInput = z.infer<typeof applicationWithdrawalSchema>;
export type ApplicationShortlistInput = z.infer<typeof applicationShortlistSchema>;
