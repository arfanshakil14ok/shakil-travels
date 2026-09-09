import React from 'react';
import prisma from '@/lib/prisma';
import { CountriesSection } from '@/components/public/countries-section';
import { ContactCtaSection } from '@/components/public/contact-cta-section';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'গন্তব্য দেশসমূহ ও ভিসা নীতিমালা | Shakil Global Recruitment',
  description: 'সৌদি আরব, আমিরাত, কাতার, কুয়েত, ওমান, সিঙ্গাপুর, মালয়েশিয়া, জাপান, পর্তুগাল, পোল্যান্ড ও অন্যান্য দেশে অভিবাসন শর্তাবলী।',
};

export default async function CountriesPublicPage() {
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

  return (
    <div className="py-6 font-sans">
      <CountriesSection
        countries={countries}
        title="গন্তব্য দেশ ও নিয়োগ সংক্রান্ত শর্তাবলী"
        subtitle="মধ্যপ্রাচ্য, এশিয়া ও ইউরোপীয় ইউনিয়নের দেশগুলোতে বাংলাদেশী কর্মীদের জন্য সরকার নির্ধারিত শর্ত, সুযোগ ও চলমান ডিমান্ড।"
        showViewAll={false}
        maxDisplay={50}
      />
      <ContactCtaSection />
    </div>
  );
}
