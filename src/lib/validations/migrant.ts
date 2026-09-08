import { z } from 'zod';

export const MIGRANT_CATEGORIES = [
  'BEFORE_TRAVEL',
  'RECRUITMENT',
  'VISA',
  'DOCUMENTS',
  'AIRPORT',
  'ARRIVAL',
  'WORKPLACE',
  'WORKER_RIGHTS',
  'SALARY',
  'CONTRACT',
  'SAFETY',
  'SCAM_AWARENESS',
  'EMERGENCY',
  'RETURN',
] as const;

export type MigrantCategory = (typeof MIGRANT_CATEGORIES)[number];

export const migrantInformationSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  slug: z.string().optional(),
  category: z.enum(MIGRANT_CATEGORIES),
  summary: z.string().optional().nullable(),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  featuredImage: z.string().optional().nullable(),
  countryId: z.string().optional().nullable(),
  officialSource: z.string().optional().nullable(),
  officialSourceUrl: z.string().url('Must be a valid URL').optional().nullable().or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
  isPublished: z.boolean().default(true),
});

export type MigrantInformationInput = z.infer<typeof migrantInformationSchema>;
