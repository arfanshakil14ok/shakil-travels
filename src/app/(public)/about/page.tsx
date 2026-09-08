import React from 'react';
import { TrustSection } from '@/components/public/trust-section';
import { HowItWorksSection } from '@/components/public/how-it-works-section';
import { ContactCtaSection } from '@/components/public/contact-cta-section';

export const metadata = {
  title: 'আমাদের সম্পর্কে (About Us)',
};

export default function AboutUsPublicPage() {
  return (
    <div className="py-8 font-bengali">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <h1 className="text-3xl font-extrabold text-slate-900">আমাদের লক্ষ্য, আদর্শ ও স্বচ্ছতা নীতি</h1>
        <p className="text-sm text-slate-600 mt-1">
          শাকিল গ্লোবাল রিক্রুটমেন্ট — আন্তর্জাতিক অভিবাসন ও বৈদেশিক জনশক্তি নিয়োগে একটি বিশ্বস্ত নাম।
        </p>
      </div>
      <TrustSection />
      <HowItWorksSection />
      <ContactCtaSection />
    </div>
  );
}
