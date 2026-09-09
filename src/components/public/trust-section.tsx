'use client';

import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Activity,
  Stamp,
  Headphones,
  Scale,
  FolderCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const TrustSection: React.FC = () => {
  const trustPoints = [
    {
      title: 'যাচাইকৃত চাকরি তথ্য',
      titleEn: 'Verified Job Information',
      desc: 'সরাসরি বিদেশী নিয়োগকর্তা ও সরকারি সংশ্লিষ্ট মন্ত্রণালয় কর্তৃক অনুমোদিত শতভাগ নির্ভরযোগ্য নিয়োগ বিজ্ঞপ্তি।',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      badge: 'BMET অনুমোদিত',
    },
    {
      title: 'স্বচ্ছ নিয়োগ প্রক্রিয়া',
      titleEn: 'Transparent Process',
      desc: 'চুক্তিপত্রের প্রতিটি শর্ত ও সরকারি ফি প্রার্থীর সম্মুখে উন্মুক্ত; কোনো প্রকার গোপন বা অতিরিক্ত ফি নেই।',
      icon: <Scale className="w-5 h-5 text-navy-800" />,
      badge: 'নো হিডেন ফি',
    },
    {
      title: 'ডকুমেন্ট ও সনদ সহায়তা',
      titleEn: 'Document Guidance',
      desc: 'পাসপোর্ট, পুলিশ ক্লিয়ারেন্স, কারিগরি সনদ ও মেডিকেল টেস্টের সঠিক প্রস্তুতিতে প্রাতিষ্ঠানিক দিকনির্দেশনা।',
      icon: <FolderCheck className="w-5 h-5 text-gold-600" />,
      badge: 'দক্ষ সহায়তা',
    },
    {
      title: 'ডিজিটাল ট্র্যাকিং সুবিধা',
      titleEn: 'Application Tracking',
      desc: 'অনলাইন পোর্টালে আপনার আবেদন, ইন্টারভিউ শিডিউল ও ভিসা ফাইল প্রসেসিংয়ের রিয়েল-টাইম অগ্রগতি ট্র্যাক করুন।',
      icon: <Activity className="w-5 h-5 text-emerald-600" />,
      badge: '২৪/৭ পোর্টাল',
    },
    {
      title: 'সঠিক ভিসা তথ্য ও গাইডলাইন',
      titleEn: 'Visa Information',
      desc: 'সংশ্লিষ্ট দেশের আইনসম্মত ক্যাটাগরি, প্রয়োজনীয় কাগজপত্র ও দূতাবাস নিয়মের নির্ভরযোগ্য হালনাগাদ তথ্য।',
      icon: <Stamp className="w-5 h-5 text-navy-800" />,
      badge: 'দূতাবাস নিয়মাবলী',
    },
    {
      title: 'প্রার্থী ও অভিবাসী কল্যাণ সাপোর্ট',
      titleEn: 'Applicant Support',
      desc: 'প্রাক-যাত্রা ব্রিফিং থেকে শুরু করে গন্তব্যে পৌঁছানো পর্যন্ত যেকোনো প্রয়োজনে সার্বক্ষণিক যোগাযোগ সহায়তা।',
      icon: <Headphones className="w-5 h-5 text-gold-600" />,
      badge: 'সার্বক্ষণিক হেল্পডেস্ক',
    },
  ];

  return (
    <section id="trust-section" className="py-16 sm:py-24 bg-white font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3 font-bengali">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>কেন আমাদের বেছে নেবেন</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            নিরাপদ আন্তর্জাতিক ক্যারিয়ারে SHAKIL GLOBAL MANPOWER
          </h2>
          <p className="text-xs sm:text-base text-slate-600 leading-relaxed">
            সরকারি অনুমোদন (RL-1892), আন্তর্জাতিক মানদণ্ড ও ডিজিটাল জবাবদিহিতায় আমরা প্রতিটি প্রার্থীর আস্থার ঠিকানা।
          </p>
        </div>

        {/* 6 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-bengali">
          {trustPoints.map((item, idx) => (
            <Card
              key={idx}
              className="p-6 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-500/30 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
            >
              <CardContent className="p-0 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {item.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {item.title}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-sans block mb-1">
                    {item.titleEn}
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
