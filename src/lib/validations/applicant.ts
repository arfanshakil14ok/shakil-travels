import { z } from 'zod';

export const applicantSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  fatherName: z.string().optional().nullable(),
  motherName: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
  nationality: z.string().default('Bangladeshi'),
  phone: z.string().min(8, 'Valid phone number is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')).nullable(),
  district: z.string().optional().nullable(),
  upazila: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
  profession: z.string().optional().nullable(),
  yearsOfExperience: z.coerce.number().int().min(0).default(0),
  skills: z.string().optional().nullable(),
  languages: z.string().optional().nullable(),
  passportAvailable: z.boolean().default(false),
  passportNumber: z.string().optional().nullable(),
  passportExpiry: z.string().optional().nullable(),
  preferredCountryId: z.string().optional().nullable(),
  preferredJobCategoryId: z.string().optional().nullable(),
  status: z
    .enum([
      'NEW',
      'PROFILE_INCOMPLETE',
      'ACTIVE',
      'SHORTLISTED',
      'ON_HOLD',
      'PLACED',
      'DEPARTED',
      'INACTIVE',
      'BLACKLISTED',
    ])
    .default('NEW'),
  source: z.enum(['WEBSITE', 'DIRECT_VISIT', 'REFERRAL', 'AGENT']).default('DIRECT_VISIT'),
  assignedStaffId: z.string().optional().nullable(),
  profilePhoto: z.string().optional().nullable(),
});

export type ApplicantInput = z.infer<typeof applicantSchema>;

export const applicantNoteSchema = z.object({
  note: z.string().min(3, 'Note must contain at least 3 characters'),
});

export type ApplicantNoteInput = z.infer<typeof applicantNoteSchema>;
