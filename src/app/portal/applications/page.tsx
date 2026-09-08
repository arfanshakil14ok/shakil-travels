'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  Briefcase,
  MapPin,
  Calendar,
  ChevronRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PortalApplicationsListPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApps() {
      try {
        const res = await fetch('/api/portal/applications');
        const data = await res.json();
        if (data.success) {
          setApplications(data.data);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    loadApps();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileCheck2 className="w-7 h-7 text-primary" />
            My Job Applications
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time status tracking for every submitted application across our international recruitment pipeline.
          </p>
        </div>
        <Link href="/portal/jobs">
          <Button size="sm">
            <Briefcase className="w-4 h-4 mr-1.5" />
            Apply for Jobs
          </Button>
        </Link>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          Loading your applications...
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl p-6">
          <FileCheck2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold text-base text-foreground">No applications found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            You have not applied for any positions yet. Explore open vacancies to begin your journey.
          </p>
          <Link href="/portal/jobs" className="inline-block mt-4">
            <Button size="sm">Explore Available Jobs</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-primary">
                    {app.applicationCode}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                    {app.status}
                  </span>
                </div>
                <h3 className="font-bold text-base text-foreground">{app.job?.title}</h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 text-foreground">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {app.job?.country?.name}
                  </span>
                  {app.job?.employer && <span>Employer: {app.job.employer.companyName}</span>}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Applied: {new Date(app.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link href={`/portal/applications/${app.id}`}>
                  <Button variant="outline" size="sm" className="font-semibold text-xs">
                    View Progress Timeline
                    <ChevronRight className="w-4 h-4 ml-1 text-primary" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
