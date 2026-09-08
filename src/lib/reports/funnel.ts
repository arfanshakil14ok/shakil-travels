import { PrismaClient } from '@prisma/client';

export interface FunnelStage {
  key: string;
  name: string;
  count: number;
  conversionFromPrevious: number; // percentage (0 - 100)
  dropoffRate: number; // percentage (0 - 100)
  color: string;
}

export interface FunnelAnalysisResult {
  stages: FunnelStage[];
  totalLeads: number;
  totalApplicants: number;
  totalApplications: number;
  totalDeployed: number;
  overallConversionRate: number; // Leads to Deployed %
  applicationToPlacementRate: number; // Applications to Deployed %
}

export async function calculateRecruitmentFunnel(
  prisma: PrismaClient,
  dateFilter?: { gte?: Date; lte?: Date }
): Promise<FunnelAnalysisResult> {
  const whereCreated = dateFilter ? { createdAt: dateFilter } : {};

  // Gather real metrics from database
  const [
    leadsCount,
    applicantsCount,
    submittedCount,
    underReviewCount,
    shortlistedCount,
    interviewedCount,
    selectedCount,
    offerCount,
    medicalPassedCount,
    visaProcessingCount,
    visaApprovedCount,
    deployedCount,
  ] = await Promise.all([
    prisma.inquiry.count({ where: whereCreated }),
    prisma.applicant.count({ where: whereCreated }),
    prisma.application.count({ where: whereCreated }),
    prisma.application.count({
      where: {
        ...whereCreated,
        status: { in: ['UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'OFFER_ACCEPTED', 'MEDICAL_PASSED', 'VISA_PROCESSING', 'VISA_APPROVED', 'COMPLETED'] },
      },
    }),
    prisma.application.count({
      where: {
        ...whereCreated,
        status: { in: ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'OFFER_ACCEPTED', 'MEDICAL_PASSED', 'VISA_PROCESSING', 'VISA_APPROVED', 'COMPLETED'] },
      },
    }),
    prisma.application.count({
      where: {
        ...whereCreated,
        status: { in: ['INTERVIEW_SCHEDULED', 'SELECTED', 'OFFER_ACCEPTED', 'MEDICAL_PASSED', 'VISA_PROCESSING', 'VISA_APPROVED', 'COMPLETED'] },
      },
    }),
    prisma.application.count({
      where: {
        ...whereCreated,
        status: { in: ['SELECTED', 'OFFER_ACCEPTED', 'MEDICAL_PASSED', 'VISA_PROCESSING', 'VISA_APPROVED', 'COMPLETED'] },
      },
    }),
    prisma.application.count({
      where: {
        ...whereCreated,
        status: { in: ['OFFER_ACCEPTED', 'MEDICAL_PASSED', 'VISA_PROCESSING', 'VISA_APPROVED', 'COMPLETED'] },
      },
    }),
    prisma.application.count({
      where: {
        ...whereCreated,
        status: { in: ['MEDICAL_PASSED', 'VISA_PROCESSING', 'VISA_APPROVED', 'COMPLETED'] },
      },
    }),
    prisma.application.count({
      where: {
        ...whereCreated,
        status: { in: ['VISA_PROCESSING', 'VISA_APPROVED', 'COMPLETED'] },
      },
    }),
    prisma.application.count({
      where: {
        ...whereCreated,
        status: { in: ['VISA_APPROVED', 'COMPLETED'] },
      },
    }),
    prisma.application.count({
      where: {
        ...whereCreated,
        status: 'COMPLETED',
      },
    }),
  ]);

  const rawStages = [
    { key: 'LEADS', name: 'Website Leads & Inquiries', count: leadsCount, color: '#3b82f6' },
    { key: 'APPLICANTS', name: 'Registered Candidates', count: applicantsCount, color: '#6366f1' },
    { key: 'SUBMITTED', name: 'Job Applications', count: submittedCount, color: '#8b5cf6' },
    { key: 'UNDER_REVIEW', name: 'Screening / Under Review', count: underReviewCount, color: '#a855f7' },
    { key: 'SHORTLISTED', name: 'Shortlisted by Employer', count: shortlistedCount, color: '#d946ef' },
    { key: 'INTERVIEWS', name: 'Interviews Scheduled', count: interviewedCount, color: '#ec4899' },
    { key: 'SELECTED', name: 'Candidate Selected', count: selectedCount, color: '#f43f5e' },
    { key: 'OFFER_ACCEPTED', name: 'Contract Signed', count: offerCount, color: '#f97316' },
    { key: 'MEDICAL_PASSED', name: 'Medical Clearance', count: medicalPassedCount, color: '#eab308' },
    { key: 'VISA_PROCESSING', name: 'Visa Lodge & Process', count: visaProcessingCount, color: '#84cc16' },
    { key: 'VISA_APPROVED', name: 'Visa Stamped & Ready', count: visaApprovedCount, color: '#10b981' },
    { key: 'DEPLOYED', name: 'Flight & Deployed Abroad', count: deployedCount, color: '#059669' },
  ];

  const stages: FunnelStage[] = rawStages.map((stage, idx) => {
    let conversionFromPrevious = 100;
    let dropoffRate = 0;

    if (idx > 0) {
      const prevCount = rawStages[idx - 1].count;
      if (prevCount > 0) {
        conversionFromPrevious = Math.min(100, Math.round((stage.count / prevCount) * 100));
        dropoffRate = Math.max(0, 100 - conversionFromPrevious);
      } else {
        conversionFromPrevious = stage.count > 0 ? 100 : 0;
        dropoffRate = 0;
      }
    }

    return {
      ...stage,
      conversionFromPrevious,
      dropoffRate,
    };
  });

  const overallConversionRate =
    leadsCount > 0 ? Math.round((deployedCount / leadsCount) * 100) : 0;

  const applicationToPlacementRate =
    submittedCount > 0 ? Math.round((deployedCount / submittedCount) * 100) : 0;

  return {
    stages,
    totalLeads: leadsCount,
    totalApplicants: applicantsCount,
    totalApplications: submittedCount,
    totalDeployed: deployedCount,
    overallConversionRate,
    applicationToPlacementRate,
  };
}
