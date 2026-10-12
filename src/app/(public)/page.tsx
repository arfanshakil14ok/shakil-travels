import React from 'react';
import prisma from '@/lib/prisma';
import { BRAND } from '@/config/brand';
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
import { FALLBACK_COUNTRIES, FALLBACK_JOBS } from '@/lib/homepage-fallback';

import { VerifiedTrustStrip } from '@/components/public/verified-trust-strip';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata = {
  title: `${BRAND.name} | সরকারি অনুমোদিত আন্তর্জাতিক নিয়োগ ও অভিবাসন (${BRAND.licenseNumber})`,
  description: 'সৌদি আরব, আমিরাত, কাতার, কুয়েত, ওমান, সিঙ্গাপুর, মালয়েশিয়া, জাপান ও ইউরোপে বৈধ কর্মসংস্থান, ভিসা তথ্য ও নিরাপদ অভিবাসন সেবা।',
};

export default async function PublicHomePage() {
  let jobs: any[] = [];
  let countries: any[] = [];
  let visaList: any[] = [];

  try {
    // Fetch real published jobs
    jobs = await prisma.job.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        country: {
          select: { id: true, name: true, code: true, flag: true, slug: true },
        },
        jobCategory: {
          select: { id: true, name: true, slug: true },
        },
        employer: {
          select: { companyName: true, verificationStatus: true },
        },
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take: 6,
    });

    // Fetch real destination countries with published jobs count
    countries = await prisma.country.findMany({
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
    visaList = await prisma.visaInformation.findMany({
      where: { isActive: true },
      include: {
        country: {
          select: { id: true, name: true, code: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
  } catch (err) {
    console.error('Homepage database fetch warning:', err);
  }

  // Gracefully fallback to high-quality default data if DB is empty or during cold start
  if (!countries || countries.length === 0) {
    countries = FALLBACK_COUNTRIES;
  }

  // Serialize decimals for client components
  let serializedJobs = jobs.map((job) => ({
    ...job,
    salaryMin: job.salaryMin ? Number(job.salaryMin) : null,
    salaryMax: job.salaryMax ? Number(job.salaryMax) : null,
  }));

  if (!serializedJobs || serializedJobs.length === 0) {
    serializedJobs = FALLBACK_JOBS as any;
  }

  return (
    <div className="space-y-0">
      {/* 1 & 2. Professional Hero Section with Primary & Secondary CTAs */}
      <HeroSection />

      {/* 3. Small, Verified Trust-Information Section */}
      <VerifiedTrustStrip />

      {/* 4. Selected Featured Job Opportunities */}
      <JobsPreviewSection jobs={serializedJobs} maxDisplay={6} />

      {/* 5. Country and Category Exploration */}
      <CountriesSection countries={countries} maxDisplay={12} />

      {/* 6. Recruitment Process: Apply → Profile Review → Interview → Visa Processing → Pre-departure */}
      <HowItWorksSection />

      {/* 7. Interactive Eligibility Checker */}
      <EligibilityCheckerSection />

      {/* 8. Candidate Support and Training Information */}
      <MigrantInfoSection />
      <VisaPreviewSection visaList={visaList} maxDisplay={3} />

      {/* 9. Trust & Fraud Awareness */}
      <TrustSection />
      <ScamAwarenessSection />

      {/* 10. Clear Contact & Consultation Section */}
      <ContactCtaSection />
    </div>
  );
}
