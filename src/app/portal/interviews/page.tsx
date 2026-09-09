'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  CheckCircle2,
  ExternalLink,
  Building2,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { useToast } from '@/components/ui/toast';

export default function PortalInterviewsPage() {
  const { success, error } = useToast();
  const { language, t } = useLanguage();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/portal/interviews');
      const data = await res.json();
      if (data.success) {
        setInterviews(data.data);
      } else {
        error(data.error || 'Failed to load interviews');
      }
    } catch {
      error('Failed to communicate with server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleConfirm = async (id: string) => {
    setConfirmingId(id);
    try {
      const res = await fetch(`/api/portal/interviews/${id}/confirm`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        success(t('উপস্থিতি সফলভাবে নিশ্চিত করা হয়েছে।', 'Attendance confirmed successfully'));
        fetchInterviews();
      } else {
        error(data.error || 'Failed to confirm attendance');
      }
    } catch {
      error('Error confirming attendance');
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
            {t('নির্বাচন ও পরীক্ষা', 'Selection & Assessment')}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
          {t('নিয়োগকারী ও কারিগরি সাক্ষাৎকার', 'Employer & Technical Interviews')}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {t(
            'বিদেশি নিয়োগকারী প্রতিষ্ঠানের সাথে সরাসরি বা অনলাইন সাক্ষাৎকার এবং প্র্যাকটিক্যাল ট্রেড টেস্টের সময়সূচি।',
            'Review scheduled employer selection sessions, online video meetings, and in-person agency trade tests.'
          )}
        </p>
      </div>

      {/* Interviews List */}
      {loading ? (
        <LoadingState text={t('সাক্ষাৎকারের তালিকা লোড হচ্ছে...', 'Loading your interview schedule...')} />
      ) : interviews.length === 0 ? (
        <EmptyState
          title={t('কোনো সাক্ষাৎকার নির্ধারিত নেই', 'No interviews scheduled yet')}
          description={t(
            'কোনো বিদেশি কোম্পানি আপনার প্রোফাইল বাছাই করলে বা প্রাথমিক পরীক্ষার জন্য মনোনীত করলে এখানে বিস্তারিত তালিকা দেখতে পাবেন।',
            'When an overseas employer shortlists your profile or schedules a trade test, session details and links will appear here.'
          )}
        />
      ) : (
        <div className="space-y-3">
          {interviews.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                    {item.interviewType} Interview
                  </span>
                  <span
                    className={`font-semibold text-[11px] px-2.5 py-0.5 rounded-full ${
                      item.status === 'CONFIRMED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : item.status === 'COMPLETED'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900">{item.job?.title}</h3>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 text-slate-800 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {new Date(item.scheduledAt).toLocaleString()}
                  </span>

                  {item.job?.employer && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {item.job.employer.companyName}
                      </span>
                    </>
                  )}

                  {item.location && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {item.location}
                      </span>
                    </>
                  )}
                </div>

                {item.meetingLink && (
                  <div className="pt-1">
                    <a
                      href={item.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-slate-900 hover:underline inline-flex items-center gap-1"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>{t('অনলাইন মিটিংয়ে যোগ দিন', 'Join Video Meeting')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {item.status === 'SCHEDULED' && (
                  <button
                    onClick={() => handleConfirm(item.id)}
                    disabled={confirmingId === item.id}
                    className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {confirmingId === item.id
                        ? t('নিশ্চিত করা হচ্ছে...', 'Confirming...')
                        : t('উপস্থিতি নিশ্চিত করুন', 'Confirm Attendance')}
                    </span>
                  </button>
                )}

                {item.status === 'CONFIRMED' && (
                  <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('উপস্থিতি নিশ্চিত করা হয়েছে', 'Attendance Confirmed')}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
