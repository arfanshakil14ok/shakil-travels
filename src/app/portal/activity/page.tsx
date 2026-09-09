'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Upload,
  FileCheck2,
  FileText,
  User,
  LogIn,
  Calendar,
  Stamp,
  Receipt,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';

const ACTION_CONFIG: Record<string, { icon: any; color: string; bg: string; labelBn: string; labelEn: string }> = {
  DOCUMENT_UPLOADED: {
    icon: Upload,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    labelBn: 'নথি আপলোড করা হয়েছে',
    labelEn: 'Document Uploaded',
  },
  DOCUMENT_REPLACED: {
    icon: RefreshCw,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    labelBn: 'নথি প্রতিস্থাপন করা হয়েছে',
    labelEn: 'Document Replaced',
  },
  DOCUMENT_DELETED: {
    icon: FileText,
    color: 'text-rose-600',
    bg: 'bg-rose-50 border-rose-200',
    labelBn: 'নথি মুছে ফেলা হয়েছে',
    labelEn: 'Document Deleted',
  },
  DOCUMENT_VERIFIED: {
    icon: FileCheck2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
    labelBn: 'নথি অনুমোদিত ও যাচাইকৃত',
    labelEn: 'Document Verified',
  },
  DOCUMENT_REJECTED: {
    icon: AlertCircle,
    color: 'text-rose-600',
    bg: 'bg-rose-50 border-rose-200',
    labelBn: 'নথি সংশোধন প্রয়োজন / প্রত্যাখ্যাত',
    labelEn: 'Document Rejected',
  },
  PROFILE_UPDATED: {
    icon: User,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 border-indigo-200',
    labelBn: 'প্রোফাইল তথ্য আপডেট',
    labelEn: 'Profile Updated',
  },
  LOGIN: {
    icon: LogIn,
    color: 'text-slate-600',
    bg: 'bg-slate-100 border-slate-200',
    labelBn: 'সিস্টেমে লগইন',
    labelEn: 'Account Login',
  },
  APPLICATION_CREATED: {
    icon: FileCheck2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
    labelBn: 'চাকরিতে নতুন আবেদন জমা',
    labelEn: 'Job Application Submitted',
  },
  APPLICATION_STATUS_CHANGED: {
    icon: Activity,
    color: 'text-teal-600',
    bg: 'bg-teal-50 border-teal-200',
    labelBn: 'আবেদনের অগ্রগতি হালনাগাদ',
    labelEn: 'Application Status Updated',
  },
  INTERVIEW_SCHEDULED: {
    icon: Calendar,
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
    labelBn: 'সাক্ষাৎকার নির্ধারিত হয়েছে',
    labelEn: 'Interview Scheduled',
  },
  VISA_STATUS_CHANGED: {
    icon: Stamp,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50 border-cyan-200',
    labelBn: 'ভিসা প্রক্রিয়ার অগ্রগতি',
    labelEn: 'Visa Processing Update',
  },
  INVOICE_CREATED: {
    icon: Receipt,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    labelBn: 'ইনভয়েস ইস্যু করা হয়েছে',
    labelEn: 'Invoice Issued',
  },
  PAYMENT_RECORDED: {
    icon: CreditCard,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
    labelBn: 'পেমেন্ট জমা ও রসিদ তৈরি',
    labelEn: 'Payment Recorded',
  },
};

export default function PortalActivityPage() {
  const { language, t } = useLanguage();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActivities() {
      try {
        const res = await fetch('/api/portal/activity');
        const data = await res.json();
        if (data.success) {
          setActivities(data.data);
        }
      } catch (err) {
        console.error('Failed to load candidate activity', err);
      } finally {
        setLoading(false);
      }
    }
    loadActivities();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {t('অ্যাকাউন্ট কার্যক্রম', 'Account Activity')}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            {t('কার্যক্রম ও অগ্রগতি টাইমলাইন', 'Activity & Progress Log')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t(
              'আপনার পোর্টাল কার্যক্রম, নথি যাচাই ও নিয়োগ প্রক্রিয়ার সকল আপডেটের সম্পূর্ণ ইতিহাস।',
              'A complete chronological timeline of your documents, applications, and account events.'
            )}
          </p>
        </div>
      </div>

      {/* Activity Timeline */}
      {loading ? (
        <LoadingState text={t('কার্যক্রম তালিকা লোড হচ্ছে...', 'Loading activity log...')} />
      ) : activities.length === 0 ? (
        <EmptyState
          title={t('এখনও কোনো কার্যক্রম রেকর্ড নেই', 'No activity records found')}
          description={t(
            'আপনি যখন প্রোফাইল আপডেট করবেন বা কোনো নথি আপলোড করবেন, তার রেকর্ড এখানে দেখা যাবে।',
            'When you update your profile, submit applications, or upload documents, your activities will appear here.'
          )}
        />
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs">
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {activities.map((item) => {
              const cfg = ACTION_CONFIG[item.action] || {
                icon: Activity,
                color: 'text-slate-600',
                bg: 'bg-slate-100 border-slate-200',
                labelBn: item.action.replace(/_/g, ' '),
                labelEn: item.action.replace(/_/g, ' '),
              };
              const Icon = cfg.icon;

              return (
                <div key={item.id} className="relative flex items-start gap-4">
                  {/* Timeline Dot/Icon */}
                  <div
                    className={`absolute -left-6 sm:-left-8 w-7 h-7 sm:w-8 sm:h-8 rounded-full border ${cfg.bg} flex items-center justify-center shrink-0 shadow-xs`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 sm:p-4 hover:border-slate-300 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        {language === 'bn' ? cfg.labelBn : cfg.labelEn}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(item.createdAt).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </p>

                    {item.metadata && (
                      <div className="mt-2 text-[11px] text-slate-500 font-mono bg-white px-2.5 py-1.5 rounded-md border border-slate-200/70 inline-block">
                        {item.metadata.fileName && <span>{t('ফাইল:', 'File:')} {item.metadata.fileName}</span>}
                        {item.metadata.documentType && <span className="ml-2 font-semibold">({item.metadata.documentType})</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
