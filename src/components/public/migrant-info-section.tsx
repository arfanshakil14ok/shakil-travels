'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  ShieldCheck,
  Banknote,
  PhoneCall,
  Plane,
  Home,
  CheckCircle2,
  ArrowRight,
  LifeBuoy,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const MigrantInfoSection: React.FC = () => {
  const topics = [
    {
      title: 'প্রাক-যাত্রা ও প্রয়োজনীয় ডকুমেন্টস',
      badge: 'যাত্রা প্রস্তুতি',
      desc: 'বিদেশে পাড়ি দেওয়ার পূর্বে সঠিক ব্রিফিং ও বৈধ কাগজপত্র সংরক্ষণ সবচেয়ে গুরুত্বপূর্ণ পদক্ষেপ।',
      points: [
        'BMET স্মার্ট কার্ড ও সরকারি ইমিগ্রেশন ছাড়পত্র',
        'GAMCA অনুমোদিত মেডিকেল ফিটনেস সার্টিফিকেট',
        'পাসপোর্ট ও ভিসার একাধিক সত্যায়িত ফটোকপি সংরক্ষণ',
      ],
      icon: <Plane className="w-5 h-5 text-emerald-400" />,
    },
    {
      title: 'কর্মী অধিকার ও চাকরি চুক্তিপত্র',
      badge: 'আইনি সুরক্ষা',
      desc: 'চুক্তির শর্তাবলী, বেতন কাঠামো ও কর্মঘণ্টা পুরোপুরি জেনে স্বাক্ষর করুন।',
      points: [
        'লিখিত চুক্তিপত্রে বেতন, আবাসন ও ছুটির সুস্পষ্ট উল্লেখ',
        'পাসপোর্ট নিজ হেফাজতে রাখার আইনগত অধিকার',
        'অসুস্থতায় জরুরি চিকিৎসাসেবা ও স্বাস্থ্য বীমা সুবিধা',
      ],
      icon: <FileText className="w-5 h-5 text-gold-400" />,
    },
    {
      title: 'আর্থিক লেনদেন ও বৈধ রেমিট্যান্স',
      badge: 'অর্থ ব্যবস্থাপনা',
      desc: 'আপনার কষ্টার্জিত অর্থ নিরাপদে দেশে পরিবারে পাঠাতে সর্বদা বৈধ ব্যাংকিং চ্যানেল ব্যবহার করুন।',
      points: [
        'হুন্ডি বা অবৈধ চ্যানেলে অর্থ পাঠানো সম্পূর্ণ নিষিদ্ধ',
        'বৈধ ব্যাংকিং চ্যানেলে অর্থ পাঠালে ২.৫% সরকারি প্রণোদনা',
        'বিদেশে যাওয়ার পূর্বে স্থানীয় ব্যাংকে এনআরবি অ্যাকাউন্ট খোলা',
      ],
      icon: <Banknote className="w-5 h-5 text-emerald-400" />,
    },
    {
      title: 'জরুরি হেল্পলাইন ও দূতাবাস সহায়তা',
      badge: '২৪/৭ সাপোর্ট',
      desc: 'যেকোনো বিপদে বা আইনগত জটিলতায় বাংলাদেশ দূতাবাস ও সরকারি হটলাইনে দ্রুত যোগাযোগ করুন।',
      points: [
        'প্রবাসী কল্যাণ হেল্পলাইন: ১৬১৩৫ (বাংলাদেশ থেকে ফ্রি)',
        'আন্তর্জাতিক হেল্পলাইন: +৮৮০ ৯৬১০ ১০২০৩০',
        'গন্তব্য দেশের বাংলাদেশ দূতাবাসের লেবার উইং নম্বর সংরক্ষণ',
      ],
      icon: <PhoneCall className="w-5 h-5 text-gold-400" />,
    },
  ];

  return (
    <section id="migrant-section" className="py-16 sm:py-24 bg-navy-950 text-white font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="max-w-3xl font-bengali">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-400 bg-navy-900 px-3.5 py-1.5 rounded-full border border-navy-800">
              <LifeBuoy className="w-3.5 h-3.5 text-gold-400" />
              <span>প্রবাসী কল্যাণ ও আইনি নির্দেশিকা</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 leading-tight tracking-tight">
              প্রবাসী কর্মীদের জন্য প্রয়োজনীয় তথ্য
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              নিরাপদ অভিবাসন, কর্মী অধিকার, আর্থিক নিরাপত্তা এবং বিদেশে জীবনযাপনের প্রয়োজনীয় সচেতনতামূলক গাইডলাইন।
            </p>
          </div>

          <Link href="/migrant-information" className="self-start md:self-auto">
            <Button
              variant="outline"
              size="sm"
              className="border-navy-700 text-slate-200 hover:bg-navy-900 font-bengali text-xs"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              সম্পূর্ণ গাইড পড়ুন
            </Button>
          </Link>
        </div>

        {/* 4-Card Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topics.map((item, idx) => (
            <Card
              key={idx}
              className="bg-navy-900/90 border-navy-800/90 text-slate-200 hover:border-navy-700 hover:shadow-xl transition-all font-bengali"
            >
              <CardContent className="p-6 sm:p-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-navy-800 border border-navy-700 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-navy-800 text-gold-400 border border-navy-700">
                    {item.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-navy-800 space-y-2">
                  {item.points.map((pt, pIdx) => (
                    <div key={pIdx} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="leading-snug">{pt}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
