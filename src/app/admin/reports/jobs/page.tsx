'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  ArrowLeft,
  Download,
  RefreshCw,
  Search,
  CheckCircle2,
  Building2,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export default function JobsReportPage() {
  const { error } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [preset, setPreset] = useState('THIS_YEAR');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/jobs?preset=${preset}`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.data.jobs);
      } else {
        error(data.error || 'Failed to load jobs report');
      }
    } catch {
      error('Failed to communicate with server');
    } finally {
      setLoading(false);
    }
  }, [preset, error]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const filteredJobs = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.jobCode.toLowerCase().includes(search.toLowerCase()) ||
      j.country.toLowerCase().includes(search.toLowerCase())
  );

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
            <Briefcase className="w-7 h-7 text-primary" />
            Job Orders & Demand Fulfillment Report
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track requisition quotas against candidate submissions, selection counts, and fill rate efficiency.
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

          <Button variant="outline" size="sm" onClick={fetchJobs} disabled={loading}>
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

      {/* Search Filter */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by job code, title, country..."
            className="pl-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          Showing {filteredJobs.length} job orders
        </span>
      </div>

      {/* Jobs Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Job Code</th>
                <th className="px-6 py-4">Job Title & Trade</th>
                <th className="px-6 py-4">Country & Employer</th>
                <th className="px-6 py-4 text-center">Vacancies</th>
                <th className="px-6 py-4 text-center">Applications</th>
                <th className="px-6 py-4 text-center">Placed</th>
                <th className="px-6 py-4 text-center">Fill Rate</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && jobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading job reports...
                  </td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    No matching jobs found.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((j) => (
                  <tr key={j.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">
                      {j.jobCode}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{j.title}</div>
                      <div className="text-xs text-muted-foreground">{j.category}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      <div className="font-medium text-foreground">{j.country}</div>
                      <div>{j.employer}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-foreground">
                      {j.vacancies}
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-xs">
                      {j.totalApplications}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">
                      {j.placed}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-bold text-xs">{j.fillRate}%</span>
                        <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              j.fillRate >= 100
                                ? 'bg-emerald-500'
                                : j.fillRate > 50
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, j.fillRate)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground">
                        {j.status}
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
