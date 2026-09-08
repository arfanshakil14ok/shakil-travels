'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

export default function PortalInterviewsPage() {
  const { success, error } = useToast();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/portal/interviews');
      const data = await res.json();
      if (data.success) {
        setInterviews(data.data);
      } else {
        error(data.error || 'Failed to load interviews');
      }
    } catch {
      error('Failed to communicate with server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleConfirm = async (id: string) => {
    setConfirmingId(id);
    try {
      const res = await fetch(`/api/portal/interviews/${id}/confirm`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        success('Attendance confirmed successfully');
        fetchInterviews();
      } else {
        error(data.error || 'Failed to confirm attendance');
      }
    } catch {
      error('Error confirming attendance');
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Calendar className="w-7 h-7 text-primary" />
          Employer & Technical Interviews
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Review scheduled employer selection sessions, video conferences, and in-person agency trade tests.
        </p>
      </div>

      {/* Interviews List */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          Loading your interview schedule...
        </div>
      ) : interviews.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl p-6">
          <Calendar className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold text-base text-foreground">No interviews scheduled yet</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            When an overseas employer shortlists your profile, your interview session details and link will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map((item) => (
            <div
              key={item.id}
              className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    {item.interviewType} Interview
                  </span>
                  <span
                    className={`font-semibold text-xs px-2.5 py-0.5 rounded-full ${
                      item.status === 'CONFIRMED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : item.status === 'COMPLETED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-foreground">{item.job?.title}</h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 text-foreground font-medium">
                    <Clock className="w-4 h-4 text-primary" />
                    {new Date(item.scheduledAt).toLocaleString()}
                  </span>

                  {item.job?.employer && (
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" />
                      {item.job.employer.companyName}
                    </span>
                  )}

                  {item.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {item.location}
                    </span>
                  )}
                </div>

                {item.meetingLink && (
                  <div className="pt-1">
                    <a
                      href={item.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Open Video Meeting Room <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {item.status === 'SCHEDULED' && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleConfirm(item.id)}
                    disabled={confirmingId === item.id}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    {confirmingId === item.id ? 'Confirming...' : 'Confirm Attendance'}
                  </Button>
                )}

                {item.status === 'CONFIRMED' && (
                  <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Attendance Confirmed
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
