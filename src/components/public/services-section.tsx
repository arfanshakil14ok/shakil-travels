'use client';

import React from 'react';
import Link from 'next/link';
import {
  Globe2,
  FileText,
  Stamp,
  GraduationCap,
  ShieldCheck,
  PlaneTakeoff,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const ServicesSection: React.FC = () => {
  const services = [
    {
      icon: <Globe2 className="w-6 h-6 text-[#102B50]" />,
      title: 'বিদেশে চাকরির তথ্য',
      description:
        'বিভিন্ন দেশের চাকরির সুযোগ, পদের ধরন, যোগ্যতা এবং আবেদনপ্রক্রিয়া সম্পর্কে তথ্য।',
      badge: 'তথ্য ও সুযোগ',
    },
    {
      icon: <FileText className="w-6 h-6 text-[#24856A]" />,
      title: 'চাকরির আবেদনসংক্রান্ত সহযোগিতা',
      description:
        'প্রযোজ্য ক্ষেত্রে চাকরির আবেদন, জীবনবৃত্তান্ত এবং প্রয়োজনীয় কাগজপত্র প্রস্তুতির বিষয়ে দিকনির্দেশনা।',
      badge: 'আবেদন প্রস্তুতি',
    },
    {
      icon: <Stamp className="w-6 h-6 text-[#102B50]" />,
      title: 'ভিসা ও ওয়ার্ক পারমিট তথ্য',
      description:
        'ভিসা, ওয়ার্ক পারমিট এবং সংশ্লিষ্ট নথিপত্রের প্রক্রিয়া সম্পর্কে তথ্য ও নির্দেশনা।',
      badge: 'প্রক্রিয়াগত নির্দেশনা',
    },
    {
      icon: <GraduationCap className="w-6 h-6 text-[#B7791F]" />,
      title: 'দক্ষতা ও প্রশিক্ষণ',
      description:
        'বিদেশে কর্মসংস্থানের জন্য প্রয়োজনীয় দক্ষতা, ভাষা শিক্ষা এবং প্রশিক্ষণের বিষয়ে দিকনির্দেশনা।',
      badge: 'দক্ষতা উন্নয়ন',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#24856A]" />,
      title: 'নিরাপদ অভিবাসন',
      description:
        'চাকরির অফার, নিয়োগকর্তা, চুক্তিপত্র এবং প্রাসঙ্গিক অনুমোদন যাচাই করার গুরুত্ব সম্পর্কে সচেতনতা।',
      badge: 'সচেতনতা ও সুরক্ষা',
    },
    {
      icon: <PlaneTakeoff className="w-6 h-6 text-[#102B50]" />,
      title: 'বিদেশযাত্রার প্রস্তুতি',
      description:
        'প্রয়োজনীয় নথি, চুক্তির শর্ত এবং বিদেশযাত্রার পূর্বপ্রস্তুতি সম্পর্কে তথ্য।',
      badge: 'প্রাক-যাত্রা ব্রিফিং',
    },
  ];

  return (
    <section id="services-section" className="py-16 sm:py-24 bg-slate-50/70 border-b border-[#E4EAF1] font-bengali">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#24856A] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            আমাদের সেবাসমূহ
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#172B45] tracking-tight">
            বিদেশে কর্মসংস্থানের প্রস্তুতিতে আমাদের সেবাসমূহ
          </h2>
          <p className="text-xs sm:text-sm text-[#66758A] leading-relaxed">
            ৭ বছরের পেশাদার অভিজ্ঞতার আলোকে আমরা প্রার্থীদের সঠিক তথ্য, বৈধ প্রক্রিয়া ও দায়িত্বশীল সহযোগিতার মাধ্যমে সহায়তা করি।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <Card
              key={index}
              className="hover:shadow-lg transition-all duration-300 border-[#CBDDF0] bg-white rounded-2xl group flex flex-col justify-between"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-[#F6F8FB] border border-[#CBDDF0] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    {service.icon}
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-[#102B50]">
                    {service.badge}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-[#102B50] leading-snug">
                    {service.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-xs text-[#66758A] max-w-xl mx-auto mb-4">
            * আমরা কেবলমাত্র বৈধ ও দায়িত্বশীল তথ্য এবং প্রযোজ্য ক্ষেত্রে প্রক্রিয়াগত সহযোগিতা প্রদান করি। চাকরি বা ভিসা নিশ্চিত করার কোনো অনৈতিক প্রতিশ্রুতি দেওয়া হয় না।
          </p>
          <Link href="/contact">
            <Button
              variant="outline"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="text-xs sm:text-sm font-bold border-[#CBDDF0] text-[#102B50] hover:bg-white"
            >
              পরামর্শ নিতে যোগাযোগ করুন
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
