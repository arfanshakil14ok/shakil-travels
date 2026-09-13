'use client';

import React, { useState, useEffect } from 'react';
import {
  Plane,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Calendar,
  MapPin,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';

export default function StaffDeparturePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields for editing
  const [formStatus, setFormStatus] = useState('SCHEDULED');
  const [formAirline, setFormAirline] = useState('');
  const [formFlight, setFormFlight] = useState('');
  const [formTicket, setFormTicket] = useState('');
  const [formPnr, setFormPnr] = useState('');
  const [formDepDate, setFormDepDate] = useState('');
  const [formOrigin, setFormOrigin] = useState('');
  const [formDestination, setFormDestination] = useState('');
  const [formInstructions, setFormInstructions] = useState('');

  const loadRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/post-selection/departure?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load departure records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRecords();
  };

  const openEditModal = (rec: any) => {
    setEditingRecord(rec);
    setFormStatus(rec.status || 'SCHEDULED');
    setFormAirline(rec.airline || '');
    setFormFlight(rec.flightNumber || '');
    setFormTicket(rec.ticketNumber || '');
    setFormPnr(rec.pnrNumber || '');
    setFormDepDate(rec.departureDate ? rec.departureDate.substring(0, 16) : '');
    setFormOrigin(rec.departureAirport || 'DAC - Hazrat Shahjalal International Airport, Dhaka');
    setFormDestination(rec.destinationAirport || '');
    setFormInstructions(rec.reportingInstructions || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/post-selection/departure', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRecord.id,
          status: formStatus,
          airline: formAirline,
          flightNumber: formFlight,
          ticketNumber: formTicket,
          pnrNumber: formPnr,
          departureDate: formDepDate ? new Date(formDepDate).toISOString() : editingRecord.departureDate,
          departureAirport: formOrigin,
          destinationAirport: formDestination,
          reportingInstructions: formInstructions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingRecord(null);
        loadRecords();
      } else {
        alert(data.error || 'Failed to update departure record');
      }
    } catch (err) {
      alert('Network error while updating departure record');
    } finally {
      setIsSaving(false);
    }
  };

  const stats = {
    total: records.length,
    scheduled: records.filter((r) => r.status === 'SCHEDULED').length,
    departed: records.filter((r) => r.status === 'DEPARTED' || r.status === 'ARRIVED' || r.status === 'BOARDED').length,
    cancelled: records.filter((r) => r.status === 'CANCELLED' || r.status === 'RESCHEDULED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-semibold">
              Post-Selection Operations
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Flight Operations & Airport Dispatch
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage airline booking, e-tickets, PNR issuance, pre-flight reporting, and airport dispatch briefings.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadRecords}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Data
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Total Flight Dispatches</span>
          <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
        </div>
        <div className="p-4 bg-white border border-sky-200 rounded-xl shadow-xs bg-sky-50/20">
          <span className="text-xs text-sky-700 font-medium block">Upcoming Scheduled</span>
          <span className="text-2xl font-bold text-sky-700">{stats.scheduled}</span>
        </div>
        <div className="p-4 bg-white border border-emerald-200 rounded-xl shadow-xs bg-emerald-50/20">
          <span className="text-xs text-emerald-700 font-medium block">Boarded & Departed</span>
          <span className="text-2xl font-bold text-emerald-700">{stats.departed}</span>
        </div>
        <div className="p-4 bg-white border border-rose-200 rounded-xl shadow-xs bg-rose-50/20">
          <span className="text-xs text-rose-700 font-medium block">Rescheduled / Cancelled</span>
          <span className="text-2xl font-bold text-rose-700">{stats.cancelled}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-96">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search candidate, airline, flight, PNR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-600 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Status</option>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="BOARDED">BOARDED</option>
            <option value="DEPARTED">DEPARTED</option>
            <option value="ARRIVED">ARRIVED</option>
            <option value="RESCHEDULED">RESCHEDULED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState text="Loading departure schedules..." />
      ) : records.length === 0 ? (
        <EmptyState
          title="No Departure Records Found"
          description="There are currently no candidate flight departure operations matching your criteria."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Flight & Airline</th>
                  <th className="py-3 px-4">Route (Origin → Dest)</th>
                  <th className="py-3 px-4">Departure Time</th>
                  <th className="py-3 px-4">PNR / Ticket</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{rec.applicant?.fullName}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {rec.applicant?.applicantNumber} • {rec.applicant?.phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{rec.airline}</div>
                      <div className="text-[11px] font-mono text-sky-700 font-semibold">
                        {rec.flightNumber}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{rec.destinationAirport}</div>
                      <div className="text-[10px] text-slate-400">from {rec.departureAirport}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">
                        {new Date(rec.departureDate).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(rec.departureDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900">{rec.pnrNumber || '—'}</div>
                      <div className="text-[10px] font-mono text-slate-500">{rec.ticketNumber || ''}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'DEPARTED' || rec.status === 'ARRIVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : rec.status === 'SCHEDULED' || rec.status === 'BOARDED'
                            ? 'bg-sky-100 text-sky-800 border border-sky-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(rec)}
                        className="text-xs h-7 px-2.5"
                      >
                        Edit Flight
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Departure Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Manage Flight Dispatch</h3>
                <p className="text-xs text-slate-500">
                  Candidate: {editingRecord.applicant?.fullName} ({editingRecord.applicant?.applicantNumber})
                </p>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Airline</label>
                  <input
                    type="text"
                    value={formAirline}
                    onChange={(e) => setFormAirline(e.target.value)}
                    placeholder="e.g. Biman Bangladesh, Saudia"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Flight Number</label>
                  <input
                    type="text"
                    value={formFlight}
                    onChange={(e) => setFormFlight(e.target.value)}
                    placeholder="e.g. BG-045, SV-802"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PNR / Booking Reference</label>
                  <input
                    type="text"
                    value={formPnr}
                    onChange={(e) => setFormPnr(e.target.value)}
                    placeholder="e.g. 7X9K2L"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">E-Ticket Number</label>
                  <input
                    type="text"
                    value={formTicket}
                    onChange={(e) => setFormTicket(e.target.value)}
                    placeholder="e.g. 098-2948201948"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Departure Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formDepDate}
                    onChange={(e) => setFormDepDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Flight Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="BOARDED">BOARDED</option>
                    <option value="DEPARTED">DEPARTED</option>
                    <option value="ARRIVED">ARRIVED</option>
                    <option value="RESCHEDULED">RESCHEDULED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Origin Airport</label>
                  <input
                    type="text"
                    value={formOrigin}
                    onChange={(e) => setFormOrigin(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Destination Airport</label>
                  <input
                    type="text"
                    value={formDestination}
                    onChange={(e) => setFormDestination(e.target.value)}
                    placeholder="e.g. RUH - King Khalid International Airport, Riyadh"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reporting & Airport Briefing Instructions</label>
                <textarea
                  rows={2}
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  placeholder="Report 4 hours before departure at Terminal 1. Bring original passport and BMET Smart Card..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingRecord(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" variant="primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Flight Details'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
