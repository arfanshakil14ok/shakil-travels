import { PrismaClient } from '@prisma/client';

export interface DocumentCheckItem {
  typeId: string;
  typeName: string;
  typeCode: string;
  isRequired: boolean;
  requiresExpiry: boolean;
  status: 'MISSING' | 'UPLOADED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  documentId?: string;
  fileName?: string;
  version?: number;
  verifiedAt?: Date | null;
  expiryDate?: Date | null;
  rejectionReason?: string | null;
}

export interface DocumentProgressSummary {
  totalRequired: number;
  uploadedCount: number;
  verifiedCount: number;
  rejectedCount: number;
  missingCount: number;
  progressPercent: number;
  isCompliant: boolean;
  items: DocumentCheckItem[];
}

/**
 * Computes compliance and document checklist progress for an applicant or application
 */
export async function calculateDocumentProgress(
  prisma: PrismaClient,
  applicantId: string,
  countryId?: string | null,
  categoryId?: string | null
): Promise<DocumentProgressSummary> {
  // Fetch active document types
  const docTypes = await prisma.documentType.findMany({
    where: {
      isActive: true,
      OR: [
        { isRequired: true },
        countryId ? { applicableCountryId: countryId } : {},
        categoryId ? { applicableCategoryId: categoryId } : {},
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  // Fetch applicant's latest documents
  const docs = await prisma.document.findMany({
    where: {
      applicantId,
      isLatest: true,
    },
    include: {
      documentType: true,
    },
  });

  const docMap = new Map<string, (typeof docs)[0]>();
  for (const doc of docs) {
    docMap.set(doc.documentTypeId, doc);
  }

  let totalRequired = 0;
  let uploadedCount = 0;
  let verifiedCount = 0;
  let rejectedCount = 0;
  let missingCount = 0;

  const items: DocumentCheckItem[] = docTypes.map((dt) => {
    if (dt.isRequired) totalRequired++;

    const doc = docMap.get(dt.id);
    if (!doc) {
      if (dt.isRequired) missingCount++;
      return {
        typeId: dt.id,
        typeName: dt.name,
        typeCode: dt.code,
        isRequired: dt.isRequired,
        requiresExpiry: dt.requiresExpiry,
        status: 'MISSING',
      };
    }

    uploadedCount++;
    if (doc.status === 'VERIFIED') verifiedCount++;
    if (doc.status === 'REJECTED') rejectedCount++;

    return {
      typeId: dt.id,
      typeName: dt.name,
      typeCode: dt.code,
      isRequired: dt.isRequired,
      requiresExpiry: dt.requiresExpiry,
      status: doc.status as any,
      documentId: doc.id,
      fileName: doc.fileName,
      version: doc.version,
      verifiedAt: doc.verifiedAt,
      expiryDate: doc.expiryDate,
      rejectionReason: doc.rejectionReason,
    };
  });

  const progressPercent =
    totalRequired > 0
      ? Math.round((verifiedCount / totalRequired) * 100)
      : uploadedCount > 0
      ? 100
      : 0;

  return {
    totalRequired,
    uploadedCount,
    verifiedCount,
    rejectedCount,
    missingCount,
    progressPercent: Math.min(100, Math.max(0, progressPercent)),
    isCompliant: totalRequired > 0 && verifiedCount >= totalRequired,
    items,
  };
}
