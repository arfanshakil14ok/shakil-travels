'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  FileCheck2,
  FileText,
  Calendar,
  Stamp,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Upload,
  User,
  ShieldCheck,
  ChevronRight,
  Receipt,
  Sparkles,
  Building2,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';

export default function PortalDashboardPage() {
  const { language, t } = useLanguage();
  const [profile, setProfile] = useState<any | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [visaCases, setVisaCases] = useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = useState<any | null>(null);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [pRes, aRes, dRes, vRes, invRes, recRes] = await Promise.all([
          fetch('/api/portal/profile'),
          fetch('/api/portal/applications'),
          fetch('/api/portal/documents'),
          fetch('/api/portal/visa'),
          fetch('/api/portal/invoices'),
          fetch('/api/portal/jobs/recommended'),
        ]);

        const [pData, aData, dData, vData, invData, recData] = await Promise.all([
          pRes.json(),
          aRes.json(),
          dRes.json(),
          vRes.json(),
          invRes.json(),
          recRes.json(),
        ]);

        if (pData.success) setProfile(pData.data);
        if (aData.success) setApplications(aData.data);
        if (dData.success) setDocumentsCount(dData.data?.documents?.length || 0);
        if (vData.success) setVisaCases(vData.data);
        if (invData.success) setFinancialSummary(invData.data.summary);
        if (recData?.success) setRecommendedJobs(recData.data || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingState text={t('ড্যাশবোর্ড লোড হচ্ছে...', 'Loading your recruitment dashboard...')} />
      </div>
    );
  }

  const completion = profile?.completion?.percentage || 0;
  const missing = profile?.completion?.missingFields || [];
  const activeVisa = visaCases.find((v) => !['REJECTED', 'CANCELLED'].includes(v.status));
  const primaryApplication = applications[0] || null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Welcome & Profile Strength Banner */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {t('প্রার্থী ড্যাশবোর্ড', 'Candidate Dashboard')}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t('স্বাগতম', 'Welcome back')}, {profile?.fullName || 'Candidate'}!
          </h1>
          <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
            <span>
              {t('প্রার্থী আইডি', 'Candidate ID')}:{' '}
              <strong className="font-mono text-slate-800">{profile?.applicantNumber || 'SG-CANDIDATE'}</strong>
            </span>
            {profile?.preferredCountry && (
              <>
                <span>•</span>
                <span>
                  {t('পছন্দের দেশ', 'Preferred Country')}:{' '}
                  <strong className="text-slate-800">{profile.preferredCountry.name}</strong>
                </span>
              </>
            )}
          </p>
        </div>

        {/* Profile Strength Meter */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 min-w-[240px]">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-600" />
              {t('প্রোফাইল পূর্ণতা', 'Profile Completion')}
            </span>
            <span className={completion >= 80 ? 'text-emerald-700' : 'text-amber-700'}>
              {completion}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mb-2">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                completion >= 80 ? 'bg-emerald-600' : 'bg-amber-500'
              }`}
              style={{ width: `${completion}%` }}
            />
          </div>
          {missing.length > 0 ? (
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span className="truncate max-w-[150px]">
                {t('অপূর্ণ:', 'Missing:')} {missing.slice(0, 2).join(', ')}
              </span>
              <Link
                href="/portal/profile"
                className="text-slate-900 font-bold hover:underline text-[11px] shrink-0"
              >
                {t('সম্পূর্ণ করুন', 'Complete')}
              </Link>
            </div>
          ) : (
            <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {t('প্রোফাইল সম্পূর্ণ হয়েছে', 'Profile 100% Completed')}
            </div>
          )}
        </div>
      </div>

      {/* 4 KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Applications */}
        <Link
          href="/portal/applications"
          className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all block group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">
              {t('আমার আবেদন', 'Applications')}
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <FileCheck2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{applications.length}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-slate-700">
            <span>{t('আবেদনের তালিকা', 'View pipeline')}</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Documents */}
        <Link
          href="/portal/documents"
          className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all block group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">
              {t('নথিপত্র ও সনদ', 'Documents')}
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{documentsCount}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-slate-700">
            <span>{t('ফাইল ও ভেরিফিকেশন', 'Uploaded files')}</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Visa Tracking */}
        <Link
          href="/portal/visa"
          className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all block group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">
              {t('ভিসা ফাইল', 'Visa Status')}
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Stamp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-sm sm:text-base font-bold text-slate-900 truncate">
            {activeVisa ? activeVisa.status : t('প্রক্রিয়াধীন নেই', 'None Active')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-slate-700">
            <span>{t('রেডিনেস চেকলিস্ট', 'Readiness checklist')}</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Outstanding Due */}
        <Link
          href="/portal/invoices"
          className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all block group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">
              {t('বকেয়া ফি', 'Outstanding Due')}
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ৳{financialSummary?.totalDue ? Number(financialSummary.totalDue).toLocaleString() : '0'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-slate-700">
            <span>{t('রসিদ ও ইনভয়েস', 'Official receipts')}</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Recommended Jobs Section */}
      {recommendedJobs.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-xl p-5 sm:p-6 text-white shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-800/60 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                {t('আপনার জন্য বাছাইকৃত চাকরি', 'Recommended Jobs For You')}
              </h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                {t('আপনার দক্ষতা, অভিজ্ঞতা ও পছন্দের দেশের সাথে ১০০% মিল রেখে নির্ধারিত সার্কুলার।', 'Vacancies tailored to your skills, trade, and destination preference.')}
              </p>
            </div>
            <Link
              href="/portal/jobs"
              className="text-xs font-semibold text-indigo-300 hover:text-white flex items-center gap-1"
            >
              <span>{t('সকল চাকরি দেখুন', 'View All Jobs')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendedJobs.slice(0, 3).map(({ job, match, hasApplied }: any) => (
              <div
                key={job.id}
                className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl p-4 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      {match.score}% {match.level}
                    </span>
                    <span className="text-xs text-slate-300 flex items-center gap-1">
                      <span>{job.country?.flag || '🌐'}</span>
                      <span>{job.country?.name}</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white mt-2 line-clamp-1">
                    {job.title}
                  </h3>

                  <div className="mt-1 text-xs text-indigo-200">
                    {job.jobCategory?.name} • {job.salaryMin ? `${job.salaryMin} - ${job.salaryMax} ${job.currency}` : 'Negotiable'}
                  </div>

                  <div className="mt-2 text-[11px] text-slate-300 flex items-center gap-2">
                    <span className="text-emerald-300 font-semibold">{job.remainingVacancies ?? job.vacancyCount} vacancies left</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <Link
                    href={`/jobs/${job.slug}`}
                    className="text-xs text-indigo-300 hover:text-white underline"
                    target="_blank"
                  >
                    {t('বিস্তারিত', 'Details')}
                  </Link>

                  {hasApplied ? (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Applied
                    </span>
                  ) : (
                    <Link
                      href={`/portal/jobs?applyJobId=${job.id}`}
                      className="px-3 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-xs"
                    >
                      {t('আবেদন করুন', 'Apply')}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Applications */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-700" />
              {t('সাম্প্রতিক আবেদনসমূহ', 'Recent Applications')}
            </h3>
            <Link
              href="/portal/jobs"
              className="text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1"
            >
              <span>{t('নতুন চাকরি খুঁজুন', 'Browse Jobs')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {applications.length === 0 ? (
            <EmptyState
              title={t('এখনও কোনো চাকরির আবেদন করা হয়নি', 'No applications submitted yet')}
              description={t(
                'আমাদের অনুমোদিত বিদেশি চাকরির বিজ্ঞপ্তি দেখুন এবং আপনার পছন্দের পদে আবেদন করুন।',
                'Explore government-approved overseas vacancies and submit your application with a single click.'
              )}
              action={{
                label: t('চাকরির বিজ্ঞপ্তি দেখুন', 'Browse Overseas Jobs'),
                href: '/portal/jobs',
              }}
            />
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 4).map((app) => (
                <Link
                  key={app.id}
                  href={`/portal/applications/${app.id}`}
                  className="block p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-sm text-slate-900">
                        {app.job?.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                        <span>{app.job?.country?.name}</span>
                        <span>•</span>
                        <span className="font-mono text-xs">{app.applicationCode}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                      {app.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                    <span>
                      {t('আবেদনের তারিখ:', 'Applied:')}{' '}
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-slate-900 font-medium flex items-center gap-1">
                      {t('টাইমলাইন দেখুন', 'View Progress')}{' '}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Actions & Trust Notice */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {t('কুইক একশন', 'Quick Actions')}
            </h3>
            <div className="space-y-2">
              <Link
                href="/portal/documents"
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>{t('পাসপোর্ট ও এনআইডি আপলোড', 'Upload Documents')}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                href="/portal/profile"
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  <span>{t('দক্ষতা ও অভিজ্ঞতা আপডেট', 'Update Profile & Skills')}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                href="/portal/invoices"
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-500" />
                  <span>{t('ইনভয়েস ও ব্যাংক রসিদ', 'Invoices & Receipts')}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Compliance & Trust Notice */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 text-xs text-slate-600 space-y-2">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-slate-700 shrink-0" />
              <span>{t('সরকারি অনুমোদন ও সততা বিজ্ঞপ্তি', 'Government Agency Notice')}</span>
            </div>
            <p className="leading-relaxed text-[11px] text-slate-500">
              {t(
                'অনুমোদিত রসিদ ছাড়া কোনো ধরনের আর্থিক লেনদেন করবেন না। ভিসা প্রাপ্তির সিদ্ধান্ত শুধুমাত্র সংশ্লিষ্ট দেশের দূতাবাস দ্বারা নির্ধারিত হয়। শাকিল ট্রাভেলস শতভাগ আইনি প্রক্রিয়া মেনে সেবা প্রদানে প্রতিশ্রুতিবদ্ধ।',
                'Never pay recruitment fees without an official system-generated receipt. Visa issuance is exclusively determined by foreign embassies. SHAKIL TRAVELS ensures transparent and legal placement.'
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
