'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  FileCheck2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Briefcase,
  MapPin,
  Building2,
  Calendar,
  FileText,
  Stamp,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { RecruitmentProgressTracker } from '@/components/portal/recruitment-progress-tracker';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

export default function PortalApplicationDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { language, t } = useLanguage();

  const [application, setApplication] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const loadApp = useCallback(async () => {
    try {
      const res = await fetch(`/api/portal/applications/${id}`);
      const data = await res.json();
      if (data.success) {
        setApplication(data.data);
      } else {
        setErrorMsg(data.error || 'Failed to load application');
      }
    } catch {
      setErrorMsg('Network error while loading application details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadApp();
  }, [id, loadApp]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawReason.trim()) return;
    try {
      setIsWithdrawing(true);
      const res = await fetch(`/api/applications/${id}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalReason: withdrawReason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to withdraw');
      setIsWithdrawOpen(false);
      setWithdrawReason('');
      loadApp();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <LoadingState text={t('আবেদনের অগ্রগতি লোড হচ্ছে...', 'Loading application milestone progress...')} />
      </div>
    );
  }

  if (errorMsg || !application) {
    return (
      <div className="max-w-md mx-auto py-12">
        <EmptyState
          title={t('আবেদনটি পাওয়া যায়নি', 'Application not found')}
          description={errorMsg || t('অনুরোধকৃত আবেদনটি বিদ্যমান নেই বা সরানো হয়েছে।', 'The requested application does not exist or was removed.')}
          action={{
            label: t('সকল আবেদনে ফিরে যান', 'Back to My Applications'),
            href: '/portal/applications',
          }}
        />
      </div>
    );
  }

  const currentTimelineStep = application.timeline?.find((t: any) => t.state === 'CURRENT');
  const currentKey = currentTimelineStep?.key || 'APPLICATION_SUBMITTED';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/portal/applications"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t('সকল আবেদনে ফিরে যান', 'Back to My Applications')}</span>
      </Link>

      {/* Top Application Header */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-slate-700">
              {application.applicationCode}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
              {application.status}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">
            {application.job?.title}
          </h1>
          <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 text-slate-800 font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {application.job?.country?.name}
            </span>
            {application.job?.employer && (
              <>
                <span>•</span>
                <span>{application.job.employer.companyName}</span>
              </>
            )}
          </div>
        </div>

        {application.visaApplication && (
          <Link
            href="/portal/visa"
            className="h-9 px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Stamp className="w-4 h-4" />
            <span>{t('ভিসা ফাইল দেখুন', 'Track Visa Case')}</span>
          </Link>
        )}
      </div>

      {/* Horizontal Milestone Tracker */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-700" />
            {t('রিক্রুটমেন্ট মাইলস্টোন ট্র্যাকার', 'Recruitment Milestone Tracker')}
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {t('১০-ধাপের আনুষ্ঠানিক প্রক্রিয়া', '10-Stage Official Process')}
          </span>
        </div>

        <RecruitmentProgressTracker currentStage={currentKey} />
      </div>

      {/* Detailed Milestone Step-by-Step List */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm sm:text-base text-slate-900 pb-2 border-b border-slate-100">
          {t('ধাপভিত্তিক বিস্তারিত বিবরণ', 'Step-by-Step Milestone Details')}
        </h3>

        <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 my-4 ml-3">
          {application.timeline?.map((step: any, idx: number) => {
            const isCompleted = step.state === 'COMPLETED';
            const isCurrent = step.state === 'CURRENT';
            return (
              <div key={step.key} className="relative">
                {/* Dot / Number indicator */}
                <div
                  className={`absolute -left-[31px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center border text-[10px] font-bold transition-all ${
                    isCompleted
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : isCurrent
                      ? 'bg-slate-900 border-slate-900 text-white ring-4 ring-slate-200'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs sm:text-sm font-semibold ${
                        isCurrent
                          ? 'text-slate-900'
                          : isCompleted
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                    {isCurrent && (
                      <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-slate-900 text-white uppercase">
                        {t('চলমান ধাপ', 'Current Stage')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Interviews & Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Interviews Section */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3">
          <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Calendar className="w-4 h-4 text-slate-700" />
            {t('নির্ধারিত সাক্ষাৎকার', 'Scheduled Interviews')}
          </h4>
          {application.interviews?.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              {t('এখনও কোনো সাক্ষাৎকার নির্ধারিত হয়নি।', 'No interviews scheduled yet.')}
            </p>
          ) : (
            <div className="space-y-2.5">
              {application.interviews.map((item: any) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>{item.interviewType} Interview</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 text-slate-800 font-bold">
                      {item.status}
                    </span>
                  </div>
                  <div className="text-slate-500">
                    {new Date(item.interviewDate).toLocaleString()}
                  </div>
                  {item.location && <div className="text-slate-600">Location: {item.location}</div>}
                  {item.meetingLink && (
                    <a
                      href={item.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-900 font-semibold hover:underline inline-flex items-center gap-1 pt-1"
                    >
                      <span>Join Meeting</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents Section */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700" />
              {t('সংযুক্ত নথিপত্র', 'Attached Documents')}
            </h4>
            <Link
              href="/portal/documents"
              className="text-xs text-slate-900 font-semibold hover:underline"
            >
              {t('আপলোড করুন', 'Upload More →')}
            </Link>
          </div>
          {application.documents?.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              {t('এই আবেদনে কোনো নথি সংযুক্ত নেই।', 'No specific documents attached yet.')}
            </p>
          ) : (
            <div className="space-y-2.5">
              {application.documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{doc.title || doc.fileName}</div>
                    <div className="text-slate-400 text-[10px]">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      doc.isVerified
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {doc.isVerified ? 'Verified' : 'Under Review'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Withdrawal Section if eligible */}
        {!['SELECTED', 'WITHDRAWN', 'REJECTED', 'DEPLOYED'].includes(application.status) && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-slate-800">আবেদন প্রত্যাহার করতে চান? (Withdraw Application)</div>
              <div className="text-slate-500">ব্যক্তিগত বা অন্য কোনো কারণে এই আবেদনটি বাতিল করতে পারেন।</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsWithdrawOpen(true)}
              className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 font-medium"
            >
              Withdraw Application
            </Button>
          </div>
        )}
      </div>

      {/* Candidate Withdrawal Modal */}
      <Modal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        title="আবেদন প্রত্যাহার নিশ্চিতকরণ (Withdraw Application)"
        maxWidth="md"
      >
        <form onSubmit={handleWithdraw} className="space-y-4">
          <p className="text-xs text-slate-600">
            আপনি কি নিশ্চিত যে আপনি &quot;{application.job?.title}&quot; পদের আবেদনটি প্রত্যাহার করতে চান?
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              প্রত্যাহারের কারণ উল্লেখ করুন (Reason for withdrawal) *
            </label>
            <textarea
              required
              rows={3}
              value={withdrawReason}
              onChange={(e) => setWithdrawReason(e.target.value)}
              placeholder="ব্যক্তিগত কারণ / অন্য চাকরি পাওয়া গিয়েছে..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsWithdrawOpen(false)}>
              ফিরে যান (Cancel)
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isWithdrawing}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs"
            >
              {isWithdrawing ? 'প্রত্যাহার হচ্ছে...' : 'প্রত্যাহার নিশ্চিত করুন (Confirm)'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
