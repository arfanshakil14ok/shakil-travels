import React from 'react';
import { Metadata } from 'next';
import { ContactCtaSection } from '@/components/public/contact-cta-section';
import { FaqSection } from '@/components/public/faq-section';
import { BRAND } from '@/config/brand';

export const metadata: Metadata = {
  title: 'যোগাযোগ ও অফিস ঠিকানা | শাকিল ট্রাভেলস',
  description:
    'চাকরির সুযোগ, প্রয়োজনীয় কাগজপত্র এবং বিদেশে কর্মসংস্থানসংক্রান্ত তথ্য জানতে আমাদের নেত্রকোনা অফিসে যোগাযোগ করুন। ফোন: 01913681771, 01604836148।',
};

export default function ContactPublicPage() {
  return (
    <div className="font-bengali bg-slate-50 min-h-screen">
      <div className="bg-[#102B50] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold block mb-2">
            নেত্রকোনা অফিস
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold">
            আমাদের সঙ্গে সরাসরি যোগাযোগ করুন
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-2xl">
            {BRAND.positioningSupportBn}
          </p>
        </div>
      </div>

      <ContactCtaSection />
      <FaqSection />
    </div>
  );
}
