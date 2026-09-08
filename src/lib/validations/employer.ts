import { z } from 'zod';

export const employerSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  countryId: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')).nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')).nullable(),
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'INACTIVE']).default('PENDING'),
  notes: z.string().optional().nullable(),
});

export type EmployerInput = z.infer<typeof employerSchema>;
