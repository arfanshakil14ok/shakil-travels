import React from 'react';
import { MigrantInfoSection } from '@/components/public/migrant-info-section';
import { ContactCtaSection } from '@/components/public/contact-cta-section';

export const metadata = {
  title: 'প্রবাসী কল্যাণ ও সচেতনতা নির্দেশিকা (Migrant Guide)',
};

export default function MigrantInfoPublicPage() {
  return (
    <div className="py-8 font-bengali">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <h1 className="text-3xl font-extrabold text-slate-900">প্রবাসী কর্মী কল্যাণ ও অধিকার সংক্রান্ত তথ্য</h1>
        <p className="text-sm text-slate-600 mt-1">
          নিরাপদ অভিবাসন নিশ্চিতকরণ, আইনি সুরক্ষা এবং বৈদেশিক হেল্পলাইন সংযোগ।
        </p>
      </div>
      <MigrantInfoSection />
      <ContactCtaSection />
    </div>
  );
}
