'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Receipt,
  ArrowLeft,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';

export default function PortalPaymentsPage() {
  const { language, t } = useLanguage();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPayments() {
      try {
        const res = await fetch('/api/portal/payments');
        const data = await res.json();
        if (data.success) setPayments(data.data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Link */}
      <Link
        href="/portal/invoices"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t('ইনভয়েস পেজে ফিরে যান', 'Back to Invoices')}</span>
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
            {t('পেমেন্ট ও রসিদ', 'Payment Receipts')}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
          {t('অফিসিয়াল পেমেন্ট রসিদ ও লেজার', 'Official Payment Receipts & Ledger')}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {t(
            'শাকিল গ্লোবাল ম্যানপাওয়ার কর্তৃক ইস্যুকৃত সকল অনুমোদিত পেমেন্ট রসিদ, ব্যাংকিং ট্রানজেকশন আইডি এবং জমার বিবরণ।',
            'All officially verified receipts issued by SHAKIL GLOBAL MANPOWER, banking transaction references, and payment timestamps.'
          )}
        </p>
      </div>

      {/* Receipts Table */}
      {loading ? (
        <LoadingState text={t('পেমেন্ট রেকর্ড লোড হচ্ছে...', 'Loading verified payment records...')} />
      ) : payments.length === 0 ? (
        <EmptyState
          title={t('কোনো পেমেন্ট রেকর্ড পাওয়া যায়নি', 'No payment records found')}
          description={t(
            'আপনার অ্যাকাউন্টে এখনও কোনো পেমেন্ট জমা হয়নি। অনুমোদিত ব্যাংকিং চ্যানেলে অর্থ পরিশোধ করার পর রসিদ এখানে স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।',
            'No payment transactions have been recorded for your candidate profile yet. Verified payments will be documented here.'
          )}
          action={{
            label: t('ইনভয়েস দেখুন', 'View Invoices'),
            href: '/portal/invoices',
          }}
        />
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">{t('রসিদ নম্বর', 'Receipt No')}</th>
                  <th className="px-5 py-3.5">{t('ইনভয়েস রেফারেন্স', 'Invoice Ref')}</th>
                  <th className="px-5 py-3.5">{t('পদ্ধতি', 'Method')}</th>
                  <th className="px-5 py-3.5">{t('তারিখ', 'Payment Date')}</th>
                  <th className="px-5 py-3.5 text-right">{t('পরিমাণ', 'Amount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                      {pay.receiptNumber || pay.paymentNumber}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">
                      {pay.invoice?.invoiceNumber || '—'}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {pay.paymentMethod}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(pay.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-emerald-700">
                      ৳{Number(pay.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
