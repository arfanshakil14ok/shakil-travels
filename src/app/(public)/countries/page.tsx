import React from 'react';
import prisma from '@/lib/prisma';
import { CountriesSection } from '@/components/public/countries-section';
import { ContactCtaSection } from '@/components/public/contact-cta-section';
import { FALLBACK_COUNTRIES } from '@/lib/homepage-fallback';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'বিদেশে কর্মসংস্থানের সম্ভাবনা ও দেশ নির্দেশিকা | শাকিল ট্রাভেলস',
  description: 'বিভিন্ন দেশের কর্মসংস্থানসংক্রান্ত সুযোগ সম্পর্কে জানুন এবং আপনার যোগ্যতা ও অভিজ্ঞতা অনুযায়ী প্রস্তুতি নিন। নেত্রকোনায় ৭ বছরের অভিজ্ঞতায় সঠিক দিকনির্দেশনা।',
};

export default async function CountriesPublicPage() {
  let countries: any[] = [];
  try {
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
    console.error('Countries page DB fetch warning:', err);
  }

  if (!countries || countries.length === 0) {
    countries = FALLBACK_COUNTRIES;
  }

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
