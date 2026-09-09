'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  Briefcase,
  MapPin,
  Calendar,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';

export default function PortalApplicationsListPage() {
  const { language, t } = useLanguage();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApps() {
      try {
        const res = await fetch('/api/portal/applications');
        const data = await res.json();
        if (data.success) {
          setApplications(data.data);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    loadApps();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {t('রিক্রুটমেন্ট রেকর্ড', 'Recruitment Record')}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            {t('আমার চাকরির আবেদনসমূহ', 'My Job Applications')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t(
              'আপনার প্রতিটি আবেদনের সর্বশেষ যাচাই ও অনুমোদন অগ্রগতি পর্যবেক্ষণ করুন।',
              'Track real-time status and verification milestones for every submitted overseas position.'
            )}
          </p>
        </div>
        <Link
          href="/portal/jobs"
          className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>{t('নতুন চাকরি খুঁজুন', 'Browse Vacancies')}</span>
        </Link>
      </div>

      {/* Applications List */}
      {loading ? (
        <LoadingState text={t('আবেদনসমূহ লোড হচ্ছে...', 'Loading your job applications...')} />
      ) : applications.length === 0 ? (
        <EmptyState
          title={t('কোনো আবেদন পাওয়া যায়নি', 'No applications found')}
          description={t(
            'আপনি এখনও কোনো বিদেশি চাকরির পদে আবেদন করেননি। আমাদের অনুমোদিত শূন্যপদগুলোতে আবেদন করতে নিচের বাটনে ক্লিক করুন।',
            'You have not applied for any overseas positions yet. Explore active vacancies to begin your journey.'
          )}
          action={{
            label: t('চাকরির বিজ্ঞপ্তি দেখুন', 'Explore Available Jobs'),
            href: '/portal/jobs',
          }}
        />
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-700">
                    {app.applicationCode}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                    {app.status}
                  </span>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  {app.job?.title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1 text-slate-700 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {app.job?.country?.name}
                  </span>
                  {app.job?.employer && (
                    <>
                      <span>•</span>
                      <span>{app.job.employer.companyName}</span>
                    </>
                  )}
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(app.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href={`/portal/applications/${app.id}`}
                  className="h-9 px-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <span>{t('টাইমলাইন দেখুন', 'View Timeline')}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
