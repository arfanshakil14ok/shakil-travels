'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Plus,
  Search,
  Download,
  RefreshCw,
  Eye,
  Building2,
  Globe2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';

export default function JobsPage() {
  const { error } = useToast();

  const [jobs, setJobs] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function loadLookups() {
      try {
        const [cRes, catRes] = await Promise.all([
          fetch('/api/countries?activeOnly=true'),
          fetch('/api/job-categories?activeOnly=true'),
        ]);
        const [cData, catData] = await Promise.all([cRes.json(), catRes.json()]);
        if (cData.success) setCountries(cData.data);
        if (catData.success) setCategories(catData.data);
      } catch (err) {
        console.error('Failed to load lookups', err);
      }
    }
    loadLookups();
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '12');
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (countryFilter !== 'ALL') params.append('countryId', countryFilter);
      if (categoryFilter !== 'ALL') params.append('categoryId', categoryFilter);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to fetch jobs');

      setJobs(data.data.items || []);
      setTotalPages(data.data.pagination.totalPages || 1);
      setTotalCount(data.data.pagination.total || 0);
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, countryFilter, categoryFilter, error]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (statusFilter !== 'ALL') params.append('status', statusFilter);
    if (countryFilter !== 'ALL') params.append('countryId', countryFilter);
    if (categoryFilter !== 'ALL') params.append('categoryId', categoryFilter);

    window.open(`/api/jobs/export?${params.toString()}`, '_blank');
  };

  const getStatusBadgeVariant = (st: string) => {
    switch (st) {
      case 'PUBLISHED':
        return 'success';
      case 'DRAFT':
        return 'warning';
      case 'PAUSED':
        return 'neutral';
      case 'CLOSED':
      case 'EXPIRED':
        return 'danger';
      default:
        return 'primary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Demand Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Overseas Job Demands
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse international vacancies, quotas, salary packages, and employer specifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>

          <Link href="/admin/jobs/new">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Post New Demand
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              placeholder="Search title, job code, skills..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />

            <Select
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'PUBLISHED', label: 'Published' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'PAUSED', label: 'Paused' },
                { value: 'CLOSED', label: 'Closed' },
              ]}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            />

            <Select
              options={[
                { value: 'ALL', label: 'All Destinations' },
                ...countries.map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={countryFilter}
              onChange={(e) => {
                setCountryFilter(e.target.value);
                setPage(1);
              }}
            />

            <Select
              options={[
                { value: 'ALL', label: 'All Trade Categories' },
                ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
              ]}
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Jobs Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Demand Code & Title</th>
                <th className="p-3.5">Destination</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Vacancies</th>
                <th className="p-3.5">Monthly Remuneration</th>
                <th className="p-3.5">Key Allowances</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-navy-900" />
                    Loading job demands...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    No overseas vacancies found matching the current search parameters.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <Link
                        href={`/admin/jobs/${job.id}`}
                        className="font-semibold text-slate-900 hover:text-emerald-600 block truncate max-w-[200px]"
                      >
                        {job.title}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[10px] text-slate-500">
                          {job.jobCode}
                        </span>
                        {job.featured && (
                          <span className="text-[9px] bg-amber-50 text-amber-700 px-1 py-0.2 rounded border border-amber-200 font-semibold">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="font-medium text-slate-800 flex items-center gap-1.5">
                        {job.country?.flag && <span>{job.country.flag}</span>}
                        <span>{job.country?.name}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {job.employer?.companyName || 'Confidential Principal'}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="text-slate-800 font-medium block">
                        {job.jobCategory?.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Min {job.experienceRequired} yrs exp
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block">
                        {job.vacancyCount}
                      </span>
                      <span className="text-[10px] text-slate-400">openings</span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-semibold text-emerald-700 block">
                        {job.currency} {Number(job.salaryMin).toLocaleString()}
                        {job.salaryMax ? ` - ${Number(job.salaryMax).toLocaleString()}` : ''}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {job.workingHours || 'Standard duty'}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {job.food && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                            Food
                          </span>
                        )}
                        {job.accommodation && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                            Accom
                          </span>
                        )}
                        {job.airTicket && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                            Ticket
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <Badge variant={getStatusBadgeVariant(job.status)} size="sm">
                        {job.status}
                      </Badge>
                    </td>

                    <td className="p-3.5 text-right">
                      <Link href={`/admin/jobs/${job.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                          className="text-xs"
                        >
                          View Demand
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {jobs.length} of {totalCount} total vacancies
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
            >
              Previous
            </Button>
            <span className="px-2 font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
