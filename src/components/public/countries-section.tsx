'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Globe2,
  ArrowRight,
  Briefcase,
  ChevronRight,
  Sparkles,
  MapPin,
  Banknote,
  CheckCircle2,
  Utensils,
  Sparkle,
  Factory,
  HardHat,
  Wrench,
  Users,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCountryImage, getCountryFlagUrl } from '@/lib/image-constants';

export interface PublicCountryItem {
  id: string;
  name: string;
  code: string;
  slug: string;
  description?: string | null;
  recruitmentStatus?: string;
  continent?: string | null;
  currency?: string | null;
  currencyCode?: string | null;
  _count?: {
    jobs?: number;
  };
  jobsCount?: number;
}

interface CountriesSectionProps {
  countries?: PublicCountryItem[];
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
  maxDisplay?: number;
}

export const CountriesSection: React.FC<CountriesSectionProps> = ({
  countries = [],
  title = 'বিদেশে কর্মসংস্থানের সম্ভাবনা',
  subtitle = 'বিভিন্ন দেশের কর্মসংস্থানসংক্রান্ত সুযোগ সম্পর্কে জানুন এবং আপনার যোগ্যতা ও অভিজ্ঞতা অনুযায়ী প্রস্তুতি নিন।',
  showViewAll = true,
  maxDisplay = 8,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');

  // Illustrative Job Categories as required by the Master Prompt
  const illustrativeCategories = [
    { title: 'হোটেল ও রেস্টুরেন্ট', desc: 'শেফ, ওয়েটার, কিচেন হেল্পার ও ক্যাটারিং কর্মী', icon: <Utensils className="w-5 h-5 text-[#102B50]" /> },
    { title: 'ক্লিনিং ও হাউসকিপিং', desc: 'অফিস, শপিং মল, হাসপাতাল ও রেসিডেন্ট ক্লিনাল সার্ভিস', icon: <Sparkle className="w-5 h-5 text-[#24856A]" /> },
    { title: 'ফ্যাক্টরি ও প্যাকেজিং', desc: 'ম্যানুফ্যাকচারিং, অ্যাসেম্বলি ও প্রোডাকশন প্যাকেজিং', icon: <Factory className="w-5 h-5 text-[#102B50]" /> },
    { title: 'নির্মাণ ও কারিগরি পেশা', desc: 'ম্যাসন, স্টিল ফিক্সার, শাটারিং কার্পেন্টার ও রডবাইন্ডার', icon: <HardHat className="w-5 h-5 text-[#B7791F]" /> },
    { title: 'ইলেকট্রিশিয়ান ও মেকানিক', desc: 'বিল্ডিং ওয়্যারিং, অটোমোবাইল ও মেকানিক্যাল টেকনিশিয়ান', icon: <Wrench className="w-5 h-5 text-[#102B50]" /> },
    { title: 'দক্ষ ও অদক্ষ কর্মী', desc: 'সাধারণ শ্রমিক, হেল্পার ও নির্দিষ্ট পেশায় অভিজ্ঞ কর্মী', icon: <Users className="w-5 h-5 text-[#24856A]" /> },
    { title: 'সুপারভাইজার ও সার্ভিস কর্মী', desc: 'সাইট সুপারভাইজার, স্টোরকিপার ও কাস্টমার সার্ভিস', icon: <ShieldCheck className="w-5 h-5 text-[#102B50]" /> },
  ];

  // Categorize countries by region
  const categorizedCountries = useMemo(() => {
    return countries.map((c) => {
      const code = c.code?.toUpperCase();
      let region = 'OTHER';
      if (['SA', 'AE', 'QA', 'KW', 'OM'].includes(code)) {
        region = 'GULF';
      } else if (['SG', 'MY', 'JP', 'KR'].includes(code)) {
        region = 'ASIA';
      } else if (['PT', 'PL', 'RO', 'HR'].includes(code)) {
        region = 'EUROPE';
      } else if (['AU'].includes(code)) {
        region = 'OCEANIA';
      }
      return { ...c, region };
    });
  }, [countries]);

  const filteredCountries = useMemo(() => {
    let list = categorizedCountries;
    if (selectedRegion !== 'ALL') {
      list = list.filter((c) => c.region === selectedRegion);
    }
    return list.slice(0, maxDisplay);
  }, [categorizedCountries, selectedRegion, maxDisplay]);

  return (
    <section id="countries-section" className="py-16 sm:py-24 bg-white font-sans border-b border-[#E4EAF1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#24856A] bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200 font-bengali">
              <Globe2 className="w-3.5 h-3.5 text-[#24856A]" />
              <span>গন্তব্য ও পেশা নির্দেশিকা</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-[#172B45] mt-3 font-bengali tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-[#66758A] mt-1.5 max-w-2xl font-bengali leading-relaxed">
              {subtitle}
            </p>
          </div>

          {showViewAll && (
            <Link href="/countries" className="self-start md:self-auto flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="font-bengali text-xs border border-[#CBDDF0] text-[#102B50] hover:bg-[#F6F8FB] font-bold px-4 py-2"
              >
                সকল দেশ দেখুন ({countries.length})
              </Button>
            </Link>
          )}
        </div>

        {/* Dynamic Region Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none font-bengali">
          {[
            { id: 'ALL', label: 'সকল অঞ্চল', count: countries.length },
            { id: 'GULF', label: 'মধ্যপ্রাচ্য (সৌদি আরব, কাতার, আমিরাত...)', count: categorizedCountries.filter((c) => c.region === 'GULF').length },
            { id: 'ASIA', label: 'দক্ষিণ-পূর্ব ও পূর্ব এশিয়া (সিঙ্গাপুর, মালয়েশিয়া...)', count: categorizedCountries.filter((c) => c.region === 'ASIA').length },
            { id: 'EUROPE', label: 'ইউরোপের বিভিন্ন দেশ', count: categorizedCountries.filter((c) => c.region === 'EUROPE').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedRegion(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedRegion === tab.id
                  ? 'bg-[#102B50] text-white shadow-md'
                  : 'bg-slate-100 text-[#66758A] hover:bg-slate-200/80'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedRegion === tab.id ? 'bg-[#1E3A8A] text-emerald-300' : 'bg-white text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Countries Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCountries.map((country) => {
            const countryImg = getCountryImage(country.code, country.slug || country.name);
            const flagUrl = getCountryFlagUrl(country.code);

            return (
              <Card
                key={country.id}
                className="overflow-hidden bg-white border border-[#CBDDF0] hover:border-[#102B50] hover:shadow-xl transition-all duration-300 flex flex-col justify-between group rounded-2xl hover:-translate-y-1"
              >
                {/* Photo Header */}
                <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                  <Image
                    src={countryImg.src}
                    alt={countryImg.alt || `${country.name} landmark`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Flag and Country Name */}
                  <div className="absolute bottom-3 left-3 right-3 z-10 text-white">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="relative w-5 h-3.5 rounded-xs overflow-hidden flex-shrink-0 shadow-md border border-white/40">
                        <Image src={flagUrl} alt={`${country.name} flag`} fill className="object-cover" />
                      </div>
                      <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-mono font-bold">
                        {country.code}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-white truncate leading-tight group-hover:text-emerald-300 transition-colors font-bengali">
                      {country.name}
                    </h3>
                  </div>
                </div>

                {/* Country Details & Links */}
                <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between font-bengali">
                  <div className="space-y-1.5">
                    <p className="text-xs text-[#66758A] line-clamp-2 leading-relaxed">
                      {country.description || 'কর্মসংস্থানসংক্রান্ত সুযোগ ও আবেদনপ্রক্রিয়া সম্পর্কে সঠিক তথ্য জেনে প্রস্তুতি নিন।'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <Link href={`/jobs?country=${country.slug}`} className="w-full">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full text-xs font-bold bg-[#102B50] hover:bg-[#0B1D35] text-white flex items-center justify-center gap-1 shadow-2xs"
                      >
                        সুযোগ দেখুন
                      </Button>
                    </Link>

                    <Link href={`/countries/${country.slug}`} className="w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs font-semibold border border-[#CBDDF0] text-[#172B45] hover:bg-slate-50 flex items-center justify-center gap-1"
                      >
                        তথ্য জানুন
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Illustrative Job Categories Showcase */}
        <div className="pt-8 border-t border-[#E4EAF1] font-bengali">
          <div className="mb-6 space-y-1">
            <h3 className="text-lg sm:text-xl font-bold text-[#102B50]">
              সম্ভাব্য কাজের ধরন ও পেশা (উদাহরণস্বরূপ)
            </h3>
            <p className="text-xs text-[#66758A]">
              আপনার পূর্ব অভিজ্ঞতা ও দক্ষতা অনুযায়ী প্রস্তুতি গ্রহণ করতে পারেন নিচের প্রধান ক্ষেত্রগুলোতে:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {illustrativeCategories.map((cat, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-[#F6F8FB] border border-[#E4EAF1] hover:border-[#102B50] transition-colors flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-white border border-[#CBDDF0] flex items-center justify-center shrink-0">
                  {cat.icon}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#102B50]">{cat.title}</h4>
                  <p className="text-[11px] text-[#66758A] mt-0.5 leading-snug">{cat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Important Rule Notice */}
          <div className="mt-6 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong>বিশেষ জ্ঞাতব্য:</strong> উল্লিখিত দেশ ও পেশাসমূহ সম্ভাব্য কর্মসংস্থানের উদাহরণমাত্র, কোনো নিশ্চিত বা স্থায়ী শূন্যপদ নয়। প্রকৃত নিয়োগ ও বিদেশযাত্রা যাচাইকৃত সুযোগ, সংশ্লিষ্ট দেশের সরকারি অনুমোদন ও প্রার্থীর যোগ্যতার ওপর নির্ভরশীল।
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
