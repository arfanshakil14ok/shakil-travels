import { z } from 'zod';

export const jobBaseSchema = z.object({
  title: z.string().trim().min(3, 'Job title must be at least 3 characters'),
  titleLocal: z.string().optional().nullable(),
  slug: z.string().optional(),
  countryId: z.string().min(1, 'Destination country is required'),
  city: z.string().optional().nullable(),
  jobCategoryId: z.string().min(1, 'Job category is required'),
  employerId: z.string().optional().nullable(),
  description: z.string().trim().min(10, 'Job description must be at least 10 characters'),
  descriptionLocal: z.string().optional().nullable(),
  salaryMin: z.coerce.number().min(0).optional().nullable(),
  salaryMax: z.coerce.number().min(0).optional().nullable(),
  currency: z.string().default('BDT'),
  salaryPeriod: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CONTRACT']).default('MONTHLY'),
  experienceRequired: z.coerce.number().int().min(0).default(0),
  educationRequired: z.string().optional().nullable(),
  ageMin: z.coerce.number().int().min(18).max(65).optional().nullable(),
  ageMax: z.coerce.number().int().min(18).max(65).optional().nullable(),
  languageRequirements: z.string().optional().nullable(),
  skillsRequired: z.string().optional().nullable(),
  vacancyCount: z.coerce.number().int().min(1).default(1),
  filledCount: z.coerce.number().int().min(0).default(0),
  accommodation: z.boolean().default(false),
  food: z.boolean().default(false),
  transportation: z.boolean().default(false),
  medical: z.boolean().default(false),
  airTicket: z.boolean().default(false),
  workingHours: z.string().optional().nullable(),
  contractDuration: z.string().optional().nullable(),
  applicationDeadline: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'PAUSED', 'CLOSED', 'EXPIRED', 'CANCELLED']).default('DRAFT'),
  featured: z.boolean().default(false),
  reviewNotes: z.string().optional().nullable(),
});

export const jobSchema = jobBaseSchema
  .refine(
    (data) => {
      if (data.salaryMin !== null && data.salaryMin !== undefined && data.salaryMax !== null && data.salaryMax !== undefined) {
        return data.salaryMin <= data.salaryMax;
      }
      return true;
    },
    {
      message: 'Minimum salary cannot exceed maximum salary',
      path: ['salaryMin'],
    }
  )
  .refine(
    (data) => {
      if (data.ageMin !== null && data.ageMin !== undefined && data.ageMax !== null && data.ageMax !== undefined) {
        return data.ageMin <= data.ageMax;
      }
      return true;
    },
    {
      message: 'Minimum age cannot exceed maximum age',
      path: ['ageMin'],
    }
  )
  .refine(
    (data) => {
      return (data.filledCount || 0) <= (data.vacancyCount || 1);
    },
    {
      message: 'Filled vacancies cannot exceed total vacancies',
      path: ['filledCount'],
    }
  )
  .refine(
    (data) => {
      if (data.status === 'PUBLISHED') {
        return Boolean(data.employerId && data.employerId.trim().length > 0);
      }
      return true;
    },
    {
      message: 'An employer must be assigned before publishing a job vacancy. / চাকরি প্রকাশ করার পূর্বে নিয়োগকর্তা নির্বাচন বাধ্যতামূলক।',
      path: ['employerId'],
    }
  );

export type JobInput = z.infer<typeof jobBaseSchema>;

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
