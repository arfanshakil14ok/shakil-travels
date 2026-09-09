'use client';

import React from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Search,
  Send,
  FileCheck2,
  Users,
  Award,
  Stamp,
  PlaneTakeoff,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Profile তৈরি',
      desc: 'অনলাইন পোর্টালে মৌলিক তথ্য ও যোগাযোগের বিবরণ দিয়ে প্রার্থী অ্যাকাউন্ট খুলুন।',
      icon: <UserCheck className="w-5 h-5 text-emerald-600" />,
    },
    {
      num: '02',
      title: 'চাকরি নির্বাচন',
      desc: 'আপনার শিক্ষাগত ও কারিগরি দক্ষতার সাথে মানানসই কাঙ্ক্ষিত দেশের পদ নির্বাচন করুন।',
      icon: <Search className="w-5 h-5 text-navy-800" />,
    },
    {
      num: '03',
      title: 'আবেদন',
      desc: 'নির্দিষ্ট পদের বিপরীতে প্রয়োজনীয় তথ্য পূরণ করে এক ক্লিকে আবেদন জমা দিন।',
      icon: <Send className="w-5 h-5 text-gold-600" />,
    },
    {
      num: '04',
      title: 'ডকুমেন্ট যাচাই',
      desc: 'পাসপোর্ট, পুলিশ ক্লিয়ারেন্স, অভিজ্ঞতা সনদ ও মেডিকেল ফিটনেস অফিসিয়ালি যাচাই।',
      icon: <FileCheck2 className="w-5 h-5 text-emerald-600" />,
    },
    {
      num: '05',
      title: 'ইন্টারভিউ',
      desc: 'বিদেশি নিয়োগকর্তা বা কোম্পানির প্রতিনিধির সাথে সরাসরি বা ভার্চুয়াল ইন্টারভিউ।',
      icon: <Users className="w-5 h-5 text-navy-800" />,
    },
    {
      num: '06',
      title: 'সিলেকশন',
      desc: 'কৃতকার্য প্রার্থীদের অফার লেটার ও আনুষ্ঠানিক কর্মসংস্থান চুক্তিপত্র সম্পাদন।',
      icon: <Award className="w-5 h-5 text-gold-600" />,
    },
    {
      num: '07',
      title: 'ভিসা প্রসেসিং',
      desc: 'দূতাবাস ভিসা স্ট্যাম্পিং, সরকারি প্রবাসী কল্যাণ রেজিস্ট্রেশন ও BMET ছাড়পত্র।',
      icon: <Stamp className="w-5 h-5 text-emerald-600" />,
    },
    {
      num: '08',
      title: 'ডিপার্চার',
      desc: 'প্রাক-যাত্রা ওরিয়েন্টেশন ব্রিফিং, এয়ার টিকিট ও গন্তব্যে নিরাপদ বিমান যাত্রা।',
      icon: <PlaneTakeoff className="w-5 h-5 text-navy-800" />,
    },
  ];

  return (
    <section id="process-section" className="py-16 sm:py-24 bg-white font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3 font-bengali">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>স্বচ্ছ ও নিরাপদ অভিবাসন প্রক্রিয়া</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            ৮ ধাপে সরকারি নিয়মে বৈধ কর্মসংস্থান যাত্রা
          </h2>
          <p className="text-xs sm:text-base text-slate-600 leading-relaxed">
            কোনো প্রকার লুকানো ফি বা অননুমোদিত দালাল ছাড়াই ডিজিটাল পোর্টালে স্বচ্ছ আবেদন ও ট্র্যাকিং সুবিধা।
          </p>
        </div>

        {/* 8 Connected Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className="relative p-6 rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:bg-white hover:border-emerald-500/30 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group font-bengali"
            >
              {/* Step Number & Icon Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-slate-300 group-hover:text-emerald-600 transition-colors font-mono">
                    {item.num}
                  </span>
                  <div className="w-11 h-11 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>

              {/* Progress Indicator line */}
              <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400 font-sans">
                <span>Step {item.num} of 08</span>
                <span className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-emerald-500 transition-colors" />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Card */}
        <div className="mt-12 bg-navy-950 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 font-bengali">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold text-white">
              আপনার যোগ্যতা অনুযায়ী সঠিক দেশ ও চাকরি বাছাই করতে চান?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              আমাদের অফিসিয়াল পোর্টালে বিনামূল্যে প্রোফাইল খুলে এখনই আবেদন শুরু করুন।
            </p>
          </div>
          <Link href="/portal/register" className="flex-shrink-0">
            <Button
              variant="gold"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="font-bold text-xs sm:text-sm px-6 py-3"
            >
              প্রোফাইল তৈরি করুন
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
