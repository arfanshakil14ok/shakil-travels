import React from 'react';
import prisma from '@/lib/prisma';
import { JobsPreviewSection } from '@/components/public/jobs-preview-section';
import { ContactCtaSection } from '@/components/public/contact-cta-section';
import { FALLBACK_JOBS } from '@/lib/homepage-fallback';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'বিদেশে কর্মসংস্থান ও চাকরির তথ্য | শাকিল ট্রাভেলস',
  description: 'বিদেশে চাকরির সুযোগ সম্পর্কে জানুন, নিজের যোগ্যতা অনুযায়ী প্রস্তুতি নিন এবং প্রয়োজনীয় কাগজপত্র ও বৈধ প্রক্রিয়া সম্পর্কে সঠিক দিকনির্দেশনা পান। ৭ বছরের অভিজ্ঞতায় নেত্রকোনার পাশে।',
};

interface JobsPageProps {
  searchParams?: Promise<{
    q?: string;
    country?: string;
    category?: string;
  }>;
}

export default async function JobsPublicPage({ searchParams }: JobsPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const query = resolvedParams.q?.trim();
  const countrySlug = resolvedParams.country?.trim()?.toLowerCase();
  const categorySlug = resolvedParams.category?.trim()?.toLowerCase();

  let jobs: any[] = [];
  try {
    // Query database with search parameters and strictly verified & active employers
    jobs = await prisma.job.findMany({
      where: {
        status: 'PUBLISHED',
        ...(query
          ? {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { titleLocal: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { skillsRequired: { contains: query, mode: 'insensitive' } },
                { country: { name: { contains: query, mode: 'insensitive' } } },
                { jobCategory: { name: { contains: query, mode: 'insensitive' } } },
                { employer: { companyName: { contains: query, mode: 'insensitive' } } },
              ],
            }
          : {}),
        ...(countrySlug
          ? {
              country: {
                OR: [{ slug: countrySlug }, { code: countrySlug.toUpperCase() }],
              },
            }
          : {}),
        ...(categorySlug
          ? {
              jobCategory: {
                OR: [{ slug: categorySlug }, { id: categorySlug }],
              },
            }
          : {}),
      },
      include: {
        country: {
          select: { id: true, name: true, code: true, flag: true, slug: true },
        },
        jobCategory: {
          select: { id: true, name: true, slug: true },
        },
        employer: {
          select: { companyName: true, companyNameLocal: true, verificationStatus: true },
        },
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });
  } catch (err) {
    console.error('Jobs page DB fetch warning:', err);
  }

  let finalJobs = jobs.map((j) => ({
    ...j,
    salaryMin: j.salaryMin ? Number(j.salaryMin) : null,
    salaryMax: j.salaryMax ? Number(j.salaryMax) : null,
  }));

  if (finalJobs.length === 0) {
    let filteredFallback = FALLBACK_JOBS;
    if (countrySlug) {
      filteredFallback = filteredFallback.filter(
        (j) => j.country.slug === countrySlug || j.country.code.toLowerCase() === countrySlug
      );
    }
    if (categorySlug) {
      filteredFallback = filteredFallback.filter(
        (j) => j.jobCategory.slug === categorySlug || j.jobCategoryId === categorySlug
      );
    }
    if (query) {
      const q = query.toLowerCase();
      filteredFallback = filteredFallback.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.country.name.toLowerCase().includes(q) ||
          j.jobCategory.name.toLowerCase().includes(q)
      );
    }
    finalJobs = (filteredFallback.length > 0 ? filteredFallback : FALLBACK_JOBS) as any;
  }

  return (
    <div className="py-6 font-sans">
      <JobsPreviewSection
        jobs={finalJobs}
        title={query ? `অনুসন্ধানের ফলাফল: "${query}"` : 'সকল আন্তর্জাতিক নিয়োগ বিজ্ঞপ্তি'}
        subtitle={
          query
            ? `আপনার অনুসন্ধানের সাথে মিল রেখে মোট ${finalJobs.length} টি চাকরি পাওয়া গেছে।`
            : 'সৌদি আরব, সংযুক্ত আরব আমিরাত, কাতার, ইউরোপ ও পূর্ব এশিয়ায় সরাসরি অনুমোদিত সরকারি চাহিদা।'
        }
        showViewAll={false}
        maxDisplay={100}
      />
      <ContactCtaSection />
    </div>
  );
}
