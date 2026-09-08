'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Briefcase,
  Globe2,
  Building2,
  DollarSign,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Users,
  Sparkles,
  ExternalLink,
  Copy,
  Trash2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { success, error } = useToast();
  const id = params?.id as string;

  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchJob = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/jobs/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load job details');
      }
      setJob(data.data);
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id, error]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleStatusChange = async (newStatus: string) => {
    if (!job || newStatus === job.status) return;
    try {
      setIsUpdatingStatus(true);
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update status');
      }
      success(`Job status changed to ${newStatus}`);
      setJob((prev: any) => ({ ...prev, status: newStatus }));
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDuplicate = async () => {
    if (!job) return;
    try {
      setIsDuplicating(true);
      const payload = {
        title: `${job.title} (Copy)`,
        countryId: job.countryId,
        jobCategoryId: job.jobCategoryId,
        employerId: job.employerId,
        description: job.description,
        salaryMin: job.salaryMin ? Number(job.salaryMin) : null,
        salaryMax: job.salaryMax ? Number(job.salaryMax) : null,
        currency: job.currency,
        experienceRequired: job.experienceRequired,
        educationRequired: job.educationRequired,
        ageMin: job.ageMin,
        ageMax: job.ageMax,
        languageRequirements: job.languageRequirements,
        skillsRequired: job.skillsRequired,
        vacancyCount: job.vacancyCount,
        accommodation: job.accommodation,
        food: job.food,
        transportation: job.transportation,
        medical: job.medical,
        airTicket: job.airTicket,
        workingHours: job.workingHours,
        contractDuration: job.contractDuration,
        status: 'DRAFT',
      };

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to duplicate job');

      success(`Job duplicated as draft: ${data.data.jobCode}`);
      router.push(`/admin/jobs/${data.data.id}`);
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/jobs/${job.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete job');

      success('Job demand processed');
      router.push('/admin/jobs');
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-navy-900 mb-3" />
        <p className="text-sm">Loading job demand details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Job Demand Not Found</h2>
        <p className="text-sm text-slate-500">
          The requested job posting does not exist or has been archived.
        </p>
        <Link href="/admin/jobs">
          <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Jobs
          </Button>
        </Link>
      </div>
    );
  }

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
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/jobs">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                {job.jobCode}
              </span>
              <Badge variant={getStatusBadgeVariant(job.status)}>
                {job.status}
              </Badge>
              {job.featured && <Badge variant="primary">Featured</Badge>}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              {job.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-44">
            <Select
              options={[
                { value: 'PUBLISHED', label: 'Published' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'PAUSED', label: 'Paused' },
                { value: 'CLOSED', label: 'Closed' },
              ]}
              value={job.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isUpdatingStatus}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            isLoading={isDuplicating}
            leftIcon={<Copy className="w-3.5 h-3.5" />}
          >
            Duplicate
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
          >
            Close / Remove
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Job Specifications & Matching Candidates */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Primary Details */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-navy-900">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <CardTitle>Demand Specifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Destination</span>
                <span className="text-slate-900 font-semibold text-sm flex items-center gap-1.5 mt-0.5">
                  {job.country?.flag && <span>{job.country.flag}</span>}
                  {job.country?.name}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Trade Category</span>
                <span className="text-slate-900 font-semibold text-sm mt-0.5 block">
                  {job.jobCategory?.name}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Vacancies</span>
                <span className="text-slate-900 font-bold text-sm mt-0.5 block">
                  {job.vacancyCount} Positions
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Salary Range</span>
                <span className="text-emerald-700 font-bold text-sm mt-0.5 block">
                  {job.currency} {Number(job.salaryMin).toLocaleString()}{' '}
                  {job.salaryMax ? `- ${Number(job.salaryMax).toLocaleString()}` : ''}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Duty Hours</span>
                <span className="text-slate-800 font-medium mt-0.5 block">
                  {job.workingHours || '8 Hours Standard'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Contract Term</span>
                <span className="text-slate-800 font-medium mt-0.5 block">
                  {job.contractDuration || '2 Years'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card: Company Perks & Benefits */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-navy-900">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <CardTitle>Expatriate Perks & Allowances</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${job.accommodation ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className={job.accommodation ? 'font-semibold text-slate-800' : 'text-slate-400 line-through'}>
                  Accommodation
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${job.food ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className={job.food ? 'font-semibold text-slate-800' : 'text-slate-400 line-through'}>
                  Food Provided
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${job.transportation ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className={job.transportation ? 'font-semibold text-slate-800' : 'text-slate-400 line-through'}>
                  Transportation
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${job.medical ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className={job.medical ? 'font-semibold text-slate-800' : 'text-slate-400 line-through'}>
                  Medical Insurance
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${job.airTicket ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className={job.airTicket ? 'font-semibold text-slate-800' : 'text-slate-400 line-through'}>
                  Return Air Ticket
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card: Description */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle>Job Description & Site Terms</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
              {job.description}
            </CardContent>
          </Card>

          {/* Card: Matching Qualified Candidates */}
          <Card className="border-navy-200 bg-linear-to-b from-white to-slate-50/50">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-navy-900">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <CardTitle>Pre-Qualified Matching Candidates</CardTitle>
                </div>
                <Badge variant="neutral" size="sm">
                  Rule-Based Engine
                </Badge>
              </div>
              <CardDescription>
                Live candidate pool evaluated against destination, trade skills, and experience criteria
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {!job.matchingCandidates || job.matchingCandidates.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No registered candidates currently meet the minimum matching criteria for this job.
                </div>
              ) : (
                <div className="space-y-3">
                  {job.matchingCandidates.map(({ applicant, match }: any) => (
                    <div
                      key={applicant.id}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-navy-400 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/applicants/${applicant.id}`}
                            className="font-semibold text-slate-900 hover:text-emerald-600 text-sm"
                          >
                            {applicant.fullName}
                          </Link>
                          <span className="font-mono text-[10px] text-slate-400">
                            ({applicant.applicantNumber})
                          </span>
                          <Badge variant={match.badgeVariant} size="sm">
                            {match.score}% {match.levelLabel}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                          <span>Phone: {applicant.phone}</span>
                          <span>•</span>
                          <span>Experience: {applicant.yearsOfExperience} Yrs</span>
                          <span>•</span>
                          <span>Passport: {applicant.passportAvailable ? 'Ready' : 'Pending'}</span>
                        </div>

                        {/* Criteria Breakdown */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {match.criteria.map((c: any, cIdx: number) => (
                            <span
                              key={cIdx}
                              title={c.detail}
                              className={`text-[10px] px-1.5 py-0.5 rounded ${
                                c.matched
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-50 text-slate-400 border border-slate-200'
                              }`}
                            >
                              {c.factor}: {c.score}/{c.maxScore}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link href={`/admin/applicants/${applicant.id}`}>
                          <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3 h-3" />}>
                            Profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Employer Details & Requirements */}
        <div className="space-y-6">
          {/* Card: Employing Principal */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-navy-900">
                <Building2 className="w-4 h-4 text-purple-600" />
                <CardTitle>Employing Principal</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Company Name</span>
                <span className="text-slate-900 font-semibold text-sm">
                  {job.employer?.companyName || 'Direct Recruitment Agency Demand'}
                </span>
              </div>

              {job.employer && (
                <>
                  <div>
                    <span className="text-slate-400 block font-medium">Verification Status</span>
                    <Badge
                      variant={job.employer.verificationStatus === 'VERIFIED' ? 'success' : 'warning'}
                      size="sm"
                    >
                      {job.employer.verificationStatus}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Contact Person</span>
                    <span className="text-slate-700">
                      {job.employer.contactPerson || 'Office Administration'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Website</span>
                    <span className="text-slate-700">{job.employer.website || 'N/A'}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card: Eligibility Specs */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle>Candidate Eligibility</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Required Experience</span>
                <span className="text-slate-800 font-medium">
                  {job.experienceRequired} Years in related trade
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Minimum Education</span>
                <span className="text-slate-800 font-medium">
                  {job.educationRequired || 'None required'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Permissible Age Range</span>
                <span className="text-slate-800 font-medium">
                  {job.ageMin && job.ageMax ? `${job.ageMin} - ${job.ageMax} Years` : '18 - 50 Years'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Languages</span>
                <span className="text-slate-800 font-medium">
                  {job.languageRequirements || 'Basic conversational ability'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Technical Skills</span>
                <span className="text-slate-800 font-medium">
                  {job.skillsRequired || 'Standard trade craftsmanship'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card: Public URL Link */}
          <Card className="bg-navy-950 text-white border-navy-800">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase">
                <Globe2 className="w-4 h-4" />
                <span>Public Portal Listing</span>
              </div>
              <p className="text-xs text-slate-300">
                Job vacancies with PUBLISHED status are instantly accessible to candidates on the public recruitment portal.
              </p>
              <div className="pt-2">
                <Link
                  href={`/jobs/${job.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 font-medium"
                >
                  <span>Preview Public Job Listing</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Remove or Close Job Demand"
        message={`Are you sure you want to remove or close ${job.title} (${job.jobCode})? If candidate applications exist, the status will safely transition to CLOSED.`}
        confirmText="Confirm Action"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
