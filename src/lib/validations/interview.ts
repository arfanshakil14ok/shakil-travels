import { z } from 'zod';

export const interviewScheduleSchema = z.object({
  applicationId: z.string().optional().nullable(),
  applicantId: z.string().min(1, 'Applicant is required'),
  jobId: z.string().optional().nullable(),
  interviewType: z.string().default('IN_PERSON'),
  scheduledDate: z.string().min(1, 'Interview date and time is required'),
  scheduledAt: z.string().optional(),
  durationMinutes: z.coerce.number().int().min(5).max(480).default(30),
  location: z.string().optional().nullable(),
  meetingLink: z.string().optional().nullable(),
  interviewerId: z.string().optional().nullable(),
  interviewerName: z.string().optional().nullable(),
  interviewer: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const interviewSchema = interviewScheduleSchema;

export const interviewResultSchema = z.object({
  status: z.string().optional(),
  outcome: z.string().optional().nullable(),
  result: z.string().optional().nullable(),
  score: z.coerce.number().int().min(0).max(100).optional().nullable(),
  feedback: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const evaluateInterviewSchema = interviewResultSchema;

export type InterviewScheduleInput = z.infer<typeof interviewScheduleSchema>;
export type InterviewResultInput = z.infer<typeof interviewResultSchema>;
