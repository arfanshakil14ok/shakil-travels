'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Plus,
  Search,
  RefreshCw,
  Building2,
  ShieldCheck,
  Clock,
  ExternalLink,
  Edit,
  Trash2,
  AlertCircle,
  FileCheck2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';

export default function StaffJobsPage() {
  const { success, error } = useToast();

  const [jobs, setJobs] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [employers, setEmployers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [employerFilter, setEmployerFilter] = useState('ALL');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  // Delete / Close Dialog
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [cRes, catRes, empRes] = await Promise.all([
          fetch('/api/countries?activeOnly=true'),
          fetch('/api/categories?activeOnly=true'),
          fetch('/api/employers?limit=100'),
        ]);

        const [cData, catData, empData] = await Promise.all([
          cRes.json(),
          catRes.json(),
          empRes.json(),
        ]);

        if (cData.success) setCountries(cData.data);
        if (catData.success) setCategories(catData.data);
        if (empData.success) setEmployers(empData.data.items || []);
      } catch (err) {
        console.error('Failed to load filter metadata', err);
      }
    }
    loadMetadata();
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '15');
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (countryFilter !== 'ALL') params.append('countryId', countryFilter);
      if (categoryFilter !== 'ALL') params.append('categoryId', categoryFilter);
      if (employerFilter !== 'ALL') params.append('employerId', employerFilter);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to fetch jobs');

      setJobs(data.data.items || []);
      setTotalPages(data.data.pagination?.totalPages || 1);
      setTotalJobs(data.data.pagination?.total || 0);
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, countryFilter, categoryFilter, employerFilter, error]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/jobs/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete job');

      success(data.message || 'Job deleted / closed successfully');
      setDeleteTarget(null);
      fetchJobs();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="success">Published</Badge>;
      case 'PENDING_APPROVAL':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'APPROVED':
        return <Badge variant="primary">Approved</Badge>;
      case 'PAUSED':
        return <Badge variant="neutral">Paused</Badge>;
      case 'CLOSED':
        return <Badge variant="danger">Closed</Badge>;
      case 'EXPIRED':
        return <Badge variant="danger">Expired</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Briefcase className="w-7 h-7 text-indigo-600" />
            Overseas Job Demands & Vacancy Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            বৈদেশিক কাজের চাহিদা, কোটা ব্যবস্থাপনা, প্রার্থী ম্যাচিং ও অনুমোদন ওয়ার্কফ্লো (RL-1892)
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={fetchJobs} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Link href="/staff/jobs/new">
              <Plus className="w-4 h-4 mr-1.5" />
              New Job Demand
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search title, trade, job code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 text-xs"
            />
          </div>

          <div>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Job Statuses' },
                { value: 'PUBLISHED', label: 'Published (Active)' },
                { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
                { value: 'APPROVED', label: 'Approved (Unpublished)' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'PAUSED', label: 'Paused' },
                { value: 'CLOSED', label: 'Closed' },
              ]}
              className="text-xs"
            />
          </div>

          <div>
            <Select
              value={countryFilter}
              onChange={(e) => {
                setCountryFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Destinations' },
                ...countries.map((c) => ({ value: c.id, label: `${c.flag || ''} ${c.name}` })),
              ]}
              className="text-xs"
            />
          </div>

          <div>
            <Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Trade Categories' },
                ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
              ]}
              className="text-xs"
            />
          </div>

          <div>
            <Select
              value={employerFilter}
              onChange={(e) => {
                setEmployerFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Employers' },
                ...employers.map((emp) => ({ value: emp.id, label: emp.companyName })),
              ]}
              className="text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Job Code & Title</th>
                <th className="py-3 px-4">Employer & Verification</th>
                <th className="py-3 px-4">Trade & Destination</th>
                <th className="py-3 px-4">Salary & Period</th>
                <th className="py-3 px-4">Quota Utilization</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading job demands...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Briefcase className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    No overseas jobs found matching criteria.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const remaining = Math.max(0, (job.vacancyCount || 0) - (job.filledCount || 0));
                  const isVerifiedEmployer = job.employer?.verificationStatus === 'VERIFIED';

                  return (
                    <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/staff/jobs/${job.id}/review`}
                          className="font-semibold text-slate-900 hover:text-indigo-600 text-sm flex items-center gap-1"
                        >
                          {job.title}
                        </Link>
                        {job.titleLocal && (
                          <div className="text-xs text-slate-500 font-normal">{job.titleLocal}</div>
                        )}
                        <div className="mt-1 font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 inline-block">
                          {job.jobCode}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {job.employer ? (
                          <div>
                            <Link
                              href={`/staff/employers/${job.employer.id}`}
                              className="font-medium text-slate-900 hover:text-indigo-600 hover:underline flex items-center gap-1"
                            >
                              {job.employer.companyName}
                            </Link>
                            <div className="mt-1">
                              {isVerifiedEmployer ? (
                                <Badge variant="success" className="text-[10px] gap-1">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                                </Badge>
                              ) : (
                                <Badge variant="warning" className="text-[10px] gap-1">
                                  <Clock className="w-3 h-3 text-amber-600" /> Unverified
                                </Badge>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {job.jobCategory?.name || 'General'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>{job.country?.flag || '🌐'}</span>
                          <span>{job.country?.name}</span>
                          {job.city ? ` • ${job.city}` : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {job.salaryMin ? `${job.salaryMin} - ${job.salaryMax} ${job.currency}` : 'Negotiable'}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                          {job.salaryPeriod || 'MONTHLY'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {job.filledCount || 0} / {job.vacancyCount}
                          </span>
                          <span className="text-slate-400">filled</span>
                        </div>
                        <div className="mt-1">
                          <Badge variant={remaining > 0 ? 'primary' : 'neutral'} className="text-[10px]">
                            {remaining} remaining
                          </Badge>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {job._count?.applications || 0} applicants
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {getStatusBadge(job.status)}
                        {job.applicationDeadline && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1">
                        <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-indigo-600 font-medium">
                          <Link href={`/staff/jobs/${job.id}/review`}>
                            <FileCheck2 className="w-3.5 h-3.5 mr-1" />
                            Review
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-slate-600">
                          <Link href={`/staff/jobs/${job.id}/edit`}>
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                        {job.status === 'PUBLISHED' && (
                          <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-slate-500">
                            <Link href={`/jobs/${job.slug}`} target="_blank">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(job)}
                          className="h-8 text-rose-500 hover:bg-rose-50 p-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>Total: {totalJobs} job demands</div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Confirm Job Posting Removal"
        message={`Are you sure you want to remove ${deleteTarget?.title} (${deleteTarget?.jobCode})? If candidate applications exist, the job will be set to CLOSED instead of deleted.`}
        confirmText={isDeleting ? 'Processing...' : 'Confirm'}
        variant="danger"
      />
    </div>
  );
}
