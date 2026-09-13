'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Building2,
  ArrowLeft,
  ShieldCheck,
  Clock,
  XCircle,
  AlertTriangle,
  Briefcase,
  Users,
  FileText,
  CreditCard,
  Plus,
  Mail,
  Phone,
  Globe,
  MapPin,
  CheckCircle2,
  Trash2,
  Edit,
  ExternalLink,
  Download,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';

export default function Employer360Page() {
  const params = useParams();
  const router = useRouter();
  const employerId = params?.id as string;
  const { success, error } = useToast();

  const [employer, setEmployer] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'jobs' | 'contacts' | 'documents' | 'billing'>('jobs');

  // Verify Modal
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'VERIFIED' | 'REJECTED' | 'PENDING'>('VERIFIED');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Contact Modal
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    designation: '',
    email: '',
    phone: '',
    isPrimary: false,
  });
  const [isSavingContact, setIsSavingContact] = useState(false);

  // Document Modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docForm, setDocForm] = useState({
    documentType: 'DEMAND_LETTER',
    title: '',
    fileUrl: '',
    verificationStatus: 'STAFF_ONLY',
  });
  const [isSavingDoc, setIsSavingDoc] = useState(false);

  const fetchEmployer = useCallback(async () => {
    if (!employerId) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/employers/${employerId}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to fetch employer');
      setEmployer(data.data);
      setVerifyNotes(data.data.verificationNotes || '');
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [employerId, error]);

  useEffect(() => {
    fetchEmployer();
  }, [fetchEmployer]);

  const handleVerifySubmit = async () => {
    try {
      setIsVerifying(true);
      const res = await fetch(`/api/employers/${employerId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationStatus: verifyStatus,
          verificationNotes: verifyNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Verification update failed');

      success(`Employer status updated to ${verifyStatus}`);
      setIsVerifyModalOpen(false);
      fetchEmployer();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingContact(true);
      const res = await fetch(`/api/employers/${employerId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add contact');

      success('Authorized contact added successfully');
      setIsContactModalOpen(false);
      setContactForm({ name: '', designation: '', email: '', phone: '', isPrimary: false });
      fetchEmployer();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      const res = await fetch(`/api/employers/${employerId}/contacts?contactId=${contactId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete contact');
      success('Contact deleted');
      fetchEmployer();
    } catch (err: any) {
      error(err.message);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingDoc(true);
      const res = await fetch(`/api/employers/${employerId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save document');

      success('Compliance document added to private vault');
      setIsDocModalOpen(false);
      setDocForm({ documentType: 'DEMAND_LETTER', title: '', fileUrl: '', verificationStatus: 'STAFF_ONLY' });
      fetchEmployer();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSavingDoc(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const res = await fetch(`/api/employers/${employerId}/documents?documentId=${documentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete document');
      success('Document removed');
      fetchEmployer();
    } catch (err: any) {
      error(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
        Loading Employer 360° Profile...
      </div>
    );
  }

  if (!employer) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Employer not found</h2>
        <Button className="mt-4" onClick={() => router.push('/staff/employers')}>
          Back to Employers
        </Button>
      </div>
    );
  }

  const metrics = employer.metrics || {
    totalJobs: employer.jobs?.length || 0,
    activeJobs: employer.jobs?.filter((j: any) => j.status === 'PUBLISHED').length || 0,
    totalVacancies: employer.jobs?.reduce((sum: number, j: any) => sum + (j.vacancyCount || 0), 0) || 0,
    filledVacancies: employer.jobs?.reduce((sum: number, j: any) => sum + (j.filledCount || 0), 0) || 0,
    remainingVacancies: Math.max(
      0,
      (employer.jobs?.reduce((sum: number, j: any) => sum + (j.vacancyCount || 0), 0) || 0) -
        (employer.jobs?.reduce((sum: number, j: any) => sum + (j.filledCount || 0), 0) || 0)
    ),
    totalApplications: employer.jobs?.reduce((sum: number, j: any) => sum + (j._count?.applications || 0), 0) || 0,
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Top Action */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-slate-900 -ml-2">
          <Link href="/staff/employers">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Employers Directory
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setVerifyStatus(employer.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'VERIFIED');
              setIsVerifyModalOpen(true);
            }}
          >
            <ShieldCheck className="w-4 h-4 mr-1.5 text-indigo-600" />
            Verify / Review
          </Button>
          <Button
            size="sm"
            asChild
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Link href={`/staff/jobs/new?employerId=${employer.id}`}>
              <Plus className="w-4 h-4 mr-1.5" />
              Create Job Demand
            </Link>
          </Button>
        </div>
      </div>

      {/* Hero Overview Header */}
      <Card className="border-indigo-100 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2.5 py-0.5 rounded">
                  {employer.employerCode || 'ID Pending'}
                </span>
                {employer.verificationStatus === 'VERIFIED' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Employer
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded">
                    <Clock className="w-3.5 h-3.5" /> {employer.verificationStatus}
                  </span>
                )}
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                  {employer.status}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {employer.companyName}
              </h1>
              {employer.companyNameLocal && (
                <p className="text-sm text-indigo-200 font-normal">{employer.companyNameLocal}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{employer.country?.flag || '🌐'}</span>
                  <span>{employer.country?.name || 'Destination Unassigned'}</span>
                </div>
                {employer.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{employer.city}</span>
                  </div>
                )}
                {employer.industry && (
                  <div className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{employer.industry}</span>
                  </div>
                )}
                {employer.website && (
                  <a
                    href={employer.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-indigo-300 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Website
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Verification Warning if unverified */}
            {employer.verificationStatus !== 'VERIFIED' && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 max-w-sm text-xs text-amber-200">
                <div className="font-semibold flex items-center gap-1.5 mb-1 text-amber-300">
                  <AlertTriangle className="w-4 h-4" /> Action Required: Verification Pending
                </div>
                Only verified and active employers can have their jobs published to the public recruitment marketplace.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{metrics.totalJobs}</div>
          <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mt-1">
            Total Demands
          </div>
        </Card>
        <Card className="p-4 text-center border-indigo-100 bg-indigo-50/40">
          <div className="text-2xl font-bold text-indigo-700">{metrics.activeJobs}</div>
          <div className="text-[11px] text-indigo-600 uppercase tracking-wider font-semibold mt-1">
            Published Active
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{metrics.totalVacancies}</div>
          <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mt-1">
            Total Quota
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{metrics.filledVacancies}</div>
          <div className="text-[11px] text-emerald-700 uppercase tracking-wider font-semibold mt-1">
            Filled / Hired
          </div>
        </Card>
        <Card className="p-4 text-center border-emerald-100 bg-emerald-50/40">
          <div className="text-2xl font-bold text-emerald-700">{metrics.remainingVacancies}</div>
          <div className="text-[11px] text-emerald-800 uppercase tracking-wider font-semibold mt-1">
            Vacancies Left
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">{metrics.totalApplications}</div>
          <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mt-1">
            Applications
          </div>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'jobs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Job Demands ({employer.jobs?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'contacts'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Authorized Contacts ({employer.contacts?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'documents'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Compliance & Documents ({employer.documents?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'billing'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Customer & Billing Ledger
        </button>
      </div>

      {/* Tab 1: Job Demands */}
      {activeTab === 'jobs' && (
        <Card>
          <CardHeader className="p-4 border-b border-slate-200 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-800">
              Assigned Job Demands & Overseas Vacancies
            </CardTitle>
            <Button size="sm" asChild className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
              <Link href={`/staff/jobs/new?employerId=${employer.id}`}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add New Job Demand
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Job Code & Title</th>
                  <th className="py-3 px-4">Trade Category</th>
                  <th className="py-3 px-4">Salary Range</th>
                  <th className="py-3 px-4">Quota Utilization</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(!employer.jobs || employer.jobs.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      No job demands registered for this employer yet.
                    </td>
                  </tr>
                ) : (
                  employer.jobs.map((job: any) => {
                    const remaining = Math.max(0, (job.vacancyCount || 0) - (job.filledCount || 0));
                    return (
                      <tr key={job.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/staff/jobs/${job.id}/review`}
                            className="font-semibold text-slate-900 hover:text-indigo-600"
                          >
                            {job.title}
                          </Link>
                          <div className="font-mono text-[11px] text-slate-500 mt-0.5">{job.jobCode}</div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {job.jobCategory?.name || 'General Trade'}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {job.salaryMin ? `${job.salaryMin} - ${job.salaryMax} ${job.currency}` : 'Negotiable'}
                          <div className="text-[10px] text-slate-400 font-normal">
                            {job.salaryPeriod || 'MONTHLY'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">
                              {job.filledCount || 0} / {job.vacancyCount}
                            </span>
                            <Badge variant={remaining > 0 ? 'primary' : 'neutral'} className="text-[10px]">
                              {remaining} remaining
                            </Badge>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {job._count?.applications || 0} candidate applicants
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              job.status === 'PUBLISHED'
                                ? 'success'
                                : job.status === 'PENDING_APPROVAL'
                                ? 'warning'
                                : 'neutral'
                            }
                          >
                            {job.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1">
                          <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-indigo-600">
                            <Link href={`/staff/jobs/${job.id}/review`}>Review</Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-slate-600">
                            <Link href={`/staff/jobs/${job.id}/edit`}>Edit</Link>
                          </Button>
                          {job.status === 'PUBLISHED' && (
                            <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-slate-500">
                              <Link href={`/jobs/${job.slug}`} target="_blank">
                                Public <ExternalLink className="w-3 h-3 ml-1" />
                              </Link>
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Authorized Contacts */}
      {activeTab === 'contacts' && (
        <Card>
          <CardHeader className="p-4 border-b border-slate-200 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-800">
              Employer Focal Points & Authorized Representatives
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setIsContactModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Contact Person
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            {(!employer.contacts || employer.contacts.length === 0) ? (
              <div className="py-8 text-center text-slate-500">
                <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No contacts registered for this employer yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employer.contacts.map((contact: any) => (
                  <Card key={contact.id} className={`p-4 ${contact.isPrimary ? 'border-indigo-300 bg-indigo-50/20' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-slate-900">{contact.name}</h4>
                          {contact.isPrimary && (
                            <Badge variant="primary" className="text-[10px]">
                              Primary Contact
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{contact.designation || 'Representative'}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteContact(contact.id)}
                        className="h-7 text-rose-500 hover:bg-rose-50 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                      {contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <a href={`mailto:${contact.email}`} className="hover:underline">
                            {contact.email}
                          </a>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <a href={`tel:${contact.phone}`} className="hover:underline">
                            {contact.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Documents Vault */}
      {activeTab === 'documents' && (
        <Card>
          <CardHeader className="p-4 border-b border-slate-200 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-800">
              Private Compliance Documents Vault (Staff Only)
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setIsDocModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Upload Document Record
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            {(!employer.documents || employer.documents.length === 0) ? (
              <div className="py-8 text-center text-slate-500">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No private compliance documents uploaded for this employer.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employer.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="p-3.5 border border-slate-200 rounded-lg flex items-center justify-between bg-slate-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-7 h-7 text-indigo-600 shrink-0" />
                      <div>
                        <h4 className="font-semibold text-xs text-slate-900">{doc.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-200 px-1 rounded">
                            {doc.documentType}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" asChild className="h-7 text-indigo-600 p-1">
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="h-7 text-rose-500 hover:bg-rose-50 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Customer & Billing Ledger */}
      {activeTab === 'billing' && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Linked Customer Account & Billing Ledger
          </h3>
          {employer.customer ? (
            <div className="space-y-4 max-w-lg text-xs">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer Account Name:</span>
                  <span className="font-semibold text-slate-900">{employer.customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer Type:</span>
                  <Badge variant="neutral">{employer.customer.type || 'EMPLOYER'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Billing Phone:</span>
                  <span className="font-semibold text-slate-900">{employer.customer.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Billing Email:</span>
                  <span className="font-semibold text-slate-900">{employer.customer.email || 'N/A'}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button size="sm" asChild variant="outline">
                  <Link href={`/admin/invoices?search=${encodeURIComponent(employer.companyName)}`}>
                    View Invoices & Billing Ledger
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 py-4">
              No linked customer ledger record found for this employer.
            </div>
          )}
        </Card>
      )}

      {/* Verification Modal */}
      <Modal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        title={`Employer Verification Workflow: ${employer.companyName}`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Verification Status</label>
            <Select
              value={verifyStatus}
              onChange={(e) => setVerifyStatus(e.target.value as any)}
              options={[
                { value: 'VERIFIED', label: '✓ VERIFIED (Permits Job Demand Publishing)' },
                { value: 'PENDING', label: '⏳ PENDING (Awaiting compliance or document review)' },
                { value: 'REJECTED', label: '✕ REJECTED (Suspends employer and prevents publishing)' },
              ]}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Internal Verification Notes & Audit Trail
            </label>
            <textarea
              rows={3}
              value={verifyNotes}
              onChange={(e) => setVerifyNotes(e.target.value)}
              placeholder="Record reason, verified documents, chamber of commerce registration number, etc."
              className="w-full rounded-md border border-slate-300 p-2.5 text-xs focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="outline" onClick={() => setIsVerifyModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleVerifySubmit}
              disabled={isVerifying}
              className={verifyStatus === 'REJECTED' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}
            >
              {isVerifying ? 'Updating...' : 'Update Verification'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Contact Modal */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title="Add Authorized Representative Contact"
      >
        <form onSubmit={handleAddContact} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
            <Input
              required
              placeholder="e.g. Tariq Mansoor"
              value={contactForm.name}
              onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Designation / Role</label>
            <Input
              placeholder="e.g. HR Director / Overseas Recruitment Specialist"
              value={contactForm.designation}
              onChange={(e) => setContactForm({ ...contactForm, designation: e.target.value })}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
            <Input
              placeholder="e.g. +966 50 123 4567"
              value={contactForm.phone}
              onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <Input
              type="email"
              placeholder="e.g. tariq@company.com"
              value={contactForm.email}
              onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isPrimary"
              checked={contactForm.isPrimary}
              onChange={(e) => setContactForm({ ...contactForm, isPrimary: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600"
            />
            <label htmlFor="isPrimary" className="font-semibold text-slate-700 cursor-pointer">
              Set as Primary Contact for this Employer
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsContactModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingContact} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isSavingContact ? 'Saving...' : 'Save Contact'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Document Modal */}
      <Modal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        title="Upload Compliance Document Record"
      >
        <form onSubmit={handleAddDocument} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Document Type *</label>
            <Select
              value={docForm.documentType}
              onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value })}
              options={[
                { value: 'COMPANY_REGISTRATION', label: 'Company Commercial Registration (CR)' },
                { value: 'DEMAND_LETTER', label: 'Attested Demand Letter' },
                { value: 'RECRUITMENT_AGREEMENT', label: 'Bilateral Recruitment Agreement' },
                { value: 'JOB_ORDER', label: 'Government Approved Job Order' },
                { value: 'AUTHORIZATION_LETTER', label: 'Power of Attorney (Wakalah)' },
                { value: 'OTHER', label: 'Other Document' },
              ]}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Document Title *</label>
            <Input
              required
              placeholder="e.g. 2026 Riyadh Metro Project Demand Letter"
              value={docForm.title}
              onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">File Storage URL *</label>
            <Input
              required
              placeholder="https://... or /uploads/documents/..."
              value={docForm.fileUrl}
              onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsDocModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingDoc} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isSavingDoc ? 'Saving...' : 'Add Document'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
