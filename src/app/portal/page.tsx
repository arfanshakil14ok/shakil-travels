'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  FileCheck2,
  Calendar,
  Stamp,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Upload,
  User,
  ShieldCheck,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PortalDashboardPage() {
  const [profile, setProfile] = useState<any | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [visaCases, setVisaCases] = useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [pRes, aRes, iRes, vRes, invRes] = await Promise.all([
          fetch('/api/portal/profile'),
          fetch('/api/portal/applications'),
          fetch('/api/portal/interviews'),
          fetch('/api/portal/visa'),
          fetch('/api/portal/invoices'),
        ]);

        const [pData, aData, iData, vData, invData] = await Promise.all([
          pRes.json(),
          aRes.json(),
          iRes.json(),
          vRes.json(),
          invRes.json(),
        ]);

        if (pData.success) setProfile(pData.data);
        if (aData.success) setApplications(aData.data);
        if (iData.success) setInterviews(iData.data);
        if (vData.success) setVisaCases(vData.data);
        if (invData.success) setFinancialSummary(invData.data.summary);
      } catch {
        // silent catch
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-card rounded-2xl border border-border" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-card rounded-xl border border-border" />
          ))}
        </div>
      </div>
    );
  }

  const completion = profile?.completion?.percentage || 0;
  const missing = profile?.completion?.missingFields || [];
  const upcomingInterview = interviews.find((i) => ['SCHEDULED', 'CONFIRMED'].includes(i.status));
  const activeVisa = visaCases.find((v) => !['REJECTED', 'CANCELLED'].includes(v.status));

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Profile Score */}
      <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {profile?.fullName}!
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Candidate ID: <span className="font-mono font-semibold text-primary">{profile?.applicantNumber}</span>
            {profile?.preferredCountry && ` • Preferred Country: ${profile.preferredCountry.name}`}
          </p>
        </div>

        {/* Profile Completion Meter */}
        <div className="bg-card/90 backdrop-blur p-4 rounded-xl border border-border shadow-sm min-w-[260px]">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" /> Profile Completion
            </span>
            <span className={completion >= 80 ? 'text-emerald-600' : 'text-amber-600'}>
              {completion}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                completion >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${completion}%` }}
            />
          </div>
          {missing.length > 0 ? (
            <div className="text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Missing: {missing.slice(0, 2).join(', ')}</span>
              <Link href="/portal/profile" className="text-primary font-semibold hover:underline">
                Complete
              </Link>
            </div>
          ) : (
            <div className="text-[11px] text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Profile fully completed
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Interview Alert */}
      {upcomingInterview && (
        <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-purple-950 dark:text-purple-200">
                Upcoming Interview Scheduled
              </h4>
              <p className="text-xs text-purple-800 dark:text-purple-300 mt-0.5">
                {new Date(upcomingInterview.scheduledAt).toLocaleString()} • {upcomingInterview.job?.title} (
                {upcomingInterview.interviewType})
              </p>
            </div>
          </div>
          <Link href="/portal/interviews">
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs">
              View Details
            </Button>
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/portal/applications"
          className="bg-card p-5 rounded-xl border border-border shadow-sm hover:border-primary/40 transition-all block group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Applications</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{applications.length}</div>
          <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            <span>View pipeline</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        <Link
          href="/portal/interviews"
          className="bg-card p-5 rounded-xl border border-border shadow-sm hover:border-primary/40 transition-all block group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Interviews</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{interviews.length}</div>
          <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            <span>Schedule & status</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        <Link
          href="/portal/visa"
          className="bg-card p-5 rounded-xl border border-border shadow-sm hover:border-primary/40 transition-all block group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Visa Case</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Stamp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-foreground truncate">
            {activeVisa ? activeVisa.status : 'None Active'}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            <span>Readiness checklist</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        <Link
          href="/portal/invoices"
          className="bg-card p-5 rounded-xl border border-border shadow-sm hover:border-primary/40 transition-all block group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Outstanding Due</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">
            ৳{financialSummary?.totalDue ? Number(financialSummary.totalDue).toLocaleString() : '0'}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            <span>Official receipts</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Recent Applications & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Applications */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Recent Applications
            </h3>
            <Link href="/portal/jobs" className="text-xs font-semibold text-primary hover:underline">
              Browse More Jobs →
            </Link>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-xl">
              <Briefcase className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">No applications submitted yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Explore government-approved overseas vacancies and submit your application with a single click.
              </p>
              <Link href="/portal/jobs" className="inline-block mt-4">
                <Button size="sm">Explore Available Jobs</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 3).map((app) => (
                <Link
                  key={app.id}
                  href={`/portal/applications/${app.id}`}
                  className="block p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-sm text-foreground">
                        {app.job?.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span>{app.job?.country?.name}</span>
                        <span>•</span>
                        <span className="font-mono text-xs">{app.applicationCode}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                      {app.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                    <span>Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                    <span className="text-primary font-medium flex items-center gap-1">
                      View Progress <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Actions & Compliance */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link href="/portal/documents" className="block">
                <Button variant="outline" className="w-full justify-start text-xs h-10">
                  <Upload className="w-4 h-4 mr-2 text-primary" />
                  Upload Passport & NID
                </Button>
              </Link>
              <Link href="/portal/profile" className="block">
                <Button variant="outline" className="w-full justify-start text-xs h-10">
                  <User className="w-4 h-4 mr-2 text-primary" />
                  Edit Skills & Experience
                </Button>
              </Link>
              <Link href="/portal/invoices" className="block">
                <Button variant="outline" className="w-full justify-start text-xs h-10">
                  <CreditCard className="w-4 h-4 mr-2 text-primary" />
                  Download Invoices & Receipts
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-5 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              Official Verification Notice
            </div>
            <p className="leading-relaxed">
              Never pay fees without an official system-generated receipt. All visa decisions rest exclusively with foreign sovereign embassies. Shakil Global guarantees 100% transparent tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
