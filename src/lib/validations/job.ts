import { z } from 'zod';

export const jobSchema = z.object({
  title: z.string().min(3, 'Job title must be at least 3 characters'),
  slug: z.string().optional(),
  countryId: z.string().min(1, 'Destination country is required'),
  jobCategoryId: z.string().min(1, 'Job category is required'),
  employerId: z.string().optional().nullable(),
  description: z.string().min(10, 'Job description must be at least 10 characters'),
  salaryMin: z.coerce.number().min(0).optional().nullable(),
  salaryMax: z.coerce.number().min(0).optional().nullable(),
  currency: z.string().default('BDT'),
  experienceRequired: z.coerce.number().int().min(0).default(0),
  educationRequired: z.string().optional().nullable(),
  ageMin: z.coerce.number().int().min(18).max(65).optional().nullable(),
  ageMax: z.coerce.number().int().min(18).max(65).optional().nullable(),
  languageRequirements: z.string().optional().nullable(),
  skillsRequired: z.string().optional().nullable(),
  vacancyCount: z.coerce.number().int().min(1).default(1),
  accommodation: z.boolean().default(false),
  food: z.boolean().default(false),
  transportation: z.boolean().default(false),
  medical: z.boolean().default(false),
  airTicket: z.boolean().default(false),
  workingHours: z.string().optional().nullable(),
  contractDuration: z.string().optional().nullable(),
  applicationDeadline: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED', 'EXPIRED']).default('DRAFT'),
  featured: z.boolean().default(false),
});

export type JobInput = z.infer<typeof jobSchema>;

export const publicJobApplicationSchema = z.object({
  jobId: z.string().min(1, 'Job is required'),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(8, 'Valid contact number is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')).nullable(),
  district: z.string().optional().nullable(),
  passportAvailable: z.boolean().default(false),
  passportNumber: z.string().optional().nullable(),
  yearsOfExperience: z.coerce.number().int().min(0).default(0),
  remarks: z.string().optional().nullable(),
});

export type PublicJobApplicationInput = z.infer<typeof publicJobApplicationSchema>;
