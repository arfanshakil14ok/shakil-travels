'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';

export default function PortalInvoicesPage() {
  const { language, t } = useLanguage();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvoices() {
      try {
        const res = await fetch('/api/portal/invoices');
        const invData = await res.json();
        if (invData.success) setData(invData.data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    loadInvoices();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <LoadingState text={t('আর্থিক বিবরণী লোড হচ্ছে...', 'Loading billing statement...')} />
      </div>
    );
  }

  const summary = data?.summary || { totalBilled: 0, totalPaid: 0, totalDue: 0 };
  const invoices = data?.invoices || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {t('হিসাব ও বিলিং', 'Billing & Finance')}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            {t('আর্থিক হিসাব বিবরণী ও ইনভয়েস', 'Financial Statement & Invoices')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t(
              'নিয়োগ প্রক্রিয়ার সরকারি ফি, সার্ভিস চার্জ ইনভয়েস এবং বর্তমান ব্যালেন্স পর্যবেক্ষণ করুন।',
              'Review itemized recruitment service invoices, billing details, and current account balance.'
            )}
          </p>
        </div>

        <Link
          href="/portal/payments"
          className="h-9 px-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0"
        >
          <Receipt className="w-3.5 h-3.5 text-slate-500" />
          <span>{t('পেমেন্ট রসিদ দেখুন', 'View Payment Receipts')}</span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1 font-medium">
            {t('মোট ইনভয়েস পরিমাণ', 'Total Invoiced')}
          </span>
          <div className="text-2xl font-bold text-slate-900">
            ৳{Number(summary.totalBilled).toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400">
            {t('ইস্যুকৃত সকল সার্ভিস ইনভয়েস', 'All issued service invoices')}
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1 font-medium">
            {t('পরিশোধিত অর্থ', 'Total Paid')}
          </span>
          <div className="text-2xl font-bold text-emerald-700">
            ৳{Number(summary.totalPaid).toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium">
            {t('যাচাইকৃত ব্যাংক রসিদ জমা', 'Confirmed bank receipts')}
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1 font-medium">
            {t('অবশিষ্ট বকেয়া', 'Outstanding Due')}
          </span>
          <div className="text-2xl font-bold text-amber-700">
            ৳{Number(summary.totalDue).toLocaleString()}
          </div>
          <span className="text-[11px] text-amber-700 font-medium">
            {t('বর্তমান দেয় অর্থ', 'Current balance due')}
          </span>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
          <FileText className="w-4 h-4 text-slate-700" />
          <span>{t('ইস্যুকৃত ইনভয়েসসমূহ', 'Issued Invoices')}</span>
        </h3>

        {invoices.length === 0 ? (
          <EmptyState
            title={t('কোনো ইনভয়েস ইস্যু করা হয়নি', 'No invoices issued yet')}
            description={t(
              'আপনার অ্যাকাউন্টে এখনও কোনো ইনভয়েস তৈরি করা হয়নি। আবেদনের অগ্রগতি অনুযায়ী ইনভয়েস এখানে যুক্ত হবে।',
              'No formal invoices have been issued to your candidate account yet. Invoices appear here as your processing advances.'
            )}
          />
        ) : (
          <div className="space-y-3">
            {invoices.map((inv: any) => (
              <div
                key={inv.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {inv.invoiceNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : inv.status === 'PARTIALLY_PAID'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {t('তারিখ:', 'Date:')} {new Date(inv.invoiceDate).toLocaleDateString()}
                    {inv.dueDate && ` • ${t('পরিশোধের শেষ তারিখ:', 'Due:')} ${new Date(inv.dueDate).toLocaleDateString()}`}
                  </div>
                  {inv.items && inv.items.length > 0 && (
                    <div className="text-xs text-slate-700 mt-2 font-medium">
                      {t('বিবরণ:', 'Items:')} {inv.items.map((it: any) => it.description).join(', ')}
                    </div>
                  )}
                </div>

                <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-base font-bold text-slate-900">
                      ৳{Number(inv.totalAmount).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t('পরিশোধিত:', 'Paid:')} ৳{Number(inv.paidAmount).toLocaleString()} |{' '}
                      {t('বকেয়া:', 'Due:')} ৳{Number(inv.dueAmount).toLocaleString()}
                    </div>
                  </div>
                  <Link
                    href={`/invoice/verify/${inv.invoiceNumber}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-[11px] font-semibold transition-colors"
                  >
                    <span>{t('ইনভয়েস ও QR ভেরিফিকেশন', 'View & QR Verify')}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
