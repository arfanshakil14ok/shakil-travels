'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ArrowLeft,
  DollarSign,
  PieChart,
  RefreshCw,
  AlertTriangle,
  Building2,
  Briefcase,
  Users,
  Globe,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StaffFinanceProfitabilityPage() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'applicant' | 'job' | 'employer' | 'country'>('applicant');

  const fetchProfitabilityData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/staff/finance/profitability');
      const json = await res.json();
      if (json.success) {
        setReport(json.data);
      } else {
        setError(json.error || 'Failed to load profitability data');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfitabilityData();
  }, []);

  const formatCurrency = (amt: number | string | null | undefined) => {
    const val = Number(amt || 0);
    return `৳${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (loading && !report) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/4"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-800 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const costBreakdown = report?.costBreakdownByCategory || {};
  let currentList: any[] = [];
  if (activeTab === 'applicant') currentList = report?.byApplicant || [];
  else if (activeTab === 'job') currentList = report?.byJob || [];
  else if (activeTab === 'employer') currentList = report?.byEmployer || [];
  else if (activeTab === 'country') currentList = report?.byCountry || [];

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
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            Recruitment Profitability Intelligence
          </h1>
          <p className="text-xs text-slate-400">
            Real-time revenue, direct operational costs & gross profit margins across candidates, jobs, employers & countries
          </p>
        </div>

        <button
          onClick={fetchProfitabilityData}
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

      {/* Top Aggregates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced Revenue */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Total Invoiced Revenue</div>
          <div className="text-2xl font-bold text-white mt-2">
            {formatCurrency(report?.totalInvoicedRevenue)}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">
            Cash Collected: {formatCurrency(report?.totalCashCollected)}
          </div>
        </div>

        {/* Direct Recruitment Costs */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Total Direct Recruitment Costs</div>
          <div className="text-2xl font-bold text-rose-300 mt-2">
            {formatCurrency(report?.totalRecruitmentCosts)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Medical, visa, tickets, BMET, training
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Gross Profit (Accrual)</div>
          <div className="text-2xl font-bold text-teal-300 mt-2">
            {formatCurrency(report?.grossProfit)}
          </div>
          <div className="text-[11px] text-teal-400 mt-1">
            Margin: {report?.grossProfitMarginPercent || 0}%
          </div>
        </div>

        {/* Net Cash Margin */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Net Cash Margin (Cash In Hand)</div>
          <div className="text-2xl font-bold text-emerald-300 mt-2">
            {formatCurrency(report?.netCashMargin)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Cash Collected - Direct Costs
          </div>
        </div>
      </div>

      {/* Direct Cost Categories Breakdown */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            Direct Recruitment Cost Breakdown by Category
          </h3>
          <p className="text-xs text-slate-400">Operational costs incurred per candidate processing milestone</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { key: 'MEDICAL', label: 'GAMCA Medical' },
            { key: 'ATTESTATION', label: 'Attestation' },
            { key: 'EMBASSY_VISA_FEE', label: 'Embassy / Visa' },
            { key: 'BMET_SMART_CARD', label: 'BMET Card' },
            { key: 'AIR_TICKET', label: 'Air Ticket' },
            { key: 'TRAINING', label: 'Training' },
            { key: 'AGENT_COMMISSION', label: 'Agent Comm.' },
            { key: 'MISCELLANEOUS', label: 'Miscellaneous' },
          ].map((cat) => (
            <div key={cat.key} className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-3">
              <div className="text-[11px] text-slate-400 font-medium truncate">{cat.label}</div>
              <div className="text-sm font-bold text-white mt-1">
                {formatCurrency(costBreakdown[cat.key])}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Profitability Breakdown Tabs */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-semibold text-white">Multidimensional Profitability Performance</h3>
            <p className="text-xs text-slate-400">Select dimension to view revenue, costs and profit margin</p>
          </div>

          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setActiveTab('applicant')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5',
                activeTab === 'applicant'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:text-white'
              )}
            >
              <Users className="w-3.5 h-3.5" />
              Candidate
            </button>
            <button
              onClick={() => setActiveTab('job')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5',
                activeTab === 'job'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:text-white'
              )}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Job / Demand
            </button>
            <button
              onClick={() => setActiveTab('employer')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5',
                activeTab === 'employer'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:text-white'
              )}
            >
              <Building2 className="w-3.5 h-3.5" />
              Employer
            </button>
            <button
              onClick={() => setActiveTab('country')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5',
                activeTab === 'country'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:text-white'
              )}
            >
              <Globe className="w-3.5 h-3.5" />
              Country
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-800/60 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Entity Name</th>
                <th className="px-4 py-3 text-right">Invoiced Revenue</th>
                <th className="px-4 py-3 text-right">Collected Cash</th>
                <th className="px-4 py-3 text-right">Direct Costs</th>
                <th className="px-4 py-3 text-right">Gross Profit</th>
                <th className="px-4 py-3 text-right">Profit Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No data recorded for this dimension yet.
                  </td>
                </tr>
              ) : (
                currentList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-medium text-white">
                      {item.name}
                      {item.code && (
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {item.code}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-300">
                      {formatCurrency(item.totalRevenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-medium">
                      {formatCurrency(item.totalCollected)}
                    </td>
                    <td className="px-4 py-3 text-right text-rose-400 font-medium">
                      {formatCurrency(item.totalCost)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-teal-300">
                      {formatCurrency(item.grossProfit)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[11px]',
                          item.profitMarginPercent >= 20
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : item.profitMarginPercent >= 0
                            ? 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        )}
                      >
                        {item.profitMarginPercent}%
                      </span>
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
