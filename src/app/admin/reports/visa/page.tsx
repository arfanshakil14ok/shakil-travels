'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Stamp,
  ArrowLeft,
  RefreshCw,
  Download,
  AlertCircle,
  Globe2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

interface VisaReportTotals {
  totalCases: number;
  approved: number;
  rejected: number;
  inProgress: number;
  cancelled: number;
  approvalRate: number;
  avgProcessingDays: number;
}

interface CountryStat {
  country: string;
  total: number;
  approved: number;
  rejected: number;
  approvalRate: number;
}

interface RejectionReason {
  reason: string;
  count: number;
}

interface VisaReportData {
  filter?: { preset: string; label: string };
  totals: VisaReportTotals;
  countryBreakdown: CountryStat[];
  rejectionReasons: RejectionReason[];
}

export default function VisaReportPage() {
  const { error: toastError } = useToast();
  const [data, setData] = useState<VisaReportData | null>(null);
  const [preset, setPreset] = useState('THIS_YEAR');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchVisaData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/reports/visa?preset=${preset}`);
      const resData = await res.json();
      if (resData.success && resData.data) {
        setData(resData.data);
      } else {
        const msg = resData.error || 'ভিসা অ্যানালিটিক্স লোড করতে ব্যর্থ হয়েছে (Failed to load visa analytics)';
        setFetchError(msg);
        toastError(msg);
      }
    } catch (err: any) {
      const msg = err?.message || 'সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি (Network connection failed)';
      setFetchError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  }, [preset, toastError]);

  useEffect(() => {
    fetchVisaData();
  }, [fetchVisaData]);

  const totals: VisaReportTotals = data?.totals || {
    totalCases: 0,
    approved: 0,
    rejected: 0,
    inProgress: 0,
    cancelled: 0,
    approvalRate: 0,
    avgProcessingDays: 0,
  };

  const countryBreakdown: CountryStat[] = data?.countryBreakdown || [];
  const rejectionReasons: RejectionReason[] = data?.rejectionReasons || [];
  const refusalRate = totals.totalCases > 0 ? Math.round((totals.rejected / totals.totalCases) * 100) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/reports"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2 transition-colors font-bengali"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> রিপোর্টস হাবে ফিরে যান (Back to Intelligence Hub)
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 font-bengali">
            <Stamp className="w-7 h-7 text-primary" />
            ভিসা অনুমোদন ও প্রসেসিং অ্যানালিটিক্স (Visa Analytics)
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-bengali">
            দূতাবাসের ক্লিয়ারেন্স কার্যকারিতা, অনুমোদনের হার, গড় সময়সীমা এবং প্রত্যাখ্যানের কারণ বিশ্লেষণ।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2 py-1">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              className="text-xs bg-transparent border-0 font-medium focus:outline-none cursor-pointer pr-2 font-bengali"
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              disabled={loading}
            >
              <option value="THIS_MONTH">চলতি মাস (This Month)</option>
              <option value="THIS_QUARTER">চলতি কোয়ার্টার (This Quarter)</option>
              <option value="THIS_YEAR">চলতি বছর (This Year)</option>
              <option value="ALL_TIME">সর্বকালের তথ্য (All Time)</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchVisaData}
            disabled={loading}
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <a href={`/api/reports/export?type=visa&preset=${preset}`} download>
            <Button size="sm" variant="outline" className="font-bengali">
              <Download className="w-4 h-4 mr-1.5" />
              এক্সপোর্ট (CSV)
            </Button>
          </a>
        </div>
      </div>

      {/* Error Banner with Retry */}
      {fetchError && !data && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span className="text-sm font-medium font-bengali">{fetchError}</span>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={fetchVisaData}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bengali text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            আবার চেষ্টা করুন (Retry)
          </Button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && !data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card p-5 rounded-xl border border-border shadow-xs animate-pulse space-y-3">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-7 w-16 bg-muted rounded" />
                <div className="h-2.5 w-32 bg-muted rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-xs animate-pulse space-y-4">
              <div className="h-4 w-48 bg-muted rounded" />
              <div className="h-20 bg-muted/30 rounded-xl" />
              <div className="h-20 bg-muted/30 rounded-xl" />
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 shadow-xs animate-pulse space-y-4">
              <div className="h-4 w-48 bg-muted rounded" />
              <div className="h-20 bg-muted/30 rounded-xl" />
              <div className="h-20 bg-muted/30 rounded-xl" />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Ribbon */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card p-5 rounded-xl border border-border shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground font-medium font-bengali">মোট ভিসা ফাইল</span>
                <Stamp className="w-4 h-4 text-muted-foreground/60" />
              </div>
              <div className="text-2xl font-bold text-foreground font-mono">{totals.totalCases}</div>
              <span className="text-[11px] text-muted-foreground font-bengali mt-0.5 block">
                {totals.inProgress} টি প্রসেসিং চলছে (In process)
              </span>
            </div>

            <div className="bg-card p-5 rounded-xl border border-border shadow-xs hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground font-medium font-bengali">অনুমোদনের হার</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 font-mono">{totals.approvalRate}%</div>
              <span className="text-[11px] text-emerald-700 font-medium font-bengali mt-0.5 block">
                {totals.approved} টি ভিসা অনুমোদিত / স্ট্যাম্পড
              </span>
            </div>

            <div className="bg-card p-5 rounded-xl border border-border shadow-xs hover:border-primary-300 transition-all">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground font-medium font-bengali">গড় প্রসেসিং সময়</span>
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary font-mono">{totals.avgProcessingDays} দিন</div>
              <span className="text-[11px] text-muted-foreground font-bengali mt-0.5 block">
                জমা থেকে ভিসা স্ট্যাম্পিং পর্যন্ত (Turnaround)
              </span>
            </div>

            <div className="bg-card p-5 rounded-xl border border-border shadow-xs hover:border-rose-300 transition-all">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground font-medium font-bengali">রিজেকশন হার</span>
                <XCircle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-bold text-rose-600 font-mono">{refusalRate}%</div>
              <span className="text-[11px] text-rose-600 font-medium font-bengali mt-0.5 block">
                {totals.rejected} টি দূতাবাস প্রত্যাখ্যান (Refusals)
              </span>
            </div>
          </div>

          {/* Country Breakdown & Rejection Analysis Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Country Breakdown */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2 font-bengali">
                  <Globe2 className="w-4 h-4 text-primary" />
                  দেশভিত্তিক ভিসার অনুমোদন হার (Country Breakdown)
                </h3>
                <span className="text-xs text-muted-foreground font-mono font-medium">
                  {countryBreakdown.length} টি দেশ
                </span>
              </div>

              {countryBreakdown.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl font-bengali">
                  এই নির্বাচিত সময়কালে কোনো দেশের ভিসা ডাটা রেকর্ড পাওয়া যায়নি।
                </div>
              ) : (
                <div className="space-y-3">
                  {countryBreakdown.map((item, idx) => (
                    <div
                      key={item.country || idx}
                      className="p-3.5 bg-muted/20 hover:bg-muted/30 transition-colors rounded-xl border border-border space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-foreground font-medium">{item.country}</span>
                        <span className="font-mono text-muted-foreground text-[11px]">
                          <strong className="text-emerald-600">{item.approved}</strong> / {item.total} অনুমোদিত ({item.approvalRate}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${Math.min(item.approvalRate || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rejection Causes */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2 font-bengali">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  ভিসা প্রত্যাখ্যাত হওয়ার কারণ বিশ্লেষণ (Refusal Causes)
                </h3>
                <span className="text-xs text-rose-600 font-mono font-medium">
                  {totals.rejected} টি মোট রিজেকশন
                </span>
              </div>

              {rejectionReasons.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl font-bengali flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/70" />
                  <span>এই নির্বাচিত সময়কালে কোনো ভিসা রিজেকশন বা প্রত্যাখ্যাত কেস নেই।</span>
                  <span className="text-[11px] text-muted-foreground/80">(No visa refusals recorded in this period)</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {rejectionReasons.map((r, idx) => (
                    <div
                      key={r.reason || idx}
                      className="p-3 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-rose-900 dark:text-rose-200 font-bengali">{r.reason}</span>
                      <span className="font-bold text-rose-600 font-mono px-2 py-0.5 bg-rose-100 dark:bg-rose-900/50 rounded-md">
                        {r.count} টি কেস ({r.count})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
