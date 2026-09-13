import React from 'react';
import prisma from '@/lib/prisma';
import { JobsPreviewSection } from '@/components/public/jobs-preview-section';
import { ContactCtaSection } from '@/components/public/contact-cta-section';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'আন্তর্জাতিক চাকরির খবর ও নিয়োগ বিজ্ঞপ্তি | SHAKIL GLOBAL MANPOWER',
  description: 'সৌদি আরব, সংযুক্ত আরব আমিরাত, কাতার, কুয়েত, ওমান, জাপান ও ইউরোপের বিভিন্ন দেশে সরকার অনুমোদিত আন্তর্জাতিক চাকরির তালিকা।',
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
  const countrySlug = resolvedParams.country?.trim();
  const categorySlug = resolvedParams.category?.trim();

  // Query database with search parameters and strictly verified & active employers
  const jobs = await prisma.job.findMany({
    where: {
      status: 'PUBLISHED',
      employer: {
        is: {
          verificationStatus: 'VERIFIED',
          status: 'ACTIVE',
        },
      },
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
  });

  return (
    <div className="py-6 font-sans">
      <JobsPreviewSection
        jobs={jobs.map((j) => ({
          ...j,
          salaryMin: j.salaryMin ? Number(j.salaryMin) : null,
          salaryMax: j.salaryMax ? Number(j.salaryMax) : null,
        }))}
        title={query ? `অনুসন্ধানের ফলাফল: "${query}"` : 'সকল আন্তর্জাতিক নিয়োগ বিজ্ঞপ্তি'}
        subtitle={
          query
            ? `আপনার অনুসন্ধানের সাথে মিল রেখে মোট ${jobs.length} টি চাকরি পাওয়া গেছে।`
            : 'সৌদি আরব, সংযুক্ত আরব আমিরাত, কাতার, ইউরোপ ও পূর্ব এশিয়ায় সরাসরি অনুমোদিত সরকারি চাহিদা।'
        }
        showViewAll={false}
        maxDisplay={100}
      />
      <ContactCtaSection />
    </div>
  );
}
