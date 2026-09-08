'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Globe2,
  ArrowLeft,
  RefreshCw,
  Stamp,
  Users,
  Briefcase,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

export default function CountriesReportPage() {
  const { error } = useToast();
  const [countries, setCountries] = useState<any[]>([]);
  const [preset, setPreset] = useState('THIS_YEAR');
  const [loading, setLoading] = useState(true);

  const fetchCountries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/countries?preset=${preset}`);
      const data = await res.json();
      if (data.success) {
        setCountries(data.data.countries);
      } else {
        error(data.error || 'Failed to load countries report');
      }
    } catch {
      error('Failed to communicate with server');
    } finally {
      setLoading(false);
    }
  }, [preset, error]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

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
            <Globe2 className="w-7 h-7 text-primary" />
            Destination Country Recruitment & Visa Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comparative performance across bilateral labor corridors: job demands, deployments, and visa issuance rates.
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

          <Button variant="outline" size="sm" onClick={fetchCountries} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Countries Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Country</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Active Jobs</th>
                <th className="px-6 py-4 text-center">Demand Quota</th>
                <th className="px-6 py-4 text-center">Applications</th>
                <th className="px-6 py-4 text-center">Placed</th>
                <th className="px-6 py-4 text-center">Visa Cases</th>
                <th className="px-6 py-4 text-center">Visa Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && countries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading country analytics...
                  </td>
                </tr>
              ) : countries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    No country data found.
                  </td>
                </tr>
              ) : (
                countries.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground flex items-center gap-2">
                      <span className="text-xl">{c.flagEmoji || '🌐'}</span>
                      <div>
                        <div>{c.name}</div>
                        <span className="font-mono text-xs text-muted-foreground font-normal">
                          {c.code}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.recruitmentStatus === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {c.recruitmentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-foreground">
                      {c.activeJobsCount}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-foreground">
                      {c.totalVacancies}
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-xs text-muted-foreground">
                      {c.totalApplications}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">
                      {c.placedCount}
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-xs">
                      {c.totalVisaCases}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-xs text-primary">
                        {c.visaApprovalRate}%
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
