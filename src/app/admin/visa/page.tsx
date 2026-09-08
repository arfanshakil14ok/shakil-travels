'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Stamp,
  Clock,
  FileCheck2,
  Send,
  SearchCheck,
  AlertTriangle,
  BadgeCheck,
  CircleX,
  History,
  Plus,
  ArrowRight,
  ExternalLink,
  CalendarDays,
  FileText,
  Users,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

export default function VisaDashboardPage() {
  const { error } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [recentCases, setRecentCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, listRes] = await Promise.all([
        fetch('/api/visa/stats'),
        fetch('/api/visa/applications?limit=6&sortBy=updatedAt&sortOrder=desc'),
      ]);

      const statsData = await statsRes.json();
      const listData = await listRes.json();

      if (statsData.success) {
        setStats(statsData.data);
      }
      if (listData.success) {
        setRecentCases(listData.data.items || []);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load visa operations data');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const kpis = [
    { label: 'Total Visa Cases', value: stats?.total || 0, icon: Stamp, color: 'text-primary-600 bg-primary-50', link: '/admin/visa/applications' },
    { label: 'Not Started', value: stats?.notStarted || 0, icon: Clock, color: 'text-slate-600 bg-slate-100', link: '/admin/visa/applications?status=NOT_STARTED' },
    { label: 'Documents Pending', value: stats?.documentPending || 0, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50', link: '/admin/visa/applications?status=DOCUMENT_PENDING' },
    { label: 'Documents Ready', value: stats?.documentReady || 0, icon: FileCheck2, color: 'text-blue-600 bg-blue-50', link: '/admin/visa/applications?status=DOCUMENT_READY' },
    { label: 'Submitted to Embassy', value: stats?.submitted || 0, icon: Send, color: 'text-indigo-600 bg-indigo-50', link: '/admin/visa/applications?status=SUBMITTED' },
    { label: 'Under Review', value: stats?.underReview || 0, icon: SearchCheck, color: 'text-purple-600 bg-purple-50', link: '/admin/visa/applications?status=UNDER_REVIEW' },
    { label: 'Additional Docs Req.', value: stats?.additionalDocuments || 0, icon: AlertTriangle, color: 'text-orange-600 bg-orange-50', link: '/admin/visa/applications?status=ADDITIONAL_DOCUMENT_REQUESTED' },
    { label: 'Visas Approved', value: stats?.approved || 0, icon: BadgeCheck, color: 'text-emerald-600 bg-emerald-50', link: '/admin/visa/applications?status=APPROVED' },
    { label: 'Visas Rejected', value: stats?.rejected || 0, icon: CircleX, color: 'text-rose-600 bg-rose-50', link: '/admin/visa/applications?status=REJECTED' },
    { label: 'Expired / Warning', value: stats?.expired || 0, icon: History, color: 'text-rose-700 bg-rose-100', link: '/admin/visa/applications?status=EXPIRED' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">APPROVED</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">REJECTED</Badge>;
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return <Badge variant="primary">{status.replace(/_/g, ' ')}</Badge>;
      case 'DOCUMENT_PENDING':
      case 'ADDITIONAL_DOCUMENT_REQUESTED':
        return <Badge variant="warning">{status.replace(/_/g, ' ')}</Badge>;
      default:
        return <Badge variant="secondary">{status.replace(/_/g, ' ')}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
              <Stamp className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Visa & Immigration Operations</h1>
              <p className="text-sm text-slate-500">
                Embassy tracking, biometric appointments, clearance, and departure readiness.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/visa-information">
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Visa Criteria
            </Button>
          </Link>
          <Link href="/admin/visa/applications">
            <Button className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Manage All Cases
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((kpi, index) => {
          const IconComponent = kpi.icon;
          return (
            <Link key={index} href={kpi.link}>
              <Card className="hover:border-primary-300 hover:shadow-md transition-all cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-500 leading-tight">{kpi.label}</span>
                    <div className={`p-2 rounded-lg ${kpi.color}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 font-mono">
                    {loading ? '—' : kpi.value}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Upcoming Appointments & Recent Visa Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-500" />
              Active Visa Cases
            </CardTitle>
            <Link href="/admin/visa/applications" className="text-xs font-medium text-primary-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Visa ID</th>
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">Loading visa cases...</td>
                    </tr>
                  ) : recentCases.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">No active visa cases registered yet.</td>
                    </tr>
                  ) : (
                    recentCases.map((vc) => (
                      <tr key={vc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-primary-700">
                          <Link href={`/admin/visa/applications/${vc.id}`} className="hover:underline">
                            {vc.visaApplicationNumber}
                          </Link>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            App: {vc.application?.applicationCode}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{vc.applicant?.fullName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Passport: {vc.applicant?.passportNumber || 'N/A'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-800">{vc.country?.name}</span>
                          <span className="block text-[11px] text-slate-400">{vc.visaType.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="py-3.5 px-4">{getStatusBadge(vc.status)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <Link href={`/admin/visa/applications/${vc.id}`}>
                            <Button size="sm" variant="outline" className="text-xs">
                              Manage Case
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Operations & Links */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary-600" />
                Operations Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                <div className="text-sm font-medium text-slate-700">Scheduled Appointments</div>
                <div className="text-lg font-bold font-mono text-primary-600">
                  {loading ? '—' : stats?.upcomingAppointments || 0}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Link href="/admin/visa-information" className="block">
                  <div className="p-3 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800">Visa Requirements Library</span>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </div>
                </Link>
                <Link href="/admin/country-information" className="block">
                  <div className="p-3 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800">Country Guidelines & Policies</span>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </div>
                </Link>
                <Link href="/admin/migrant-information" className="block">
                  <div className="p-3 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800">Migrant Advisories & Content</span>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
