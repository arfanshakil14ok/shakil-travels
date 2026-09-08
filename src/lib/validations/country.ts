import { z } from 'zod';

export const countrySchema = z.object({
  name: z.string().min(2, 'Country name is required'),
  code: z.string().min(2).max(3, 'Country code must be 2 or 3 letters').toUpperCase(),
  flag: z.string().optional().nullable(),
  slug: z.string().optional(),
  continent: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
  currencyCode: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
  recruitmentStatus: z.enum(['ACTIVE', 'LIMITED', 'PAUSED', 'INACTIVE']).default('ACTIVE'),
  description: z.string().optional().nullable(),
  visaInformation: z.string().optional().nullable(),
  workerInformation: z.string().optional().nullable(),
  featured: z.boolean().default(false),
  displayOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

export type CountryInput = z.infer<typeof countrySchema>;

