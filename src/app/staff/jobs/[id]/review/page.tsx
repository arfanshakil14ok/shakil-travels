'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Briefcase,
  ArrowLeft,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  MapPin,
  Users,
  ExternalLink,
  Edit,
  Send,
  PauseCircle,
  PlayCircle,
  XCircle,
  RefreshCw,
  Award,
  Sparkles,
  FileCheck2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

export default function JobReviewPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;
  const { success, error } = useToast();

  const [job, setJob] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/jobs/${jobId}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to fetch job');
      setJob(data.data);
      setReviewNotes(data.data.reviewNotes || '');
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [jobId, error]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleStatusAction = async (action: string) => {
    try {
      setIsUpdatingStatus(true);
      const res = await fetch(`/api/jobs/${job.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          notes: reviewNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update status');

      success(data.message || `Status successfully changed`);
      fetchJob();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const [startingAppFor, setStartingAppFor] = useState<string | null>(null);

  const handleStartApplication = async (applicantId: string) => {
    try {
      setStartingAppFor(applicantId);
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId,
          jobId: job.id,
          source: 'STAFF_CREATED',
          appliedStage: 'APPLIED',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to initiate application');

      success(data.message || 'Application initiated successfully');
      router.push(`/staff/applications/${data.data.id}`);
    } catch (err: any) {
      error(err.message);
    } finally {
      setStartingAppFor(null);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
        Loading Job Review & Candidate Matches...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Job Demand Not Found</h2>
        <Button className="mt-4" onClick={() => router.push('/staff/jobs')}>
          Back to Jobs Directory
        </Button>
      </div>
    );
  }

  const isVerifiedEmployer = job.employer?.verificationStatus === 'VERIFIED';
  const remainingVacancies = Math.max(0, (job.vacancyCount || 0) - (job.filledCount || 0));

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-slate-600">
          <Link href="/staff/jobs">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Jobs Directory
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/staff/jobs/${job.id}/edit`}>
              <Edit className="w-3.5 h-3.5 mr-1" />
              Edit Job Details
            </Link>
          </Button>
          {job.status === 'PUBLISHED' && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/jobs/${job.slug}`} target="_blank">
                Public View
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Hero Header */}
      <Card className="border-indigo-100 bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2.5 py-0.5 rounded">
                {job.jobCode}
              </span>
              <Badge
                variant={
                  job.status === 'PUBLISHED'
                    ? 'success'
                    : job.status === 'PENDING_APPROVAL'
                    ? 'warning'
                    : job.status === 'APPROVED'
                    ? 'primary'
                    : 'neutral'
                }
                className="text-xs"
              >
                {job.status}
              </Badge>
              {job.featured && (
                <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded">
                  ★ Featured
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {job.title}
            </h1>
            {job.titleLocal && (
              <p className="text-sm text-indigo-200 font-normal">{job.titleLocal}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                {job.employer ? (
                  <Link
                    href={`/staff/employers/${job.employer.id}`}
                    className="text-indigo-300 hover:underline flex items-center gap-1 font-semibold"
                  >
                    {job.employer.companyName}
                    {isVerifiedEmployer ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </Link>
                ) : (
                  <span>Unassigned</span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-base">{job.country?.flag || '🌐'}</span>
                <span>{job.country?.name}</span>
                {job.city ? ` • ${job.city}` : ''}
              </div>

              <div>Trade: <span className="font-semibold text-white">{job.jobCategory?.name}</span></div>
            </div>
          </div>

          {/* Vacancy Quota Badge */}
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-4 text-center border border-white/10 shrink-0 min-w-[180px]">
            <div className="text-3xl font-bold text-white">
              {job.filledCount || 0} / {job.vacancyCount}
            </div>
            <div className="text-xs text-indigo-200 font-medium mt-0.5">Quota Filled</div>
            <div className="mt-2 text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 rounded py-0.5 px-2">
              {remainingVacancies} Remaining Vacancies
            </div>
          </div>
        </div>
      </Card>

      {/* Status Lifecycle Action Bar */}
      <Card className="border-indigo-100 bg-slate-50 p-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
              Recruitment Workflow & Status Control
            </h3>
            <span className="text-xs text-slate-500">Current Status: <strong className="text-slate-900">{job.status}</strong></span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {job.status === 'DRAFT' && (
              <Button
                size="sm"
                onClick={() => handleStatusAction('SUBMIT')}
                disabled={isUpdatingStatus}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                Submit for Manager Review
              </Button>
            )}

            {job.status === 'PENDING_APPROVAL' && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleStatusAction('APPROVE')}
                  disabled={isUpdatingStatus}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Approve Job Demand
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleStatusAction('PUBLISH')}
                  disabled={isUpdatingStatus || !isVerifiedEmployer}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                >
                  <PlayCircle className="w-3.5 h-3.5 mr-1" />
                  Approve & Publish to Marketplace
                </Button>
              </>
            )}

            {job.status === 'APPROVED' && (
              <Button
                size="sm"
                onClick={() => handleStatusAction('PUBLISH')}
                disabled={isUpdatingStatus || !isVerifiedEmployer}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                <PlayCircle className="w-3.5 h-3.5 mr-1" />
                Publish to Public Marketplace
              </Button>
            )}

            {job.status === 'PUBLISHED' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusAction('PAUSE')}
                  disabled={isUpdatingStatus}
                  className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                >
                  <PauseCircle className="w-3.5 h-3.5 mr-1" />
                  Pause Vacancy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusAction('CLOSE')}
                  disabled={isUpdatingStatus}
                  className="text-xs text-rose-700 border-rose-300 hover:bg-rose-50"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Close Demand
                </Button>
              </>
            )}

            {job.status === 'PAUSED' && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleStatusAction('RESUME')}
                  disabled={isUpdatingStatus}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                >
                  <PlayCircle className="w-3.5 h-3.5 mr-1" />
                  Resume Publishing
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusAction('CLOSE')}
                  disabled={isUpdatingStatus}
                  className="text-xs text-rose-700 border-rose-300 hover:bg-rose-50"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Close Demand
                </Button>
              </>
            )}

            {job.status === 'CLOSED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusAction('REOPEN')}
                disabled={isUpdatingStatus}
                className="text-xs"
              >
                Reopen as Draft
              </Button>
            )}
          </div>

          {!isVerifiedEmployer && (job.status === 'DRAFT' || job.status === 'PENDING_APPROVAL' || job.status === 'APPROVED') && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2.5 flex items-center gap-2 mt-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                <strong>Publishing Invariant Guard:</strong> This job cannot be published because the employer ({job.employer?.companyName}) is not verified yet.{' '}
                <Link href={`/staff/employers/${job.employer?.id}`} className="underline font-semibold hover:text-amber-900">
                  Verify employer here
                </Link>
              </span>
            </div>
          )}

          <div className="pt-2">
            <Input
              placeholder="Internal review notes / verification comments..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="text-xs bg-white"
            />
          </div>
        </div>
      </Card>

      {/* 2-Column Details & Matching Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Job Specifications & Benefits */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Compensation, Terms & Statutory Benefits
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500">Monthly Salary:</span>
                <div className="font-semibold text-slate-900 text-sm mt-0.5">
                  {job.salaryMin ? `${job.salaryMin} - ${job.salaryMax} ${job.currency}` : 'Negotiable'}
                </div>
                <div className="text-[10px] text-slate-400">{job.salaryPeriod || 'MONTHLY'}</div>
              </div>

              <div>
                <span className="text-slate-500">Working Hours:</span>
                <div className="font-semibold text-slate-900 mt-0.5">
                  {job.workingHours || '8 Hours/Day, 6 Days/Week'}
                </div>
              </div>

              <div>
                <span className="text-slate-500">Contract Duration:</span>
                <div className="font-semibold text-slate-900 mt-0.5">
                  {job.contractDuration || '2 Years (Renewable)'}
                </div>
              </div>

              <div>
                <span className="text-slate-500">Minimum Experience:</span>
                <div className="font-semibold text-slate-900 mt-0.5">
                  {job.experienceRequired} Years Required
                </div>
              </div>

              <div>
                <span className="text-slate-500">Education Required:</span>
                <div className="font-semibold text-slate-900 mt-0.5">
                  {job.educationRequired || 'None'}
                </div>
              </div>

              <div>
                <span className="text-slate-500">Age Eligibility:</span>
                <div className="font-semibold text-slate-900 mt-0.5">
                  {job.ageMin || 18} - {job.ageMax || 45} Years
                </div>
              </div>
            </div>

            {/* Benefits Badges */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 block mb-2 font-medium">Provided Benefits:</span>
              <div className="flex flex-wrap gap-2 text-xs">
                {job.accommodation && (
                  <Badge variant="neutral" className="bg-slate-100 text-slate-700">✓ Free Accommodation</Badge>
                )}
                {job.food && (
                  <Badge variant="neutral" className="bg-slate-100 text-slate-700">✓ Food / Food Allowance</Badge>
                )}
                {job.transportation && (
                  <Badge variant="neutral" className="bg-slate-100 text-slate-700">✓ Free Transportation</Badge>
                )}
                {job.medical && (
                  <Badge variant="neutral" className="bg-slate-100 text-slate-700">✓ Medical Insurance</Badge>
                )}
                {job.airTicket && (
                  <Badge variant="neutral" className="bg-slate-100 text-slate-700">✓ Air Ticket</Badge>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-700">
              <span className="font-semibold text-slate-900 block">Job Description:</span>
              <p className="whitespace-pre-line leading-relaxed">{job.description}</p>
              {job.descriptionLocal && (
                <p className="whitespace-pre-line leading-relaxed text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
                  {job.descriptionLocal}
                </p>
              )}
            </div>

            {/* Skills & Languages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block mb-1">Required Skills:</span>
                <p className="text-slate-800">{job.skillsRequired || 'General trade proficiency'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-1">Required Languages:</span>
                <p className="text-slate-800">{job.languageRequirements || 'Basic English / Bangla'}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Top Matching Candidates Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4 border-b border-slate-200 bg-indigo-50/50">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Matching Candidates ({job.matchingCandidates?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 divide-y divide-slate-100">
              {(!job.matchingCandidates || job.matchingCandidates.length === 0) ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No candidate profiles matching this trade criteria found yet.
                </div>
              ) : (
                job.matchingCandidates.map(({ applicant, match }: any) => {
                  const badgeColor =
                    match.level === 'EXCELLENT'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : match.level === 'GOOD'
                      ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300';

                  return (
                    <div key={applicant.id} className="py-3 first:pt-1 last:pb-1 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/admin/applicants/${applicant.id}`}
                            className="font-semibold text-slate-900 hover:text-indigo-600 flex items-center gap-1"
                          >
                            {applicant.fullName}
                          </Link>
                          <span className="font-mono text-[10px] text-slate-400">
                            {applicant.applicantNumber}
                          </span>
                        </div>
                        <span
                          className={`font-bold text-[11px] px-2 py-0.5 rounded border ${badgeColor}`}
                        >
                          {match.score}% {match.level}
                        </span>
                      </div>

                      <div className="mt-1 text-[11px] text-slate-600">
                        <span>Exp: {applicant.yearsOfExperience || 0} yrs</span>
                        <span className="mx-1.5 text-slate-300">•</span>
                        <span>{applicant.preferredJobCategory?.name || 'Skilled'}</span>
                      </div>

                      {/* Criteria Highlights */}
                      <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-500">
                        {match.criteria?.slice(0, 3).map((c: any, i: number) => (
                          <div key={i} className="flex items-center gap-1">
                            <span className={c.matched ? 'text-emerald-600' : 'text-slate-400'}>
                              {c.matched ? '✓' : '•'}
                            </span>
                            <span className="truncate">{c.detail}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-6 text-[11px] text-slate-500 hover:text-slate-800 p-0"
                        >
                          <Link href={`/admin/applicants/${applicant.id}`}>
                            Profile →
                          </Link>
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={startingAppFor === applicant.id}
                          onClick={() => handleStartApplication(applicant.id)}
                          className="h-6 px-2.5 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                        >
                          {startingAppFor === applicant.id ? 'Starting...' : 'Start Application'}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
