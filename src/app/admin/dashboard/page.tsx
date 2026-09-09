'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  CircleCheck,
  CircleX,
  Bell,
  History,
  ClipboardList,
  UserRound,
  Receipt,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load dashboard data');
      }
      setStats(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Enterprise Recruitment ERP
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Platform Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Database-backed operational staff metrics, system audit activity, and recruitment baseline.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />}
          >
            Refresh
          </Button>
          <Link href="/admin/users">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Users className="w-3.5 h-3.5" aria-hidden="true" />}
            >
              Manage Staff
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Primary Staff & System Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Staff */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Staff
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                  {isLoading ? '...' : stats?.staff?.total ?? 0}
                </h3>
                <p className="text-xs text-slate-500 mt-1">System accounts</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-navy-50 text-navy-900 flex items-center justify-center border border-navy-100">
                <Users className="w-6 h-6" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Staff */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                  Active Staff
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                  {isLoading ? '...' : stats?.staff?.active ?? 0}
                </h3>
                <p className="text-xs text-emerald-600 mt-1">Operational access</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CircleCheck className="w-6 h-6" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inactive Staff */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Inactive Staff
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                  {isLoading ? '...' : stats?.staff?.inactive ?? 0}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Deactivated users</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-200">
                <CircleX className="w-6 h-6" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Trail Count */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Audit Records
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                  {isLoading ? '...' : stats?.totalAuditLogs ?? 0}
                </h3>
                <p className="text-xs text-slate-500 mt-1">Tracked activities</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
                <History className="w-6 h-6" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recruitment Pipeline Metrics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Live Recruitment Pipeline
            </h2>
            <p className="text-xs text-slate-500">
              Active candidates, overseas vacancies, verified employers, and global destinations.
            </p>
          </div>
          <Badge variant="success">Operational</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/applicants">
            <Card className="hover:border-navy-400 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Applicants</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {isLoading ? '...' : stats?.business?.applicants ?? 0}
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">
                    {isLoading ? '' : `${stats?.business?.activeApplicants ?? 0} Active in pool`}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <UserRound className="w-5 h-5" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/jobs">
            <Card className="hover:border-navy-400 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Overseas Jobs</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {isLoading ? '...' : stats?.business?.jobs ?? 0}
                  </p>
                  <p className="text-[11px] text-blue-600 mt-0.5">
                    {isLoading ? '' : `${stats?.business?.publishedJobs ?? 0} Published`}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <ClipboardList className="w-5 h-5" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/employers">
            <Card className="hover:border-navy-400 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Employers</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {isLoading ? '...' : stats?.business?.employers ?? 0}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Global recruitment partners</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <Receipt className="w-5 h-5" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/countries">
            <Card className="hover:border-navy-400 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Destinations</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {isLoading ? '...' : stats?.business?.countries ?? 0}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Active licensed countries</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                  <CreditCard className="w-5 h-5" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Activity & Quick Shortcuts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Recent System Activity</CardTitle>
              <CardDescription>Live audit logs recorded by the platform</CardDescription>
            </div>
            <Link href="/admin/audit-logs">
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />}
              >
                View Full Audit
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                Loading activity logs...
              </div>
            ) : !stats?.recentActivity || stats.recentActivity.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                No activity records found.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.recentActivity.map((log: any) => (
                  <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-[10px]">
                        {log.action.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 truncate">
                            {log.action}
                          </span>
                          <Badge variant="neutral" size="sm">
                            {log.entity}
                          </Badge>
                        </div>
                        <p className="text-slate-500 mt-0.5 truncate">
                          By: <span className="font-medium text-slate-700">{log.user?.name || 'System'}</span> ({log.ipAddress})
                        </p>
                      </div>
                    </div>
                    <span className="text-slate-400 text-[11px] whitespace-nowrap">
                      {formatDate(log.createdAt, true)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Administration Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Administration Shortcuts</CardTitle>
              <CardDescription>Primary administrative management tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <Link href="/admin/users" className="block">
                <div className="p-3 rounded-lg border border-slate-200 hover:border-navy-900/30 hover:bg-slate-50 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-navy-50 text-navy-900 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800">User Management</h4>
                      <p className="text-[11px] text-slate-500">Add, edit, deactivate staff</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-navy-900 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>

              <Link href="/admin/settings" className="block">
                <div className="p-3 rounded-lg border border-slate-200 hover:border-navy-900/30 hover:bg-slate-50 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-navy-50 text-navy-900 flex items-center justify-center">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800">Company & System Settings</h4>
                      <p className="text-[11px] text-slate-500">Configure prefixes, currency, details</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-navy-900 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>

              <Link href="/admin/audit-logs" className="block">
                <div className="p-3 rounded-lg border border-slate-200 hover:border-navy-900/30 hover:bg-slate-50 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-navy-50 text-navy-900 flex items-center justify-center">
                      <History className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800">Audit Trail</h4>
                      <p className="text-[11px] text-slate-500">Security and action logs</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-navy-900 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* System Environment Status Card */}
          <Card className="bg-navy-950 text-white border-navy-800">
            <CardContent className="p-5">
              <div className="flex items-center gap-2.5 mb-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  PostgreSQL Architecture
                </h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Full relational schemas, foreign keys, and indexes active in PostgreSQL database.
              </p>
              <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Connected & Operational</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
