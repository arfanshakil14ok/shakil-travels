'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  FileText,
  Users,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StaffFinanceAgingPage() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const fetchAgingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/staff/finance/aging');
      const json = await res.json();
      if (json.success) {
        setReport(json.data);
      } else {
        setError(json.error || 'Failed to load aging report');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgingData();
  }, []);

  const formatCurrency = (amt: number | string | null | undefined) => {
    const val = Number(amt || 0);
    return `৳${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (loading && !report) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/4"></div>
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-slate-800 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const buckets = report?.buckets || {};

  // Aggregate all invoices or filter by bucket
  const allInvoices: any[] = [];
  Object.keys(buckets).forEach((key) => {
    if (selectedBucket === 'ALL' || selectedBucket === key) {
      buckets[key].invoices.forEach((inv: any) => {
        allInvoices.push({ ...inv, bucketKey: key });
      });
    }
  });

  const filteredInvoices = allInvoices.filter((inv) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      inv.invoiceNumber?.toLowerCase().includes(s) ||
      inv.applicantName?.toLowerCase().includes(s) ||
      inv.employerName?.toLowerCase().includes(s) ||
      inv.jobTitle?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/staff/finance"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Finance Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-400" />
            Accounts Receivable Aging Analysis
          </h1>
          <p className="text-xs text-slate-400">
            Total Outstanding: <span className="text-amber-300 font-bold">{formatCurrency(report?.totalOutstanding)}</span> • Overdue: <span className="text-rose-400 font-bold">{formatCurrency(report?.totalOverdue)}</span> • Average Overdue: <span className="text-white font-semibold">{report?.averageDaysOverdue || 0} days</span>
          </p>
        </div>

        <button
          onClick={fetchAgingData}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition self-start"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/50 border border-rose-800 rounded-xl text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Aging Bucket Selector Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* CURRENT */}
        <button
          onClick={() => setSelectedBucket(selectedBucket === 'CURRENT' ? 'ALL' : 'CURRENT')}
          className={cn(
            'p-4 rounded-xl border text-left transition',
            selectedBucket === 'CURRENT'
              ? 'bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          )}
        >
          <div className="text-xs font-semibold text-emerald-400">Current (Not Overdue)</div>
          <div className="text-xl font-bold text-white mt-1">
            {formatCurrency(buckets.CURRENT?.totalAmount)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {buckets.CURRENT?.count || 0} Invoices
          </div>
        </button>

        {/* 1-30 */}
        <button
          onClick={() => setSelectedBucket(selectedBucket === 'DAYS_1_30' ? 'ALL' : 'DAYS_1_30')}
          className={cn(
            'p-4 rounded-xl border text-left transition',
            selectedBucket === 'DAYS_1_30'
              ? 'bg-yellow-950/80 border-yellow-500 ring-2 ring-yellow-500/20'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          )}
        >
          <div className="text-xs font-semibold text-yellow-400">1 – 30 Days Overdue</div>
          <div className="text-xl font-bold text-white mt-1">
            {formatCurrency(buckets.DAYS_1_30?.totalAmount)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {buckets.DAYS_1_30?.count || 0} Invoices
          </div>
        </button>

        {/* 31-60 */}
        <button
          onClick={() => setSelectedBucket(selectedBucket === 'DAYS_31_60' ? 'ALL' : 'DAYS_31_60')}
          className={cn(
            'p-4 rounded-xl border text-left transition',
            selectedBucket === 'DAYS_31_60'
              ? 'bg-amber-950/80 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          )}
        >
          <div className="text-xs font-semibold text-amber-400">31 – 60 Days Overdue</div>
          <div className="text-xl font-bold text-white mt-1">
            {formatCurrency(buckets.DAYS_31_60?.totalAmount)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {buckets.DAYS_31_60?.count || 0} Invoices
          </div>
        </button>

        {/* 61-90 */}
        <button
          onClick={() => setSelectedBucket(selectedBucket === 'DAYS_61_90' ? 'ALL' : 'DAYS_61_90')}
          className={cn(
            'p-4 rounded-xl border text-left transition',
            selectedBucket === 'DAYS_61_90'
              ? 'bg-orange-950/80 border-orange-500 ring-2 ring-orange-500/20'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          )}
        >
          <div className="text-xs font-semibold text-orange-400">61 – 90 Days Overdue</div>
          <div className="text-xl font-bold text-white mt-1">
            {formatCurrency(buckets.DAYS_61_90?.totalAmount)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {buckets.DAYS_61_90?.count || 0} Invoices
          </div>
        </button>

        {/* 90+ */}
        <button
          onClick={() => setSelectedBucket(selectedBucket === 'DAYS_90_PLUS' ? 'ALL' : 'DAYS_90_PLUS')}
          className={cn(
            'p-4 rounded-xl border text-left transition',
            selectedBucket === 'DAYS_90_PLUS'
              ? 'bg-rose-950/80 border-rose-500 ring-2 ring-rose-500/20'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          )}
        >
          <div className="text-xs font-semibold text-rose-400">90+ Days Overdue</div>
          <div className="text-xl font-bold text-rose-300 mt-1">
            {formatCurrency(buckets.DAYS_90_PLUS?.totalAmount)}
          </div>
          <div className="text-[11px] text-rose-400/80 mt-1">
            {buckets.DAYS_90_PLUS?.count || 0} Invoices
          </div>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search invoice, candidate, employer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="font-semibold text-white">{filteredInvoices.length}</span> invoices in view
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-800/60 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Candidate / Customer</th>
                <th className="px-4 py-3">Job / Demand</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3 text-right">Overdue</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Balance Due</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    No outstanding invoices found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-mono font-medium text-indigo-300">
                      <Link href={`/staff/invoices/${inv.id}`} className="hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {inv.applicantName}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {inv.jobTitle || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {inv.daysOverdue > 0 ? (
                        <span className="text-rose-400">{inv.daysOverdue} days</span>
                      ) : (
                        <span className="text-emerald-400">Current</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-300">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-400">
                      {formatCurrency(inv.paidAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-amber-300">
                      {formatCurrency(inv.balance)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/staff/invoices/${inv.id}`}
                        className="px-2.5 py-1 bg-indigo-950 text-indigo-300 hover:bg-indigo-900 border border-indigo-700/60 rounded text-[11px] font-medium transition"
                      >
                        Manage &rarr;
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
