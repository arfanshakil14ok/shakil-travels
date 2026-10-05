'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  RefreshCw,
  Users,
  Building2,
  Calendar,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Edit2,
  Trash2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';
import { ProfileAvatar } from '@/components/ui/profile-avatar';

export default function AdminTrainingPage() {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'courses' | 'batches' | 'enrollments' | 'trainers' | 'centers'>('courses');
  const [isLoading, setIsLoading] = useState(true);

  // Data States
  const [stats, setStats] = useState<any>({});
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [applicants, setApplicants] = useState<any[]>([]);

  // Search & Filter
  const [search, setSearch] = useState('');

  // Modals
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false);
  const [isCenterModalOpen, setIsCenterModalOpen] = useState(false);

  // Form States
  const [courseForm, setCourseForm] = useState({
    title: '',
    banglaTitle: '',
    categoryId: '',
    durationWeeks: 4,
    hoursTotal: 120,
    fee: 0,
    certificationType: 'BMET_AFFILIATED',
    status: 'ACTIVE',
    description: '',
  });

  const [batchForm, setBatchForm] = useState({
    courseId: '',
    centerId: '',
    instructorId: '',
    startDate: '',
    endDate: '',
    classSchedule: 'Sun-Thu 9:00 AM - 1:00 PM',
    capacity: 30,
  });

  const [enrollForm, setEnrollForm] = useState({
    applicantId: '',
    batchId: '',
    rollNumber: '',
  });

  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  const [progressForm, setProgressForm] = useState({
    completionPercentage: 50,
    status: 'ATTENDING',
    finalGrade: 'A',
    remarks: '',
    issueCertificate: false,
  });

  const [trainerForm, setTrainerForm] = useState({
    name: '',
    phone: '',
    email: '',
    specialization: '',
    centerId: '',
  });

  const [centerForm, setCenterForm] = useState({
    name: '',
    banglaName: '',
    district: 'Dhaka',
    address: '',
    contactPhone: '',
    capacity: 50,
  });

  // Fetch Master Data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [coursesRes, batchesRes, trainersRes, centersRes, enrollmentsRes, applicantsRes] =
        await Promise.all([
          fetch(`/api/admin/training?search=${search}`),
          fetch('/api/admin/training/batches'),
          fetch('/api/admin/training/trainers'),
          fetch('/api/admin/training/centers'),
          fetch('/api/admin/training/enrollments'),
          fetch('/api/applicants?limit=100'),
        ]);

      const [coursesData, batchesData, trainersData, centersData, enrollmentsData, applicantsData] =
        await Promise.all([
          coursesRes.json(),
          batchesRes.json(),
          trainersRes.json(),
          centersRes.json(),
          enrollmentsRes.json(),
          applicantsRes.json(),
        ]);

      if (coursesData.success) {
        setStats(coursesData.data.stats || {});
        setCourses(coursesData.data.courses || []);
        setCategories(coursesData.data.categories || []);
      }
      if (batchesData.success) setBatches(batchesData.data || []);
      if (trainersData.success) setTrainers(trainersData.data || []);
      if (centersData.success) setCenters(centersData.data || []);
      if (enrollmentsData.success) setEnrollments(enrollmentsData.data || []);
      if (applicantsData.success) setApplicants(applicantsData.data.items || []);
    } catch (err: any) {
      error(err.message || 'Failed to load training data');
    } finally {
      setIsLoading(false);
    }
  }, [search, error]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Course Create
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create course');

      success('Training course created successfully.', 'Course Added');
      setIsCourseModalOpen(false);
      setCourseForm({
        title: '',
        banglaTitle: '',
        categoryId: categories[0]?.id || '',
        durationWeeks: 4,
        hoursTotal: 120,
        fee: 0,
        certificationType: 'BMET_AFFILIATED',
        status: 'ACTIVE',
        description: '',
      });
      fetchData();
    } catch (err: any) {
      error(err.message);
    }
  };

  // Handle Batch Create
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/training/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create batch');

      success('Training batch created successfully.', 'Batch Added');
      setIsBatchModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err.message);
    }
  };

  // Handle Enroll Candidate
  const handleEnrollCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/training/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrollForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to enroll candidate');

      success('Candidate enrolled into batch successfully.', 'Enrolled');
      setIsEnrollModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err.message);
    }
  };

  // Handle Progress Update
  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollment) return;
    try {
      const res = await fetch('/api/admin/training/enrollments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId: selectedEnrollment.id,
          ...progressForm,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update progress');

      success('Training progress & assessment updated.', 'Progress Saved');
      setIsProgressModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err.message);
    }
  };

  // Handle Trainer Create
  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/training/trainers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trainerForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create trainer');

      success('Trainer added successfully.', 'Trainer Created');
      setIsTrainerModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err.message);
    }
  };

  // Handle Center Create
  const handleCreateCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/training/centers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(centerForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create center');

      success('Training Center added successfully.', 'Center Created');
      setIsCenterModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Training Management System <span className="text-sm font-normal text-slate-500 font-bengali">প্রশিক্ষণ ব্যবস্থাপনা</span>
            </h1>
            <p className="text-xs text-slate-500">
              Control training programs, batches, trainers, centers, candidate skill tracking, and certificate issuance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              if (activeTab === 'courses') setIsCourseModalOpen(true);
              else if (activeTab === 'batches') setIsBatchModalOpen(true);
              else if (activeTab === 'enrollments') setIsEnrollModalOpen(true);
              else if (activeTab === 'trainers') setIsTrainerModalOpen(true);
              else if (activeTab === 'centers') setIsCenterModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeTab === 'courses' && 'New Course'}
              {activeTab === 'batches' && 'New Batch'}
              {activeTab === 'enrollments' && 'Enroll Candidate'}
              {activeTab === 'trainers' && 'New Trainer'}
              {activeTab === 'centers' && 'New Center'}
            </span>
          </Button>
        </div>
      </div>

      {/* KPI Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Courses</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.totalCourses || 0}</div>
          <span className="text-[11px] text-emerald-700 font-medium">{stats.activeCourses || 0} Active Programs</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Training Batches</span>
            <Calendar className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.totalBatches || 0}</div>
          <span className="text-[11px] text-sky-700 font-medium">{stats.activeBatches || 0} Running Batches</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Enrolled Trainees</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.totalEnrollments || 0}</div>
          <span className="text-[11px] text-indigo-700 font-medium">{stats.completedEnrollments || 0} Certified</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Centers & Faculty</span>
            <Building2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.totalCenters || 0}</div>
          <span className="text-[11px] text-amber-700 font-medium">{stats.totalTrainers || 0} Certified Trainers</span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-2 shadow-xs">
        <div className="flex flex-wrap gap-1">
          {[
            { id: 'courses', label: 'Programs / কোর্স', icon: BookOpen },
            { id: 'batches', label: 'Batches / ব্যাচ', icon: Calendar },
            { id: 'enrollments', label: 'Candidate Trainees / প্রশিক্ষণার্থী', icon: Users },
            { id: 'trainers', label: 'Trainers / ট্রেইনার', icon: Award },
            { id: 'centers', label: 'Training Centers / সেন্টার', icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search training..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Tab 1: Courses */}
      {activeTab === 'courses' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Code & Program</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Duration & Hours</th>
                  <th className="py-3 px-4">Fee</th>
                  <th className="py-3 px-4">Certification</th>
                  <th className="py-3 px-4">Batches</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No training programs found. Click &quot;New Course&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  courses.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-semibold">
                          {c.courseCode}
                        </span>
                        <div className="font-bold text-slate-900 mt-0.5">{c.title}</div>
                        <div className="text-[11px] text-slate-500 font-bengali">{c.banglaTitle}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold text-[11px]">
                          {c.category?.name || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div>{c.durationWeeks} Weeks</div>
                        <div className="text-[10px] text-slate-400 font-mono">{c.hoursTotal} Hours Total</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {Number(c.fee) > 0 ? `${Number(c.fee).toLocaleString()} ${c.currency}` : 'Free / Govt. Sponsored'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {c.certificationType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {c._count?.batches || 0} Batches
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Batches */}
      {activeTab === 'batches' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Batch Code & Course</th>
                  <th className="py-3 px-4">Training Center</th>
                  <th className="py-3 px-4">Trainer / Instructor</th>
                  <th className="py-3 px-4">Date Range</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Enrolled / Cap</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No training batches scheduled. Click &quot;New Batch&quot; to schedule one.
                    </td>
                  </tr>
                ) : (
                  batches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-semibold">
                          {b.batchCode}
                        </span>
                        <div className="font-bold text-slate-900 mt-0.5">{b.course?.title}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {b.center?.name || 'N/A'}
                        <div className="text-[10px] text-slate-400 font-normal">{b.center?.district}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {b.instructor?.name || 'Assigned Lead Trainer'}
                        <div className="text-[10px] text-slate-400">{b.instructor?.specialization}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{formatDate(b.startDate)}</div>
                        <div className="text-[10px] text-slate-400">to {formatDate(b.endDate)}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{b.classSchedule || 'Flexible'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">
                            {b._count?.enrollments || 0}/{b.capacity}
                          </span>
                          <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-600 h-full"
                              style={{ width: `${Math.min(100, ((b._count?.enrollments || 0) / b.capacity) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Candidate Trainees / Enrollments */}
      {activeTab === 'enrollments' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Candidate & Reg ID</th>
                  <th className="py-3 px-4">Course & Batch</th>
                  <th className="py-3 px-4">Center</th>
                  <th className="py-3 px-4">Enrolled Date</th>
                  <th className="py-3 px-4">Progress & Grade</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {enrollments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No candidate enrollments found. Click &quot;Enroll Candidate&quot; to assign training.
                    </td>
                  </tr>
                ) : (
                  enrollments.map((e) => {
                    const currentProg = e.progress?.[0]?.completionPercentage || (e.status === 'COMPLETED' ? 100 : 25);
                    return (
                      <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <ProfileAvatar name={e.applicant?.fullName} photoUrl={e.applicant?.profilePhoto} size="sm" />
                            <div>
                              <div className="font-bold text-slate-900">{e.applicant?.fullName}</div>
                              <span className="font-mono text-[10px] text-slate-400">{e.applicant?.applicantNumber}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{e.batch?.course?.title}</div>
                          <span className="font-mono text-[10px] text-slate-500">{e.batch?.batchCode}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{e.batch?.center?.name}</td>
                        <td className="py-3 px-4 text-slate-500">{formatDate(e.enrolledAt)}</td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-800">{currentProg}% Complete</span>
                              {e.finalGrade && <span className="font-bold text-emerald-700">Grade: {e.finalGrade}</span>}
                            </div>
                            <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${currentProg >= 100 ? 'bg-emerald-600' : 'bg-sky-600'}`}
                                style={{ width: `${currentProg}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              e.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {e.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedEnrollment(e);
                              setProgressForm({
                                completionPercentage: currentProg,
                                status: e.status,
                                finalGrade: e.finalGrade || 'A',
                                remarks: e.progress?.[0]?.trainerRemarks || '',
                                issueCertificate: !!e.certificate,
                              });
                              setIsProgressModalOpen(true);
                            }}
                            className="text-xs h-7 px-2.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          >
                            Update Progress
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Trainers */}
      {activeTab === 'trainers' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Trainer Name</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Specialization</th>
                  <th className="py-3 px-4">Affiliated Center</th>
                  <th className="py-3 px-4">Active Batches</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {trainers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No trainers added yet. Click &quot;New Trainer&quot; to register faculty.
                    </td>
                  </tr>
                ) : (
                  trainers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{t.name}</td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{t.phone}</div>
                        <div className="text-[10px] text-slate-400">{t.email || 'No email'}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-800">{t.specialization}</td>
                      <td className="py-3 px-4 text-slate-700">{t.center?.name || 'National Pool'}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{t._count?.batches || 0}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Centers */}
      {activeTab === 'centers' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Center Code & Name</th>
                  <th className="py-3 px-4">District & Division</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {centers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No training centers added yet. Click &quot;New Center&quot; to add a campus.
                    </td>
                  </tr>
                ) : (
                  centers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-semibold">
                          {c.code}
                        </span>
                        <div className="font-bold text-slate-900 mt-0.5">{c.name}</div>
                        <div className="text-[10px] text-slate-500 font-bengali">{c.banglaName}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {c.district}, {c.division}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{c.address}</td>
                      <td className="py-3 px-4 font-mono">{c.contactPhone}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{c.capacity} Trainees</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {c.operatingStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: New Course */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Training Program</h3>
              <button onClick={() => setIsCourseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Course Title (English) *</label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  placeholder="e.g. Industrial Electrical Installation"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Course Title (Bangla) *</label>
                <input
                  type="text"
                  required
                  value={courseForm.banglaTitle}
                  onChange={(e) => setCourseForm({ ...courseForm, banglaTitle: e.target.value })}
                  placeholder="e.g. ইন্ডাস্ট্রিয়াল ইলেকট্রিক্যাল ইন্সটলেশন"
                  className="w-full px-3 py-2 border rounded-lg font-bengali"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category *</label>
                  <select
                    value={courseForm.categoryId}
                    onChange={(e) => setCourseForm({ ...courseForm, categoryId: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Duration (Weeks)</label>
                  <input
                    type="number"
                    value={courseForm.durationWeeks}
                    onChange={(e) => setCourseForm({ ...courseForm, durationWeeks: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Total Hours</label>
                  <input
                    type="number"
                    value={courseForm.hoursTotal}
                    onChange={(e) => setCourseForm({ ...courseForm, hoursTotal: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Course Fee (BDT)</label>
                  <input
                    type="number"
                    value={courseForm.fee}
                    onChange={(e) => setCourseForm({ ...courseForm, fee: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCourseModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  Create Program
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Batch */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Schedule New Training Batch</h3>
              <button onClick={() => setIsBatchModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBatch} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Program *</label>
                <select
                  required
                  value={batchForm.courseId}
                  onChange={(e) => setBatchForm({ ...batchForm, courseId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="">Select Course Program</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.courseCode})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Center *</label>
                <select
                  required
                  value={batchForm.centerId}
                  onChange={(e) => setBatchForm({ ...batchForm, centerId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="">Select Campus / Center</option>
                  {centers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.district})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={batchForm.startDate}
                    onChange={(e) => setBatchForm({ ...batchForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={batchForm.endDate}
                    onChange={(e) => setBatchForm({ ...batchForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsBatchModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  Schedule Batch
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Enroll Candidate */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Enroll Candidate into Training</h3>
              <button onClick={() => setIsEnrollModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEnrollCandidate} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Candidate *</label>
                <select
                  required
                  value={enrollForm.applicantId}
                  onChange={(e) => setEnrollForm({ ...enrollForm, applicantId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="">Select Candidate</option>
                  {applicants.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.fullName} ({a.applicantNumber} - {a.phone})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Training Batch *</label>
                <select
                  required
                  value={enrollForm.batchId}
                  onChange={(e) => setEnrollForm({ ...enrollForm, batchId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="">Select Batch</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.course?.title} - {b.batchCode} ({b.center?.name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEnrollModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  Confirm Enrollment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Progress & Certificate */}
      {isProgressModalOpen && selectedEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Update Training Progress & Evaluation</h3>
              <button onClick={() => setIsProgressModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateProgress} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="font-bold text-slate-900">{selectedEnrollment.applicant?.fullName}</p>
                <p className="text-[11px] text-slate-500">{selectedEnrollment.batch?.course?.title}</p>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Completion Percentage: {progressForm.completionPercentage}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressForm.completionPercentage}
                  onChange={(e) =>
                    setProgressForm({ ...progressForm, completionPercentage: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-emerald-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    value={progressForm.status}
                    onChange={(e) => setProgressForm({ ...progressForm, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="ENROLLED">Enrolled</option>
                    <option value="ATTENDING">Attending</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DROPPED">Dropped</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Final Grade</label>
                  <select
                    value={progressForm.finalGrade}
                    onChange={(e) => setProgressForm({ ...progressForm, finalGrade: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="A+">A+ (Outstanding)</option>
                    <option value="A">A (Excellent)</option>
                    <option value="B">B (Good)</option>
                    <option value="PASSED">Passed</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={progressForm.issueCertificate}
                    onChange={(e) => setProgressForm({ ...progressForm, issueCertificate: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  <span className="font-semibold text-slate-800">Issue BMET Skill Certificate Automatically</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsProgressModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  Save Progress
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Trainer */}
      {isTrainerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Trainer / Instructor</h3>
              <button onClick={() => setIsTrainerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTrainer} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Trainer Full Name *</label>
                <input
                  type="text"
                  required
                  value={trainerForm.name}
                  onChange={(e) => setTrainerForm({ ...trainerForm, name: e.target.value })}
                  placeholder="e.g. Engr. Rafiqul Islam"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={trainerForm.phone}
                    onChange={(e) => setTrainerForm({ ...trainerForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={trainerForm.email}
                    onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Specialization / Trade *</label>
                <input
                  type="text"
                  required
                  value={trainerForm.specialization}
                  onChange={(e) => setTrainerForm({ ...trainerForm, specialization: e.target.value })}
                  placeholder="e.g. Electrical & Industrial Wiring"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsTrainerModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  Save Trainer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Center */}
      {isCenterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Training Center</h3>
              <button onClick={() => setIsCenterModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCenter} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Center Name (English) *</label>
                <input
                  type="text"
                  required
                  value={centerForm.name}
                  onChange={(e) => setCenterForm({ ...centerForm, name: e.target.value })}
                  placeholder="e.g. Shakil Technical Training Center, Mirpur"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Center Name (Bangla) *</label>
                <input
                  type="text"
                  required
                  value={centerForm.banglaName}
                  onChange={(e) => setCenterForm({ ...centerForm, banglaName: e.target.value })}
                  placeholder="e.g. শাকিল টেকনিক্যাল ট্রেনিং সেন্টার, মিরপুর"
                  className="w-full px-3 py-2 border rounded-lg font-bengali"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={centerForm.district}
                    onChange={(e) => setCenterForm({ ...centerForm, district: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Capacity</label>
                  <input
                    type="number"
                    value={centerForm.capacity}
                    onChange={(e) => setCenterForm({ ...centerForm, capacity: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Address *</label>
                <input
                  type="text"
                  required
                  value={centerForm.address}
                  onChange={(e) => setCenterForm({ ...centerForm, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contact Phone *</label>
                <input
                  type="text"
                  required
                  value={centerForm.contactPhone}
                  onChange={(e) => setCenterForm({ ...centerForm, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCenterModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  Save Center
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
