'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  FileCheck2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Briefcase,
  MapPin,
  Building2,
  DollarSign,
  Calendar,
  FileText,
  Stamp,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PortalApplicationDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [application, setApplication] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadApp() {
      try {
        const res = await fetch(`/api/portal/applications/${id}`);
        const data = await res.json();
        if (data.success) {
          setApplication(data.data);
        } else {
          setErrorMsg(data.error || 'Failed to load application');
        }
      } catch {
        setErrorMsg('Network error while loading application details');
      } finally {
        setLoading(false);
      }
    }
    if (id) loadApp();
  }, [id]);

  if (loading) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading application progress...
      </div>
    );
  }

  if (errorMsg || !application) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center bg-card border border-border rounded-2xl p-6">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="font-bold text-base text-foreground">Unable to load application</h3>
        <p className="text-xs text-muted-foreground mt-1">{errorMsg || 'Application not found'}</p>
        <Link href="/portal/applications" className="inline-block mt-4">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Applications
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/portal/applications"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Applications
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-semibold text-primary">
                {application.applicationCode}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                {application.status}
              </span>
            </div>
            <h1 className="text-xl font-bold text-foreground">{application.job?.title}</h1>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1 text-foreground">
                <MapPin className="w-3.5 h-3.5 text-primary" /> {application.job?.country?.name}
              </span>
              {application.job?.employer && (
                <span>Employer: {application.job.employer.companyName}</span>
              )}
            </div>
          </div>

          {application.visaApplication && (
            <Link href="/portal/visa">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                <Stamp className="w-4 h-4 mr-1.5" />
                Track Visa Case
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 10-Stage Milestone Visual Progress Timeline */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Recruitment & Immigration Milestone Timeline
        </h3>
        <p className="text-xs text-muted-foreground">
          Step-by-step verification progress from initial submission to destination deployment.
        </p>

        <div className="relative pl-6 border-l-2 border-border space-y-6 my-4 ml-3">
          {application.timeline?.map((step: any, idx: number) => {
            const isCompleted = step.state === 'COMPLETED';
            const isCurrent = step.state === 'CURRENT';
            return (
              <div key={step.key} className="relative">
                {/* Dot */}
                <div
                  className={`absolute -left-[31px] top-0 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/20'
                      : 'bg-background border-border text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <span className="text-[10px] font-bold">{idx + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        isCurrent
                          ? 'text-primary'
                          : isCompleted
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground uppercase">
                        Current Stage
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interviews & Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Interviews */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-3">
          <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            Interview Schedule
          </h4>
          {application.interviews?.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4">No interviews scheduled yet.</p>
          ) : (
            <div className="space-y-2">
              {application.interviews.map((item: any) => (
                <div
                  key={item.id}
                  className="p-3 bg-muted/40 rounded-xl border border-border text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span>{item.interviewType} Interview</span>
                    <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold">
                      {item.status}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    Date: {new Date(item.interviewDate).toLocaleString()}
                  </div>
                  {item.location && <div className="text-muted-foreground">Location: {item.location}</div>}
                  {item.meetingLink && (
                    <a
                      href={item.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-medium hover:underline inline-flex items-center gap-1"
                    >
                      Join Online Meeting <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Attached Documents
            </h4>
            <Link href="/portal/documents" className="text-xs text-primary font-semibold hover:underline">
              Upload More →
            </Link>
          </div>
          {application.documents?.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4">
              No specific documents attached to this application yet.
            </p>
          ) : (
            <div className="space-y-2">
              {application.documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="p-3 bg-muted/40 rounded-xl border border-border text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-foreground">{doc.title || doc.fileName}</div>
                    <div className="text-muted-foreground text-[10px]">
                      Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      doc.isVerified
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {doc.isVerified ? 'Verified' : 'Under Review'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
