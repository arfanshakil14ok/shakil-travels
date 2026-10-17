'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Clock,
  MapPin,
  User,
  Stethoscope,
  Plane,
  Stamp,
  Users,
  Briefcase,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'INTERVIEW' | 'MEDICAL' | 'VISA' | 'FLIGHT' | 'MEETING' | 'EVENT';
  date: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  location?: string;
  candidateName?: string;
  description?: string;
  color?: string;
  isSystem?: boolean;
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; bg: string; text: string; border: string }> = {
  INTERVIEW: { label: 'ইন্টারভিউ', icon: Users, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  MEDICAL: { label: 'মেডিকেল', icon: Stethoscope, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  VISA: { label: 'ভিসা ও এম্বাসি', icon: Stamp, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  FLIGHT: { label: 'ফ্লাইট ডিপার্চার', icon: Plane, bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  MEETING: { label: 'বিজনেস মিটিং', icon: Briefcase, bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  EVENT: { label: 'সাধারণ ইভেন্ট', icon: CalendarIcon, bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

const BENGALI_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const WEEKDAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

export default function BusinessCalendarPage() {
  const { success, error } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedDateEvents, setSelectedDateEvents] = useState<CalendarEvent[] | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');

  // Add event modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'MEETING',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    location: '',
    description: '',
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/calendar');
      const data = await res.json();
      if (data.success) {
        setEvents(data.data.events);
      } else {
        error(data.error || 'ক্যালেন্ডার লোড করতে ব্যর্থ হয়েছে');
      }
    } catch (e) {
      error('সার্ভারে সংযোগ ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('আপনি কি এই ইভেন্টটি মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch(`/api/admin/calendar?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        fetchEvents();
        success('ইভেন্ট মুছে ফেলা হয়েছে');
      }
    } catch (e) {
      error('মুছে ফেলতে সমস্যা হয়েছে');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      error('ইভেন্টের নাম আবশ্যক');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        setFormData({
          title: '',
          type: 'MEETING',
          date: new Date().toISOString().split('T')[0],
          startTime: '10:00',
          endTime: '11:00',
          location: '',
          description: '',
        });
        fetchEvents();
        success('নতুন ক্যালেন্ডার ইভেন্ট যুক্ত হয়েছে');
      } else {
        error(data.error || 'ইভেন্ট তৈরি ব্যর্থ হয়েছে');
      }
    } catch (e) {
      error('সার্ভারে সংযোগ ব্যর্থ হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  // Calendar matrix calculation
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const calendarDays: { dayNum: number; dateStr: string; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = month === 0 ? 12 : month;
    const y = month === 0 ? year - 1 : year;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ dayNum: d, dateStr, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ dayNum: d, dateStr, isCurrentMonth: true });
  }

  // Next month leading days
  const remainingCells = 42 - calendarDays.length;
  for (let d = 1; d <= remainingCells; d++) {
    const m = month + 2 > 12 ? 1 : month + 2;
    const y = month + 2 > 12 ? year + 1 : year;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ dayNum: d, dateStr, isCurrentMonth: false });
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredEvents = events.filter((e) => {
    if (typeFilter !== 'ALL' && e.type !== typeFilter) return false;
    return true;
  });

  const getEventsForDate = (dateStr: string) => {
    return filteredEvents.filter((e) => e.date === dateStr);
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setSelectedDateEvents(getEventsForDate(dateStr));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Agency Master Schedule
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            বিজনেস ক্যালেন্ডার (Business Calendar)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ইন্টারভিউ শিডিউল, মেডিকেল চেকআপ, ভিসা অ্যাপয়েন্টমেন্ট ও ফ্লাইট ডিপার্চার ক্যালেন্ডার।
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEvents}
            isLoading={loading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            রিফ্রেশ
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            ইভেন্ট যোগ করুন
          </Button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900">
            {BENGALI_MONTHS[month]} {year}
          </h2>
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white rounded text-slate-600 transition-colors"
              title="পূর্ববর্তী মাস"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-white rounded transition-colors"
            >
              আজকে
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white rounded text-slate-600 transition-colors"
              title="পরবর্তী মাস"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              typeFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'
            }`}
          >
            সকল ইভেন্ট
          </button>
          <button
            onClick={() => setTypeFilter('INTERVIEW')}
            className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition-all ${
              typeFilter === 'INTERVIEW'
                ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/50'
            }`}
          >
            <Users className="w-3 h-3" />
            ইন্টারভিউ
          </button>
          <button
            onClick={() => setTypeFilter('MEDICAL')}
            className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition-all ${
              typeFilter === 'MEDICAL'
                ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50'
            }`}
          >
            <Stethoscope className="w-3 h-3" />
            মেডিকেল
          </button>
          <button
            onClick={() => setTypeFilter('VISA')}
            className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition-all ${
              typeFilter === 'VISA'
                ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/50'
            }`}
          >
            <Stamp className="w-3 h-3" />
            ভিসা
          </button>
          <button
            onClick={() => setTypeFilter('FLIGHT')}
            className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition-all ${
              typeFilter === 'FLIGHT'
                ? 'bg-purple-600 text-white border-purple-600 font-semibold'
                : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100/50'
            }`}
          >
            <Plane className="w-3 h-3" />
            ফ্লাইট
          </button>
        </div>
      </div>

      {/* Main Calendar Grid and Upcoming Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Monthly Grid */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2.5 text-xs font-bold text-slate-700">
            {WEEKDAYS.map((w, idx) => (
              <div key={idx} className={idx === 5 ? 'text-rose-600' : ''}>
                {w}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {calendarDays.map((cd, index) => {
              const dayEvents = getEventsForDate(cd.dateStr);
              const isToday = cd.dateStr === todayStr;
              const isSelected = selectedDateStr === cd.dateStr;

              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(cd.dateStr)}
                  className={`min-h-[95px] sm:min-h-[115px] p-1.5 sm:p-2 transition-all cursor-pointer flex flex-col justify-between ${
                    !cd.isCurrentMonth ? 'bg-slate-50/50 opacity-40' : 'bg-white hover:bg-slate-50/70'
                  } ${isSelected ? 'ring-2 ring-navy-900 bg-blue-50/20' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-navy-900 text-white shadow-xs'
                          : cd.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {cd.dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-full">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Day Events Stack */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev) => {
                      const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.EVENT;
                      return (
                        <div
                          key={ev.id}
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                          title={ev.title}
                        >
                          {ev.startTime && <span className="font-bold mr-1">{ev.startTime}</span>}
                          {ev.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] font-semibold text-slate-400 pl-1">
                        + আরো {dayEvents.length - 2} টি...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day / Upcoming Events Sidebar */}
        <div className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>
                  {selectedDateStr
                    ? `${formatDate(selectedDateStr, false)} এর শিডিউল`
                    : 'আসন্ন প্রধান ইভেন্টসমূহ'}
                </span>
                {selectedDateStr && (
                  <button
                    onClick={() => {
                      setSelectedDateStr('');
                      setSelectedDateEvents(null);
                    }}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    সব দেখাও
                  </button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 max-h-[500px] overflow-y-auto space-y-2.5">
              {(selectedDateEvents || filteredEvents.slice(0, 8)).length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  কোনো ইভেন্ট বা শিডিউল নেই।
                </div>
              ) : (
                (selectedDateEvents || filteredEvents.slice(0, 8)).map((ev) => {
                  const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.EVENT;
                  const EvIcon = cfg.icon;

                  return (
                    <div
                      key={ev.id}
                      className={`p-3 rounded-xl border transition-all ${cfg.bg} ${cfg.border} space-y-1.5`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <EvIcon className={`w-3.5 h-3.5 ${cfg.text}`} />
                          <span className={`text-[11px] font-bold ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        </div>
                        {!ev.isSystem && (
                          <button
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {ev.title}
                      </h4>

                      {ev.description && (
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {ev.description}
                        </p>
                      )}

                      <div className="space-y-0.5 pt-1 text-[10px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3 text-slate-400" />
                          <span>তারিখ: {formatDate(ev.date, false)}</span>
                          {ev.startTime && <span>({ev.startTime})</span>}
                        </div>
                        {ev.location && (
                          <div className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{ev.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Event Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="নতুন বিজনেস ইভেন্ট যোগ করুন"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ইভেন্টের নাম বা মিটিংয়ের বিষয় <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="যেমন: সৌদি নিয়োগকর্তার সাথে জুম মিটিং"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-800/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ইভেন্ট ধরন</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
              >
                <option value="MEETING">বিজনেস মিটিং</option>
                <option value="INTERVIEW">ইন্টারভিউ কল</option>
                <option value="MEDICAL">মেডিকেল অ্যাপয়েন্টমেন্ট</option>
                <option value="VISA">ভিসা ও এম্বাসি ভিজিট</option>
                <option value="FLIGHT">ফ্লাইট ও ডিপার্চার</option>
                <option value="EVENT">সাধারণ ইভেন্ট</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">তারিখ</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">শুরুর সময়</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">শেষের সময়</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">স্থান বা লিংক</label>
            <input
              type="text"
              placeholder="যেমন: হেড অফিস কনফারেন্স রুম / Google Meet"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">বিবরণ</label>
            <textarea
              rows={3}
              placeholder="ইভেন্টের বিস্তারিত তথ্য..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-800/20"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              বাতিল
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={submitting}>
              ইভেন্ট সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
