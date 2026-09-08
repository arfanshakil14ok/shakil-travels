'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  ArrowLeft,
  RefreshCw,
  Download,
  Users,
  Briefcase,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

export default function EmployersReportPage() {
  const { error } = useToast();
  const [employers, setEmployers] = useState<any[]>([]);
  const [preset, setPreset] = useState('THIS_YEAR');
  const [loading, setLoading] = useState(true);

  const fetchEmployers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/employers?preset=${preset}`);
      const data = await res.json();
      if (data.success) {
        setEmployers(data.data.employers);
      } else {
        error(data.error || 'Failed to load employers report');
      }
    } catch {
      error('Failed to communicate with server');
    } finally {
      setLoading(false);
    }
  }, [preset, error]);

  useEffect(() => {
    fetchEmployers();
  }, [fetchEmployers]);

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
            <Building2 className="w-7 h-7 text-primary" />
            Employer Hiring Volume & Performance Report
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Accounts report on employer demand quotas, applicant volumes, successful placements, and billings.
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

          <Button variant="outline" size="sm" onClick={fetchEmployers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <a href={`/api/reports/export?type=employers&preset=${preset}`} download>
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-1.5" />
              Export CSV
            </Button>
          </a>
        </div>
      </div>

      {/* Employers Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Employer Code</th>
                <th className="px-6 py-4">Company Name</th>
                <th className="px-6 py-4">Country</th>
                <th className="px-6 py-4 text-center">Job Orders</th>
                <th className="px-6 py-4 text-center">Demand Quota</th>
                <th className="px-6 py-4 text-center">Applications</th>
                <th className="px-6 py-4 text-center">Placements</th>
                <th className="px-6 py-4 text-right">Billed Amount</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && employers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading employer data...
                  </td>
                </tr>
              ) : employers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                    No employer records found.
                  </td>
                </tr>
              ) : (
                employers.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">
                      {e.employerCode}
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground">{e.companyName}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{e.country}</td>
                    <td className="px-6 py-4 text-center font-medium">{e.totalJobs}</td>
                    <td className="px-6 py-4 text-center font-bold text-foreground">
                      {e.totalVacancies}
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-xs text-muted-foreground">
                      {e.totalApplications}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">
                      {e.totalPlacements}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-foreground font-mono text-xs">
                      ৳{Number(e.totalBilled || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground">
                        {e.status}
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
