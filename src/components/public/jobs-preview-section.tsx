'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BriefcaseBusiness,
  MapPin,
  ArrowRight,
  Sparkles,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCountryFlagUrl } from '@/lib/image-constants';
import { JobCard, JobCardData } from '@/components/jobs/job-card';

export type PublicJobItem = JobCardData;

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
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
