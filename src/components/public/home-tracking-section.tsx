'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileSearch,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plane,
  FileCheck2,
  Lock,
  Headphones,
} from 'lucide-react';
import { FileTrackingWidget } from './file-tracking-widget';
import { BRAND } from '@/config/brand';

export const HomeTrackingSection: React.FC = () => {
  return (
    <section id="file-tracking" className="py-14 sm:py-20 bg-gradient-to-b from-white via-[#F6F8FB] to-[#EDF3FA] border-t border-[#CBDDF0] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Heading, Context & Transparency */}
          <div className="lg:col-span-6 space-y-4 font-bengali">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#24856A]">
              <FileSearch className="w-4 h-4 text-[#24856A]" />
              <span>রিয়েল-টাইম রিক্রুটমেন্ট ট্র্যাকিং</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#102B50] tracking-tight leading-snug">
              আপনার ফাইল ও ভিসা আবেদনের <br />
              <span className="text-[#24856A]">সর্বশেষ স্ট্যাটাস অনলাইনে জানুন</span>
            </h2>

            <p className="text-xs sm:text-sm text-[#66758A] leading-relaxed">
              সেন্ট্রাল ডাটাবেসের মাধ্যমে আপনার ফাইল নম্বর বা পাসপোর্ট নম্বর দিয়ে যেকোনো সময় আপনার নিয়োগ, সাক্ষাৎকার, মেডিকেল, ভিসা স্ট্যাম্পিং ও ফ্লাইট প্রস্তুতির সঠিক তথ্য জানুন।
            </p>

            {/* Micro Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-[#CBDDF0] shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-[#24856A] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-[#102B50]">শতভাগ গোপনীয়তা</div>
                  <div className="text-[11px] text-[#66758A]">ব্যক্তিগত তথ্যের সর্বোচ্চ এনক্রিপশন</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-[#CBDDF0] shadow-2xs">
                <Clock className="w-4 h-4 text-[#102B50] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-[#102B50]">২৪/৭ লাইভ আপডেট</div>
                  <div className="text-[11px] text-[#66758A]">যেকোনো ডিভাইসে তাৎক্ষণিক ফলাফল</div>
                </div>
              </div>
            </div>

            {/* Helpline contact */}
            <div className="pt-2 flex items-center gap-2 text-xs text-[#66758A]">
              <Headphones className="w-4 h-4 text-[#102B50]" />
              <span>সহায়তার জন্য কল করুন:</span>
              <a href={BRAND.phoneTel} className="font-bold text-[#102B50] hover:underline font-mono">
                {BRAND.phoneDisplay}
              </a>
            </div>
          </div>

          {/* Right Column: Tracking Search Desk */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-2xl border border-[#CBDDF0] p-6 sm:p-8 shadow-xl shadow-[#102B50]/[0.06]">
              <div className="border-b border-[#E4EAF1] pb-3 mb-5 font-bengali">
                <h3 className="text-base font-bold text-[#102B50] flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-[#24856A]" />
                  অনলাইন ফাইল সার্চ ডেস্ক
                </h3>
                <p className="text-xs text-[#66758A] mt-0.5">
                  আবেদন স্লিপ বা পাসপোর্টের নম্বরটি নিচে প্রবেশ করান
                </p>
              </div>

              <FileTrackingWidget variant="hero" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
