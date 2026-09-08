'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  Search,
  Plus,
  Calendar,
  Clock,
  User,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Video,
  MapPin,
  RefreshCw,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Schedule modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [applicantSearch, setApplicantSearch] = useState('');
  const [applicantResults, setApplicantResults] = useState<any[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
  const [interviewType, setInterviewType] = useState('IN_PERSON');
  const [scheduledDate, setScheduledDate] = useState('');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  // Evaluate modal
  const [isEvaluateModalOpen, setIsEvaluateModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<any | null>(null);
  const [evalOutcome, setEvalOutcome] = useState<'PASSED' | 'FAILED' | 'DID_NOT_ATTEND'>('PASSED');
  const [evalScore, setEvalScore] = useState(85);
  const [evalFeedback, setEvalFeedback] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (statusFilter !== 'ALL') query.set('status', statusFilter);
      if (typeFilter !== 'ALL') query.set('type', typeFilter);

      const res = await fetch(`/api/interviews?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setInterviews(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const handleSearchApplicants = async (term: string) => {
    setApplicantSearch(term);
    if (term.length < 2) {
      setApplicantResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/applicants?search=${encodeURIComponent(term)}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setApplicantResults(data.data.items || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplicant || !scheduledDate) return;
    setIsScheduling(true);

    try {
      // Find candidate's active application if any
      const appRes = await fetch(`/api/applications?applicantId=${selectedApplicant.id}&limit=1`);
      const appData = await appRes.json();
      const linkedAppId = appData.data?.items?.[0]?.id || null;

      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId: selectedApplicant.id,
          applicationId: linkedAppId,
          interviewType,
          scheduledDate,
          location: location || undefined,
          meetingLink: meetingLink || undefined,
          notes: scheduleNotes || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsScheduleModalOpen(false);
        setSelectedApplicant(null);
        setApplicantSearch('');
        setScheduledDate('');
        fetchInterviews();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleEvaluateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterview) return;
    setIsEvaluating(true);

    try {
      const res = await fetch(`/api/interviews/${selectedInterview.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome: evalOutcome,
          score: evalScore,
          feedback: evalFeedback,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsEvaluateModalOpen(false);
        setSelectedInterview(null);
        fetchInterviews();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-primary-600" />
            Interview Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Schedule candidate trade tests, oral interviews, and foreign employer client screenings.
          </p>
        </div>

        <Button onClick={() => setIsScheduleModalOpen(true)} className="bg-primary-600 hover:bg-primary-700 text-white text-xs">
          <Plus className="w-4 h-4 mr-1.5" />
          Schedule Interview
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Search candidate name, ID, or interviewer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-200 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="NO_SHOW">No Show</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Interview Types</option>
            <option value="IN_PERSON">In-Person</option>
            <option value="ONLINE">Online Video</option>
            <option value="TECHNICAL">Technical Trade Test</option>
            <option value="CLIENT">Employer Client</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Candidate</th>
              <th className="py-3.5 px-4">Date & Time</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Job / Application</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Score & Outcome</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                  Loading interviews...
                </td>
              </tr>
            ) : interviews.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <CalendarCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-700">No interviews found</p>
                  <p className="text-slate-400 mt-1">Schedule a candidate screening to get started.</p>
                </td>
              </tr>
            ) : (
              interviews.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                        {item.applicant.fullName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{item.applicant.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {item.applicant.applicantNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {new Date(item.scheduledDate).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{item.interviewType.replace(/_/g, ' ')}</td>
                  <td className="py-3.5 px-4">
                    {item.application ? (
                      <div>
                        <span className="font-medium text-slate-800">{item.application.job.title}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">{item.application.applicationNumber}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Unlinked</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={item.status === 'COMPLETED' ? 'success' : item.status === 'CANCELLED' ? 'error' : 'info'}>
                      {item.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    {item.outcome ? (
                      <div>
                        <span className={`font-bold ${item.outcome === 'PASSED' ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {item.outcome}
                        </span>
                        {item.score !== null && <span className="text-slate-500 ml-1">({item.score}/100)</span>}
                        {item.feedback && <span className="block text-[10px] text-slate-400 truncate max-w-xs">{item.feedback}</span>}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Pending result</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedInterview(item);
                        setEvalOutcome(item.outcome || 'PASSED');
                        setEvalScore(item.score || 85);
                        setEvalFeedback(item.feedback || '');
                        setIsEvaluateModalOpen(true);
                      }}
                      className="h-7 text-xs px-2"
                    >
                      <Award className="w-3.5 h-3.5 mr-1" />
                      Evaluate
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Candidate Interview"
        maxWidth="md"
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Target Candidate *</label>
            {selectedApplicant ? (
              <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-primary-900 block">{selectedApplicant.fullName}</span>
                  <span className="text-primary-700">ID: {selectedApplicant.applicantNumber} • {selectedApplicant.phone}</span>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedApplicant(null)} className="text-xs text-rose-600">
                  Change
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  placeholder="Type candidate name or phone..."
                  value={applicantSearch}
                  onChange={(e) => handleSearchApplicants(e.target.value)}
                  className="pl-9 text-xs"
                />
                {applicantResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto divide-y divide-slate-100">
                    {applicantResults.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedApplicant(c);
                          setApplicantResults([]);
                        }}
                        className="p-2 text-xs hover:bg-slate-50 cursor-pointer"
                      >
                        <div className="font-semibold text-slate-800">{c.fullName}</div>
                        <div className="text-slate-500 font-mono text-[10px]">{c.applicantNumber} • {c.phone}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Interview Type *</label>
            <select
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            >
              <option value="IN_PERSON">In-Person (Office)</option>
              <option value="ONLINE">Online Video</option>
              <option value="PHONE">Phone Interview</option>
              <option value="TECHNICAL">Technical Trade Test</option>
              <option value="CLIENT">Direct Employer Client</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Date & Time *</label>
            <input
              type="datetime-local"
              required
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Location or Meeting Link</label>
            <input
              type="text"
              value={location || meetingLink}
              onChange={(e) => {
                setLocation(e.target.value);
                setMeetingLink(e.target.value);
              }}
              placeholder="e.g. Dhaka Office Room 3 or Google Meet URL"
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes</label>
            <textarea
              value={scheduleNotes}
              onChange={(e) => setScheduleNotes(e.target.value)}
              placeholder="Candidate preparation notes..."
              rows={2}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsScheduleModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isScheduling || !selectedApplicant || !scheduledDate} className="bg-primary-600 text-white text-xs">
              {isScheduling ? 'Scheduling...' : 'Confirm Schedule'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Evaluate Modal */}
      <Modal
        isOpen={isEvaluateModalOpen}
        onClose={() => setIsEvaluateModalOpen(false)}
        title="Record Interview Evaluation"
        description={selectedInterview ? `Candidate: ${selectedInterview.applicant.fullName}` : ''}
        maxWidth="md"
      >
        <form onSubmit={handleEvaluateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Interview Outcome *</label>
            <select
              value={evalOutcome}
              onChange={(e) => setEvalOutcome(e.target.value as any)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 font-bold"
            >
              <option value="PASSED">PASSED (Candidate Recommended)</option>
              <option value="FAILED">FAILED (Did Not Meet Standard)</option>
              <option value="DID_NOT_ATTEND">DID NOT ATTEND (No Show)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Evaluation Score (0 - 100)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={evalScore}
              onChange={(e) => setEvalScore(Number(e.target.value))}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Interviewer Feedback & Notes</label>
            <textarea
              value={evalFeedback}
              onChange={(e) => setEvalFeedback(e.target.value)}
              placeholder="Candidate technical trade performance, language proficiency, attitude..."
              rows={3}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsEvaluateModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isEvaluating} className="bg-primary-600 text-white text-xs">
              {isEvaluating ? 'Saving...' : 'Submit Evaluation'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
