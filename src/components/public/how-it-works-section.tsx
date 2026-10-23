'use client';

import React from 'react';
import Link from 'next/link';
import {
  PhoneCall,
  FileCheck2,
  SearchCheck,
  Send,
  ArrowRight,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      num: '০১',
      title: 'যোগাযোগ',
      desc: 'আপনার পছন্দের দেশ, কাজের ধরন এবং অভিজ্ঞতা সম্পর্কে জানান।',
      icon: <PhoneCall className="w-5 h-5 text-[#102B50]" />,
    },
    {
      num: '০২',
      title: 'প্রাথমিক পর্যালোচনা',
      desc: 'আপনার যোগ্যতা ও প্রয়োজনীয় কাগজপত্র সম্পর্কে আলোচনা করুন।',
      icon: <FileCheck2 className="w-5 h-5 text-[#24856A]" />,
    },
    {
      num: '০৩',
      title: 'সুযোগ যাচাই',
      desc: 'প্রাসঙ্গিক চাকরির বিজ্ঞপ্তি, নিয়োগকর্তা ও চাকরির শর্ত যাচাই করুন।',
      icon: <SearchCheck className="w-5 h-5 text-[#B7791F]" />,
    },
    {
      num: '০৪',
      title: 'আবেদন ও প্রস্তুতি',
      desc: 'প্রযোজ্য নিয়ম, অনুমোদন এবং নিয়োগপ্রক্রিয়া অনুসরণ করে পরবর্তী ধাপে এগিয়ে যান।',
      icon: <Send className="w-5 h-5 text-[#102B50]" />,
    },
  ];

  return (
    <section id="process-section" className="py-16 sm:py-20 bg-white font-sans border-b border-[#E4EAF1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3 font-bengali">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#102B50] bg-[#F6F8FB] px-3.5 py-1.5 rounded-full border border-[#E4EAF1]">
            <ShieldCheck className="w-4 h-4 text-[#24856A]" />
            <span>স্বচ্ছ ও সুশৃঙ্খল প্রক্রিয়া</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#172B45] tracking-tight">
            আমাদের সঙ্গে কাজের ধাপ
          </h2>
          <p className="text-xs sm:text-sm text-[#66758A] leading-relaxed max-w-2xl mx-auto">
            বিদেশে কর্মসংস্থানের প্রস্তুতিতে ৪টি নির্ভরযোগ্য ও স্বচ্ছ ধাপ অনুসরণ করে নিরাপদে অগ্রসর হোন।
          </p>
        </div>

        {/* 4 Connected Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative font-bengali">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className="relative p-6 rounded-2xl border border-[#CBDDF0] bg-[#F6F8FB] hover:bg-white hover:border-[#102B50] hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-300 group-hover:text-[#102B50] transition-colors font-mono">
                    {item.num}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-[#CBDDF0] flex items-center justify-center group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#172B45] leading-snug group-hover:text-[#102B50]">
                    ধাপ {item.num} — {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#475569] mt-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-[#E4EAF1] flex items-center justify-between text-[11px] text-[#66758A] font-sans">
                <span>ধাপ {item.num} / ০৪</span>
                <span className="text-[#24856A] font-semibold">ধারাবাহিক প্রস্তুতি</span>
              </div>
            </div>
          ))}
        </div>

        {/* Legal and procedural clarification note */}
        <div className="mt-10 p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-[#1E3A8A] text-xs font-bengali flex items-start gap-3 max-w-3xl mx-auto">
          <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>প্রক্রিয়াগত স্পষ্টতা:</strong> প্রকৃত নিয়োগ ও কর্মসংস্থান সংশ্লিষ্ট দেশের বৈধ অনুমোদন, যাচাইকৃত শূন্যপদ, প্রার্থীর ব্যক্তিগত যোগ্যতা, নিয়োগকর্তার শর্ত এবং প্রযোজ্য আইনি নিয়মের ওপর সম্পূর্ণভাবে নির্ভরশীল।
          </p>
        </div>
      </div>
    </section>
  );
};
