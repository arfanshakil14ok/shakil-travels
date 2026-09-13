import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  Briefcase,
  MapPin,
  Banknote,
  Clock,
  Calendar,
  Users,
  Building,
  GraduationCap,
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Utensils,
  Home,
  Bus,
  HeartPulse,
  Plane,
  Sparkles,
  PhoneCall,
  UserPlus,
} from 'lucide-react';
import prisma from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { getJobCategoryImage, getCountryFlagUrl, getCountryImage } from '@/lib/image-constants';
import { getCurrentApplicant } from '@/lib/portal-auth';
import { getCurrentUser } from '@/lib/auth';
import { calculateMatch } from '@/lib/matching';

export const dynamic = 'force-dynamic';

interface JobDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: JobDetailPageProps) {
  const { slug } = await params;
  const job = await prisma.job.findFirst({
    where: {
      OR: [{ slug }, { id: slug }, { jobCode: slug }],
      status: 'PUBLISHED',
      employer: {
        is: {
          verificationStatus: 'VERIFIED',
          status: 'ACTIVE',
        },
      },
    },
    include: {
      country: true,
      jobCategory: true,
    },
  });

  if (!job) {
    return {
      title: 'Job Circular Not Found | SHAKIL GLOBAL RECRUITMENT',
    };
  }

  return {
    title: `${job.title} in ${job.country.name} | SHAKIL GLOBAL RECRUITMENT (RL-1892)`,
    description: `Official job vacancy for ${job.title} in ${job.country.name}. Vacancies: ${job.vacancyCount}. Verified overseas employment through licensed recruitment agency RL-1892.`,
  };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { slug } = await params;
  
  // Check candidate portal session or staff user session
  const [applicant, staffUser] = await Promise.all([
    getCurrentApplicant(),
    getCurrentUser(),
  ]);

  const job = await prisma.job.findFirst({
    where: {
      OR: [{ slug }, { id: slug }, { jobCode: slug }],
      status: 'PUBLISHED',
      employer: {
        is: {
          verificationStatus: 'VERIFIED',
          status: 'ACTIVE',
        },
      },
    },
    include: {
      country: true,
      jobCategory: true,
      employer: true,
    },
  });

  if (!job) {
    notFound();
  }

  // Calculate remaining vacancies
  const remainingVacancies = Math.max(0, (job.vacancyCount || 0) - (job.filledCount || 0));

  // Candidate Match calculation if candidate is logged in
  let candidateMatch: any = null;
  let hasApplied = false;

  if (applicant) {
    try {
      candidateMatch = calculateMatch(applicant, job);
      const appCount = await prisma.application.count({
        where: { jobId: job.id, applicantId: applicant.id },
      });
      hasApplied = appCount > 0;
    } catch {
      // Fallback if matching engine encounter edge case
      candidateMatch = null;
    }
  }

  const categoryImg = getJobCategoryImage(job.jobCategory?.name, job.title);
  const flagUrl = getCountryFlagUrl(job.country?.code);
  const countryImg = getCountryImage(job.country?.code, job.country?.slug || job.country?.name);

  const formatSalary = () => {
    const cur = job.currency || 'BDT';
    const period = job.salaryPeriod ? ` / ${job.salaryPeriod.toLowerCase()}` : ' / মাস';
    if (!job.salaryMin && !job.salaryMax) return 'আলোচনা সাপেক্ষে (Negotiable)';
    if (job.salaryMin && job.salaryMax) {
      return `${cur} ${Number(job.salaryMin).toLocaleString()} - ${Number(job.salaryMax).toLocaleString()}${period}`;
    }
    if (job.salaryMin) {
      return `${cur} ${Number(job.salaryMin).toLocaleString()}+${period}`;
    }
    return `${cur} ${Number(job.salaryMax).toLocaleString()}${period}`;
  };

  const formatDeadline = (date?: Date | null) => {
    if (!date) return 'নির্দিষ্ট সময়সীমা নেই (Open until filled)';
    try {
      return new Date(date).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'নির্দিষ্ট সময়সীমা নেই';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-bengali">
          <Link href="/" className="hover:text-slate-900 transition-colors">হোম</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href="/jobs" className="hover:text-slate-900 transition-colors">চাকরি</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href={`/countries/${job.country.slug || job.country.id}`} className="hover:text-slate-900 transition-colors">
            {job.country.name}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-800 truncate max-w-xs">{job.title}</span>
        </nav>

        {/* Header Hero Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Top Banner Image */}
          <div className="relative h-48 sm:h-64 w-full bg-slate-900">
            <Image
              src={countryImg.src}
              alt={`${job.country.name} - ${job.title}`}
              fill
              priority
              className="object-cover opacity-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Country & Category Tags */}
            <div className="absolute top-4 left-4 sm:left-6 flex flex-wrap items-center gap-2">
              <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-md flex items-center gap-2">
                <div className="relative w-4 h-3 rounded-xs overflow-hidden">
                  <Image src={flagUrl} alt={job.country.name} fill className="object-cover" />
                </div>
                <span className="text-xs font-bold text-slate-900">{job.country.name}</span>
              </div>

              <div className="bg-navy-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                {job.jobCategory?.name || 'সাধারণ ক্যাটাগরি'}
              </div>

              {job.featured && (
                <div className="bg-gold-500 text-navy-950 font-bold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Featured Demand
                </div>
              )}
            </div>

            {/* Headline in banner bottom */}
            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 text-white">
              <div className="text-xs text-slate-300 font-mono mb-1">
                সার্কুলার কোড: {job.jobCode || 'SK-JOB'}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-bengali">
                {job.title}
              </h1>
            </div>
          </div>

          {/* Quick Summary Grid */}
          <div className="p-6 sm:p-8 bg-white grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-slate-100">
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1 font-bengali">
                <Banknote className="w-3.5 h-3.5" /> মাসিক বেতন
              </span>
              <div className="text-sm sm:text-base font-extrabold text-emerald-900 font-sans">
                {formatSalary()}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 font-bengali">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" /> মোট পদসংখ্যা ও কোটা
              </span>
              <div className="text-sm sm:text-base font-extrabold text-slate-900 font-sans">
                {job.vacancyCount || 1} জন কর্মী
                <span className="text-xs font-semibold text-emerald-700 ml-1.5 bg-emerald-100 px-1.5 py-0.5 rounded font-bengali">
                  {remainingVacancies} টি অবশিষ্ট
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 font-bengali">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> কাজের অভিজ্ঞতা
              </span>
              <div className="text-sm sm:text-base font-extrabold text-slate-900">
                {job.experienceRequired ? `${job.experienceRequired} বছর আবশ্যক` : 'অভিজ্ঞতা প্রযোজ্য নয়'}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 font-bengali">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> আবেদনের শেষ তারিখ
              </span>
              <div className="text-sm sm:text-base font-extrabold text-slate-900 font-sans">
                {formatDeadline(job.applicationDeadline)}
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Details Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Job Description */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 font-bengali">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                কাজের বিস্তারিত বিবরণ ও দায়িত্বসমূহ
              </h2>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {job.description || 'এই পদের জন্য বিস্তারিত বিবরণ সরাসরি অফিসে অথবা অনলাইনে আবেদন করার পর অবহিত করা হবে।'}
              </div>
            </div>

            {/* Requirements & Criteria */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 font-bengali">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                প্রয়োজনীয় শিক্ষাগত যোগ্যতা ও অন্যান্য শর্তাবলী
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-500">শিক্ষাগত যোগ্যতা:</span>
                  <p className="text-slate-800 font-semibold">{job.educationRequired || 'অষ্টম শ্রেণি / এসএসসি পাস অথবা সমমান'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-500">বয়সসীমা:</span>
                  <p className="text-slate-800 font-semibold">
                    {job.ageMin || 21} বছর থেকে {job.ageMax || 40} বছর পর্যন্ত
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-500">চুক্তির মেয়াদ:</span>
                  <p className="text-slate-800 font-semibold">{job.contractDuration || '২ বছর (নবায়নযোগ্য)'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-500">কাজের সময়:</span>
                  <p className="text-slate-800 font-semibold">{job.workingHours || '৮ ঘণ্টা দৈনিক, সপ্তাহে ৬ দিন (ওভারটাইম প্রযোজ্য)'}</p>
                </div>
              </div>

              {job.skillsRequired && (
                <div className="pt-2 text-xs">
                  <span className="font-bold text-slate-700 block mb-1">প্রয়োজনীয় কারিগরি দক্ষতা:</span>
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-700 leading-relaxed">
                    {job.skillsRequired}
                  </div>
                </div>
              )}
            </div>

            {/* Benefits & Facilities */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 font-bengali">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                কোম্পানি প্রদত্ত সুযোগ-সুবিধা ও সুরক্ষা
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${job.accommodation ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  <Home className="w-4 h-4" />
                  <span className="font-bold">আবাসন {job.accommodation ? 'ফ্রি' : 'আলোচনা সাপেক্ষ'}</span>
                </div>

                <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${job.food ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  <Utensils className="w-4 h-4" />
                  <span className="font-bold">খাবার {job.food ? 'ফ্রি / এলাউন্স' : 'নিজস্ব'}</span>
                </div>

                <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${job.transportation ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  <Bus className="w-4 h-4" />
                  <span className="font-bold">যাতায়াত {job.transportation ? 'কোম্পানির ব্যবস্থা' : 'আলোচনা সাপেক্ষ'}</span>
                </div>

                <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${job.medical ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  <HeartPulse className="w-4 h-4" />
                  <span className="font-bold">চিকিৎসা {job.medical ? 'বীমা কভারড' : 'আলোচনা সাপেক্ষ'}</span>
                </div>

                <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${job.airTicket ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  <Plane className="w-4 h-4" />
                  <span className="font-bold">বিমান টিকিট {job.airTicket ? 'প্রদত্ত' : 'চুক্তি অনুযায়ী'}</span>
                </div>
              </div>
            </div>

            {/* Official Legal & Anti-Fraud Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4 text-xs text-amber-950 font-bengali leading-relaxed">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-extrabold block text-amber-900">সরকারি নীতিমালা ও প্রতারণা সতর্কতা:</span>
                <p>
                  SHAKIL GLOBAL RECRUITMENT (RL-1892) বাংলাদেশ সরকারের প্রবাসী কল্যাণ ও বৈদেশিক কর্মসংস্থান মন্ত্রণালয় এবং BMET এর পূর্ণাঙ্গ নীতি অনুসরণ করে। কোনো মধ্যস্বত্বভোগী বা দালালের সাথে আর্থিক লেনদেন করবেন না। সমস্ত ফি অফিসের অফিসিয়াল রসিদের মাধ্যমে প্রদেয়।
                </p>
              </div>
            </div>
          </div>

          {/* Right Sidebar Column: Apply Card, Match Score & Employer Info */}
          <div className="lg:col-span-4 space-y-6">
            {/* Candidate Match Score Card (If Candidate Logged In) */}
            {candidateMatch && (
              <div className="bg-gradient-to-br from-indigo-50 via-white to-indigo-100/40 rounded-2xl p-6 border border-indigo-200 shadow-sm space-y-3 font-bengali">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> আপনার প্রোফাইল মিল (Match Score)
                  </span>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-indigo-600 text-white font-sans">
                    {candidateMatch.score}%
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        candidateMatch.score >= 80
                          ? 'bg-emerald-500'
                          : candidateMatch.score >= 60
                          ? 'bg-indigo-600'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${candidateMatch.score}%` }}
                    />
                  </div>
                  <div className="text-[11px] font-semibold text-slate-600 flex justify-between">
                    <span>{candidateMatch.levelLabel}</span>
                    <span>{candidateMatch.score >= 70 ? 'উচ্চ সম্ভাবনা' : 'আবেদন উপযোগী'}</span>
                  </div>
                </div>

                {/* Key match points */}
                <div className="pt-2 border-t border-indigo-100 text-[11px] text-slate-600 space-y-1">
                  {candidateMatch.criteria?.slice(0, 3).map((c: any, i: number) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className={c.matched ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                        {c.matched ? '✓' : '•'}
                      </span>
                      <span className="truncate">{c.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Apply Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 font-bengali sticky top-24">
              <h3 className="font-extrabold text-slate-900 text-base">আবেদন করার প্রক্রিয়া</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                অনলাইনে সরাসরি আবেদন করুন। আমাদের রিক্রুটমেন্ট টিম আপনার প্রোফাইল মূল্যায়ন করে ইন্টারভিউয়ের জন্য যোগাযোগ করবে।
              </p>

              {/* Dynamic Apply Action */}
              {hasApplied ? (
                <div className="w-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-center font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ইতিমধ্যে এই চাকরিতে আবেদন সম্পন্ন হয়েছে
                </div>
              ) : applicant ? (
                <Link href={`/portal/jobs?applyJobId=${job.id}`} className="block">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-sm flex items-center justify-center gap-2 shadow-md"
                  >
                    <UserPlus className="w-4 h-4" />
                    সরাসরি আবেদন জমা দিন (1-Click Apply)
                  </Button>
                </Link>
              ) : (
                <div className="space-y-2">
                  <Link href={`/portal/register?jobId=${job.id}`} className="block">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-sm flex items-center justify-center gap-2 shadow-md"
                    >
                      <UserPlus className="w-4 h-4" />
                      অনলাইনে আবেদন করুন (নতুন প্রার্থী)
                    </Button>
                  </Link>
                  <Link href={`/portal/login?redirect=/jobs/${job.slug || job.id}`} className="block">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs text-slate-700 hover:bg-slate-50"
                    >
                      লগইন করে আবেদন করুন
                    </Button>
                  </Link>
                </div>
              )}

              {/* Verified Employer Card */}
              {job.employer && (
                <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    নিয়োগকারী প্রতিষ্ঠান
                  </span>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-indigo-600" />
                      {job.employer.companyName}
                    </div>
                    {job.employer.companyNameLocal && (
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {job.employer.companyNameLocal}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified Employer
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Destination Country Card */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  গন্তব্য দেশ সংক্রান্ত তথ্য
                </span>
                <Link
                  href={`/countries/${job.country.slug || job.country.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-300 bg-slate-50 transition-colors group"
                >
                  <div className="relative w-10 h-8 rounded-md overflow-hidden flex-shrink-0">
                    <Image src={countryImg.src} alt={job.country.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 truncate">
                      {job.country.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      ভিসা ও প্রবাস নির্দেশিকা দেখুন
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                </Link>
              </div>

              {/* Helpline Assistance */}
              <div className="pt-4 border-t border-slate-100 text-xs text-slate-600 space-y-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                  প্রয়োজনে পরামর্শ নিন:
                </span>
                <p className="text-[11px] text-slate-500">
                  সকাল ৯টা থেকে সন্ধ্যা ৬টা পর্যন্ত আমাদের ক্যারিয়ার কাউন্সিলিং টিম সহায়তায় প্রস্তুত।
                </p>
                <div className="font-mono font-bold text-slate-800 text-xs">
                  হটলাইন:{' '}
                  <a href="tel:01913681771" className="text-emerald-700 hover:underline">
                    01913681771
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
