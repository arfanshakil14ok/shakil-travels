'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  ArrowLeft,
  RefreshCw,
  User,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

export default function StaffWorkloadReportPage() {
  const { error } = useToast();
  const [workloads, setWorkloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkloads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/staff-workload');
      const data = await res.json();
      if (data.success) {
        setWorkloads(data.data.staffWorkload);
      } else {
        error(data.error || 'Failed to load workload data');
      }
    } catch {
      error('Failed to communicate with server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkloads();
  }, []);

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
            <Layers className="w-7 h-7 text-primary" />
            Operational Staff Workload & Capacity Allocation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time balance of open candidate profiles, active applications, and visa cases across operational team members.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchWorkloads} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Workload Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Team Member</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-center">Active Candidates</th>
                <th className="px-6 py-4 text-center">Active Applications</th>
                <th className="px-6 py-4 text-center">Active Visa Files</th>
                <th className="px-6 py-4 text-center">Total Open Load</th>
                <th className="px-6 py-4 text-center">Load Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && workloads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Calculating active workloads...
                  </td>
                </tr>
              ) : workloads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No active staff members found.
                  </td>
                </tr>
              ) : (
                workloads.map((u) => {
                  let loadBadge = 'bg-emerald-100 text-emerald-800';
                  let loadLabel = 'Optimal';
                  if (u.totalActiveWorkload > 30) {
                    loadBadge = 'bg-rose-100 text-rose-800';
                    loadLabel = 'Heavy';
                  } else if (u.totalActiveWorkload > 15) {
                    loadBadge = 'bg-amber-100 text-amber-800';
                    loadLabel = 'Moderate';
                  }

                  return (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">
                        <div>{u.name}</div>
                        <div className="text-xs text-muted-foreground font-normal">{u.email}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-primary">
                        {u.role}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold">
                        {u.activeApplicants}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold">
                        {u.activeApplications}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold">
                        {u.activeVisaCases}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-base text-foreground">
                        {u.totalActiveWorkload}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${loadBadge}`}>
                          {loadLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
