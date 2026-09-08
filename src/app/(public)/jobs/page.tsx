import React from 'react';
import { JobsPreviewSection } from '@/components/public/jobs-preview-section';
import { ContactCtaSection } from '@/components/public/contact-cta-section';

export const metadata = {
  title: 'আন্তর্জাতিক চাকরির খবর (Overseas Jobs)',
};

export default function JobsPublicPage() {
  return (
    <div className="py-8 font-bengali">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <h1 className="text-3xl font-extrabold text-slate-900">আন্তর্জাতিক চাকরির খবর ও নিয়োগ বিজ্ঞপ্তি</h1>
        <p className="text-sm text-slate-600 mt-1">
          অনুমোদিত বৈদেশিক কোম্পানিতে সরাসরি নিয়োগ ও সাক্ষাতকারের তালিকা।
        </p>
      </div>
      <JobsPreviewSection />
      <ContactCtaSection />
    </div>
  );
}
