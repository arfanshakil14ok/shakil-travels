import React from 'react';
import { CountriesSection } from '@/components/public/countries-section';
import { ContactCtaSection } from '@/components/public/contact-cta-section';

export const metadata = {
  title: 'গন্তব্য দেশসমূহ (Destination Countries)',
};

export default function CountriesPublicPage() {
  return (
    <div className="py-8 font-bengali">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <h1 className="text-3xl font-extrabold text-slate-900">গন্তব্য দেশ ও নিয়োগ সংক্রান্ত শর্তাবলী</h1>
        <p className="text-sm text-slate-600 mt-1">
          মধ্যপ্রাচ্য, এশিয়া ও উন্নত দেশগুলোতে বাংলাদেশী কর্মীদের জন্য সরকার নির্ধারিত শর্ত ও সুযোগ।
        </p>
      </div>
      <CountriesSection />
      <ContactCtaSection />
    </div>
  );
}
