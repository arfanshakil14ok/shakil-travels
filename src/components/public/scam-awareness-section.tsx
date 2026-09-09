'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  ExternalLink,
  ArrowRight,
  XCircle,
  FileCheck2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const ScamAwarenessSection: React.FC = () => {
  const warnings = [
    {
      title: 'ব্যক্তিগত নম্বরে বা দালালকে নগদ অর্থ প্রদান নিষেধ',
      desc: 'কোনো বিকাশ, নগদ বা ব্যক্তিগত অ্যাকাউন্টে অর্থ পাঠাবেন না। সকল লেনদেন কেবল অফিসের অনুমোদিত ব্যাংক অ্যাকাউন্টে এবং অফিশিয়াল মানি রিসিট গ্রহণপূর্বক সম্পন্ন করুন।',
    },
    {
      title: 'অবাস্তব উচ্চ বেতন ও বিনা দক্ষতায় চাকরির প্রস্তাব',
      desc: 'কোনো পরীক্ষা বা ইন্টারভিউ ছাড়াই অস্বাভাবিক উচ্চ বেতন (যেমন ২-৩ লাখ টাকা) প্রস্তাবকারী চক্র থেকে সাবধান থাকুন। এগুলো সুপরিচিত প্রতারণার লক্ষণ।',
    },
    {
      title: 'ভিসিট বা ট্যুরিস্ট ভিসায় কাজের প্রলোভন সম্পূর্ণ অবৈধ',
      desc: 'ট্যুরিস্ট ভিসায় গিয়ে পরে কাজের ভিসায় রূপান্তরের দাবি আইনবিরোধী। বৈধ এমপ্লয়মেন্ট ভিসা ও BMET স্মার্ট কার্ড ব্যতীত বিদেশে গমন করলে গ্রেপ্তার ও নির্বাসনের ঝুঁকি থাকে।',
    },
    {
      title: 'মূল পাসপোর্ট দালালদের হাতে জিম্মি না রাখা',
      desc: 'চাকরি দেওয়ার নামে পাসপোর্ট আটকে রেখে অর্থ দাবি করা আইনত দণ্ডনীয় অপরাধ। কেবল অফিসিয়াল স্লিপ বা চুক্তির বিপরীতে বৈধ এজেন্সিতে ডকুমেন্ট জমা দিন।',
    },
  ];

  const safetyChecklist = [
    'এজেন্সির সরকারি রিক্রুটিং লাইসেন্স (RL-1892) BMET ওয়েবসাইটে যাচাই করুন',
    'চাকরির চাহিদা ও কাজের শর্তাবলী আমি প্রবাসী / BMET পোর্টালে মিলিয়ে নিন',
    'দূতাবাস থেকে ইস্যুকৃত মূল ভিসা কপি অফিশিয়াল পোর্টাল (যেমন KSA Qiwa/Enjaz) থেকে যাচাই করুন',
    'প্রতিটি কিস্তির বিপরীতে সিল ও তারিখযুক্ত অফিশিয়াল মানি রিসিট সংগ্রহ করুন',
  ];

  return (
    <section id="scam-awareness" className="py-16 sm:py-24 bg-rose-50/40 border-y border-rose-100 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3 font-bengali">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-100 px-3.5 py-1.5 rounded-full border border-rose-200">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>সচেতনতা ও গণবিজ্ঞপ্তি</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            বিদেশে চাকরি নিয়ে প্রতারণা থেকে সতর্ক থাকুন
          </h2>

          <p className="text-xs sm:text-base text-slate-600 leading-relaxed">
            অননুমোদিত মধ্যস্বত্বভোগী বা ভুয়া ভিসা চক্র পরিহার করে শতভাগ স্বচ্ছ ও সরকারি নিয়মে বিদেশে নিজের ভবিষ্যৎ নিশ্চিত করুন।
          </p>
        </div>

        {/* 2-Column Warning & Safeguard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Warning Signs */}
          <div className="lg:col-span-7 space-y-4 font-bengali">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              প্রতারণার প্রধান লক্ষণসমূহ চিহ্নিত করুন
            </h3>

            <div className="space-y-3">
              {warnings.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white border border-rose-100 shadow-xs flex items-start gap-3.5"
                >
                  <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Safe Verification Checklist & Helpline */}
          <div className="lg:col-span-5 space-y-6 font-bengali">
            {/* Safe Verification Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-emerald-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                নিরাপদ অভিবাসনের ৪টি গোল্ডেন রুল
              </h3>

              <div className="space-y-2.5">
                {safetyChecklist.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-medium">{rule}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100">
                <Link href="/scam-awareness" className="block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-semibold border-slate-200 text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 flex items-center justify-center gap-1.5"
                  >
                    সম্পূর্ণ প্রতারণা প্রতিরোধ গাইড দেখুন
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Official Helpline Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <PhoneCall className="w-4 h-4" />
                <span>সরকারি জরুরি রিপোর্ট হেল্পলাইন</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                কোনো দালাল বা প্রতারকের সন্ধান পেলে সাথে সাথে প্রবাসী কল্যাণ মন্ত্রণালয় ও BMET হেল্পলাইনে অভিযোগ জানান:
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 font-mono text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">বাংলাদেশ টোল-ফ্রি:</span>
                  <strong className="text-white text-base">১৬১৩৫</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">আন্তর্জাতিক কল:</span>
                  <strong className="text-white text-sm">+৮৮০ ৯৬১০ ১০২০৩০</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
