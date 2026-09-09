'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Briefcase,
  GraduationCap,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileText,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle2,
  Activity,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';
import { AuditLogDetailDialog } from '@/components/admin/audit-log-detail-dialog';

export default function ApplicantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { success, error } = useToast();
  const id = params?.id as string;

  const [applicant, setApplicant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Notes state
  const [noteText, setNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Status changer state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchApplicant = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/applicants/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load applicant details');
      }
      setApplicant(data.data);
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id, error]);

  // Activity Timeline state
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [viewingActivityLog, setViewingActivityLog] = useState<any | null>(null);

  const fetchActivityLogs = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoadingActivity(true);
      const res = await fetch(`/api/audit-logs?applicantId=${id}&pageSize=50`);
      const data = await res.json();
      if (data.success) {
        setActivityLogs(data.data.logs || []);
      }
    } catch {
      // Non-blocking
    } finally {
      setIsLoadingActivity(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApplicant();
    fetchActivityLogs();
  }, [fetchApplicant, fetchActivityLogs]);

  const handleStatusChange = async (newStatus: string) => {
    if (!applicant || newStatus === applicant.status) return;
    try {
      setIsUpdatingStatus(true);
      const res = await fetch(`/api/applicants/${applicant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update status');
      }
      success(`Status updated to ${newStatus}`);
      setApplicant((prev: any) => ({ ...prev, status: newStatus }));
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    try {
      setIsSubmittingNote(true);
      const res = await fetch(`/api/applicants/${applicant.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteText.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add note');
      }
      success('Confidential staff note added');
      setNoteText('');
      // Prepend to current notes
      setApplicant((prev: any) => ({
        ...prev,
        notes: [data.data, ...(prev.notes || [])],
      }));
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/applicants/${applicant.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete applicant');
      }
      success('Applicant record processed');
      router.push('/admin/applicants');
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
        <p className="text-sm">Loading 360° candidate profile...</p>
      </div>
    );
  }

  if (!applicant) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Candidate Not Found</h2>
        <p className="text-sm text-slate-500">
          The requested applicant profile does not exist or has been removed.
        </p>
        <Link href="/admin/applicants">
          <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Applicants
          </Button>
        </Link>
      </div>
    );
  }

  // Passport alert check (< 6 months)
  let isPassportExpiringSoon = false;
  let passportDaysRemaining: number | null = null;
  if (applicant.passportExpiry) {
    const expiry = new Date(applicant.passportExpiry);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    passportDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (passportDaysRemaining <= 180) {
      isPassportExpiringSoon = true;
    }
  }

  const getStatusBadgeVariant = (st: string): 'success' | 'navy' | 'gold' | 'warning' | 'error' | 'info' | 'neutral' => {
    switch (st) {
      case 'ACTIVE':
        return 'success';
      case 'SHORTLISTED':
        return 'navy';
      case 'PLACED':
      case 'DEPARTED':
        return 'gold';
      case 'ON_HOLD':
      case 'PROFILE_INCOMPLETE':
        return 'warning';
      case 'BLACKLISTED':
      case 'INACTIVE':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/applicants">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                {applicant.applicantNumber}
              </span>
              <Badge variant={getStatusBadgeVariant(applicant.status)}>
                {applicant.status.replace('_', ' ')}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              {applicant.fullName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-48">
            <Select
              options={[
                { value: 'NEW', label: 'Status: New' },
                { value: 'PROFILE_INCOMPLETE', label: 'Status: Incomplete' },
                { value: 'ACTIVE', label: 'Status: Active Pool' },
                { value: 'SHORTLISTED', label: 'Status: Shortlisted' },
                { value: 'ON_HOLD', label: 'Status: On Hold' },
                { value: 'PLACED', label: 'Status: Placed' },
                { value: 'DEPARTED', label: 'Status: Departed' },
                { value: 'INACTIVE', label: 'Status: Inactive' },
                { value: 'BLACKLISTED', label: 'Status: Blacklisted' },
              ]}
              value={applicant.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isUpdatingStatus}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
          >
            Remove
          </Button>
        </div>
      </div>

      {/* Passport Expiry Warning Alert */}
      {isPassportExpiringSoon && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-semibold text-sm text-amber-950">
              Passport Validity Alert
            </h4>
            <p className="mt-0.5">
              Candidate passport ({applicant.passportNumber || 'N/A'}) expires on{' '}
              <span className="font-semibold">{formatDate(applicant.passportExpiry)}</span> (
              {passportDaysRemaining !== null && passportDaysRemaining > 0
                ? `${passportDaysRemaining} days remaining`
                : 'Expired'}
              ). International migration protocols require at least 6 months passport validity for visa stamping.
            </p>
          </div>
        </div>
      )}

      {/* 360 Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Bio-data, Qualifications & Matching Jobs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Personal Details */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-navy-900">
                <User className="w-4 h-4 text-emerald-600" />
                <CardTitle>Personal Bio-Data & Contact</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Full Name</span>
                <span className="text-slate-800 font-semibold text-sm">{applicant.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Primary Phone</span>
                <span className="text-slate-800 font-semibold text-sm flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  {applicant.phone}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Father&apos;s Name</span>
                <span className="text-slate-700">{applicant.fatherName || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Mother&apos;s Name</span>
                <span className="text-slate-700">{applicant.motherName || 'Not specified'}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Date of Birth / Gender</span>
                <span className="text-slate-700">
                  {applicant.dateOfBirth ? formatDate(applicant.dateOfBirth) : 'N/A'} (
                  {applicant.gender || 'MALE'})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Email Address</span>
                <span className="text-slate-700">{applicant.email || 'None provided'}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">District & Upazila</span>
                <span className="text-slate-700">
                  {applicant.district ? `${applicant.district}${applicant.upazila ? `, ${applicant.upazila}` : ''}` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Detailed Address</span>
                <span className="text-slate-700">{applicant.address || 'N/A'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Card: Passport & Target Preferences */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-navy-900">
                <Globe className="w-4 h-4 text-blue-600" />
                <CardTitle>Travel Documents & Migration Preferences</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Passport Available</span>
                <span className="font-semibold text-slate-800">
                  {applicant.passportAvailable ? 'Yes - In Possession' : 'No / In Process'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Passport Number</span>
                <span className="font-mono text-sm font-bold text-slate-800">
                  {applicant.passportNumber || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Passport Expiry</span>
                <span className="text-slate-700">
                  {applicant.passportExpiry ? formatDate(applicant.passportExpiry) : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Nationality</span>
                <span className="text-slate-700">{applicant.nationality}</span>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block font-medium">Target Destination</span>
                  <span className="text-sm font-semibold text-navy-900 flex items-center gap-2 mt-0.5">
                    {applicant.preferredCountry?.flag && (
                      <span className="text-base">{applicant.preferredCountry.flag}</span>
                    )}
                    {applicant.preferredCountry?.name || 'Any Global Destination'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Target Trade Category</span>
                  <span className="text-sm font-semibold text-navy-900 flex items-center gap-1.5 mt-0.5">
                    <Briefcase className="w-4 h-4 text-slate-500" />
                    {applicant.preferredJobCategory?.name || 'Open to Trades'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Experience & Qualifications */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-navy-900">
                <GraduationCap className="w-4 h-4 text-purple-600" />
                <CardTitle>Trade Experience & Qualifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-slate-400 block font-medium">Profession</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {applicant.profession || 'General Worker'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Experience</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {applicant.yearsOfExperience} Years
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Education</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {applicant.education || 'Literate'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-medium mb-1">Key Trade Skills</span>
                {applicant.skills ? (
                  <div className="flex flex-wrap gap-1.5">
                    {applicant.skills.split(',').map((s: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[11px] font-medium"
                      >
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400">No specific skills listed</span>
                )}
              </div>

              <div>
                <span className="text-slate-400 block font-medium mb-1">Languages Spoken</span>
                <p className="text-slate-700 font-medium">{applicant.languages || 'Bengali'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Card: Rule-Based Matching Vacancies */}
          <Card className="border-navy-200 bg-linear-to-b from-white to-slate-50/50">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-navy-900">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <CardTitle>Top Matching Overseas Jobs</CardTitle>
                </div>
                <Badge variant="neutral" size="sm">
                  Rule-Based Engine
                </Badge>
              </div>
              <CardDescription>
                Deterministic criteria matching based on trade, country, experience, education, and language
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {!applicant.matchingJobs || applicant.matchingJobs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No active published job openings currently match this applicant&apos;s criteria.
                </div>
              ) : (
                <div className="space-y-3">
                  {applicant.matchingJobs.map(({ job, match }: any) => (
                    <div
                      key={job.id}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-navy-400 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-sm truncate">
                            {job.title}
                          </span>
                          <Badge variant={match.badgeVariant} size="sm">
                            {match.score}% {match.levelLabel}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                          <span className="font-medium text-slate-700 flex items-center gap-1">
                            {job.country.name}
                          </span>
                          <span>•</span>
                          <span>{job.jobCategory.name}</span>
                          <span>•</span>
                          <span className="font-semibold text-emerald-600">
                            {job.currency} {Number(job.salaryMin).toLocaleString()}
                          </span>
                          <span>•</span>
                          <span>Vacancies: {job.vacancyCount}</span>
                        </div>

                        {/* Breakdown tags */}
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
                        <Link href={`/admin/jobs/${job.id}`}>
                          <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3 h-3" />}>
                            View Job
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

        {/* Right 1 Column: CRM, Notes & Applications */}
        <div className="space-y-6">
          {/* Card: CRM & Assignment */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-navy-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <CardTitle>CRM & Office Handling</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Assigned Officer</span>
                <span className="text-slate-800 font-semibold">
                  {applicant.assignedStaff ? (
                    `${applicant.assignedStaff.name} (${applicant.assignedStaff.email})`
                  ) : (
                    <span className="text-slate-400">Unassigned</span>
                  )}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Lead Acquisition Source</span>
                <span className="text-slate-700 font-medium">
                  {applicant.source || 'DIRECT_VISIT'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">CRM Customer Profile</span>
                <span className="font-mono text-[11px] text-slate-600">
                  {applicant.customer?.id ? `Linked ID: ${applicant.customer.id}` : 'Syncing'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block font-medium">Registered On</span>
                <span className="text-slate-700">{formatDate(applicant.createdAt, true)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Card: Internal Staff Notes */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-navy-900">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <CardTitle>Internal Staff Notes</CardTitle>
                </div>
                <Badge variant="neutral" size="sm">
                  Staff Only
                </Badge>
              </div>
              <CardDescription>Confidential operational logs and interview remarks</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2.5">
                <Textarea
                  placeholder="Record call summary, medical review, or recruitment officer notes..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  isLoading={isSubmittingNote}
                  disabled={!noteText.trim()}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="w-full"
                >
                  Save Internal Note
                </Button>
              </form>

              {/* Notes List */}
              <div className="space-y-3 pt-2 max-h-96 overflow-y-auto pr-1">
                {!applicant.notes || applicant.notes.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No notes recorded yet.
                  </p>
                ) : (
                  applicant.notes.map((note: any) => (
                    <div
                      key={note.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1"
                    >
                      <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {note.note}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                        <span className="font-semibold text-slate-600">
                          {note.createdBy?.name || 'Staff Member'}
                        </span>
                        <span>{formatDate(note.createdAt, true)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card: Application History */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-navy-900">
                <FileText className="w-4 h-4 text-emerald-600" />
                <CardTitle>Applications History</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 text-xs">
              {!applicant.applications || applicant.applications.length === 0 ? (
                <p className="text-slate-400 text-center py-4">
                  No applications recorded yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {applicant.applications.map((app: any) => (
                    <div
                      key={app.id}
                      className="p-3 border border-slate-200 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 block">
                          {app.job?.title || 'Overseas Job'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Code: {app.applicationCode} • {formatDate(app.createdAt)}
                        </span>
                      </div>
                      <Badge variant="primary" size="sm">
                        {app.currentStage}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Candidate Activity Timeline */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-navy-900">
              <Activity className="w-4 h-4 text-purple-600" />
              <CardTitle>Applicant Activity & Audit Trail</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchActivityLogs}
              disabled={isLoadingActivity}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingActivity ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </div>
          <CardDescription>
            Chronological log of portal logins, document submissions, profile modifications, and workflow stage changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 text-xs">
          {isLoadingActivity && activityLogs.length === 0 ? (
            <p className="text-slate-400 text-center py-6">Loading activity logs...</p>
          ) : activityLogs.length === 0 ? (
            <p className="text-slate-400 text-center py-6">No activity records logged for this candidate yet.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold font-mono text-slate-900 text-xs">
                        {log.action}
                      </span>
                      <Badge
                        variant={log.actorType === 'APPLICANT' ? 'success' : log.actorType === 'STAFF' ? 'primary' : 'neutral'}
                        size="sm"
                      >
                        {log.actorType || 'STAFF'}
                      </Badge>
                      <Badge variant="neutral" size="sm">
                        {log.entity}
                      </Badge>
                    </div>
                    <p className="text-slate-600 text-xs truncate max-w-xl">
                      {log.description || log.action.replace(/_/g, ' ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 text-slate-400 text-[11px] font-mono">
                    <span>{formatDate(log.createdAt, true)}</span>
                    <button
                      type="button"
                      onClick={() => setViewingActivityLog(log)}
                      className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200 cursor-pointer transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Log Detail Dialog */}
      <AuditLogDetailDialog
        isOpen={!!viewingActivityLog}
        onClose={() => setViewingActivityLog(null)}
        log={viewingActivityLog}
      />

      {/* Confirmation Dialog for Removal */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Remove Applicant Record"
        message={`Are you sure you want to remove ${applicant.fullName} (${applicant.applicantNumber})? If active applications exist, status will be safely archived to INACTIVE.`}
        confirmText="Confirm Deletion"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
