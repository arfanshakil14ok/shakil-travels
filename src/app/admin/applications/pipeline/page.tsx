'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Layers,
  Search,
  Filter,
  ArrowRight,
  User,
  Building2,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowLeft,
  ChevronRight,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

interface Column {
  id: string;
  title: string;
  color: string;
  count: number;
  items: any[];
}

export default function PipelinePage() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobsList, setJobsList] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('ALL');
  const [search, setSearch] = useState('');
  const [vacancyStats, setVacancyStats] = useState<any | null>(null);

  // Transition modal
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [nextStage, setNextStage] = useState('');
  const [transitionNotes, setTransitionNotes] = useState('');
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);

  // Fetch jobs for filter
  useEffect(() => {
    async function loadJobs() {
      try {
        const res = await fetch('/api/jobs?limit=100');
        const data = await res.json();
        if (data.success) {
          setJobsList(data.data.items);
        }
      } catch (err) {
        console.error('Failed to load jobs', err);
      }
    }
    loadJobs();
  }, []);

  const fetchPipeline = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (selectedJobId !== 'ALL') query.set('jobId', selectedJobId);
      if (search) query.set('search', search);

      const res = await fetch(`/api/applications/pipeline?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setColumns(data.data.columns);
        setVacancyStats(data.data.vacancyStats);
      }
    } catch (err) {
      console.error('Failed to fetch pipeline', err);
    } finally {
      setLoading(false);
    }
  }, [selectedJobId, search]);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  const openQuickAdvance = (app: any, targetColId: string) => {
    setSelectedApp(app);
    setNextStage(targetColId);
    setTransitionNotes('');
    setTransitionError(null);
    setIsTransitionModalOpen(true);
  };

  const handleConfirmTransition = async (forceOverride = false) => {
    if (!selectedApp || !nextStage) return;
    setTransitionError(null);

    try {
      const res = await fetch(`/api/applications/${selectedApp.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toStatus: nextStage,
          notes: transitionNotes || `Quick stage advancement via recruitment pipeline board`,
          forceOverride,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsTransitionModalOpen(false);
        fetchPipeline();
      } else {
        setTransitionError(data.error || 'Failed to move candidate');
      }
    } catch (err: any) {
      setTransitionError(err.message || 'Error advancing candidate');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/applications" className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1 font-medium">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Applications List
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-7 h-7 text-primary-600" />
            Recruitment Pipeline Board
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visual stage progression workflow and job vacancy quota monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => fetchPipeline()} className="flex items-center gap-1.5 border-slate-300">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Board
          </Button>
          <Link href="/admin/applications">
            <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white">
              Manage Applications
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Vacancy Monitor Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <label className="text-xs font-semibold text-slate-700 uppercase">Target Job Demand:</label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-primary-500 focus:outline-none min-w-[260px]"
            >
              <option value="ALL">All Overseas Jobs (Global View)</option>
              {jobsList.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.jobCode}) — {j.country?.name} [{j.vacancies} vacancies]
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search candidates in board..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 text-xs"
            />
          </div>
        </div>

        {/* Vacancy Quota Card when job selected */}
        {vacancyStats && (
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-slate-500 font-medium">Job Quota:</span>{' '}
                <span className="font-bold text-slate-900 text-sm">{vacancyStats.vacancies}</span>
              </div>
              <div>
                <span className="text-amber-600 font-medium">Selected / Confirmed:</span>{' '}
                <span className="font-bold text-amber-700 text-sm">{vacancyStats.selectedCount}</span>
              </div>
              <div>
                <span className="text-emerald-600 font-medium">Remaining Openings:</span>{' '}
                <span className="font-bold text-emerald-700 text-sm">{vacancyStats.remainingVacancies}</span>
              </div>
              <div>
                <span className="text-sky-600 font-medium">Active Applicants:</span>{' '}
                <span className="font-bold text-sky-700 text-sm">{vacancyStats.totalApplications}</span>
              </div>
            </div>

            {/* Quota Progress Bar */}
            <div className="w-48 bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  vacancyStats.remainingVacancies === 0 ? 'bg-rose-500' : 'bg-amber-500'
                }`}
                style={{
                  width: `${Math.min(100, Math.round((vacancyStats.selectedCount / vacancyStats.vacancies) * 100))}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Kanban Board Horizontal Scroll */}
      <div className="overflow-x-auto pb-6">
        <div className="flex gap-4 min-w-max">
          {loading ? (
            <div className="py-20 text-center w-full text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary-600" />
              Loading pipeline stages...
            </div>
          ) : (
            columns.map((col, colIdx) => (
              <div
                key={col.id}
                className="w-72 bg-slate-100/80 rounded-xl border border-slate-200 flex flex-col max-h-[750px] shadow-sm"
              >
                {/* Column Header */}
                <div className="p-3 bg-white rounded-t-xl border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800 tracking-wide uppercase">
                      {col.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {col.count}
                    </span>
                  </div>
                </div>

                {/* Column Body Cards */}
                <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1">
                  {col.items.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 italic">
                      No candidates in this stage
                    </div>
                  ) : (
                    col.items.map((app) => (
                      <div
                        key={app.id}
                        className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative"
                      >
                        {/* Header: Photo + Name + Priority */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs overflow-hidden shrink-0">
                              {app.applicant.profilePhoto ? (
                                <img src={app.applicant.profilePhoto} alt={app.applicant.fullName} className="w-full h-full object-cover" />
                              ) : (
                                app.applicant.fullName.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <Link href={`/admin/applications/${app.id}`} className="font-semibold text-xs text-slate-900 hover:text-primary-600 line-clamp-1">
                                {app.applicant.fullName}
                              </Link>
                              <span className="text-[10px] text-slate-400 font-mono">{app.applicant.applicantNumber}</span>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              app.priority === 'URGENT'
                                ? 'bg-rose-100 text-rose-700'
                                : app.priority === 'HIGH'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {app.priority}
                          </span>
                        </div>

                        {/* Job & Destination Flag */}
                        <div className="text-[11px] text-slate-600 mb-2 bg-slate-50 p-1.5 rounded border border-slate-100">
                          <div className="font-medium text-slate-800 truncate">{app.job.title}</div>
                          <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                            {app.job.country.flag && <span>{app.job.country.flag}</span>}
                            <span>{app.job.country.name}</span>
                          </div>
                        </div>

                        {/* Card Footer: Assigned & Next Action */}
                        <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-100">
                          <span className="text-slate-400 truncate max-w-[120px]">
                            {app.assignedTo ? app.assignedTo.name : 'Unassigned'}
                          </span>

                          <div className="flex items-center gap-1">
                            <Link href={`/admin/applications/${app.id}`}>
                              <button
                                type="button"
                                title="View Details"
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </Link>

                            {/* Quick advance to next column */}
                            {colIdx < columns.length - 1 && (
                              <button
                                type="button"
                                onClick={() => openQuickAdvance(app, columns[colIdx + 1].id)}
                                title={`Advance to ${columns[colIdx + 1].title}`}
                                className="p-1 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Advance Modal */}
      <Modal
        isOpen={isTransitionModalOpen}
        onClose={() => setIsTransitionModalOpen(false)}
        title="Advance Candidate Stage"
        description={selectedApp ? `Move ${selectedApp.applicant.fullName} (${selectedApp.applicationNumber}) to ${nextStage.replace(/_/g, ' ')}` : ''}
        maxWidth="md"
      >
        <div className="space-y-4">
          {transitionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              <p className="font-semibold">{transitionError}</p>
              {transitionError.includes('quota') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleConfirmTransition(true)}
                  className="mt-2 text-rose-700 border-rose-300 hover:bg-rose-100 text-xs"
                >
                  Force Manager Quota Override
                </Button>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Transition Notes / Audit Remark
            </label>
            <textarea
              value={transitionNotes}
              onChange={(e) => setTransitionNotes(e.target.value)}
              placeholder="e.g. Candidate completed interview with Grade A..."
              rows={3}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="outline" onClick={() => setIsTransitionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleConfirmTransition(false)}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              Confirm Move
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
