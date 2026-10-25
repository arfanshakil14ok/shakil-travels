import React from 'react';
import prisma from '@/lib/prisma';
import { BRAND } from '@/config/brand';
import { HeroSection } from '@/components/public/hero-section';
import { VerifiedTrustStrip } from '@/components/public/verified-trust-strip';
import { JobsPreviewSection } from '@/components/public/jobs-preview-section';
import { CountriesSection } from '@/components/public/countries-section';
import { ServicesSection } from '@/components/public/services-section';
import { TrustSection } from '@/components/public/trust-section';
import { HowItWorksSection } from '@/components/public/how-it-works-section';
import { HomeTrackingSection } from '@/components/public/home-tracking-section';
import { EligibilityCheckerSection } from '@/components/public/eligibility-checker-section';
import { FaqSection } from '@/components/public/faq-section';
import { ContactCtaSection } from '@/components/public/contact-cta-section';
import { FALLBACK_COUNTRIES, FALLBACK_JOBS } from '@/lib/homepage-fallback';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata = {
  title: BRAND.seo.defaultTitle,
  description: BRAND.seo.descriptionBn,
  keywords: BRAND.seo.keywords,
  openGraph: {
    title: BRAND.seo.defaultTitle,
    description: BRAND.seo.descriptionBn,
    type: 'website',
    locale: 'bn_BD',
    siteName: BRAND.name,
  },
};

export default async function PublicHomePage() {
  let jobs: any[] = [];
  let countries: any[] = [];

  try {
    // Fetch published jobs
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

    // Fetch destination countries
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
  } catch (err) {
    console.error('Homepage database fetch warning:', err);
  }

  // Fallback data
  if (!countries || countries.length === 0) {
    countries = FALLBACK_COUNTRIES;
  }

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
      {/* 1. Hero Section (এনিমেটেড লাইভ টেক্সটসহ) */}
      <HeroSection />

      {/* Trust Strip */}
      <VerifiedTrustStrip />

      {/* 2. জব সেকশন (হিরো সেকশন এর নিচে থাকবে জব সেকশন) */}
      <JobsPreviewSection jobs={serializedJobs} maxDisplay={6} />

      {/* 3. গন্তব্য দেশ সমূহ (জব সেকশনের নিচে থাকবে গন্তব্য দেশ সমূহ) */}
      <CountriesSection countries={countries} maxDisplay={8} />

      {/* 4. আমাদের সেবাসমূহ ও আমাদের সম্পর্কে */}
      <ServicesSection />
      <TrustSection />
      <HowItWorksSection />

      {/* 5. ফাইল ট্র্যাকিং ও যোগ্যতা অনুসন্ধান */}
      <HomeTrackingSection />
      <EligibilityCheckerSection />

      {/* 6. প্রশ্ন উত্তর (FAQ) */}
      <FaqSection />

      {/* 7. যোগাযোগ ইত্যাদি (Contact CTA) */}
      <ContactCtaSection />
    </div>
  );
}
