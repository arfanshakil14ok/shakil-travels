'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Search,
  MapPin,
  Building2,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  X,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { useToast } from '@/components/ui/toast';

export default function PortalJobsPage() {
  const { success, error } = useToast();
  const { language, t } = useLanguage();
  const [jobs, setJobs] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Apply Modal
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyNotes, setApplyNotes] = useState('');
  const [applying, setApplying] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        search,
      });
      if (countryFilter !== 'ALL') params.append('countryId', countryFilter);
      if (categoryFilter !== 'ALL') params.append('categoryId', categoryFilter);

      const res = await fetch(`/api/portal/jobs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.data.items);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        error(data.error || 'Failed to load jobs');
      }
    } catch {
      error('Failed to communicate with server');
    } finally {
      setLoading(false);
    }
  }, [page, search, countryFilter, categoryFilter, error]);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [cRes, catRes] = await Promise.all([
          fetch('/api/countries'),
          fetch('/api/job-categories'),
        ]);
        const cData = await cRes.json();
        const catData = await catRes.json();
        if (cData.success) setCountries(cData.data);
        if (catData.success) setCategories(catData.data);
      } catch {
        // silent
      }
    }
    loadMeta();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleOpenApply = (job: any) => {
    setSelectedJob(job);
    setApplyNotes('');
    setIsApplyModalOpen(true);
  };

  const handleConfirmApply = async () => {
    if (!selectedJob) return;
    setApplying(true);
    try {
      const res = await fetch(`/api/portal/jobs/${selectedJob.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: applyNotes }),
      });
      const data = await res.json();
      if (data.success) {
        success(t('আবেদন সফলভাবে জমা দেওয়া হয়েছে।', 'Application submitted successfully'));
        setIsApplyModalOpen(false);
        fetchJobs();
      } else {
        error(data.error || 'Failed to submit application');
      }
    } catch {
      error('Error submitting application');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
            {t('প্রবাসী নিয়োগ', 'Overseas Vacancies')}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
          {t('অনুমোদিত বৈদেশিক চাকরির শূন্যপদ', 'Overseas Employment Opportunities')}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {t(
            'সরকারি অনুমোদনপ্রাপ্ত বৈদেশিক নিয়োগের শূন্যপদসমূহ। সকল নিয়োগ আইনি ফ্রেমওয়ার্ক অনুযায়ী পরিচালিত হয়।',
            'Explore government-registered vacancies. All placements strictly follow legal bilateral recruitment guidelines.'
          )}
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200/90 p-4 rounded-xl shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder={t('ট্রেড, পদবী বা কোড খুঁজুন...', 'Search trade, title, or code...')}
            className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            className="h-9 text-xs bg-white border border-slate-300 rounded-lg px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
            value={countryFilter}
            onChange={(e) => {
              setCountryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">{t('সকল দেশ', 'All Countries')}</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="h-9 text-xs bg-white border border-slate-300 rounded-lg px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">{t('সকল ক্যাটাগরি', 'All Categories')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <button
            onClick={fetchJobs}
            disabled={loading}
            className="h-9 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center justify-center cursor-pointer"
            title={t('রিফ্রেশ করুন', 'Refresh')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Jobs Grid */}
      {loading && jobs.length === 0 ? (
        <LoadingState text={t('চাকরির বিজ্ঞপ্তি লোড হচ্ছে...', 'Finding overseas vacancies...')} />
      ) : jobs.length === 0 ? (
        <EmptyState
          title={t('কোনো পদ পাওয়া যায়নি', 'No open positions found')}
          description={t(
            'অনুসন্ধানের শর্ত পরিবর্তন করে বা ভিন্ন দেশ নির্বাচন করে পুনরায় চেষ্টা করুন।',
            'Try adjusting your search query or country filter.'
          )}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-xs text-slate-700 font-bold">
                    {job.jobCode}
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold border border-slate-200">
                    {job.category?.name || 'General'}
                  </span>
                </div>

                <h3 className="font-bold text-sm sm:text-base text-slate-900 line-clamp-1">
                  {job.title}
                </h3>

                <div className="space-y-1.5 mt-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.country?.name}</span>
                  </div>

                  {job.employer && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{job.employer.companyName}</span>
                    </div>
                  )}

                  {job.salaryMin && (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>
                        {job.salaryMin} - {job.salaryMax || ''} {job.salaryCurrency}
                      </span>
                    </div>
                  )}
                </div>

                {job.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {job.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100">
                {job.hasApplied ? (
                  <Link
                    href={`/portal/applications/${job.applicationId}`}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200/70 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-700" />
                    <span>{t('আবেদন জমা হয়েছে', 'Application Submitted')} ({job.applicationCode})</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => handleOpenApply(job)}
                    className="w-full h-9 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{t('আবেদন করুন', 'Apply for Position')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clean Apply Modal */}
      {selectedJob && isApplyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-xl shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {t('আবেদন:', 'Apply:')} {selectedJob.title}
              </h3>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div>
                  <span className="text-slate-500">{t('চাকরির কোড:', 'Job Code:')}</span>{' '}
                  <span className="font-mono font-bold text-slate-800">{selectedJob.jobCode}</span>
                </div>
                <div>
                  <span className="text-slate-500">{t('গন্তব্য দেশ:', 'Country:')}</span>{' '}
                  <span className="font-semibold text-slate-800">{selectedJob.country?.name}</span>
                </div>
                {selectedJob.salaryMin && (
                  <div>
                    <span className="text-slate-500">{t('আনুমানিক বেতন:', 'Estimated Salary:')}</span>{' '}
                    <span className="font-semibold text-emerald-700">
                      {selectedJob.salaryMin} {selectedJob.salaryCurrency}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  {t('সংক্ষিপ্ত অভিজ্ঞতা নোট / বার্তা (ঐচ্ছিক)', 'Cover Note / Trade Experience (Optional)')}
                </label>
                <textarea
                  rows={3}
                  className="w-full text-xs p-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                  placeholder={t('আপনার কাজের অভিজ্ঞতা সম্পর্কে সংক্ষিপ্ত বিবরণ দিন...', 'Briefly describe your trade skills...')}
                  value={applyNotes}
                  onChange={(e) => setApplyNotes(e.target.value)}
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-slate-600 mt-0.5 shrink-0" />
                <span>
                  {t(
                    'আবেদন জমা দিলে তা আনুষ্ঠানিকভাবে ডাটাবেজে সংরক্ষিত হবে এবং নিয়োগকারী কোম্পানি কর্তৃক পর্যালোচনা করা হবে।',
                    'Submitting an application creates an official recruitment record for employer review.'
                  )}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="h-9 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                >
                  {t('বাতিল', 'Cancel')}
                </button>
                <button
                  onClick={handleConfirmApply}
                  disabled={applying}
                  className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {applying ? t('আবেদন জমা হচ্ছে...', 'Submitting...') : t('আবেদন নিশ্চিত করুন', 'Confirm Application')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
