import { z } from 'zod';

export const jobCategorySchema = z.object({
  name: z.string().min(2, 'Category name is required'),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type JobCategoryInput = z.infer<typeof jobCategorySchema>;
