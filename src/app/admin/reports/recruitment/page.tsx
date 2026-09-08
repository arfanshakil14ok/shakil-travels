'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ArrowLeft,
  Download,
  RefreshCw,
  Filter,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

export default function RecruitmentReportPage() {
  const { success, error } = useToast();
  const [data, setData] = useState<any | null>(null);
  const [preset, setPreset] = useState('THIS_MONTH');
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/recruitment?preset=${preset}`);
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
      } else {
        error(resData.error || 'Failed to load recruitment report');
      }
    } catch {
      error('Failed to communicate with server');
    } finally {
      setLoading(false);
    }
  }, [preset, error]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const funnel = data?.funnel;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/reports"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Intelligence Hub
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-primary" />
            Recruitment Funnel & Conversion Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time candidate transition metrics from inbound website leads to overseas deployment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="text-xs bg-card border border-border rounded-lg p-2 font-medium"
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
          >
            <option value="TODAY">Today</option>
            <option value="THIS_WEEK">This Week</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="LAST_MONTH">Last Month</option>
            <option value="THIS_QUARTER">This Quarter</option>
            <option value="THIS_YEAR">This Year</option>
            <option value="ALL_TIME">All Time</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchReport}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <a href={`/api/reports/export?type=jobs&preset=${preset}`} download>
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-1.5" />
              Export CSV
            </Button>
          </a>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <span className="text-xs text-muted-foreground font-medium block mb-1">Total Inbound Leads</span>
          <div className="text-2xl font-bold text-foreground">{funnel?.totalLeads || 0}</div>
          <span className="text-[11px] text-muted-foreground">Website contact & inquiries</span>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <span className="text-xs text-muted-foreground font-medium block mb-1">Applications Lodged</span>
          <div className="text-2xl font-bold text-foreground">{funnel?.totalApplications || 0}</div>
          <span className="text-[11px] text-muted-foreground">Formal recruitment submissions</span>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <span className="text-xs text-muted-foreground font-medium block mb-1">Total Deployed</span>
          <div className="text-2xl font-bold text-emerald-600">{funnel?.totalDeployed || 0}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Flight departures completed</span>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <span className="text-xs text-muted-foreground font-medium block mb-1">Lead-to-Flight Conversion</span>
          <div className="text-2xl font-bold text-primary">{funnel?.overallConversionRate || 0}%</div>
          <span className="text-[11px] text-muted-foreground">End-to-end placement rate</span>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
        <div>
          <h3 className="font-bold text-base text-foreground">12-Stage Recruitment Funnel Breakdown</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Stage volume, percentage retention, and drop-off rates across each verification milestone.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            Analyzing funnel transitions...
          </div>
        ) : (
          <div className="space-y-3">
            {funnel?.stages?.map((stage: any, idx: number) => {
              const maxCount = Math.max(1, funnel.stages[0]?.count || 1);
              const barWidth = Math.max(8, Math.round((stage.count / maxCount) * 100));

              return (
                <div key={stage.key} className="space-y-1 bg-muted/20 p-3 rounded-xl border border-border/60">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-foreground flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      {stage.name}
                    </span>
                    <div className="flex items-center gap-4">
                      {idx > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          Conversion: <strong>{stage.conversionFromPrevious}%</strong>
                          {stage.dropoffRate > 0 && ` (Drop-off: ${stage.dropoffRate}%)`}
                        </span>
                      )}
                      <span className="font-bold text-sm text-foreground font-mono">
                        {stage.count}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: stage.color || '#3b82f6',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
