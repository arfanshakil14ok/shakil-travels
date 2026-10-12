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
      className={`overflow-hidden bg-white border border-[#E4EAF1] hover:border-[#102B50] hover:shadow-lg transition-all duration-300 flex flex-col justify-between group rounded-xl ${className || ''}`}
    >
      {/* Visual Header with Destination Country Landmark Photo */}
      <div className="relative h-44 w-full bg-[#0B1D35] overflow-hidden">
        <Image
          src={countryImg.src}
          alt={`${job.country?.name || 'Destination'} - ${job.title}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1D35]/95 via-[#0B1D35]/40 to-transparent" />

        {/* Top-Left: Country Vector Flag & Name Badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-[#E4EAF1] shadow-2xs flex items-center gap-2 z-10">
          <div className="relative w-5 h-3.5 rounded-xs overflow-hidden border border-slate-200 flex-shrink-0">
            <Image
              src={flagUrl}
              alt={job.country?.name || 'Flag'}
              fill
              className="object-cover"
            />
          </div>
          <span className="text-xs font-bold text-[#172B45] font-sans">
            {job.country?.name || 'International'}
          </span>
        </div>

        {/* Top-Right: Trade Category / Featured Pill */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          {job.featured && (
            <div className="bg-[#E8A2C1] text-[#102B50] font-bold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#102B50]" />
              Featured
            </div>
          )}
          <div className="bg-[#102B50]/90 backdrop-blur-xs text-white border border-white/10 text-[10px] font-semibold px-2 py-0.5 rounded-md font-sans">
            {job.jobCategory?.name || 'General'}
          </div>
        </div>

        {/* Job Title on Gradient Overlay */}
        <div className="absolute bottom-3 left-3.5 right-3.5 text-white z-10">
          <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium mb-1">
            <span>পদসংখ্যা: {job.vacancyCount || 1} জন</span>
            <span className="text-slate-300 font-sans text-[10px]">কোড: {job.jobCode || 'SK-JOB'}</span>
          </div>
          <h3 className="text-base font-bold line-clamp-1 text-white group-hover:text-[#E8A2C1] transition-colors font-bengali">
            {job.title}
          </h3>
        </div>
      </div>

      {/* Card Body & Details */}
      <CardContent className="p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col justify-between font-bengali">
        <div className="space-y-3 text-xs text-[#66758A]">
          {/* Employer with Verified Badge */}
          <div className="flex items-center justify-between gap-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 text-[#172B45] font-medium truncate">
              <BriefcaseBusiness className="w-3.5 h-3.5 text-[#66758A] flex-shrink-0" />
              <span className="truncate">
                {job.employer?.companyName || 'অনুমোদিত বিদেশি নিয়োগকারী'}
              </span>
            </div>
            {job.employer?.verificationStatus === 'VERIFIED' ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#24856A] bg-[#24856A]/10 px-1.5 py-0.5 rounded flex-shrink-0">
                <CheckCircle2 className="w-3 h-3 text-[#24856A]" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center text-[10px] font-medium text-[#66758A] bg-[#F6F8FB] px-1.5 py-0.5 rounded border border-[#E4EAF1] flex-shrink-0">
                নিবন্ধিত
              </span>
            )}
          </div>

          {/* Salary Box */}
          <div className="p-2.5 bg-[#F6F8FB] border border-[#E4EAF1] rounded-lg flex items-center justify-between">
            <span className="text-[#66758A] text-[11px] font-medium flex items-center gap-1">
              <Banknote className="w-4 h-4 text-[#102B50]" />
              মাসিক বেতন:
            </span>
            <span className="font-bold text-[#102B50] text-xs sm:text-sm font-sans">
              {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
            </span>
          </div>

          {/* Experience & Deadline */}
          <div className="grid grid-cols-2 gap-2 pt-0.5 text-[11px]">
            <div className="flex items-center gap-1 text-[#66758A] truncate">
              <Clock className="w-3.5 h-3.5 text-[#66758A] flex-shrink-0" />
              <span className="truncate">
                {job.experienceRequired
                  ? `${job.experienceRequired} বছরের অভিজ্ঞতা`
                  : 'ফ্রেশার আবেদনযোগ্য'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[#66758A] truncate">
              <Calendar className="w-3.5 h-3.5 text-[#66758A] flex-shrink-0" />
              <span className="truncate">{formatDeadline(job.applicationDeadline)}</span>
            </div>
          </div>
        </div>

        {/* Dual Action CTAs */}
        <div className="pt-3 border-t border-[#E4EAF1] grid grid-cols-2 gap-2">
          <Link href={`/jobs/${job.slug || job.id}`} className="w-full">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs border border-[#E4EAF1] text-[#172B45] hover:bg-[#F6F8FB] hover:border-slate-300 font-semibold py-2"
            >
              বিস্তারিত দেখুন
            </Button>
          </Link>

          <Link href={`/portal/apply/${job.id}`} className="w-full">
            <Button
              variant="primary"
              size="sm"
              className="w-full text-xs bg-[#102B50] hover:bg-[#0B1D35] text-white font-semibold flex items-center justify-center gap-1 py-2"
            >
              আবেদন করুন
              <ArrowRight className="w-3 h-3 text-[#E8A2C1]" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
