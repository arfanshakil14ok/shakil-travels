import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  Users,
  Briefcase,
  GraduationCap,
  HeartPulse,
  Stamp,
  ShieldCheck,
  Plane,
  Receipt,
  Headset,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StaffDashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/staff/login');
  }

  // Fetch departmental statistics in parallel
  const [
    totalCandidates,
    skilledCandidates,
    unskilledCandidates,
    activeJobs,
    activeApplications,
    pendingDocuments,
    trainingBatches,
    trainingEnrollments,
    issuedCertificates,
    medicalRecords,
    clearanceRecords,
    departureRecords,
    supportTicketsOpen,
  ] = await Promise.all([
    prisma.applicant.count(),
    prisma.applicant.count({ where: { candidateType: 'SKILLED' } }),
    prisma.applicant.count({ where: { candidateType: 'UNSKILLED' } }),
    prisma.job.count({ where: { status: 'PUBLISHED' } }),
    prisma.application.count({ where: { status: { notIn: ['COMPLETED', 'REJECTED'] } } }),
    prisma.document.count({ where: { status: 'UPLOADED' } }),
    prisma.trainingBatch.count({ where: { status: { in: ['ENROLLING', 'ONGOING', 'UPCOMING'] } } }),
    prisma.trainingEnrollment.count(),
    prisma.trainingCertificate.count(),
    prisma.medicalRecord.count({ where: { result: { in: ['PENDING', 'SCHEDULED'] } } }),
    prisma.clearanceRecord.count({ where: { status: { not: 'APPROVED' } } }),
    prisma.departureRecord.count({ where: { status: 'SCHEDULED' } }),
    prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
  ]);

  const roleName = user.role?.name || 'STAFF';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-900/60 px-2.5 py-0.5 rounded-md border border-indigo-700/50">
              Departmental Staff Hub • কর্মকর্তা ড্যাশবোর্ড
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {user.name}
            </h1>
            <p className="text-sm text-slate-300">
              Active Role: <span className="text-indigo-200 font-semibold">{user.role?.description || roleName}</span> • License RL-1892
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-slate-300">Operational Sync Active</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Candidates */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Candidates</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Users className="w-4 h-4" /></span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalCandidates}</span>
            <span className="text-xs text-slate-400">Registered</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Skilled: <strong className="text-slate-800">{skilledCandidates}</strong></span>
            <span>Unskilled: <strong className="text-slate-800">{unskilledCandidates}</strong></span>
          </div>
        </div>

        {/* Active Jobs */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Jobs</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Briefcase className="w-4 h-4" /></span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{activeJobs}</span>
            <span className="text-xs text-emerald-600 font-medium">Published</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>In Pipeline: <strong className="text-slate-800">{activeApplications}</strong> apps</span>
          </div>
        </div>

        {/* Training Batches */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Training Batches</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><GraduationCap className="w-4 h-4" /></span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{trainingBatches}</span>
            <span className="text-xs text-blue-600 font-medium">Batches Active</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Enrolled: <strong className="text-slate-800">{trainingEnrollments}</strong></span>
            <span>Certificates: <strong className="text-slate-800">{issuedCertificates}</strong></span>
          </div>
        </div>

        {/* Documents Pending */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Docs to Verify</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg"><FileCheck2 className="w-4 h-4" /></span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{pendingDocuments}</span>
            <span className="text-xs text-amber-700 font-medium">Pending Review</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <Link href="/admin/documents" className="text-indigo-600 font-medium hover:underline flex items-center gap-1">
              Verify Vault Files <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Operations Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recruitment & Sourcing Desk */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">Recruitment & Candidates</h2>
              <p className="text-xs text-slate-500">Candidate sourcing, screening & interviews</p>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Link
              href="/admin/applicants"
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
            >
              <span>View All 360° Candidate Hub</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              href="/admin/jobs"
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
            >
              <span>Manage Job Demands & Vacancies</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              href="/admin/applications"
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
            >
              <span>Recruitment Application Pipeline</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Skill Training Operations */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">Skill Training Ecosystem</h2>
              <p className="text-xs text-slate-500">Courses, centers, attendance & certificates</p>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Link
              href="/staff/training"
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
            >
              <span>Training Courses & Batches</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              href="/staff/training/attendance"
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
            >
              <span>Student Attendance & Progress</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              href="/verify-certificate"
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
            >
              <span>Verify & Issue Skill Certificates</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Post-Selection & Processing */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Stamp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">Post-Selection Pipeline</h2>
              <p className="text-xs text-slate-500">Medical (GAMCA), Visa, Clearance & Flight</p>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Link
              href="/staff/medical"
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
            >
              <span>Medical Tests (GAMCA): <strong className="text-emerald-700">{medicalRecords}</strong></span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              href="/staff/clearance"
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
            >
              <span>BMET Clearance / Smart Card</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              href="/staff/departure"
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
            >
              <span>Flight Tickets & Departure</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Candidate Support Desk */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <Headset className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">Candidate Support Desk</h2>
              <p className="text-xs text-slate-500">Inquiries, tickets & candidate assistance</p>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Link
              href="/staff/support"
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
            >
              <span>Open Support Tickets: <strong className="text-purple-700">{supportTicketsOpen}</strong></span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              href="/admin/inquiries"
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
            >
              <span>Website Lead Inquiries</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Finance & Accounts */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">Billing & Receipts</h2>
              <p className="text-xs text-slate-500">Candidate invoicing, payments & vouchers</p>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Link
              href="/admin/invoices"
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
            >
              <span>Invoices & QR Verification</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              href="/admin/payments"
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
            >
              <span>Payment Receipts & Ledger</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Agency License & Compliance */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">Official Accreditation</h2>
              <p className="text-xs text-slate-500">BMET Compliance & Agency Status</p>
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-900">SHAKIL GLOBAL MANPOWER</div>
            <div>License: <span className="font-mono font-bold text-indigo-600">RL-1892</span></div>
            <div>Netrokona Office: 01913681771</div>
          </div>
        </div>
      </div>
    </div>
  );
}
