import React from 'react';
import { HowItWorksSection } from '@/components/public/how-it-works-section';
import { ContactCtaSection } from '@/components/public/contact-cta-section';

export const metadata = {
  title: 'ভিসা ও ইমিগ্রেশন তথ্য (Visa & Immigration Info)',
};

export default function VisaInfoPublicPage() {
  return (
    <div className="py-8 font-bengali">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <h1 className="text-3xl font-extrabold text-slate-900">ভিসা প্রক্রিয়াকরণ ও বিএমইটি তথ্য</h1>
        <p className="text-sm text-slate-600 mt-1">
          বৈধ ওয়ার্ক পারমিট, গামকা মেডিকেল টেস্ট এবং ইমিগ্রেশন ছাড়পত্রের সম্পূর্ণ গাইড।
        </p>
      </div>
      <HowItWorksSection />
      <ContactCtaSection />
    </div>
  );
}
