import { z } from 'zod';

export const documentTypeSchema = z.object({
  name: z.string().min(2, 'Document type name is required'),
  code: z.string().min(2, 'Code is required').toUpperCase(),
  category: z.string().default('OTHER'),
  description: z.string().optional().nullable(),
  isRequired: z.boolean().default(false),
  requiresExpiry: z.boolean().default(false),
  applicableCountryId: z.string().optional().nullable(),
  applicableCategoryId: z.string().optional().nullable(),
  maxSizeMb: z.coerce.number().default(10),
  allowedFormats: z.array(z.string()).default(['pdf', 'jpg', 'png']),
  sortOrder: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
});

export const documentVerifySchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED', 'UNDER_REVIEW', 'EXPIRED']),
  rejectionReason: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine(
  (data) => {
    if (data.status === 'REJECTED' && (!data.rejectionReason || data.rejectionReason.trim().length < 3)) {
      return false;
    }
    return true;
  },
  {
    message: 'A mandatory rejection reason (at least 3 characters) is required when rejecting a document.',
    path: ['rejectionReason'],
  }
);

export const verifyDocumentSchema = documentVerifySchema;

export type DocumentTypeInput = z.infer<typeof documentTypeSchema>;
export type DocumentVerifyInput = z.infer<typeof documentVerifySchema>;
