import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Please provide a valid email address'),
  phone: z.string().trim().optional().nullable(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/[0-9]/, 'Password must include a number'),
  roleId: z.string().uuid('Please select a valid role'),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Please provide a valid email address'),
  phone: z.string().trim().optional().nullable(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/[0-9]/, 'Password must include a number')
    .optional()
    .or(z.literal('')),
  roleId: z.string().uuid('Please select a valid role'),
  isActive: z.boolean(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
