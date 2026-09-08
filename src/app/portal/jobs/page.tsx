'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Search,
  Filter,
  MapPin,
  Building2,
  DollarSign,
  Calendar,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

export default function PortalJobsPage() {
  const { success, error } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Apply Modal
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyNotes, setApplyNotes] = useState('');
  const [applying, setApplying] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        search,
      });
      if (countryFilter !== 'ALL') params.append('countryId', countryFilter);
      if (categoryFilter !== 'ALL') params.append('categoryId', categoryFilter);

      const res = await fetch(`/api/portal/jobs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.data.items);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        error(data.error || 'Failed to load jobs');
      }
    } catch {
      error('Failed to communicate with server');
    } finally {
      setLoading(false);
    }
  }, [page, search, countryFilter, categoryFilter, error]);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [cRes, catRes] = await Promise.all([
          fetch('/api/countries'),
          fetch('/api/job-categories'),
        ]);
        const cData = await cRes.json();
        const catData = await catRes.json();
        if (cData.success) setCountries(cData.data);
        if (catData.success) setCategories(catData.data);
      } catch {
        // silent
      }
    }
    loadMeta();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleOpenApply = (job: any) => {
    setSelectedJob(job);
    setApplyNotes('');
    setIsApplyModalOpen(true);
  };

  const handleConfirmApply = async () => {
    if (!selectedJob) return;
    setApplying(true);
    try {
      const res = await fetch(`/api/portal/jobs/${selectedJob.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: applyNotes }),
      });
      const data = await res.json();
      if (data.success) {
        success(data.message || 'Application submitted successfully');
        setIsApplyModalOpen(false);
        fetchJobs();
      } else {
        error(data.error || 'Failed to submit application');
      }
    } catch {
      error('Error submitting application');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Briefcase className="w-7 h-7 text-primary" />
          Overseas Employment Opportunities
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Explore government-registered vacancies. All placements strictly follow legal bilateral recruitment guidelines.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search trade, title, or code..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            className="text-xs bg-background border border-border rounded-lg p-2.5"
            value={countryFilter}
            onChange={(e) => {
              setCountryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Countries</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="text-xs bg-background border border-border rounded-lg p-2.5"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <Button variant="outline" size="sm" onClick={fetchJobs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Jobs Grid */}
      {loading && jobs.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          Finding jobs...
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl p-6">
          <Briefcase className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold text-base text-foreground">No open positions found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search query or country filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-xs text-primary font-semibold">
                    {job.jobCode}
                  </span>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded font-medium">
                    {job.category?.name || 'General'}
                  </span>
                </div>

                <h3 className="font-bold text-base text-foreground line-clamp-1">{job.title}</h3>

                <div className="space-y-1.5 mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 text-foreground">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>Destination: <strong>{job.country?.name}</strong></span>
                  </div>

                  {job.employer && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{job.employer.companyName}</span>
                    </div>
                  )}

                  {job.salaryMin && (
                    <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>
                        {job.salaryMin} - {job.salaryMax || ''} {job.salaryCurrency} / month
                      </span>
                    </div>
                  )}
                </div>

                {job.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-3 bg-muted/20 p-2.5 rounded-lg border border-border/50">
                    {job.description}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-border flex items-center justify-between">
                {job.hasApplied ? (
                  <Link
                    href={`/portal/applications/${job.applicationId}`}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Application Submitted ({job.applicationCode})
                  </Link>
                ) : (
                  <Button
                    className="w-full text-xs font-semibold"
                    size="sm"
                    onClick={() => handleOpenApply(job)}
                  >
                    Apply for Position
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Apply Modal */}
      {selectedJob && (
        <Modal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          title={`Apply: ${selectedJob.title}`}
          className="max-w-md"
        >
          <div className="space-y-4">
            <div className="bg-muted/40 p-3 rounded-lg border border-border text-xs space-y-1">
              <div>
                <span className="text-muted-foreground">Job Code:</span>{' '}
                <span className="font-mono font-semibold text-foreground">{selectedJob.jobCode}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Country:</span>{' '}
                <span className="font-semibold text-foreground">{selectedJob.country?.name}</span>
              </div>
              {selectedJob.salaryMin && (
                <div>
                  <span className="text-muted-foreground">Estimated Salary:</span>{' '}
                  <span className="font-semibold text-emerald-600">
                    {selectedJob.salaryMin} {selectedJob.salaryCurrency}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Cover Note / Relevant Qualifications (Optional)
              </label>
              <textarea
                rows={3}
                className="w-full text-sm bg-background border border-border rounded-lg p-2.5 text-foreground"
                placeholder="Briefly state your relevant trade experience..."
                value={applyNotes}
                onChange={(e) => setApplyNotes(e.target.value)}
              />
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg text-[11px] text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-3.5 h-3.5 inline mr-1 text-amber-600" />
              Submitting an application creates an official recruitment record. Please ensure your passport details are up to date.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsApplyModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmApply}
                disabled={applying}
              >
                {applying ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
