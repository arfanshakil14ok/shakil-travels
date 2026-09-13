'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Clock,
  Building2,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Award,
} from 'lucide-react';
import { BRAND } from '@/config/brand';

interface CourseItem {
  id: string;
  courseCode: string;
  title: string;
  banglaTitle: string;
  slug: string;
  description: string;
  durationWeeks: number;
  hoursTotal: number;
  fee: string | number;
  certificationType: string;
  featured: boolean;
  category: {
    id: string;
    name: string;
    banglaName: string;
    slug: string;
  };
  batches: Array<{
    id: string;
    batchCode: string;
    startDate: string;
    endDate: string;
    capacity: number;
    classSchedule: string;
    status: string;
    center: {
      name: string;
      district: string;
    };
  }>;
}

interface CategoryItem {
  id: string;
  name: string;
  banglaName: string;
  slug: string;
  icon?: string;
}

function SkillTrainingCatalog() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/api/training/courses');
        const json = await res.json();
        if (json.success) {
          setCourses(json.data.courses || []);
          setCategories(json.data.categories || []);
        }
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredCourses = courses.filter((c) => {
    const matchesCategory = selectedCategory === 'all' || c.category.slug === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.banglaTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.courseCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            BMET Affiliated Vocational Training • RL-1892
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            স্কিল ট্রেনিং ও কারিগরি প্রশিক্ষণ একাডেমি
          </h1>
          <p className="text-base text-slate-600 leading-relaxed font-bengali">
            বিদেশে ভালো বেতনের বৈধ কর্মসংস্থানের জন্য সরকারি কারিগরি মানসম্পন্ন আধুনিক প্রশিক্ষণ। ট্রেনিং সম্পন্ন করে সার্টিফিকেট অর্জন করুন এবং সরাসরি চাকরির সুযোগ নিন।
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-xs"
            >
              ট্রেনিংয়ের জন্য নিবন্ধন করুন
            </Link>
            <Link
              href="/training-centers"
              className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl border border-slate-200 transition-colors shadow-xs"
            >
              ট্রেনিং সেন্টারসমূহ দেখুন
            </Link>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="কোর্স বা স্কিল খুঁজুন..."
                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                সকল ক্যাটাগরি ({courses.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                    selectedCategory === cat.slug
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.banglaName}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Course Cards Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">কোর্স লোড হচ্ছে...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">কোনো কোর্স পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500">
              আপনার ফিল্টারের সাথে মিলে এমন কোনো কোর্স পাওয়া যায়নি। অন্য ক্যাটাগরি নির্বাচন করুন।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const activeBatch = course.batches[0];

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                >
                  <div className="p-6 flex-1 space-y-4">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-md">
                        {course.category.banglaName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {course.courseCode}
                      </span>
                    </div>

                    {/* Course Title */}
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {course.banglaTitle}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{course.title}</p>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {course.description}
                    </p>

                    {/* Duration & Fee Meta */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{course.durationWeeks} সপ্তাহ ({course.hoursTotal} ঘণ্টা)</span>
                      </div>
                      <div className="text-right font-bold text-slate-900">
                        {Number(course.fee) === 0 ? 'বিনামূল্যে' : `৳${Number(course.fee).toLocaleString()}`}
                      </div>
                    </div>

                    {/* Upcoming Batch Info */}
                    {activeBatch && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-700 font-medium">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {activeBatch.center.name}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            ভর্তি চলছে
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          ক্লাস: {activeBatch.classSchedule}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Action */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      BMET অ্যাফিলিয়েটেড
                    </span>
                    <Link
                      href={`/register?course=${course.courseCode}&type=unskilled`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      আবেদন করুন <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Training to Recruitment Guarantee Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-10 shadow-md">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              ট্রেনিং টু রিক্রুটমেন্ট ব্রিজ গ্যারান্টি
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              অদক্ষ থেকে দক্ষ হয়ে সরাসরি বিদেশে কর্মসংস্থান
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-bengali">
              শাকিল গ্লোবাল ট্রেনিং একাডেমি থেকে সফলভাবে প্রশিক্ষণ ও সার্টিফিকেট অর্জনের সাথে সাথে আপনার প্রোফাইল সরাসরি দক্ষ ক্যান্ডিডেট হিসেবে অনুমোদিত হবে এবং সৌদি আরব, দুবাই, কাতার, মালয়েশিয়া ও ইউরোপের বাছাইকৃত কোম্পানিতে চাকরির জন্য সুপারিশ করা হবে।
            </p>
            <div className="pt-2">
              <Link
                href="/register?type=unskilled"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm transition-all"
              >
                এখনই কোর্সে যুক্ত হন <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SkillTrainingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <SkillTrainingCatalog />
    </Suspense>
  );
}
