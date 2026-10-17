'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  Calendar,
  User,
  ShieldAlert,
  FileCheck,
  Stethoscope,
  Plane,
  Stamp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  category: 'PASSPORT' | 'MEDICAL' | 'VISA' | 'FLIGHT' | 'GENERAL' | 'FINANCE';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: string;
  assignee?: string;
  notes?: string;
  applicantName?: string;
  createdAt: string;
  isSystemGenerated?: boolean;
}

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string }> = {
  PASSPORT: { label: 'পাসপোর্ট ও ফাইল', icon: FileCheck, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  MEDICAL: { label: 'মেডিকেল টেস্ট', icon: Stethoscope, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  VISA: { label: 'ভিসা ও এম্বাসি', icon: Stamp, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  FLIGHT: { label: 'ফ্লাইট ও টিকিট', icon: Plane, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  GENERAL: { label: 'সাধারণ টাস্ক', icon: ListTodo, color: 'text-slate-600 bg-slate-50 border-slate-200' },
  FINANCE: { label: 'হিসাব ও পেমেন্ট', icon: FileCheck, color: 'text-rose-600 bg-rose-50 border-rose-200' },
};

export default function AdminTasksPage() {
  const { success, error } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, pending: 0, urgent: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Add Task Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'GENERAL',
    priority: 'MEDIUM',
    dueDate: new Date().toISOString().split('T')[0],
    assignee: '',
    applicantName: '',
    notes: '',
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tasks');
      const data = await res.json();
      if (data.success) {
        setTasks(data.data.tasks);
        setStats(data.data.stats);
      } else {
        error(data.error || 'টাস্ক লোড করতে ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      error('সার্ভারে সংযোগ ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggleStatus = async (task: Task) => {
    const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          status: nextStatus,
          title: task.title,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
        );
        fetchTasks();
        success(nextStatus === 'COMPLETED' ? 'টাস্ক সম্পন্ন হয়েছে!' : 'টাস্ক পেন্ডিং করা হয়েছে');
      }
    } catch (e) {
      error('স্ট্যাটাস আপডেট ব্যর্থ হয়েছে');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('আপনি কি এই টাস্কটি মুছে ফেলতে নিশ্চিত?')) return;
    try {
      const res = await fetch(`/api/admin/tasks?id=${taskId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        fetchTasks();
        success('টাস্ক সফলভাবে মুছে ফেলা হয়েছে');
      }
    } catch (e) {
      error('মুছে ফেলতে ব্যর্থ হয়েছে');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      error('টাস্কের নাম আবশ্যক');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        setFormData({
          title: '',
          category: 'GENERAL',
          priority: 'MEDIUM',
          dueDate: new Date().toISOString().split('T')[0],
          assignee: '',
          applicantName: '',
          notes: '',
        });
        fetchTasks();
        success('নতুন টাস্ক সফলভাবে তৈরি হয়েছে');
      } else {
        error(data.error || 'টাস্ক তৈরি ব্যর্থ হয়েছে');
      }
    } catch (e) {
      error('সার্ভারে সংযোগ ব্যর্থ হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
    if (search.trim()) {
      const term = search.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(term);
      const matchApplicant = t.applicantName?.toLowerCase().includes(term);
      const matchNotes = t.notes?.toLowerCase().includes(term);
      if (!matchTitle && !matchApplicant && !matchNotes) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-navy-800 bg-navy-50 px-2.5 py-0.5 rounded-full border border-navy-200">
              Agency Operations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            টাস্ক ও কার্যাবলী (Tasks & Activities)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            রিক্রুটমেন্ট ফাইল, ডকুমেন্ট ভেরিফিকেশন, মেডিকেল ও ভিসা সম্পর্কিত সমস্ত দৈনিক কাজ।
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTasks}
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
            নতুন টাস্ক যোগ করুন
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">মোট টাস্ক</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">সব ধরনের কাজ</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <ListTodo className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">বাকি কাজ (Pending)</p>
              <h3 className="text-2xl font-bold text-amber-900 mt-1">{stats.pending}</h3>
              <p className="text-[11px] text-amber-600 mt-0.5">{stats.urgent}টি জরুরি কাজ</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">চলমান কাজ</p>
              <h3 className="text-2xl font-bold text-blue-900 mt-1">{stats.inProgress}</h3>
              <p className="text-[11px] text-blue-600 mt-0.5">প্রক্রিয়াধীন রয়েছে</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">সম্পন্ন কাজ</p>
              <h3 className="text-2xl font-bold text-emerald-900 mt-1">{stats.completed}</h3>
              <p className="text-[11px] text-emerald-600 mt-0.5">সফল সমাপ্তি</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Tab Section */}
      <Card className="border-slate-200">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-fit text-xs font-medium">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                সকল কাজ ({tasks.length})
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  statusFilter === 'PENDING'
                    ? 'bg-white text-amber-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                বাকি কাজ ({stats.pending})
              </button>
              <button
                onClick={() => setStatusFilter('IN_PROGRESS')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  statusFilter === 'IN_PROGRESS'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                চলমান ({stats.inProgress})
              </button>
              <button
                onClick={() => setStatusFilter('COMPLETED')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  statusFilter === 'COMPLETED'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                সম্পন্ন ({stats.completed})
              </button>
            </div>

            {/* Search & Category Filter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="টাস্ক বা ক্যান্ডিডেট খুঁজুন..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-navy-800/20"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none"
              >
                <option value="ALL">সব ক্যাটাগরি</option>
                <option value="PASSPORT">পাসপোর্ট ও ফাইল</option>
                <option value="MEDICAL">মেডিকেল টেস্ট</option>
                <option value="VISA">ভিসা ও এম্বাসি</option>
                <option value="FLIGHT">ফ্লাইট ও টিকিট</option>
                <option value="FINANCE">হিসাব ও পেমেন্ট</option>
                <option value="GENERAL">সাধারণ কাজ</option>
              </select>
            </div>
          </div>

          {/* Tasks List */}
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-white">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">টাস্ক লোড হচ্ছে...</div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-slate-700">কোনো টাস্ক পাওয়া যায়নি</p>
                <p className="text-xs text-slate-400 mt-1">সব কাজ সম্পন্ন অথবা কোনো পেন্ডিং টাস্ক নেই।</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const cat = CATEGORY_MAP[task.category] || CATEGORY_MAP.GENERAL;
                const CatIcon = cat.icon;
                const isDone = task.status === 'COMPLETED';

                return (
                  <div
                    key={task.id}
                    className={`p-4 flex items-start justify-between gap-4 transition-colors hover:bg-slate-50/80 ${
                      isDone ? 'bg-slate-50/40 opacity-70' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleStatus(task)}
                        className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center transition-colors ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 hover:border-emerald-600 bg-white'
                        }`}
                      >
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>

                      {/* Content */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-sm font-semibold ${
                              isDone ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {task.title}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat.color}`}
                          >
                            <CatIcon className="w-2.5 h-2.5" />
                            {cat.label}
                          </span>

                          {task.priority === 'URGENT' && !isDone && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <ShieldAlert className="w-2.5 h-2.5" />
                              জরুরি (URGENT)
                            </span>
                          )}

                          {task.isSystemGenerated && (
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                              অটো সিঙ্ক
                            </span>
                          )}
                        </div>

                        {task.notes && (
                          <p className="text-xs text-slate-500 leading-relaxed">{task.notes}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                          {task.applicantName && (
                            <span className="flex items-center gap-1 text-slate-600 font-medium">
                              <User className="w-3 h-3 text-slate-400" />
                              {task.applicantName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            তারিখ: {formatDate(task.dueDate, false)}
                          </span>
                          {task.assignee && <span>দায়িত্বে: {task.assignee}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Delete action */}
                    {!task.isSystemGenerated && (
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
                        title="টাস্ক মুছুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Task Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="নতুন টাস্ক তৈরি করুন"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              টাস্কের নাম বা বিষয়বস্তু <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="যেমন: পাসপোর্ট ভেরিফিকেশন ও পুলিশ ক্লিয়ারেন্স জমা"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-800/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ক্যাটাগরি</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
              >
                <option value="GENERAL">সাধারণ কাজ</option>
                <option value="PASSPORT">পাসপোর্ট ও ফাইল</option>
                <option value="MEDICAL">মেডিকেল টেস্ট</option>
                <option value="VISA">ভিসা ও এম্বাসি</option>
                <option value="FLIGHT">ফ্লাইট ও টিকিট</option>
                <option value="FINANCE">হিসাব ও পেমেন্ট</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">অগ্রাধিকার (Priority)</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
              >
                <option value="LOW">স্বাভাবিক (Low)</option>
                <option value="MEDIUM">মাঝারি (Medium)</option>
                <option value="HIGH">উচ্চ (High)</option>
                <option value="URGENT">জরুরি (Urgent)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">তারিখ (Due Date)</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">দায়িত্বপ্রাপ্ত স্টাফ</label>
              <input
                type="text"
                placeholder="যেমন: আরফান শাকিল"
                value={formData.assignee}
                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ক্যান্ডিডেটের নাম (যদি থাকে)</label>
            <input
              type="text"
              placeholder="যেমন: মোঃ রফিকুল ইসলাম"
              value={formData.applicantName}
              onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">বিস্তারিত নোট</label>
            <textarea
              rows={3}
              placeholder="কাজের বিস্তারিত বিবরণ ও নির্দেশনা..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-800/20"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              বাতিল
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={submitting}>
              টাস্ক সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
