'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  FileCheck2,
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
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { RecruitmentProgressTracker } from '@/components/portal/recruitment-progress-tracker';

export default function PortalDashboardPage() {
  const { language, t } = useLanguage();
  const [profile, setProfile] = useState<any | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [visaCases, setVisaCases] = useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [pRes, aRes, iRes, vRes, invRes] = await Promise.all([
          fetch('/api/portal/profile'),
          fetch('/api/portal/applications'),
          fetch('/api/portal/interviews'),
          fetch('/api/portal/visa'),
          fetch('/api/portal/invoices'),
        ]);

        const [pData, aData, iData, vData, invData] = await Promise.all([
          pRes.json(),
          aRes.json(),
          iRes.json(),
          vRes.json(),
          invRes.json(),
        ]);

        if (pData.success) setProfile(pData.data);
        if (aData.success) setApplications(aData.data);
        if (iData.success) setInterviews(iData.data);
        if (vData.success) setVisaCases(vData.data);
        if (invData.success) setFinancialSummary(invData.data.summary);
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
  const upcomingInterview = interviews.find((i) => ['SCHEDULED', 'CONFIRMED'].includes(i.status));
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

      {/* 10-Stage Milestone Visual Progress Tracker (if candidate has applied) */}
      {primaryApplication && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-700">
                  {primaryApplication.applicationCode}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                  {primaryApplication.status}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                {primaryApplication.job?.title} • {primaryApplication.job?.country?.name}
              </h3>
            </div>
            <Link
              href={`/portal/applications/${primaryApplication.id}`}
              className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1 shrink-0"
            >
              <span>{t('সম্পূর্ণ টাইমলাইন দেখুন', 'View Full Timeline')}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <RecruitmentProgressTracker
            currentStage={primaryApplication.timeline?.find((t: any) => t.state === 'CURRENT')?.key || 'APPLICATION_SUBMITTED'}
          />
        </div>
      )}

      {/* Upcoming Interview Alert */}
      {upcomingInterview && (
        <div className="p-4 bg-purple-50 border border-purple-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-700 text-white flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-purple-950">
                {t('আসন্ন সাক্ষাৎকার নির্ধারিত হয়েছে', 'Upcoming Interview Scheduled')}
              </div>
              <div className="text-purple-800 mt-0.5">
                {new Date(upcomingInterview.scheduledAt).toLocaleString()} • {upcomingInterview.job?.title} (
                {upcomingInterview.interviewType})
              </div>
            </div>
          </div>
          <Link
            href="/portal/interviews"
            className="px-3 py-1.5 rounded-lg bg-purple-900 hover:bg-purple-800 text-white font-semibold text-xs transition-colors shrink-0 text-center"
          >
            {t('বিস্তারিত দেখুন', 'View Details')}
          </Link>
        </div>
      )}

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

        {/* Interviews */}
        <Link
          href="/portal/interviews"
          className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all block group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">
              {t('সাক্ষাৎকার', 'Interviews')}
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{interviews.length}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-slate-700">
            <span>{t('সময়সূচি দেখুন', 'Schedule & status')}</span>
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
                'অনুমোদিত রসিদ ছাড়া কোনো ধরনের আর্থিক লেনদেন করবেন না। ভিসা প্রাপ্তির সিদ্ধান্ত শুধুমাত্র সংশ্লিষ্ট দেশের দূতাবাস দ্বারা নির্ধারিত হয়। শাকিল গ্লোবাল ম্যানপাওয়ার শতভাগ আইনি প্রক্রিয়া মেনে সেবা প্রদানে প্রতিশ্রুতিবদ্ধ।',
                'Never pay recruitment fees without an official system-generated receipt. Visa issuance is exclusively determined by foreign embassies. SHAKIL GLOBAL MANPOWER ensures transparent and legal placement.'
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
