'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  FileCheck2,
  FileText,
  Calendar,
  Stamp,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Upload,
  User,
  ShieldCheck,
  ChevronRight,
  Receipt,
  Sparkles,
  Building2,
  Clock,
  ExternalLink,
  Camera,
  GraduationCap,
  Award,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { BRAND } from '@/config/brand';

export default function PortalDashboardPage() {
  const { language, t } = useLanguage();
  const [profile, setProfile] = useState<any | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [visaCases, setVisaCases] = useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = useState<any | null>(null);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [pRes, aRes, dRes, vRes, invRes, recRes] = await Promise.all([
          fetch('/api/portal/profile'),
          fetch('/api/portal/applications'),
          fetch('/api/portal/documents'),
          fetch('/api/portal/visa'),
          fetch('/api/portal/invoices'),
          fetch('/api/portal/jobs/recommended'),
        ]);

        const [pData, aData, dData, vData, invData, recData] = await Promise.all([
          pRes.json(),
          aRes.json(),
          dRes.json(),
          vRes.json(),
          invRes.json(),
          recRes.json(),
        ]);

        if (pData.success) setProfile(pData.data);
        if (aData.success) setApplications(aData.data || []);
        if (dData.success) {
          setDocuments(dData.data?.documents || []);
          setDocumentTypes(dData.data?.documentTypes || []);
        }
        if (vData.success) setVisaCases(vData.data || []);
        if (invData.success) setFinancialSummary(invData.data?.summary || null);
        if (recData?.success) setRecommendedJobs(recData.data || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingState text={t('ড্যাশবোর্ড লোড হচ্ছে...', 'Loading your recruitment dashboard...')} />
      </div>
    );
  }

  const completion = profile?.completion?.percentage || 0;
  const missing = profile?.completion?.missingFields || [];
  const activeVisa = visaCases.find((v) => !['REJECTED', 'CANCELLED'].includes(v.status));

  // Determine completion of individual categories
  const categoriesStatus = [
    {
      id: 'personal',
      name: language === 'bn' ? 'ব্যক্তিগত তথ্য' : 'Personal Information',
      completed: !!(profile?.fullName && profile?.phone && profile?.district),
      link: '/portal/profile',
    },
    {
      id: 'photo',
      name: language === 'bn' ? 'প্রোফাইল ছবি' : 'Profile Photo',
      completed: !!(profile?.profilePhoto && profile.profilePhoto.trim().length > 0),
      link: '/portal/profile',
    },
    {
      id: 'passport',
      name: language === 'bn' ? 'পাসপোর্ট / জাতীয় পরিচয়' : 'Passport & Identity',
      completed: !!(profile?.passportAvailable && profile?.passportNumber),
      link: '/portal/profile',
    },
    {
      id: 'education',
      name: language === 'bn' ? 'শিক্ষাগত যোগ্যতা' : 'Education & Qualifications',
      completed: !!(profile?.education || profile?.profile?.education),
      link: '/portal/profile',
    },
    {
      id: 'experience',
      name: language === 'bn' ? 'কাজের অভিজ্ঞতা ও দক্ষতা' : 'Work Experience & Skills',
      completed: !!(profile?.profession || profile?.skills || profile?.yearsOfExperience !== undefined),
      link: '/portal/profile',
    },
    {
      id: 'documents',
      name: language === 'bn' ? 'নথিপত্র আপলোড' : 'Documents & Attachments',
      completed: documents.length > 0,
      link: '/portal/documents',
    },
  ];

  // Document checklist inspection
  const standardDocs = [
    {
      key: 'PASSPORT',
      title: language === 'bn' ? 'আন্তর্জাতিক পাসপোর্ট' : 'International Passport',
      isUploaded: documents.some((d) => 
        d.documentType?.code?.toUpperCase().includes('PASSPORT') ||
        d.fileName?.toLowerCase().includes('passport')
      ),
    },
    {
      key: 'PHOTO',
      title: language === 'bn' ? 'পাসপোর্ট সাইজ ছবি' : 'Passport Size Photo',
      isUploaded: !!(profile?.profilePhoto && profile.profilePhoto.length > 0),
    },
    {
      key: 'NID',
      title: language === 'bn' ? 'জাতীয় পরিচয়পত্র (NID)' : 'National ID / NID',
      isUploaded: documents.some((d) => 
        d.documentType?.code?.toUpperCase().includes('NID') ||
        d.fileName?.toLowerCase().includes('nid')
      ),
    },
    {
      key: 'CERTIFICATE',
      title: language === 'bn' ? 'শিক্ষাগত বা ট্রেনিং সনদ' : 'Educational / Skill Certificate',
      isUploaded: documents.some((d) => 
        d.documentType?.code?.toUpperCase().includes('EDU') ||
        d.documentType?.code?.toUpperCase().includes('CERT') ||
        d.fileName?.toLowerCase().includes('cert')
      ),
    },
    {
      key: 'EXPERIENCE',
      title: language === 'bn' ? 'কাজের অভিজ্ঞতা সনদ (যদি থাকে)' : 'Experience Document (If any)',
      isUploaded: documents.some((d) => 
        d.documentType?.code?.toUpperCase().includes('EXP') ||
        d.fileName?.toLowerCase().includes('experience')
      ),
    },
  ];

  const getStageBadgeColor = (stage: string) => {
    switch (stage?.toUpperCase()) {
      case 'SELECTED':
      case 'VISA_ISSUED':
      case 'BMET_CARD':
      case 'DEPARTED':
        return 'bg-[#24856A]/10 text-[#24856A] border-[#24856A]/30';
      case 'INTERVIEW_SCHEDULED':
      case 'MEDICAL_FIT':
      case 'VISA_PROCESSING':
        return 'bg-[#102B50]/10 text-[#102B50] border-[#102B50]/30';
      case 'UNDER_REVIEW':
      case 'SCREENING':
      case 'DOCUMENT_PENDING':
        return 'bg-[#B7791F]/10 text-[#B7791F] border-[#B7791F]/30';
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-[#C2414B]/10 text-[#C2414B] border-[#C2414B]/30';
      default:
        return 'bg-[#102B50]/5 text-[#102B50] border-[#E4EAF1]';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      {/* 1. Welcome Header */}
      <div className="bg-white border border-[#E4EAF1] rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 font-bengali">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F6F8FB] text-[#102B50] font-semibold border border-[#E4EAF1]">
              {t('প্রার্থী ড্যাশবোর্ড', 'Candidate Dashboard')}
            </span>
            <span className="text-xs text-[#66758A] hidden sm:inline">
              • {BRAND.licenseNumber} (BMET অনুমোদিত)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172B45] tracking-tight">
            {t('স্বাগতম', 'Welcome')}, {profile?.fullName || 'Candidate'}!
          </h1>
          <p className="text-xs text-[#66758A] flex flex-wrap items-center gap-2">
            <span>
              {t('প্রার্থী আইডি', 'Candidate ID')}:{' '}
              <strong className="font-mono text-[#102B50]">{profile?.applicantNumber || 'SG-CANDIDATE'}</strong>
            </span>
            {profile?.preferredCountry && (
              <>
                <span>•</span>
                <span>
                  {t('পছন্দের দেশ', 'Preferred Country')}:{' '}
                  <strong className="text-[#172B45]">{profile.preferredCountry.name}</strong>
                </span>
              </>
            )}
          </p>
        </div>

        {/* Profile Completion Status Badge */}
        <div className="bg-[#F6F8FB] border border-[#E4EAF1] rounded-xl p-3.5 min-w-[260px]">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-[#172B45] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#102B50]" />
              {t('প্রোফাইল পূর্ণতা', 'Profile Completion')}
            </span>
            <span className={completion >= 80 ? 'text-[#24856A] font-bold' : 'text-[#B7791F] font-bold'}>
              {completion}%
            </span>
          </div>
          <div className="w-full bg-[#E4EAF1] rounded-full h-2 overflow-hidden mb-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                completion >= 80 ? 'bg-[#24856A]' : 'bg-[#102B50]'
              }`}
              style={{ width: `${completion}%` }}
            />
          </div>
          {missing.length > 0 ? (
            <div className="text-[11px] text-[#66758A] flex items-center justify-between">
              <span className="truncate max-w-[160px]">
                {t('অপূর্ণ:', 'Missing:')} {missing.slice(0, 2).join(', ')}
              </span>
              <Link
                href="/portal/profile"
                className="text-[#102B50] font-bold hover:underline text-[11px] shrink-0"
              >
                {t('সম্পূর্ণ করুন', 'Complete')}
              </Link>
            </div>
          ) : (
            <div className="text-[11px] text-[#24856A] font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#24856A]" />
              {t('প্রোফাইল শতভাগ সম্পূর্ণ', 'Profile 100% Completed')}
            </div>
          )}
        </div>
      </div>

      {/* 2. Missing Profile Categories Checklist (Part A.5) */}
      <div className="bg-white border border-[#E4EAF1] rounded-xl p-5 shadow-2xs font-bengali">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E4EAF1]">
          <div>
            <h3 className="text-sm font-bold text-[#172B45] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#102B50]" />
              {t('প্রোফাইল ক্যাটাগরি চেকলিস্ট', 'Profile Category Status')}
            </h3>
            <p className="text-xs text-[#66758A]">
              {t(
                'চাকরিতে সফল আবেদনের জন্য নিচের সবকটি ক্যাটাগরি সম্পন্ন করা বাধ্যতামূলক।',
                'Completing each category ensures immediate eligibility for overseas screening.'
              )}
            </p>
          </div>
          <Link
            href="/portal/profile"
            className="text-xs font-semibold text-[#102B50] hover:text-[#0B1D35] flex items-center gap-1"
          >
            <span>{t('প্রোফাইল এডিট করুন', 'Edit Profile')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {categoriesStatus.map((cat) => (
            <Link
              key={cat.id}
              href={cat.link}
              className={`p-3 rounded-lg border text-left transition-all block ${
                cat.completed
                  ? 'bg-[#24856A]/5 border-[#24856A]/20 hover:border-[#24856A]'
                  : 'bg-[#F6F8FB] border-[#E4EAF1] hover:border-[#102B50]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#66758A]">
                  {cat.completed ? (
                    <span className="text-[#24856A] flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3 text-[#24856A]" /> সম্পন্ন
                    </span>
                  ) : (
                    <span className="text-[#B7791F]">বাকি আছে</span>
                  )}
                </span>
              </div>
              <div className="text-xs font-bold text-[#172B45] line-clamp-1">{cat.name}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* 3. 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-bengali">
        {/* Applications */}
        <Link
          href="/portal/applications"
          className="bg-white border border-[#E4EAF1] rounded-xl p-4 sm:p-5 shadow-2xs hover:border-[#102B50] transition-all block group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#66758A]">
              {t('আমার আবেদনসমূহ', 'My Applications')}
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#F6F8FB] text-[#102B50] flex items-center justify-center">
              <FileCheck2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#102B50]">{applications.length}</div>
          <div className="text-[11px] text-[#66758A] mt-1 flex items-center gap-1 group-hover:text-[#102B50]">
            <span>{t('আবেদনের অগ্রগতি দেখুন', 'View Applications')}</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Documents */}
        <Link
          href="/portal/documents"
          className="bg-white border border-[#E4EAF1] rounded-xl p-4 sm:p-5 shadow-2xs hover:border-[#102B50] transition-all block group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#66758A]">
              {t('আপলোডকৃত নথিপত্র', 'Documents')}
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#F6F8FB] text-[#102B50] flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#102B50]">{documents.length}</div>
          <div className="text-[11px] text-[#66758A] mt-1 flex items-center gap-1 group-hover:text-[#102B50]">
            <span>{t('ফাইল ও সনদ ম্যানেজ', 'Manage Files')}</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Visa Tracking */}
        <Link
          href="/portal/visa"
          className="bg-white border border-[#E4EAF1] rounded-xl p-4 sm:p-5 shadow-2xs hover:border-[#102B50] transition-all block group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#66758A]">
              {t('ভিসা প্রসেসিং স্ট্যাটাস', 'Visa Status')}
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#F6F8FB] text-[#102B50] flex items-center justify-center">
              <Stamp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-sm sm:text-base font-bold text-[#102B50] truncate">
            {activeVisa ? activeVisa.status : t('প্রক্রিয়াধীন নেই', 'None Active')}
          </div>
          <div className="text-[11px] text-[#66758A] mt-1 flex items-center gap-1 group-hover:text-[#102B50]">
            <span>{t('ভিসা ও ছাড়পত্র ট্র্যাকিং', 'Visa Tracking')}</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Outstanding Due */}
        <Link
          href="/portal/invoices"
          className="bg-white border border-[#E4EAF1] rounded-xl p-4 sm:p-5 shadow-2xs hover:border-[#102B50] transition-all block group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#66758A]">
              {t('বকেয়া সরকারি ফি', 'Outstanding Due')}
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#F6F8FB] text-[#102B50] flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#102B50]">
            ৳{financialSummary?.totalDue ? Number(financialSummary.totalDue).toLocaleString() : '0'}
          </div>
          <div className="text-[11px] text-[#66758A] mt-1 flex items-center gap-1 group-hover:text-[#102B50]">
            <span>{t('রসিদ ও পেমেন্ট হিস্ট্রি', 'Payment History')}</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>

      {/* 4. Main 2-Column Section: Current Applications & Document Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-bengali">
        {/* Left Column (8 cols): Current Applications */}
        <div className="lg:col-span-8 bg-white border border-[#E4EAF1] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4EAF1]">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#172B45] flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#102B50]" />
                {t('চলমান চাকরির আবেদনসমূহ', 'Current Applications')}
              </h3>
              <p className="text-xs text-[#66758A]">
                {t('আবেদনের বর্তমান স্টেজ ও সর্বশেষ অগ্রগতি পর্যবেক্ষণ করুন।', 'Application stage & latest status updates.')}
              </p>
            </div>
            <Link
              href="/portal/jobs"
              className="text-xs font-semibold text-[#102B50] hover:underline flex items-center gap-1"
            >
              <span>{t('নতুন চাকরি খুঁজুন', 'Browse Jobs')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {applications.length === 0 ? (
            <EmptyState
              title={t('এখনও কোনো চাকরির আবেদন করা হয়নি', 'No applications submitted yet')}
              description={t(
                'আমাদের অনুমোদিত বিদেশি চাকরির বিজ্ঞপ্তি দেখুন এবং আপনার পছন্দের পদে আবেদন করুন।',
                'Explore verified overseas vacancies and submit your step-by-step application.'
              )}
              action={{
                label: t('চাকরির বিজ্ঞপ্তি দেখুন', 'Browse Overseas Jobs'),
                href: '/portal/jobs',
              }}
            />
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-xl border border-[#E4EAF1] hover:border-[#102B50] bg-white transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-[#172B45]">
                        {app.job?.title}
                      </div>
                      <div className="text-xs text-[#66758A] mt-0.5 flex flex-wrap items-center gap-2">
                        <span>{app.job?.country?.name}</span>
                        <span>•</span>
                        <span className="font-mono text-xs text-[#102B50]">{app.applicationCode}</span>
                        {app.job?.employer?.companyName && (
                          <>
                            <span>•</span>
                            <span className="text-[#66758A]">{app.job.employer.companyName}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border self-start ${getStageBadgeColor(app.status)}`}>
                      {app.status || 'APPLIED'}
                    </span>
                  </div>

                  {/* 5-Stage Mini Progress Bar for each Application */}
                  <div className="pt-2 border-t border-[#E4EAF1]/70">
                    <div className="flex items-center justify-between text-[11px] text-[#66758A] mb-1.5">
                      <span>আবেদন স্টেজ: <strong>{app.currentStage || app.status || 'Applied'}</strong></span>
                      <span className="text-[10px]">
                        হালনাগাদ: {new Date(app.updatedAt || app.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-1">
                      {['APPLIED', 'PROFILE_REVIEW', 'INTERVIEW', 'VISA_PROCESSING', 'PRE_DEPARTURE'].map((st, sIdx) => {
                        const stageOrder = ['APPLIED', 'PROFILE_REVIEW', 'INTERVIEW', 'VISA_PROCESSING', 'PRE_DEPARTURE'];
                        const currentIdx = stageOrder.indexOf(app.currentStage || app.status || 'APPLIED');
                        const isReached = currentIdx >= sIdx;
                        const isCurrent = currentIdx === sIdx;

                        return (
                          <div key={st} className="flex-1 text-center">
                            <div
                              className={`h-1.5 rounded-full ${
                                isReached ? 'bg-[#102B50]' : 'bg-[#E4EAF1]'
                              } ${isCurrent ? 'ring-2 ring-[#E8A2C1]' : ''}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-[#66758A]">
                    <span>
                      {t('আবেদনের তারিখ:', 'Applied:')} {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                    <Link
                      href={`/portal/applications/${app.id}`}
                      className="text-[#102B50] font-bold hover:underline flex items-center gap-1"
                    >
                      <span>{t('পূর্ণ বিবরণ ও টাইমলাইন', 'View Timeline')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Required Documents & Next Actions */}
        <div className="lg:col-span-4 space-y-4">
          {/* Required Document Checklist */}
          <div className="bg-white border border-[#E4EAF1] rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E4EAF1]">
              <h3 className="font-bold text-sm text-[#172B45] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#102B50]" />
                {t('প্রয়োজনীয় নথিপত্র চেকলিস্ট', 'Document Checklist')}
              </h3>
              <Link
                href="/portal/documents"
                className="text-[11px] font-bold text-[#102B50] hover:underline"
              >
                আপলোড
              </Link>
            </div>

            <div className="space-y-2">
              {standardDocs.map((doc) => (
                <div
                  key={doc.key}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-[#E4EAF1] bg-[#F6F8FB] text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {doc.isUploaded ? (
                      <CheckCircle2 className="w-4 h-4 text-[#24856A] flex-shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-[#B7791F] flex-shrink-0" />
                    )}
                    <span className="truncate text-[#172B45] font-medium">{doc.title}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      doc.isUploaded
                        ? 'bg-[#24856A]/10 text-[#24856A]'
                        : 'bg-[#B7791F]/10 text-[#B7791F]'
                    }`}
                  >
                    {doc.isUploaded ? 'আপলোডকৃত' : 'বাকি আছে'}
                  </span>
                </div>
              ))}
            </div>

            <Link href="/portal/documents" className="block pt-1">
              <button className="w-full py-2 bg-[#102B50] hover:bg-[#0B1D35] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors">
                <Upload className="w-3.5 h-3.5 text-[#E8A2C1]" />
                {t('নতুন ডকুমেন্ট আপলোড করুন', 'Upload New Document')}
              </button>
            </Link>
          </div>

          {/* Next Actions & Notifications */}
          <div className="bg-white border border-[#E4EAF1] rounded-xl p-5 shadow-2xs space-y-3">
            <h3 className="font-bold text-sm text-[#172B45] flex items-center gap-2 pb-2 border-b border-[#E4EAF1]">
              <ShieldCheck className="w-4 h-4 text-[#24856A]" />
              {t('পরবর্তী করণীয় (Next Actions)', 'Next Actions')}
            </h3>

            <div className="space-y-2 text-xs">
              {!profile?.profilePhoto && (
                <div className="p-3 bg-[#E8A2C1]/15 border border-[#E8A2C1]/40 rounded-lg flex items-start gap-2">
                  <Camera className="w-4 h-4 text-[#102B50] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-[#102B50]">পাসপোর্ট সাইজ ছবি আপলোড করুন</div>
                    <div className="text-[11px] text-[#66758A]">আবেদন কার্যকর করতে সাম্প্রতিক রঙিন ছবি প্রয়োজন।</div>
                    <Link href="/portal/profile" className="text-[11px] font-bold text-[#102B50] underline block mt-1">
                      ছবি যুক্ত করুন →
                    </Link>
                  </div>
                </div>
              )}

              {applications.length === 0 && (
                <div className="p-3 bg-[#F6F8FB] border border-[#E4EAF1] rounded-lg flex items-start gap-2">
                  <Briefcase className="w-4 h-4 text-[#102B50] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-[#172B45]">পছন্দের চাকরিতে আবেদন করুন</div>
                    <div className="text-[11px] text-[#66758A]">আপনার স্কিল অনুযায়ী নতুন সার্কুলার প্রকাশিত হয়েছে।</div>
                    <Link href="/portal/jobs" className="text-[11px] font-bold text-[#102B50] underline block mt-1">
                      চাকরির বিজ্ঞপ্তি দেখুন →
                    </Link>
                  </div>
                </div>
              )}

              <div className="p-3 bg-[#F6F8FB] border border-[#E4EAF1] rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#102B50] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#172B45]">সরকারি রিক্রুটমেন্ট নির্দেশিকা</div>
                  <div className="text-[11px] text-[#66758A] leading-relaxed">
                    অফিসিয়াল সিস্টেম রসিদ ছাড়া কোনো লেনদেন করবেন না। যেকোনো সমস্যায় হেল্পডেস্কে যোগাযোগ করুন।
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
