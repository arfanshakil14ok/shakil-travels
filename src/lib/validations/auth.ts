import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
  password: z.string().min(6, 'Password must contain at least 6 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;
