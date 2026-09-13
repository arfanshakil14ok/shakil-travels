import { z } from 'zod';

export const employerSchema = z.object({
  companyName: z.string().trim().min(2, 'Company name is required'),
  companyNameLocal: z.string().optional().nullable(),
  countryId: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')).nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')).nullable(),
  verificationStatus: z.enum(['PENDING', 'UNVERIFIED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'INACTIVE']).default('PENDING'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED']).default('ACTIVE'),
  notes: z.string().optional().nullable(),
});

export const employerContactSchema = z.object({
  name: z.string().trim().min(2, 'Contact name is required'),
  designation: z.string().optional().nullable(),
  email: z.string().email('Invalid email').optional().or(z.literal('')).nullable(),
  phone: z.string().optional().nullable(),
  isPrimary: z.boolean().default(false),
});

export type EmployerInput = z.infer<typeof employerSchema>;
export type EmployerContactInput = z.infer<typeof employerContactSchema>;

