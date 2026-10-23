import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  Award,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  Eye,
  HeartHandshake,
  ArrowRight,
  PhoneCall,
} from 'lucide-react';
import { BRAND } from '@/config/brand';
import { Button } from '@/components/ui/button';
import { ServicesSection } from '@/components/public/services-section';
import { TrustSection } from '@/components/public/trust-section';
import { HowItWorksSection } from '@/components/public/how-it-works-section';
import { ContactCtaSection } from '@/components/public/contact-cta-section';

export const metadata: Metadata = {
  title: 'আমাদের সম্পর্কে | শাকিল ট্রাভেলস',
  description:
    'বিদেশে কর্মসংস্থানসংক্রান্ত কাজে ৭ বছরের অভিজ্ঞতার ভিত্তিতে নেত্রকোনার চাকরিপ্রত্যাশীদের তথ্য, দিকনির্দেশনা ও বৈধ প্রক্রিয়ায় সহযোগিতা।',
};

export default function AboutUsPublicPage() {
  return (
    <div className="font-bengali bg-slate-50 min-h-screen">
      {/* 1. Page Header */}
      <section className="bg-gradient-to-br from-[#102B50] via-[#1E3A8A] to-[#0B1D35] text-white py-14 sm:py-18 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#CBDDF0_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs text-emerald-300 font-medium">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>৭ বছরের অভিজ্ঞতা ও স্থানীয় বিশ্বস্ততা</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              আমাদের সম্পর্কে
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal">
              {BRAND.positioningBn}
            </p>
          </div>
        </div>
      </section>

      {/* 2. Main Narrative Content Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-xl border border-[#CBDDF0] space-y-6">
          <div className="border-l-4 border-[#24856A] pl-4 sm:pl-6 py-1">
            <h2 className="text-xl sm:text-2xl font-bold text-[#102B50]">
              {BRAND.positioningSupportBn}
            </h2>
          </div>

          <div className="text-slate-700 text-sm sm:text-base leading-relaxed space-y-4">
            <p>
              বিদেশে কর্মসংস্থান অনেক মানুষের জীবনে নতুন সম্ভাবনা তৈরি করে। তবে সঠিক তথ্য, প্রয়োজনীয় প্রস্তুতি এবং বৈধ প্রক্রিয়া অনুসরণ করা অত্যন্ত গুরুত্বপূর্ণ।
            </p>

            <p>
              বিদেশে কর্মসংস্থানসংক্রান্ত কাজে ৭ বছরের অভিজ্ঞতার ভিত্তিতে আমরা নেত্রকোনার চাকরিপ্রত্যাশীদের প্রয়োজনীয় তথ্য, দিকনির্দেশনা এবং প্রক্রিয়াগত সহযোগিতা দিতে প্রতিশ্রুতিবদ্ধ।
            </p>

            <p>
              আমাদের লক্ষ্য হলো বিদেশে কাজ করতে আগ্রহী মানুষকে সচেতন সিদ্ধান্ত নিতে সাহায্য করা, সম্ভাব্য চাকরির সুযোগ সম্পর্কে সঠিক তথ্য দেওয়া এবং প্রতারণার ঝুঁকি সম্পর্কে সচেতন করা।
            </p>

            <p className="font-semibold text-[#102B50] bg-slate-50 p-4 rounded-xl border border-slate-200">
              আমরা বিশ্বাস করি, আস্থা তৈরি হয় সততা, স্বচ্ছতা ও দায়িত্বশীল সেবার মাধ্যমে।
            </p>
          </div>

          {/* Core Values Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F6F8FB] border border-[#CBDDF0]">
              <Award className="w-6 h-6 text-[#24856A] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-[#102B50]">৭ বছরের অভিজ্ঞতা</h3>
                <p className="text-xs text-[#66758A] mt-1">
                  বিদেশে কর্মসংস্থানসংক্রান্ত বাস্তব কাজের অভিজ্ঞতা থেকে অর্জিত সঠিক পরামর্শ।
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F6F8FB] border border-[#CBDDF0]">
              <MapPin className="w-6 h-6 text-[#102B50] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-[#102B50]">নেত্রকোনাভিত্তিক উপস্থিতি</h3>
                <p className="text-xs text-[#66758A] mt-1">
                  স্থানীয় চাকরিপ্রত্যাশীদের সহজে সরাসরি অফিসে যোগাযোগ ও পরামর্শ নেওয়ার সুবিধা।
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F6F8FB] border border-[#CBDDF0]">
              <Eye className="w-6 h-6 text-[#24856A] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-[#102B50]">স্বচ্ছতা ও সচেতনতা</h3>
                <p className="text-xs text-[#66758A] mt-1">
                  প্রতারণা প্রতিরোধে প্রার্থীদের সচেতন করা এবং বৈধ প্রক্রিয়ায় সহযোগিতা করা।
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Our Services Section */}
      <ServicesSection />

      {/* 4. Why Choose Us Section */}
      <TrustSection />

      {/* 5. How It Works Section */}
      <HowItWorksSection />

      {/* 6. Contact CTA */}
      <ContactCtaSection />
    </div>
  );
}
