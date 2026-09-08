'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Users,
  Briefcase,
  Globe2,
  Building2,
  UserCheck,
  CreditCard,
  Stamp,
  Download,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCw,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReportsHubPage() {
  const [data, setData] = useState<any | null>(null);
  const [preset, setPreset] = useState('THIS_MONTH');
  const [loading, setLoading] = useState(true);

  const fetchSummary = async (selectedPreset = preset) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/dashboard?preset=${selectedPreset}`);
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(preset);
  }, [preset]);

  const kpis = data?.kpis || {
    totalApplicants: 0,
    activeApplications: 0,
    placedCandidates: 0,
    activeVisaCases: 0,
    totalBilled: 0,
    totalPaid: 0,
    totalDue: 0,
    activeJobs: 0,
  };

  const reportModules = [
    {
      title: 'Recruitment Funnel & Conversion',
      description: '12-stage candidate pipeline analysis, drop-off rates, and lead-to-departure conversion efficiency.',
      href: '/admin/reports/recruitment',
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40',
      badge: 'Core Funnel',
    },
    {
      title: 'Job Orders & Demand Fulfillment',
      description: 'Demand quotas vs applicant volumes, time-to-fill, and placement fill rates by position.',
      href: '/admin/reports/jobs',
      icon: Briefcase,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40',
      badge: 'Demand Analysis',
    },
    {
      title: 'Country & Destination Analytics',
      description: 'Deployment volumes, visa approval rates, and bilateral demand breakdown across destination nations.',
      href: '/admin/reports/countries',
      icon: Globe2,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
      badge: 'Destinations',
    },
    {
      title: 'Employer Hiring Activity',
      description: 'Overseas employer hiring volumes, candidate placement track record, and corporate billing.',
      href: '/admin/reports/employers',
      icon: Building2,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40',
      badge: 'Accounts',
    },
    {
      title: 'Staff Productivity & Conversions',
      description: 'Recruiter throughput, interview scheduling velocity, application screening, and individual conversions.',
      href: '/admin/reports/staff-performance',
      icon: UserCheck,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
      badge: 'Productivity',
    },
    {
      title: 'Operational Workload Distribution',
      description: 'Real-time case allocation across staff for active applicants, pending interviews, and visa files.',
      href: '/admin/reports/staff-workload',
      icon: Layers,
      color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40',
      badge: 'Capacity',
    },
    {
      title: 'Financial Revenue & Collections',
      description: 'Itemized revenue, invoice settlement statuses, collections by payment method, and aging receivables.',
      href: '/admin/reports/financial',
      icon: CreditCard,
      color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40',
      badge: 'Financials',
    },
    {
      title: 'Visa Processing & Approvals',
      description: 'Embassy approval rates, average processing turnaround durations, and rejection root-cause analysis.',
      href: '/admin/reports/visa',
      icon: Stamp,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40',
      badge: 'Immigration',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" />
            Executive Intelligence & Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time data warehouse insights across recruitment pipelines, embassy compliance, staff productivity, and revenue.
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
            onClick={() => fetchSummary(preset)}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <span className="text-xs text-muted-foreground font-medium block mb-1">Active Pipeline</span>
          <div className="text-2xl font-bold text-foreground">{kpis.activeApplications}</div>
          <span className="text-[11px] text-muted-foreground">Applications currently in process</span>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <span className="text-xs text-muted-foreground font-medium block mb-1">Total Placements</span>
          <div className="text-2xl font-bold text-emerald-600">{kpis.placedCandidates}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Successfully deployed</span>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <span className="text-xs text-muted-foreground font-medium block mb-1">Active Visa Files</span>
          <div className="text-2xl font-bold text-amber-600">{kpis.activeVisaCases}</div>
          <span className="text-[11px] text-amber-600 font-medium">In embassy processing</span>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <span className="text-xs text-muted-foreground font-medium block mb-1">Period Collections</span>
          <div className="text-2xl font-bold text-primary">
            ৳{Number(kpis.periodCollections || 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-muted-foreground">Verified payment receipts</span>
        </div>
      </div>

      {/* Reports Directory Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Operational & Strategic Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className="bg-card p-5 rounded-2xl border border-border shadow-sm hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mod.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {mod.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                    {mod.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-semibold text-primary">
                  <span>Open Report</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
