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
      title: 'Apply (আবেদন)',
      desc: 'পছন্দের সার্কুলার বাছাই করে ক্যাটাগরি অনুযায়ী ধাপে ধাপে প্রোফাইল তথ্য ও প্রয়োজনীয় ডকুমেন্ট আপলোড করুন।',
      icon: <Send className="w-5 h-5 text-[#102B50]" />,
    },
    {
      num: '02',
      title: 'Profile Review (প্রোফাইল যাচাই)',
      desc: 'আমাদের অভিজ্ঞ স্ক্রিনিং টিম প্রার্থীর শিক্ষাগত যোগ্যতা, পাসপোর্ট ও অভিজ্ঞতার সনদ পুঙ্খানুপুঙ্খ যাচাই করে।',
      icon: <FileCheck2 className="w-5 h-5 text-[#102B50]" />,
    },
    {
      num: '03',
      title: 'Interview (ইন্টারভিউ ও নির্বাচন)',
      desc: 'বিদেশি নিয়োগকর্তা বা প্রতিনিধির সাথে সরাসরি অথবা অনলাইন টেকনিক্যাল ইন্টারভিউ ও প্রাথমিক সিলেকশন।',
      icon: <Users className="w-5 h-5 text-[#102B50]" />,
    },
    {
      num: '04',
      title: 'Visa Processing (ভিসা প্রসেসিং)',
      desc: 'সরকারি নিয়মানুযায়ী দূতাবাস ভিসা স্ট্যাম্পিং, অনুমোদিত মেডিকেল টেস্ট এবং BMET স্মার্ট কার্ড ছাড়পত্র গ্রহণ।',
      icon: <Stamp className="w-5 h-5 text-[#102B50]" />,
    },
    {
      num: '05',
      title: 'Pre-departure (প্রাক-যাত্রা ও ব্রিফিং)',
      desc: 'যাত্রার পূর্বে বিশেষ ওরিয়েন্টেশন ব্রিফিং, এয়ার টিকিট ও গন্তব্য দেশে নিরাপদে কর্মসংস্থান যাত্রা।',
      icon: <PlaneTakeoff className="w-5 h-5 text-[#102B50]" />,
    },
  ];

  return (
    <section id="process-section" className="py-16 sm:py-20 bg-white font-sans border-b border-[#E4EAF1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3 font-bengali">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#102B50] bg-[#F6F8FB] px-3.5 py-1.5 rounded-full border border-[#E4EAF1]">
            <ShieldCheck className="w-4 h-4 text-[#24856A]" />
            <span>স্বচ্ছ ও নিরাপদ অভিবাসন প্রক্রিয়া</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#172B45] tracking-tight">
            ৫ ধাপে সরকারি নিয়মে নিরাপদ বৈদেশিক নিয়োগ
          </h2>
          <p className="text-xs sm:text-sm text-[#66758A] leading-relaxed max-w-2xl mx-auto">
            কোনো প্রকার লুকানো ফি বা মধ্যস্বত্বভোগী ছাড়া ডিজিটাল পোর্টালে স্বচ্ছ আবেদন, যাচাই ও রিয়েল-টাইম অগ্রগতি পর্যবেক্ষণ।
          </p>
        </div>

        {/* 5 Connected Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5 relative">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className="relative p-5 rounded-xl border border-[#E4EAF1] bg-[#F6F8FB] hover:bg-white hover:border-[#102B50] hover:shadow-md transition-all duration-300 flex flex-col justify-between group font-bengali"
            >
              {/* Step Number & Icon Header */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-300 group-hover:text-[#102B50] transition-colors font-mono">
                    {item.num}
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-white shadow-2xs border border-[#E4EAF1] flex items-center justify-center group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#172B45] leading-snug group-hover:text-[#102B50]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#66758A] mt-2 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              </div>

              {/* Progress Indicator line */}
              <div className="mt-4 pt-3 border-t border-[#E4EAF1] flex items-center justify-between text-[11px] text-[#66758A] font-sans">
                <span>Step {item.num} of 05</span>
                <span className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-[#102B50] transition-colors" />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Card */}
        <div className="mt-12 bg-[#0B1D35] text-white rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 font-bengali border border-white/10">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold text-white">
              আপনার যোগ্যতা অনুযায়ী সঠিক দেশ ও পেশা বাছাই করতে চান?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              আমাদের অফিসিয়াল রিক্রুটমেন্ট পোর্টালে নিখরচায় প্রোফাইল সম্পন্ন করে সরাসরি আবেদন করুন।
            </p>
          </div>
          <Link href="/portal/register" className="flex-shrink-0">
            <Button
              variant="primary"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4 text-[#102B50]" />}
              className="font-bold text-xs sm:text-sm px-6 py-2.5 bg-[#E8A2C1] hover:bg-[#D987AC] text-[#102B50] shadow-sm"
            >
              প্রার্থী নিবন্ধন করুন
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
