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
  title = 'জনপ্রিয় গন্তব্য দেশসমূহ',
  subtitle = 'বাংলাদেশি কর্মীদের জন্য সরকার অনুমোদিত শীর্ষ বৈদেশিক কর্মসংস্থান গন্তব্য। প্রতিটি দেশের ছবি, নিয়ম ও সার্কুলার দেখুন।',
  showViewAll = true,
  maxDisplay = 8,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');

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

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-600/90 text-white shadow-xs backdrop-blur-xs font-bengali">
            নিয়োগ সক্রিয়
          </span>
        );
      case 'LIMITED':
        return (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/90 text-white shadow-xs backdrop-blur-xs font-bengali">
            সীমিত কোটা
          </span>
        );
      case 'PAUSED':
        return (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-700/90 text-white shadow-xs backdrop-blur-xs font-bengali">
            সাময়িক স্থগিত
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-600/90 text-white shadow-xs backdrop-blur-xs font-bengali">
            নিয়োগ সক্রিয়
          </span>
        );
    }
  };

  return (
    <section id="countries-section" className="py-16 sm:py-24 bg-white font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-3.5 py-1 rounded-full border border-emerald-200">
              <Globe2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>আন্তর্জাতিক কর্মসংস্থান কেন্দ্র</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-3 font-bengali tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl font-bengali leading-relaxed">
              {subtitle}
            </p>
          </div>

          {showViewAll && (
            <Link href="/countries" className="self-start md:self-auto flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="font-bengali text-xs border-slate-300 text-slate-800 hover:bg-slate-50 font-bold px-4 py-2"
              >
                সকল দেশ দেখুন ({countries.length})
              </Button>
            </Link>
          )}
        </div>

        {/* Dynamic Region Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none font-bengali">
          {[
            { id: 'ALL', label: 'সকল অঞ্চল', count: countries.length },
            { id: 'GULF', label: 'মধ্যপ্রাচ্য (Gulf)', count: categorizedCountries.filter(c => c.region === 'GULF').length },
            { id: 'ASIA', label: 'পূর্ব ও দক্ষিণ-পূর্ব এশিয়া', count: categorizedCountries.filter(c => c.region === 'ASIA').length },
            { id: 'EUROPE', label: 'ইউরোপীয় ইউনিয়ন', count: categorizedCountries.filter(c => c.region === 'EUROPE').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedRegion(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedRegion === tab.id
                  ? 'bg-navy-950 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedRegion === tab.id ? 'bg-navy-800 text-gold-400' : 'bg-white text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Countries Grid with Rich Photography */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCountries.map((country) => {
            const countryImg = getCountryImage(country.code, country.slug || country.name);
            const flagUrl = getCountryFlagUrl(country.code);
            const jobsCount = country._count?.jobs ?? country.jobsCount ?? 0;

            return (
              <Card
                key={country.id}
                className="overflow-hidden bg-white border border-slate-200/90 hover:border-emerald-500 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group rounded-2xl hover:-translate-y-1"
              >
                {/* Country Landmark Photo Header */}
                <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                  <Image
                    src={countryImg.src}
                    alt={countryImg.alt || `${country.name} landmark`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  {/* Status Badge Top-Right */}
                  <div className="absolute top-3 right-3 z-10">
                    {getStatusBadge(country.recruitmentStatus)}
                  </div>

                  {/* Flag and Country Name on Photo Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 z-10 text-white">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="relative w-6 h-4 rounded-xs overflow-hidden flex-shrink-0 shadow-md border border-white/40">
                        <Image
                          src={flagUrl}
                          alt={`${country.name} flag`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-mono font-bold">
                        {country.code} • {country.continent || 'International'}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-white truncate leading-tight group-hover:text-emerald-300 transition-colors font-bengali">
                      {country.name}
                    </h3>
                  </div>
                </div>

                {/* Country Details & Features */}
                <CardContent className="p-4 space-y-3.5 flex-1 flex flex-col justify-between font-bengali">
                  <div className="space-y-2">
                    {country.description ? (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {country.description}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        অনুমোদিত কোম্পানি ও দূতাবাসের সরকারি নির্দেশিকায় নিরাপদ কর্মসংস্থান।
                      </p>
                    )}

                    {/* Jobs & Currency Meta */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700">
                      <span className="text-slate-500 text-[11px] flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" /> সার্কুলার:
                      </span>
                      <span className={`font-bold ${jobsCount > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {jobsCount > 0 ? `${jobsCount} টি সক্রিয় বিজ্ঞপ্তি` : 'শীঘ্রই বিজ্ঞপ্তি আসছে'}
                      </span>
                    </div>

                    {country.currency && (
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Banknote className="w-3.5 h-3.5 text-slate-400" /> মুদ্রা:
                        </span>
                        <span className="font-semibold text-slate-700">
                          {country.currency} ({country.currencyCode || country.code})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dual Action CTAs */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <Link href={`/jobs?country=${country.slug}`} className="w-full">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1 shadow-2xs"
                      >
                        চাকরি দেখুন
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>

                    <Link href={`/countries/${country.slug}`} className="w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs font-semibold border-slate-200 text-slate-800 hover:bg-slate-50 flex items-center justify-center gap-1"
                      >
                        দেশ নির্দেশিকা
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
