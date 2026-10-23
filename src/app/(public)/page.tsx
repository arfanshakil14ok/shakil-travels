import React from 'react';
import prisma from '@/lib/prisma';
import { BRAND } from '@/config/brand';
import { HeroSection } from '@/components/public/hero-section';
import { VerifiedTrustStrip } from '@/components/public/verified-trust-strip';
import { HomeTrackingSection } from '@/components/public/home-tracking-section';
import { ServicesSection } from '@/components/public/services-section';
import { CountriesSection } from '@/components/public/countries-section';
import { HowItWorksSection } from '@/components/public/how-it-works-section';
import { TrustSection } from '@/components/public/trust-section';
import { JobsPreviewSection } from '@/components/public/jobs-preview-section';
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
      {/* 1. Master Prompt Homepage Hero Section */}
      <HeroSection />

      {/* 2. Brand Positioning Trust Strip (7 Years Experience & Netrokona Focus) */}
      <VerifiedTrustStrip />

      {/* 3. Interactive File & Slip Tracking Section */}
      <HomeTrackingSection />

      {/* 4. Our Services (বিদেশে চাকরির তথ্য, আবেদন সহযোগিতা, ভিসা তথ্য, দক্ষতা ও প্রশিক্ষণ, নিরাপদ অভিবাসন, বিদেশযাত্রার প্রস্তুতি) */}
      <ServicesSection />

      {/* 5. Countries and Job Categories (বিদেশে কর্মসংস্থানের সম্ভাবনা) */}
      <CountriesSection countries={countries} maxDisplay={8} />

      {/* 6. How It Works (আমাদের সঙ্গে কাজের ধাপ - ৪টি ধাপ) */}
      <HowItWorksSection />

      {/* 7. Why Choose Us (কেন আমাদের সঙ্গে যোগাযোগ করবেন? - ৫টি কারণ) */}
      <TrustSection />

      {/* 8. Available Verified Jobs Preview */}
      <JobsPreviewSection jobs={serializedJobs} maxDisplay={6} />

      {/* 9. Interactive Eligibility & Preparation Checker */}
      <EligibilityCheckerSection />

      {/* 10. Master Prompt FAQ Section (সাধারণ প্রশ্নোত্তর) */}
      <FaqSection />

      {/* 11. Contact Section (আপনার বিদেশে কর্মসংস্থানের প্রস্তুতি শুরু হোক আজই) */}
      <ContactCtaSection />
    </div>
  );
}
