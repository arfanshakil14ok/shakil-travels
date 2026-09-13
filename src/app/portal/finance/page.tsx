'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  Receipt as ReceiptIcon,
  Clock,
  Layers,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export default function PortalFinancePage() {
  const { language, t } = useLanguage();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invoices' | 'receipts' | 'plans' | 'ledger'>('invoices');

  useEffect(() => {
    async function loadFinance() {
      try {
        const res = await fetch('/api/portal/finance');
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    loadFinance();
  }, []);

  const formatCurrency = (amt: number | string | null | undefined) => {
    const val = Number(amt || 0);
    return `৳${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto p-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const summary = data?.summary || { totalInvoiced: 0, totalPaid: 0, totalDue: 0, runningBalance: 0 };
  const invoices = data?.invoices || [];
  const payments = data?.payments || [];
  const receipts = data?.receipts || [];
  const paymentPlans = data?.paymentPlans || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
              {t('প্রার্থী ফাইন্যান্স পোর্টাল', 'Candidate Finance Portal')}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            {t('আর্থিক হিসাব বিবরণী ও পেমেন্ট হিস্ট্রি', 'Financial Statement & Payment History')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t(
              'আপনার রিক্রুটমেন্ট প্রসেসিং ফি, ব্যাংক পেমেন্ট রসিদ এবং কিস্তি প্ল্যানের রিয়েল-টাইম তথ্য।',
              'Itemized service fees, confirmed money receipts, and installment payment plan breakdown.'
            )}
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1 font-medium">
            {t('মোট ইনভয়েস পরিমাণ', 'Total Invoiced')}
          </span>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(summary.totalInvoiced)}
          </div>
          <span className="text-[11px] text-slate-400">
            {summary.invoiceCount || 0} {t('টি ইনভয়েস ইস্যুকৃত', 'invoices issued')}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs text-emerald-600 block mb-1 font-medium">
            {t('পরিশোধিত অর্থ', 'Total Paid')}
          </span>
          <div className="text-2xl font-bold text-emerald-700">
            {formatCurrency(summary.totalPaid)}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">
            {summary.paymentCount || 0} {t('টি যাচাইকৃত রসিদ', 'confirmed payments')}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs text-amber-600 block mb-1 font-medium">
            {t('বর্তমান অবশিষ্ট বকেয়া', 'Current Balance Due')}
          </span>
          <div className="text-2xl font-bold text-amber-700">
            {formatCurrency(summary.totalDue)}
          </div>
          <span className="text-[11px] text-amber-600 font-medium">
            {t('পরিশোধের জন্য প্রস্তুত', 'Payable balance')}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 text-xs">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${
            activeTab === 'invoices'
              ? 'bg-white border-t-2 border-indigo-600 text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('ইনভয়েসসমূহ', 'Invoices')} ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('receipts')}
          className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${
            activeTab === 'receipts'
              ? 'bg-white border-t-2 border-indigo-600 text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('পেমেন্ট রসিদসমূহ', 'Official Receipts')} ({receipts.length})
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${
            activeTab === 'plans'
              ? 'bg-white border-t-2 border-indigo-600 text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('কিস্তি প্ল্যান', 'Payment Plans')} ({paymentPlans.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'invoices' && (
        <div className="space-y-3">
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
              {t('কোনো ইনভয়েস পাওয়া যায়নি।', 'No invoices found.')}
            </div>
          ) : (
            invoices.map((inv: any) => (
              <div
                key={inv.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800">{inv.invoiceNumber}</span>
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
                    {t('ইস্যু তারিখ:', 'Issued:')} {new Date(inv.issueDate || inv.createdAt).toLocaleDateString()} •{' '}
                    {t('পরিশোধের শেষ তারিখ:', 'Due:')} {new Date(inv.dueDate).toLocaleDateString()}
                  </div>
                  {inv.items && (
                    <div className="text-xs text-slate-700 mt-2 font-medium">
                      {inv.items.map((it: any) => it.description).join(', ')}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-slate-900">{formatCurrency(inv.totalAmount)}</div>
                  <div className="text-xs text-slate-500">
                    {t('পরিশোধ:', 'Paid:')} {formatCurrency(inv.paidAmount)} •{' '}
                    <span className="text-amber-700 font-bold">{t('বকেয়া:', 'Due:')} {formatCurrency(inv.dueAmount)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'receipts' && (
        <div className="space-y-3">
          {receipts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
              {t('কোনো মানি রসিদ ইস্যু করা হয়নি।', 'No official money receipts issued yet.')}
            </div>
          ) : (
            receipts.map((rc: any) => (
              <div
                key={rc.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <ReceiptIcon className="w-4 h-4 text-emerald-600" />
                    <span className="font-mono text-xs font-bold text-emerald-800">{rc.receiptNumber}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {rc.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {t('রসিদ তারিখ:', 'Receipt Date:')} {new Date(rc.receiptDate).toLocaleDateString()} •{' '}
                    {t('মাধ্যম:', 'Method:')} {rc.payment?.paymentMethod || 'BANK'}
                  </div>
                  <div className="text-xs text-slate-700 mt-1 italic">
                    {rc.amountInWords}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-700">{formatCurrency(rc.amount)}</div>
                  </div>
                  <Link
                    href={`/staff/receipts/${rc.id}`}
                    target="_blank"
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
                  >
                    {t('প্রিন্ট ভিউ', 'Print View')}
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'plans' && (
        <div className="space-y-4">
          {paymentPlans.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
              {t('কোনো কিস্তি প্ল্যান পাওয়া যায়নি।', 'No installment payment plans configured.')}
            </div>
          ) : (
            paymentPlans.map((plan: any) => (
              <div key={plan.id} className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-700">{plan.planNumber}</span>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {plan.numberOfInstallments} {t('কিস্তি', 'Installments')} • {plan.frequency}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-slate-900">{formatCurrency(plan.totalAmount)}</div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {plan.status}
                    </span>
                  </div>
                </div>

                {/* Installments table */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                  {plan.installments?.map((inst: any) => (
                    <div
                      key={inst.id}
                      className={`p-3 rounded-lg border text-xs ${
                        inst.status === 'PAID'
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between font-semibold">
                        <span>Installment #{inst.installmentNumber}</span>
                        <span className={inst.status === 'PAID' ? 'text-emerald-700' : 'text-slate-700'}>
                          {inst.status}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-1">
                        Due: {new Date(inst.dueDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-1">
                        {formatCurrency(inst.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
