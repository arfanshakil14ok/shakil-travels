import React from 'react';
import prisma from '@/lib/prisma';
import { HeroSection } from '@/components/public/hero-section';
import { CountriesSection } from '@/components/public/countries-section';
import { JobsPreviewSection } from '@/components/public/jobs-preview-section';
import { EligibilityCheckerSection } from '@/components/public/eligibility-checker-section';
import { HowItWorksSection } from '@/components/public/how-it-works-section';
import { VisaPreviewSection } from '@/components/public/visa-preview-section';
import { MigrantInfoSection } from '@/components/public/migrant-info-section';
import { TrustSection } from '@/components/public/trust-section';
import { ScamAwarenessSection } from '@/components/public/scam-awareness-section';
import { ContactCtaSection } from '@/components/public/contact-cta-section';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata = {
  title: 'শাকিল গ্লোবাল রিক্রুটমেন্ট | সরকারি অনুমোদিত আন্তর্জাতিক নিয়োগ ও অভিবাসন (RL-1234)',
  description: 'সৌদি আরব, আমিরাত, কাতার, কুয়েত, ওমান, সিঙ্গাপুর, মালয়েশিয়া, জাপান ও ইউরোপে বৈধ কর্মসংস্থান, ভিসা তথ্য ও নিরাপদ অভিবাসন সেবা।',
};

export default async function PublicHomePage() {
  // Fetch real published jobs
  const jobs = await prisma.job.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      country: {
        select: { id: true, name: true, code: true, flag: true, slug: true },
      },
      jobCategory: {
        select: { id: true, name: true, slug: true },
      },
      employer: {
        select: { companyName: true },
      },
    },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    take: 6,
  });

  // Fetch real destination countries with published jobs count
  const countries = await prisma.country.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          jobs: {
            where: { status: 'PUBLISHED' },
          },
        },
      },
    },
    orderBy: [{ featured: 'desc' }, { displayOrder: 'asc' }, { name: 'asc' }],
  });

  // Fetch active visa information
  const visaList = await prisma.visaInformation.findMany({
    where: { isActive: true },
    include: {
      country: {
        select: { id: true, name: true, code: true, slug: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  // Serialize decimals for client components
  const serializedJobs = jobs.map((job) => ({
    ...job,
    salaryMin: job.salaryMin ? Number(job.salaryMin) : null,
    salaryMax: job.salaryMax ? Number(job.salaryMax) : null,
  }));

  return (
    <div className="space-y-0">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Destination Countries (Real DB Data) */}
      <CountriesSection countries={countries} maxDisplay={12} />

      {/* 3. Latest Published Jobs (Real DB Data) */}
      <JobsPreviewSection jobs={serializedJobs} maxDisplay={6} />

      {/* 4. Interactive Eligibility Checker */}
      <EligibilityCheckerSection />

      {/* 5. 8-Step Recruitment Process */}
      <HowItWorksSection />

      {/* 6. Visa & Work Permit Guidelines */}
      <VisaPreviewSection visaList={visaList} maxDisplay={3} />

      {/* 7. Migrant Worker Essential Information */}
      <MigrantInfoSection />

      {/* 8. Trust & Why Choose Us */}
      <TrustSection />

      {/* 9. Recruitment Fraud & Scam Awareness */}
      <ScamAwarenessSection />

      {/* 10. Call to Action & Direct Consultation */}
      <ContactCtaSection />
    </div>
  );
}
