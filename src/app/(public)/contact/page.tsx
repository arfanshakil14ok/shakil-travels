import React from 'react';
import { ContactCtaSection } from '@/components/public/contact-cta-section';

export const metadata = {
  title: 'যোগাযোগ ও অফিস ঠিকানা (Contact Us)',
};

export default function ContactPublicPage() {
  return (
    <div className="py-8 font-bengali">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <h1 className="text-3xl font-extrabold text-slate-900">আমাদের সাথে সরাসরি যোগাযোগ করুন</h1>
        <p className="text-sm text-slate-600 mt-1">
          উত্তরা প্রধান কার্যালয় ভিজিট করুন অথবা ফোনে ও অনলাইনে পরামর্শ নিন।
        </p>
      </div>
      <ContactCtaSection />
    </div>
  );
}
