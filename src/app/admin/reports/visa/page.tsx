'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Stamp,
  ArrowLeft,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe2,
  BarChart2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

export default function VisaReportPage() {
  const { error } = useToast();
  const [data, setData] = useState<any | null>(null);
  const [preset, setPreset] = useState('THIS_YEAR');
  const [loading, setLoading] = useState(true);

  const fetchVisaData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/visa?preset=${preset}`);
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
      } else {
        error(resData.error || 'Failed to load visa report');
      }
    } catch {
      error('Failed to communicate with server');
    } finally {
      setLoading(false);
    }
  }, [preset, error]);

  useEffect(() => {
    fetchVisaData();
  }, [fetchVisaData]);

  const totals = data?.totals || {
    totalCases: 0,
    approved: 0,
    rejected: 0,
    inProgress: 0,
    approvalRate: 0,
    avgProcessingDays: 0,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/reports"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Intelligence Hub
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Stamp className="w-7 h-7 text-primary" />
            Visa Approval & Processing Durations Report
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Embassy clearance efficiency, approval percentages, duration turnaround, and rejection cause analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="text-xs bg-card border border-border rounded-lg p-2 font-medium"
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
          >
            <option value="THIS_MONTH">This Month</option>
            <option value="THIS_QUARTER">This Quarter</option>
            <option value="THIS_YEAR">This Year</option>
            <option value="ALL_TIME">All Time</option>
          </select>

          <Button variant="outline" size="sm" onClick={fetchVisaData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <a href={`/api/reports/export?type=visa&preset=${preset}`} download>
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-1.5" />
              Export CSV
            </Button>
          </a>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <span className="text-xs text-muted-foreground font-medium block mb-1">Total Visa Files</span>
          <div className="text-2xl font-bold text-foreground">{totals.totalCases}</div>
          <span className="text-[11px] text-muted-foreground">{totals.inProgress} currently in process</span>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <span className="text-xs text-muted-foreground font-medium block mb-1">Approval Rate</span>
          <div className="text-2xl font-bold text-emerald-600">{totals.approvalRate}%</div>
          <span className="text-[11px] text-emerald-600 font-medium">{totals.approved} visas approved/stamped</span>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <span className="text-xs text-muted-foreground font-medium block mb-1">Avg Turnaround Time</span>
          <div className="text-2xl font-bold text-primary">{totals.avgProcessingDays} Days</div>
          <span className="text-[11px] text-muted-foreground">From lodge to visa stamping</span>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <span className="text-xs text-muted-foreground font-medium block mb-1">Refusal Rate</span>
          <div className="text-2xl font-bold text-rose-600">
            {totals.totalCases > 0 ? Math.round((totals.rejected / totals.totalCases) * 100) : 0}%
          </div>
          <span className="text-[11px] text-rose-600 font-medium">{totals.rejected} embassy refusals</span>
        </div>
      </div>

      {/* Country Breakdown & Rejection Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Country Breakdown */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-primary" />
            Approval Rates by Destination Country
          </h3>

          <div className="space-y-3">
            {data?.countryBreakdown?.map((item: any) => (
              <div key={item.country} className="p-3 bg-muted/20 rounded-xl border border-border space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">{item.country}</span>
                  <span>
                    {item.approved} / {item.total} approved ({item.approvalRate}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${item.approvalRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rejection Causes */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            Visa Refusal Root-Cause Analysis
          </h3>

          {data?.rejectionReasons?.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No visa refusals recorded in this period.
            </div>
          ) : (
            <div className="space-y-2">
              {data.rejectionReasons.map((r: any) => (
                <div
                  key={r.reason}
                  className="p-3 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-rose-900 dark:text-rose-200">{r.reason}</span>
                  <span className="font-bold text-rose-600">{r.count} case(s)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
