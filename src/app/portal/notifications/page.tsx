'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink,
  Check,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { useToast } from '@/components/ui/toast';

export default function PortalNotificationsPage() {
  const { success, error } = useToast();
  const { language, t } = useLanguage();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/portal/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.notifications);
      }
    } catch {
      error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('/api/portal/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      const data = await res.json();
      if (data.success) {
        success(t('সকল নোটিফিকেশন পড়া হয়েছে।', 'All marked as read'));
        fetchNotifs();
      }
    } catch {
      error('Error updating notifications');
    }
  };

  const handleMarkOne = async (id: string) => {
    try {
      await fetch('/api/portal/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      fetchNotifs();
    } catch {
      // silent
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {t('বার্তা ও এলার্ট', 'Alerts & Notices')}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            {t('নোটিফিকেশন ও জরুরি নোটিশ', 'Notifications & Operational Alerts')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t(
              'সাক্ষাৎকারের সময়সূচি, নথি যাচাই অনুমোদন এবং ভিসা সংক্রান্ত তাৎক্ষণিক আপডেট।',
              'Official operational notices, interview reminders, document approvals, and visa status changes.'
            )}
          </p>
        </div>

        <button
          onClick={handleMarkAllAsRead}
          disabled={loading || notifications.every((n) => n.isRead)}
          className="h-9 px-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          <span>{t('সব পড়া হিসেবে চিহ্নিত করুন', 'Mark all as read')}</span>
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <LoadingState text={t('নোটিফিকেশন লোড হচ্ছে...', 'Loading alerts and notices...')} />
      ) : notifications.length === 0 ? (
        <EmptyState
          title={t('কোনো নতুন নোটিফিকেশন নেই', 'No notifications yet')}
          description={t(
            'আপনার আবেদন, সাক্ষাৎকার বা নথিপত্র সম্পর্কিত কোনো নতুন তথ্য এলে এখানে দেখতে পাবেন।',
            'Important updates regarding your applications, interview schedules, and documents will appear here.'
          )}
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                n.isRead
                  ? 'bg-white border-slate-200/90 shadow-2xs'
                  : 'bg-slate-50/90 border-slate-300 shadow-xs'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-xs sm:text-sm text-slate-900">
                    {n.title}
                  </h4>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-slate-900 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {n.message}
                </p>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-2">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                {n.link && (
                  <Link
                    href={n.link}
                    className="h-7 px-2.5 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                  >
                    <span>{t('দেখুন', 'View')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkOne(n.id)}
                    className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                  >
                    {t('পড়া হয়েছে', 'Mark read')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
