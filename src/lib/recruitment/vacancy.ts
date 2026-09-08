import { PrismaClient } from '@prisma/client';

export interface VacancyStats {
  vacancies: number;
  totalApplications: number;
  shortlistedCount: number;
  selectedCount: number;
  remainingVacancies: number;
  isFull: boolean;
}

/**
 * Calculates live vacancy utilization statistics directly from database
 */
export async function getJobVacancyStats(
  prisma: PrismaClient,
  jobId: string
): Promise<VacancyStats | null> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { vacancyCount: true },
  });

  if (!job) return null;

  const [totalApplications, shortlistedCount, selectedCount] = await Promise.all([
    prisma.application.count({
      where: { jobId },
    }),
    prisma.application.count({
      where: {
        jobId,
        status: { in: ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED'] },
      },
    }),
    prisma.application.count({
      where: {
        jobId,
        status: {
          in: [
            'SELECTED',
            'OFFER_SENT',
            'OFFER_ACCEPTED',
            'MEDICAL_PENDING',
            'MEDICAL_COMPLETED',
            'CONTRACT_PENDING',
            'CONTRACT_SIGNED',
            'VISA_PROCESSING',
            'READY_FOR_DEPARTURE',
            'COMPLETED',
          ],
        },
      },
    }),
  ]);

  const vacancies = job.vacancyCount || 1;
  const remaining = Math.max(0, vacancies - selectedCount);

  return {
    vacancies,
    totalApplications,
    shortlistedCount,
    selectedCount,
    remainingVacancies: remaining,
    isFull: selectedCount >= vacancies,
  };
}

/**
 * Validates whether an applicant can be transitioned to SELECTED or beyond.
 * Blocks over-selection unless privileged override flag is explicitly provided.
 */
export async function validateVacancyLimit(
  prisma: PrismaClient,
  jobId: string,
  isOverride = false
): Promise<{ allowed: boolean; message?: string; reason?: string; stats?: VacancyStats | null }> {
  const stats = await getJobVacancyStats(prisma, jobId);
  if (!stats) {
    return { allowed: false, message: 'Associated job demand not found', reason: 'Associated job demand not found', stats: null };
  }

  if (stats.isFull && !isOverride) {
    const msg = `Vacancy quota full (${stats.selectedCount}/${stats.vacancies} selected). Selection blocked without privileged authorization override.`;
    return {
      allowed: false,
      message: msg,
      reason: msg,
      stats,
    };
  }

  return { allowed: true, stats };
}
