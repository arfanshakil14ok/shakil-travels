import { z } from 'zod';

export const updateSettingsSchema = z.object({
  settings: z.record(z.string(), z.string()),
});

export const companySettingsSchema = z.object({
  'company.name': z.string().min(2, 'Company name is required'),
  'company.address': z.string().min(5, 'Company address is required'),
  'company.phone': z.string().min(5, 'Phone number is required'),
  'company.email': z.string().email('Valid company email required'),
  'company.website': z.string().url('Valid website URL required'),
  'company.business_hours': z.string().min(3, 'Business hours required'),
  'company.logo': z.string().optional(),
});

export const systemSettingsSchema = z.object({
  'system.currency': z.string().min(2).default('BDT'),
  'system.timezone': z.string().min(3).default('Asia/Dhaka'),
  'system.date_format': z.string().default('DD/MM/YYYY'),
  'system.prefix_applicant': z.string().min(2).default('SGR'),
  'system.prefix_application': z.string().min(2).default('SGR-APP'),
  'system.prefix_invoice': z.string().min(2).default('SGR-INV'),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
