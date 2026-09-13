'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  CheckCircle2,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { BRAND } from '@/config/brand';

interface TrainingCenterItem {
  id: string;
  name: string;
  banglaName: string;
  code: string;
  district: string;
  division: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  email: string;
  capacity: number;
  facilities: string;
  operatingStatus: string;
  batches: Array<{
    id: string;
    course: {
      title: string;
      banglaTitle: string;
    };
  }>;
}

export default function TrainingCentersPage() {
  const [centers, setCenters] = useState<TrainingCenterItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCenters() {
      try {
        setLoading(true);
        const res = await fetch('/api/training/centers');
        const json = await res.json();
        if (json.success) {
          setCenters(json.data || []);
        }
      } catch (err) {
        console.error('Failed to load centers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCenters();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            Accredited Vocational Centers • সরকারি অনুমোদনপ্রাপ্ত
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            আমাদের কারিগরি প্রশিক্ষণ কেন্দ্রসমূহ
          </h1>
          <p className="text-base text-slate-600 leading-relaxed font-bengali">
            আধুনিক ওয়ার্কশপ, অভিজ্ঞ ট্রেইনার এবং হাতে-কলমে প্র্যাকটিক্যাল ল্যাব সমৃদ্ধ আমাদের বিভিন্ন জেলাভিত্তিক প্রশিক্ষণ কেন্দ্র।
          </p>
        </div>

        {/* Centers Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">সেন্টার লোড হচ্ছে...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {centers.map((center) => (
              <div
                key={center.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                      {center.code}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      অনুমোদিত
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {center.banglaName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{center.name}</p>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{center.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <a href={`tel:${center.contactPhone}`} className="hover:text-indigo-600 font-mono">
                        {center.contactPhone}
                      </a>
                    </div>
                    {center.contactPerson && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>ইনচার্জ: {center.contactPerson}</span>
                      </div>
                    )}
                  </div>

                  {center.facilities && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <div className="text-[11px] font-bold text-slate-700">ল্যাব ও সুবিধাসমূহ:</div>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        {center.facilities}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    ধারণক্ষমতা: <strong>{center.capacity} জন</strong>
                  </span>
                  <Link
                    href={`/skill-training?district=${encodeURIComponent(center.district)}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    কোর্স দেখুন <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
