'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BriefcaseBusiness,
  MapPin,
  Banknote,
  Clock,
  ArrowRight,
  Users,
  Calendar,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Search,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getJobCategoryImage, getCountryFlagUrl, getCountryImage } from '@/lib/image-constants';

export interface PublicJobItem {
  id: string;
  title: string;
  slug: string;
  jobCode?: string;
  description?: string;
  salaryMin?: number | string | null;
  salaryMax?: number | string | null;
  currency?: string | null;
  experienceRequired?: number;
  educationRequired?: string | null;
  vacancyCount?: number;
  contractDuration?: string | null;
  applicationDeadline?: string | Date | null;
  featured?: boolean;
  country?: {
    id?: string;
    name: string;
    code: string;
    flag?: string | null;
    slug?: string;
  } | null;
  jobCategory?: {
    id?: string;
    name: string;
    slug?: string;
  } | null;
  employer?: {
    companyName?: string;
  } | null;
}

interface JobsPreviewSectionProps {
  jobs?: PublicJobItem[];
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
  maxDisplay?: number;
}

export const JobsPreviewSection: React.FC<JobsPreviewSectionProps> = ({
  jobs = [],
  title = 'সর্বশেষ চাকরির সুযোগ',
  subtitle = 'স্বনামধন্য বৈদেশিক কোম্পানিতে সরাসরি সরকারি নীতিমালায় অনুমোদিত ডিমান্ড ও সার্কুলার।',
  showViewAll = true,
  maxDisplay = 6,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [localSearch, setLocalSearch] = useState<string>('');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      if (j.jobCategory?.name) set.add(j.jobCategory.name);
    });
    return Array.from(set);
  }, [jobs]);

  // Extract unique countries
  const countryList = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();
    jobs.forEach((j) => {
      if (j.country?.code && j.country?.name) {
        map.set(j.country.code, { code: j.country.code, name: j.country.name });
      }
    });
    return Array.from(map.values());
  }, [jobs]);

  // Dynamic filter
  const filteredJobs = useMemo(() => {
    let list = jobs;

    if (selectedCategory !== 'ALL') {
      list = list.filter((j) => j.jobCategory?.name === selectedCategory);
    }

    if (selectedCountry !== 'ALL') {
      list = list.filter((j) => j.country?.code === selectedCountry);
    }

    if (localSearch.trim()) {
      const q = localSearch.toLowerCase().trim();
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.country?.name.toLowerCase().includes(q) ||
          j.jobCategory?.name.toLowerCase().includes(q)
      );
    }

    return list.slice(0, maxDisplay);
  }, [jobs, selectedCategory, selectedCountry, localSearch, maxDisplay]);

  // Format currency helper
  const formatSalary = (min?: number | string | null, max?: number | string | null, cur?: string | null) => {
    const currency = cur || 'BDT';
    if (!min && !max) return 'আলোচনা সাপেক্ষে';
    if (min && max) {
      return `${currency} ${Number(min).toLocaleString()} - ${Number(max).toLocaleString()}/মাস`;
    }
    if (min) {
      return `${currency} ${Number(min).toLocaleString()}+/মাস`;
    }
    return `${currency} ${Number(max).toLocaleString()}/মাস`;
  };

  // Format deadline helper
  const formatDeadline = (deadline?: string | Date | null) => {
    if (!deadline) return 'নির্দিষ্ট সময়সীমা নেই';
    try {
      const d = new Date(deadline);
      return d.toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'নির্দিষ্ট সময়সীমা নেই';
    }
  };

  return (
    <section id="jobs-section" className="py-16 sm:py-24 bg-slate-50/80 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-3.5 py-1 rounded-full border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>চলমান বৈদেশিক নিয়োগ বিজ্ঞপ্তি</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-3 font-bengali tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl font-bengali leading-relaxed">
              {subtitle}
            </p>
          </div>

          {showViewAll && (
            <Link href="/jobs" className="self-start md:self-auto flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="font-bengali text-xs border-slate-300 text-slate-800 hover:bg-white font-bold px-4 py-2"
              >
                সকল চাকরি দেখুন ({jobs.length})
              </Button>
            </Link>
          )}
        </div>

        {/* Dynamic Filters Bar: Country & Category Tabs */}
        <div className="space-y-3 mb-8">
          {/* Country Quick Filter with Vector Flags */}
          {countryList.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none font-bengali">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap flex items-center gap-1 mr-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" /> দেশ:
              </span>
              <button
                onClick={() => setSelectedCountry('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCountry === 'ALL'
                    ? 'bg-navy-950 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                সকল দেশ
              </button>
              {countryList.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setSelectedCountry(c.code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    selectedCountry === c.code
                      ? 'bg-navy-950 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <div className="relative w-4 h-3 rounded-xs overflow-hidden flex-shrink-0">
                    <Image src={getCountryFlagUrl(c.code)} alt={c.name} fill className="object-cover" />
                  </div>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Category Filter Pills */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none font-bengali">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-navy-800" /> খাত:
              </span>
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === 'ALL'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                সকল খাত
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Jobs Grid */}
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 font-bengali shadow-xs">
            <BriefcaseBusiness className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">এই মানদণ্ডে কোনো নিয়োগ বিজ্ঞপ্তি পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              ফিল্টার পরিবর্তন করুন অথবা নতুন বিজ্ঞপ্তির আপডেট পেতে আপনার প্রোফাইল নিবন্ধন করে রাখুন।
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSelectedCategory('ALL'); setSelectedCountry('ALL'); setLocalSearch(''); }}
                className="text-xs"
              >
                ফিল্টার রিসেট করুন
              </Button>
              <Link href="/portal/register">
                <Button variant="primary" size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                  প্রোফাইল তৈরি করুন
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => {
              const categoryImg = getJobCategoryImage(job.jobCategory?.name, job.title);
              const countryImg = getCountryImage(job.country?.code, job.country?.slug || job.country?.name);
              const flagUrl = getCountryFlagUrl(job.country?.code);

              return (
                <Card
                  key={job.id}
                  className="overflow-hidden bg-white border border-slate-200/90 hover:border-emerald-500 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group rounded-2xl hover:-translate-y-1"
                >
                  {/* Visual Header with Destination Country Landmark Image */}
                  <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                    <Image
                      src={countryImg.src}
                      alt={`${job.country?.name || 'Destination'} - ${job.title}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/20" />

                    {/* Top-Left: Country Vector Flag & Name Badge */}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-md flex items-center gap-2 z-10">
                      <div className="relative w-5 h-3.5 rounded-xs overflow-hidden shadow-2xs border border-slate-200 flex-shrink-0">
                        <Image
                          src={flagUrl}
                          alt={job.country?.name || 'Flag'}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="text-xs font-black text-slate-900 font-sans">
                        {job.country?.name || 'International'}
                      </span>
                    </div>

                    {/* Top-Right: Trade Category / Featured Pill */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                      {job.featured && (
                        <div className="bg-gold-500 text-navy-950 font-black text-[10px] px-2 py-0.5 rounded-lg uppercase tracking-wider shadow-sm flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Featured
                        </div>
                      )}
                      <div className="bg-navy-950/85 backdrop-blur-md text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-lg font-sans">
                        {job.jobCategory?.name || 'General'}
                      </div>
                    </div>

                    {/* Job Title on Gradient Overlay */}
                    <div className="absolute bottom-3 left-3 right-3 text-white z-10">
                      <div className="flex items-center justify-between text-[10px] text-emerald-300 font-bold mb-1">
                        <span>পদসংখ্যা: {job.vacancyCount || 1} জন</span>
                        <span className="text-slate-300 font-sans">কাজের কোড: {job.jobCode || 'SK-JOB'}</span>
                      </div>
                      <h3 className="text-base font-extrabold line-clamp-1 text-white group-hover:text-emerald-300 transition-colors font-bengali">
                        {job.title}
                      </h3>
                    </div>
                  </div>

                  {/* Card Body & Details */}
                  <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between font-bengali">
                    <div className="space-y-3 text-xs text-slate-600">
                      {/* Employer */}
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                        <BriefcaseBusiness className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate font-medium">
                          {job.employer?.companyName || 'অনুমোদিত বিদেশি কোম্পানি'}
                        </span>
                      </div>

                      {/* Salary Box */}
                      <div className="p-3 bg-emerald-50/80 border border-emerald-100 rounded-xl flex items-center justify-between">
                        <span className="text-slate-600 text-[11px] font-medium flex items-center gap-1">
                          <Banknote className="w-4 h-4 text-emerald-700" />
                          মাসিক বেতন:
                        </span>
                        <span className="font-black text-emerald-800 text-xs sm:text-sm font-sans">
                          {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                        </span>
                      </div>

                      {/* Experience & Deadline */}
                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div className="flex items-center gap-1 text-slate-600 truncate">
                          <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>
                            {job.experienceRequired
                              ? `${job.experienceRequired} বছরের অভিজ্ঞতা`
                              : 'ফ্রেশার আবেদনযোগ্য'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-600 truncate">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{formatDeadline(job.applicationDeadline)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Dual Action CTAs */}
                    <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                      <Link href={`/jobs/${job.slug}`} className="w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs border-slate-200 text-slate-800 hover:bg-slate-50 font-bold"
                        >
                          বিস্তারিত দেখুন
                        </Button>
                      </Link>

                      <Link href={`/portal/register?jobId=${job.id}`} className="w-full">
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1 shadow-xs"
                        >
                          আবেদন করুন
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
