'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BriefcaseBusiness,
  MapPin,
  Banknote,
  Clock,
  ArrowRight,
  Calendar,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getJobCategoryImage, getCountryFlagUrl, getCountryImage } from '@/lib/image-constants';

export interface JobCardData {
  id: string;
  title: string;
  slug: string;
  jobCode?: string | null;
  description?: string | null;
  salaryMin?: number | string | null;
  salaryMax?: number | string | null;
  currency?: string | null;
  salaryPeriod?: string | null;
  experienceRequired?: number | null;
  educationRequired?: string | null;
  vacancyCount?: number | null;
  contractDuration?: string | null;
  applicationDeadline?: string | Date | null;
  featured?: boolean | null;
  country?: {
    id?: string;
    name: string;
    code: string;
    flag?: string | null;
    slug?: string | null;
  } | null;
  jobCategory?: {
    id?: string;
    name: string;
    slug?: string | null;
  } | null;
  employer?: {
    companyName?: string | null;
    companyNameLocal?: string | null;
    verificationStatus?: string | null;
  } | null;
}

interface JobCardProps {
  job: JobCardData;
  className?: string;
}

export const JobCard: React.FC<JobCardProps> = ({ job, className }) => {
  const categoryImg = getJobCategoryImage(job.jobCategory?.name, job.title);
  const countryImg = getCountryImage(job.country?.code, job.country?.slug || job.country?.name);
  const flagUrl = getCountryFlagUrl(job.country?.code);

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
    <Card
      className={`overflow-hidden bg-white border border-slate-200/90 hover:border-emerald-500 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group rounded-2xl hover:-translate-y-1 ${className || ''}`}
    >
      {/* Visual Header with Destination Country Landmark Photo */}
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
          {/* Employer with Verified Badge */}
          <div className="flex items-center justify-between gap-1.5 text-[11px]">
            <div className="flex items-center gap-1 text-slate-700 font-semibold truncate">
              <BriefcaseBusiness className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">
                {job.employer?.companyName || 'অনুমোদিত বিদেশি কোম্পানি'}
              </span>
            </div>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex-shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
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
          <Link href={`/jobs/${job.slug || job.id}`} className="w-full">
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
};
