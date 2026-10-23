'use client';

import React from 'react';
import {
  Award,
  MapPin,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { BRAND } from '@/config/brand';

export const TrustSection: React.FC = () => {
  const cards = [
    {
      title: '৭ বছরের অভিজ্ঞতা',
      desc: 'বিদেশে কর্মসংস্থানসংক্রান্ত কাজে অর্জিত অভিজ্ঞতার ভিত্তিতে দিকনির্দেশনা।',
      icon: <Award className="w-5 h-5 text-[#24856A]" />,
      badge: 'বাস্তব অভিজ্ঞতা',
    },
    {
      title: 'স্থানীয়ভাবে যোগাযোগ',
      desc: 'নেত্রকোনার মানুষের কাছে কর্মসংস্থানসংক্রান্ত তথ্য ও প্রাথমিক সহযোগিতা সহজলভ্য করার উদ্যোগ।',
      icon: <MapPin className="w-5 h-5 text-[#102B50]" />,
      badge: 'নেত্রকোনা অফিস',
    },
    {
      title: 'স্বচ্ছ যোগাযোগ',
      desc: 'প্রয়োজনীয় তথ্য, শর্ত এবং প্রক্রিয়া সম্পর্কে পরিষ্কার ধারণা দেওয়ার অঙ্গীকার।',
      icon: <MessageSquare className="w-5 h-5 text-[#B7791F]" />,
      badge: 'সততা ও স্বচ্ছতা',
    },
    {
      title: 'সচেতন সিদ্ধান্ত',
      desc: 'যাচাই করে সিদ্ধান্ত নেওয়া এবং বৈধ অভিবাসন প্রক্রিয়া অনুসরণের বিষয়ে গুরুত্ব।',
      icon: <ShieldCheck className="w-5 h-5 text-[#24856A]" />,
      badge: 'নিরাপদ অভিবাসন',
    },
    {
      title: 'ব্যক্তিকেন্দ্রিক দিকনির্দেশনা',
      desc: 'প্রার্থীর দক্ষতা, অভিজ্ঞতা ও প্রয়োজন অনুযায়ী উপযুক্ত তথ্য দেওয়ার চেষ্টা।',
      icon: <UserCheck className="w-5 h-5 text-[#102B50]" />,
      badge: 'যোগ্যতা মূল্যায়ন',
    },
  ];

  return (
    <section id="trust-section" className="py-16 sm:py-24 bg-white font-sans border-b border-[#E4EAF1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3 font-bengali">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#24856A] bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
            <HelpCircle className="w-4 h-4 text-[#24856A]" />
            <span>আমাদের বৈশিষ্ট্য ও অঙ্গীকার</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#172B45] tracking-tight">
            কেন আমাদের সঙ্গে যোগাযোগ করবেন?
          </h2>
          <p className="text-xs sm:text-base text-[#66758A] leading-relaxed">
            ৭ বছরের অর্জিত অভিজ্ঞতায় নেত্রকোনার চাকরিপ্রত্যাশীদের জন্য সঠিক তথ্য, দায়িত্বশীল পরামর্শ ও সচেতন বিদেশযাত্রার বিশ্বস্ত উদ্যোগ।
          </p>
        </div>

        {/* 5 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-bengali">
          {cards.map((item, idx) => (
            <Card
              key={idx}
              className="p-6 rounded-2xl border border-[#CBDDF0] bg-white hover:border-[#102B50] hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
            >
              <CardContent className="p-0 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-[#F6F8FB] border border-[#E4EAF1] flex items-center justify-center group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-[#102B50]">
                    {item.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#102B50] leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#475569] mt-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Responsible Disclaimer */}
        <div className="mt-10 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center font-bengali text-xs text-[#66758A] max-w-3xl mx-auto">
          আমরা কোনো প্রকার নিশ্চিত চাকরি বা ভিসার নিশ্চয়তা প্রদান করি না। চাকরি পাওয়া নির্ভর করে সংশ্লিষ্ট নিয়োগকর্তার শর্ত, প্রার্থীর যোগ্যতা ও সংশ্লিষ্ট দেশের আইনসম্মত প্রক্রিয়ার ওপর।
        </div>
      </div>
    </section>
  );
};
