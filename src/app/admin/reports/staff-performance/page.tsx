'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  ArrowLeft,
  RefreshCw,
  Calendar,
  Layers,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

export default function StaffPerformanceReportPage() {
  const { error } = useToast();
  const [staff, setStaff] = useState<any[]>([]);
  const [preset, setPreset] = useState('THIS_MONTH');
  const [loading, setLoading] = useState(true);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/staff-performance?preset=${preset}`);
      const data = await res.json();
      if (data.success) {
        setStaff(data.data.staff);
      } else {
        error(data.error || 'Failed to load staff performance report');
      }
    } catch {
      error('Failed to communicate with server');
    } finally {
      setLoading(false);
    }
  }, [preset, error]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

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
            <UserCheck className="w-7 h-7 text-primary" />
            Recruiter & Staff Performance Report
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Evaluate operational productivity, candidate screenings, interview scheduling velocity, and conversion output.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="text-xs bg-card border border-border rounded-lg p-2 font-medium"
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
          >
            <option value="THIS_MONTH">This Month</option>
            <option value="LAST_MONTH">Last Month</option>
            <option value="THIS_QUARTER">This Quarter</option>
            <option value="THIS_YEAR">This Year</option>
            <option value="ALL_TIME">All Time</option>
          </select>

          <Button variant="outline" size="sm" onClick={fetchStaff} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Staff Member</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-center">Interviews Scheduled</th>
                <th className="px-6 py-4 text-center">Pipeline Transitions</th>
                <th className="px-6 py-4 text-center">Visa Status Updates</th>
                <th className="px-6 py-4 text-center">Active Assigned Files</th>
                <th className="px-6 py-4 text-center">Placements Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && staff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading staff performance...
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No staff records found.
                  </td>
                </tr>
              ) : (
                staff.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">
                      <div>{u.name}</div>
                      <div className="text-xs text-muted-foreground font-normal">{u.email}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-primary">
                      {u.role}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold">
                      {u.interviewsCreated}
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-xs">
                      {u.pipelineTransitions}
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-xs">
                      {u.visaTransitions}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-foreground">
                      {u.activeApplications}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">
                      {u.completedPlacements}
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
