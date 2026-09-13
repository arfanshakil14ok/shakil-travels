'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Receipt,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  CreditCard,
  Building2,
  Users,
  PieChart,
  Calendar,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StaffFinanceDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/staff/finance/dashboard');
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error || 'Failed to load finance data');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (amt: number | string | null | undefined) => {
    const val = Number(amt || 0);
    return `৳${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (loading && !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 bg-slate-800 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-800 rounded-xl"></div>
          ))}
        </div>
        <div className="h-80 bg-slate-800 rounded-xl"></div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const aging = data?.agingSummary || {};
  const buckets = aging.buckets || {};
  const topDebtors = data?.topDebtors || [];
  const methodBreakdown = data?.methodBreakdown || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Receipt className="w-7 h-7 text-indigo-400" />
              Finance & Accounting ERP
            </h1>
            <span className="text-xs bg-indigo-950 text-indigo-300 font-semibold px-2.5 py-1 rounded-full border border-indigo-700">
              RL-1892 Intelligence
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Double-entry ledger, invoice receivables, cash flow, recruitment cost accounting & profitability
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh
          </button>
          <Link
            href="/staff/finance/aging"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 rounded-lg border border-amber-800/80 transition"
          >
            <Clock className="w-3.5 h-3.5" />
            AR Aging
          </Link>
          <Link
            href="/staff/finance/profitability"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 rounded-lg border border-emerald-800/80 transition"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Profitability
          </Link>
          <Link
            href="/staff/invoices"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            Manage Invoices
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/50 border border-rose-800 rounded-xl text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Invoiced */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Total Invoiced</span>
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2">
            {formatCurrency(summary.totalInvoiced)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {summary.invoicesCount || 0} invoices issued
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span>Total Collected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-300 mt-2">
            {formatCurrency(summary.totalCollected)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Confirmed cash in hand
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-amber-400 font-medium">
            <span>Outstanding Due</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300 mt-2">
            {formatCurrency(summary.totalOutstanding)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Receivable from candidates
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-rose-400 font-medium">
            <span>Total Overdue</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-300 mt-2">
            {formatCurrency(summary.totalOverdue)}
          </div>
          <div className="text-[11px] text-rose-400 mt-1 font-medium">
            {aging.overdueCount || 0} overdue invoices
          </div>
        </div>

        {/* Direct Costs */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-sky-400 font-medium">
            <span>Recruitment Costs</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-sky-300 mt-2">
            {formatCurrency(summary.totalDirectCosts)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Direct operational expenses
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-teal-400 font-medium">
            <span>Gross Profit</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-bold text-teal-300 mt-2">
            {formatCurrency(summary.grossProfit)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Invoiced - Direct Costs
          </div>
        </div>
      </div>

      {/* Today & Month-to-date Collection Spotlight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Today&apos;s Collection
            </span>
            <span className="text-xs bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
              {summary.todayCount || 0} Transactions
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">
            {formatCurrency(summary.todayCollection)}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Instant real-time payment reconciliation across all bank, cash & mobile channels.
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider text-emerald-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              Month-to-Date Collections
            </span>
            <span className="text-xs bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
              {summary.monthCount || 0} Transactions
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">
            {formatCurrency(summary.monthCollection)}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Total verified collections for the current calendar month.
          </p>
        </div>
      </div>

      {/* Accounts Receivable Aging Breakdown */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Accounts Receivable Aging Analysis
            </h3>
            <p className="text-xs text-slate-400">
              Candidate & employer invoice receivables grouped by aging overdue duration
            </p>
          </div>
          <Link
            href="/staff/finance/aging"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            View Full Aging Schedule &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Current */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-3.5">
            <div className="text-xs font-semibold text-emerald-400">Current (Not Overdue)</div>
            <div className="text-lg font-bold text-white mt-1">
              {formatCurrency(buckets.CURRENT?.totalAmount)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {buckets.CURRENT?.count || 0} Invoices
            </div>
          </div>

          {/* 1 - 30 Days */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-3.5">
            <div className="text-xs font-semibold text-yellow-400">1 – 30 Days Overdue</div>
            <div className="text-lg font-bold text-white mt-1">
              {formatCurrency(buckets.DAYS_1_30?.totalAmount)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {buckets.DAYS_1_30?.count || 0} Invoices
            </div>
          </div>

          {/* 31 - 60 Days */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-3.5">
            <div className="text-xs font-semibold text-amber-400">31 – 60 Days Overdue</div>
            <div className="text-lg font-bold text-white mt-1">
              {formatCurrency(buckets.DAYS_31_60?.totalAmount)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {buckets.DAYS_31_60?.count || 0} Invoices
            </div>
          </div>

          {/* 61 - 90 Days */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-3.5">
            <div className="text-xs font-semibold text-orange-400">61 – 90 Days Overdue</div>
            <div className="text-lg font-bold text-white mt-1">
              {formatCurrency(buckets.DAYS_61_90?.totalAmount)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {buckets.DAYS_61_90?.count || 0} Invoices
            </div>
          </div>

          {/* 90+ Days */}
          <div className="bg-slate-800/40 border border-rose-900/50 rounded-lg p-3.5">
            <div className="text-xs font-semibold text-rose-400">90+ Days Overdue</div>
            <div className="text-lg font-bold text-rose-300 mt-1">
              {formatCurrency(buckets.DAYS_90_PLUS?.totalAmount)}
            </div>
            <div className="text-[11px] text-rose-400/80 mt-1">
              {buckets.DAYS_90_PLUS?.count || 0} Invoices
            </div>
          </div>
        </div>
      </div>

      {/* Top Debtors & Payment Method Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Debtors */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Top Candidates with Highest Outstanding Balances
              </h3>
              <p className="text-xs text-slate-400">Candidates requiring payment follow-up or payment plan restructuring</p>
            </div>
          </div>

          {topDebtors.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No outstanding candidate balances recorded.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-800/40 border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5">Candidate</th>
                    <th className="px-3 py-2.5">Tracking No</th>
                    <th className="px-3 py-2.5 text-right">Outstanding</th>
                    <th className="px-3 py-2.5 text-right">Max Overdue</th>
                    <th className="px-3 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {topDebtors.map((debtor: any) => (
                    <tr key={debtor.applicantId} className="hover:bg-slate-800/30">
                      <td className="px-3 py-2.5 font-medium text-white">
                        {debtor.applicantName}
                        {debtor.passportNumber && (
                          <span className="block text-[10px] text-slate-400">
                            Passport: {debtor.passportNumber}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-indigo-300 font-mono">
                        {debtor.trackingNo || 'N/A'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-amber-300">
                        {formatCurrency(debtor.totalOutstanding)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-rose-400">
                        {debtor.maxDaysOverdue} days
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Link
                          href={`/staff/invoices?applicantId=${debtor.applicantId}`}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium underline"
                        >
                          View Invoices
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment Channels Breakdown */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              Collections by Method (MTD)
            </h3>
            <p className="text-xs text-slate-400">Cash, Bank Transfer, bKash, Nagad, POS</p>
          </div>

          {methodBreakdown.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No payments recorded this month yet.
            </div>
          ) : (
            <div className="space-y-3">
              {methodBreakdown.map((item: any) => (
                <div
                  key={item.method}
                  className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-semibold text-white">
                      {item.method}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {item.count} payments
                    </span>
                  </div>
                  <div className="text-sm font-bold text-emerald-300">
                    {formatCurrency(item.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
