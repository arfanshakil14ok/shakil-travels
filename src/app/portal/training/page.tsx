'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Award,
  Calendar,
  Clock,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Building2,
  ExternalLink,
  BookOpen,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

export default function PortalTrainingPage() {
  const [data, setData] = useState<{
    applications: any[];
    enrollments: any[];
    certificates: any[];
    candidateType: string;
  } | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'courses'>('my');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [trainingsRes, coursesRes] = await Promise.all([
        fetch('/api/portal/training/my-trainings'),
        fetch('/api/training/courses'),
      ]);

      const trainingsJson = await trainingsRes.json();
      const coursesJson = await coursesRes.json();

      if (trainingsJson.success) {
        setData(trainingsJson.data);
      }
      if (coursesJson.success) {
        setCourses(coursesJson.data.courses || []);
      }
    } catch (err) {
      console.error('Error loading portal training data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (courseId: string, batchId?: string) => {
    setApplying(courseId);
    setFeedback(null);

    try {
      const res = await fetch('/api/portal/training/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, batchId }),
      });

      const json = await res.json();

      if (json.success) {
        setFeedback({
          type: 'success',
          message: 'আপনার কোর্সের আবেদন সফলভাবে গৃহীত হয়েছে! শীঘ্রই ব্যাচ কনফার্মেশন জানানো হবে।',
        });
        loadAll();
      } else {
        setFeedback({
          type: 'error',
          message: json.errorBn || json.error || 'আবেদন সম্পন্ন করা সম্ভব হয়নি।',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'নেটওয়ার্ক সংযোগ ত্রুটি। পুনরায় চেষ্টা করুন।',
      });
    } finally {
      setApplying(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">ট্রেনিং ডেটা লোড হচ্ছে...</p>
      </div>
    );
  }

  const isUnskilled = data?.candidateType === 'UNSKILLED';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-900/60 px-2.5 py-0.5 rounded-md border border-indigo-700/50">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
              কারিগরি প্রশিক্ষণ ও স্কিল ভল্ট
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {isUnskilled ? 'দক্ষতা উন্নয়ন একাডেমি ও প্রশিক্ষণ পোর্টাল' : 'আপনার অর্জিত দক্ষতা ও কারিগরি সার্টিফিকেট'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-bengali">
              {isUnskilled
                ? 'আপনি বর্তমানে "অদক্ষ (UNSKILLED)" হিসেবে নিবন্ধিত। সরকারি বিএমইটি অনুমোদিত আধুনিক কোর্সে ভর্তি হয়ে প্রশিক্ষণ সম্পন্ন করুন। কোর্স শেষে সার্টিফিকেট প্রাপ্তির পর আপনার প্রোফাইল স্বয়ংক্রিয়ভাবে দক্ষ (SKILLED) হিসেবে আপগ্রেড হবে এবং সরাসরি বৈদেশিক চাকরির সুযোগ উন্মুক্ত হবে।'
                : 'আপনার প্রোফাইল বর্তমানে "দক্ষ (SKILLED)" হিসেবে অনুমোদিত। এখানে আপনার পূর্ববর্তী ট্রেনিং, অর্জিত সার্টিফিকেট এবং অতিরিক্ত বিশেষায়িত কোর্সের অগ্রগতি দেখতে পারেন।'}
            </p>
          </div>

          <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6 shrink-0">
            <div className="text-xs text-slate-400">বর্তমান স্ট্যাটাস</div>
            <div className="text-base font-bold text-white mt-0.5">
              {isUnskilled ? (
                <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800">
                  <Clock3 className="w-3.5 h-3.5" /> অদক্ষ (প্রশিক্ষণাধীন)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> দক্ষ (সার্টিফাইড)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          role="alert"
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          )}
          <p className="font-medium">{feedback.message}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('my')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'my'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          আমার ট্রেনিং ও সার্টিফিকেটসমূহ ({data?.applications?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'courses'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          উপলব্ধ কোর্স ও নতুন ভর্তি ({courses.length})
        </button>
      </div>

      {/* TAB 1: My Trainings & Certificates */}
      {activeTab === 'my' && (
        <div className="space-y-6">
          {/* Certificates Section */}
          {data?.certificates && data.certificates.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                আপনার অর্জিত অফিসিয়াল সার্টিফিকেটসমূহ
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="bg-white rounded-2xl border-2 border-emerald-500/80 p-5 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {cert.certificateNumber}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ভেরিফাইড
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{cert.skillAcquired}</h3>
                      <p className="text-xs text-slate-500">{cert.course?.title} • {cert.center?.name}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">ইস্যু তারিখ: {new Date(cert.issueDate).toLocaleDateString('en-GB')}</span>
                      <Link
                        href={`/verify-certificate/${cert.certificateNumber}`}
                        target="_blank"
                        className="font-bold text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        অনলাইন ভেরিফিকেশন <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Enrollments Section */}
          {data?.enrollments && data.enrollments.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                চলমান ব্যাচ ও ক্লাসের অগ্রগতি
              </h2>
              <div className="space-y-4">
                {data.enrollments.map((enr) => (
                  <div
                    key={enr.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {enr.enrollmentNumber}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-1">
                          {enr.batch?.course?.banglaTitle}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {enr.batch?.center?.name} • ব্যাচ: {enr.batch?.batchCode}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                          স্ট্যাটাস: {enr.status}
                        </span>
                      </div>
                    </div>

                    {/* Progress details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">ক্লাস শিডিউল</span>
                        <span className="font-semibold text-slate-800">{enr.batch?.classSchedule || 'নির্ধারিত'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">শুরুর তারিখ</span>
                        <span className="font-semibold text-slate-800">
                          {new Date(enr.batch?.startDate).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">উপস্থিতি রেকর্ড</span>
                        <span className="font-semibold text-slate-800">{enr.attendance?.length || 0} দিন</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">ফাইনাল গ্রেড</span>
                        <span className="font-semibold text-emerald-700">{enr.finalGrade || 'মূল্যায়ন প্রক্রিয়াধীন'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Applications Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-slate-600" />
              কোর্স আবেদনের তালিকা ({data?.applications?.length || 0})
            </h2>

            {data?.applications && data.applications.length > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="divide-y divide-slate-100">
                  {data.applications.map((app) => (
                    <div key={app.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400">{app.applicationCode}</span>
                        <h4 className="text-sm font-bold text-slate-900">{app.course?.banglaTitle}</h4>
                        <p className="text-xs text-slate-500">
                          ক্যাটাগরি: {app.course?.category?.banglaName} • আবেদন তারিখ: {new Date(app.appliedAt).toLocaleDateString('en-GB')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                            app.status === 'APPROVED' || app.status === 'ENROLLED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : app.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                <GraduationCap className="w-8 h-8 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">কোনো আবেদন নেই</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  আপনি এখনো কোনো স্কিল ট্রেনিং কোর্সের জন্য আবেদন করেননি। নিচে কোর্সসমূহ দেখে এখনই আবেদন করুন।
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('courses')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  কোর্স ব্রাউজ করুন
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Available Courses */}
      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const hasApplied = data?.applications?.some((a) => a.courseId === course.id);
            const activeBatch = course.batches?.[0];

            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {course.category?.banglaName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{course.courseCode}</span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{course.banglaTitle}</h3>
                    <p className="text-xs text-slate-500">{course.title}</p>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {course.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="text-slate-500">
                      মেয়াদ: <strong>{course.durationWeeks} সপ্তাহ</strong>
                    </div>
                    <div className="text-right font-bold text-slate-900">
                      {Number(course.fee) === 0 ? 'বিনামূল্যে' : `৳${Number(course.fee).toLocaleString()}`}
                    </div>
                  </div>

                  {activeBatch && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600">
                      <div className="font-semibold text-slate-800">{activeBatch.center?.name}</div>
                      <div>ক্লাস: {activeBatch.classSchedule}</div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  {hasApplied ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-4 h-4" /> আবেদন জমা আছে
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={applying === course.id}
                      onClick={() => handleApply(course.id, activeBatch?.id)}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
                    >
                      {applying === course.id ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>আবেদন হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <GraduationCap className="w-4 h-4" />
                          <span>কোর্সে আবেদন করুন</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
