'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Stamp,
  Globe2,
  Files,
  Info,
  ExternalLink,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCountryImage, getCountryFlagUrl, VISA_IMAGES } from '@/lib/image-constants';

export interface PublicVisaItem {
  id: string;
  title: string;
  slug: string;
  visaType: string;
  overview?: string | null;
  eligibilityCriteria?: string | null;
  requiredDocuments?: string[] | string | null;
  processingTime?: string | null;
  officialSourceUrl?: string | null;
  officialSourceName?: string | null;
  country?: {
    id?: string;
    name: string;
    code: string;
    slug?: string;
  } | null;
}

interface VisaPreviewSectionProps {
  visaList?: PublicVisaItem[];
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
  maxDisplay?: number;
}

export const VisaPreviewSection: React.FC<VisaPreviewSectionProps> = ({
  visaList = [],
  title = 'ভিসা ও ওয়ার্ক পারমিট তথ্য',
  subtitle = 'বিভিন্ন দেশের সরকার নির্ধারিত বৈধ কাজের ভিসা, প্রয়োজনীয় নথিপত্র এবং অফিসিয়াল আবেদনের নির্দেশিকা।',
  showViewAll = true,
  maxDisplay = 3,
}) => {
  // If no database visa items passed, use verified realistic defaults
  const fallbackVisas: PublicVisaItem[] = [
    {
      id: 'ksa-work',
      title: 'সৌদি আরব এমপ্লয়মেন্ট ওয়ার্ক ভিসা (Qiwa / Enjaz)',
      slug: 'saudi-arabia-work-visa',
      visaType: 'EMPLOYMENT_VISA',
      overview: 'সৌদি সরকারের কিওয়া (Qiwa) পোর্টাল ও এনজাজ সিস্টেমের মাধ্যমে সরাসরি ইস্যুকৃত বৈধ কর্মসংস্থান ভিসা।',
      eligibilityCriteria: 'ন্যূনতম ২১ বছর বয়স, বৈধ পাসপোর্ট, পেশাগত দক্ষতার সনদ ও গামকা মেডিকেল ফিটনেস।',
      requiredDocuments: ['মূল পাসপোর্ট (১ বছর মেয়াদী)', 'গামকা মেডিকেল ফিট সনদ', 'পুলিশ ক্লিয়ারেন্স', 'পেশাগত সনদ'],
      processingTime: '৪ - ৮ সপ্তাহ',
      officialSourceName: 'Ministry of Human Resources (KSA)',
      country: { name: 'Saudi Arabia', code: 'SA' },
    },
    {
      id: 'uae-work',
      title: 'সংযুক্ত আরব আমিরাত কর্মসংস্থান রেসিডেন্স পারমিট',
      slug: 'uae-employment-residence-permit',
      visaType: 'WORK_PERMIT',
      overview: 'MOHRE ও ফেডারেল অথরিটি (ICP) অনুমোদিত স্ট্যান্ডার্ড ২ বছর মেয়াদী নবায়নযোগ্য এমপ্লয়মেন্ট ভিসা।',
      eligibilityCriteria: 'বৈধ জব অফার লেটার, শিক্ষা সনদ সত্যায়ন, মেডিকেল টেস্ট ও সিকিউরিটি ক্লিয়ারেন্স।',
      requiredDocuments: ['পাসপোর্ট সাইজ ছবি', 'শিক্ষাগত সনদ সত্যায়ন', 'মেডিকেল টেস্ট রিপোর্ট', 'অফার লেটার'],
      processingTime: '৩ - ৬ সপ্তাহ',
      officialSourceName: 'MOHRE UAE Official Portal',
      country: { name: 'United Arab Emirates', code: 'AE' },
    },
    {
      id: 'qatar-work',
      title: 'কাতার ওয়ার্ক রেসিডেন্স পারমিট (QVP প্রসেসিং)',
      slug: 'qatar-work-residence-permit',
      visaType: 'WORK_PERMIT',
      overview: 'কাতার ভিসা সেন্টার (QVC ঢাকা/সিলেট) এর মাধ্যমে বায়োমেট্রিক ও চুক্তিপত্র যাচাইকৃত বৈধ ওয়ার্ক ভিসা।',
      eligibilityCriteria: 'বৈধ কোম্পানি ডিমান্ড, কিউভিসি মেডিকেল ফিটনেস, ব্যাকগ্রাউন্ড ভেরিফিকেশন।',
      requiredDocuments: ['ই-পাসপোর্ট', 'QVC বায়োমেট্রিক স্লিপ', 'পুলিশ ক্লিয়ারেন্স', 'নিয়োগ চুক্তিপত্র'],
      processingTime: '৪ - ৭ সপ্তাহ',
      officialSourceName: 'Ministry of Interior (Qatar)',
      country: { name: 'Qatar', code: 'QA' },
    },
  ];

  const items = visaList.length > 0 ? visaList.slice(0, maxDisplay) : fallbackVisas;

  return (
    <section id="visa-section" className="py-16 sm:py-24 bg-slate-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy-800 bg-navy-100/80 px-3 py-1 rounded-full border border-navy-200">
              <Stamp className="w-3.5 h-3.5 text-navy-700" />
              <span>অফিসিয়াল অভিবাসন তথ্য</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 font-bengali">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl font-bengali">
              {subtitle}
            </p>
          </div>

          {showViewAll && (
            <Link href="/visa-information" className="self-start md:self-auto">
              <Button
                variant="outline"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="font-bengali text-xs border-slate-300 text-slate-800 hover:bg-white"
              >
                ভিসা তথ্য দেখুন
              </Button>
            </Link>
          )}
        </div>

        {/* Mandatory Official Immigration Policy Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 mb-8 flex items-start gap-3.5 text-xs text-amber-950 font-bengali leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-extrabold block text-amber-900 mb-0.5">
              গুরুত্বপূর্ণ সরকারি অভিবাসন নীতিমালা সতর্কতা:
            </strong>
            ভিসা ও ওয়ার্ক পারমিট অনুমোদনের চূড়ান্ত এখতিয়ার শুধুমাত্র সংশ্লিষ্ট দেশের দূতাবাস এবং অভিবাসন কর্তৃপক্ষের। শাকিল গ্লোবাল রিক্রুটমেন্ট কোনো প্রকার '১০০% ভিসা গ্যারান্টি' বা অননুমোদিত প্রতিশ্রুতি দেয় না; আমরা শুধুমাত্র সরকারি ও আইনসম্মত প্রক্রিয়ায় প্রার্থীর আবেদন ও ফাইল প্রসেসিং সহায়তা প্রদান করি।
          </div>
        </div>

        {/* Visa Information Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item) => {
            const countryImg = getCountryImage(item.country?.code, item.country?.slug || item.country?.name);
            const flagUrl = getCountryFlagUrl(item.country?.code);

            return (
              <Card
                key={item.id}
                className="overflow-hidden bg-white border border-slate-200/90 hover:border-emerald-500 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group rounded-2xl hover:-translate-y-1"
              >
                {/* Visual Header */}
                <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                  <Image
                    src={countryImg.src}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  {/* Flag & Country Badge */}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl border border-slate-200 shadow-md flex items-center gap-2">
                    <div className="relative w-4 h-3 rounded-xs overflow-hidden flex-shrink-0">
                      <Image
                        src={flagUrl}
                        alt={item.country?.name || 'Country flag'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 font-sans">
                      {item.country?.name}
                    </span>
                  </div>

                  {/* Visa Type Pill */}
                  <div className="absolute top-3 right-3 bg-navy-950/85 backdrop-blur-xs text-white font-mono text-[10px] px-2 py-0.5 rounded-md font-bold">
                    {item.visaType.replace(/_/g, ' ')}
                  </div>

                  {/* Title */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="text-base font-extrabold text-white font-bengali leading-snug group-hover:text-emerald-300 transition-colors">
                      {item.title}
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between font-bengali">
                  <div className="space-y-3 text-xs text-slate-600">
                    {/* Overview */}
                    {item.overview && (
                      <p className="leading-relaxed line-clamp-2 text-slate-600">
                        {item.overview}
                      </p>
                    )}

                    {/* Eligibility */}
                    {item.eligibilityCriteria && (
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                        <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                          <Info className="w-3 h-3 text-navy-700" /> যোগ্যতা ও শর্ত:
                        </span>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          {item.eligibilityCriteria}
                        </p>
                      </div>
                    )}

                    {/* Required Documents Checklist */}
                    {(() => {
                      const docList = Array.isArray(item.requiredDocuments)
                        ? item.requiredDocuments
                        : (item.requiredDocuments || '')
                            .split(/\r?\n|,/)
                            .map((d) => d.trim())
                            .filter(Boolean);

                      if (docList.length === 0) return null;

                      return (
                        <div className="space-y-1.5 pt-1">
                          <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                            <Files className="w-3 h-3 text-navy-700" /> প্রয়োজনীয় কাগজপত্র:
                          </span>
                          <ul className="space-y-1 text-[11px] text-slate-600">
                            {docList.slice(0, 3).map((doc, idx) => (
                              <li key={idx} className="flex items-center gap-1.5 truncate">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                                <span className="truncate">{doc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Official Source & CTA */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    {item.officialSourceName && (
                      <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 font-sans">
                        <Globe2 className="w-3 h-3 flex-shrink-0" />
                        <span>Source: {item.officialSourceName}</span>
                      </div>
                    )}

                    <Link href={`/visa-information/${item.slug}`} className="block">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs font-semibold border-slate-200 text-slate-800 hover:bg-navy-50 hover:text-navy-900 flex items-center justify-center gap-1"
                      >
                        ভিসা তথ্য দেখুন
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
