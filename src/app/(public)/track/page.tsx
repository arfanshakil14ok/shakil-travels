import React from 'react';
import { Metadata } from 'next';
import { FileSearch, ShieldCheck, Headphones, CheckCircle2 } from 'lucide-react';
import { FileTrackingWidget } from '@/components/public/file-tracking-widget';
import { BRAND } from '@/config/brand';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'অনলাইন ফাইল ও ভিসা ট্র্যাকিং | SHAKIL TRAVELS',
  description: 'আপনার বৈদেশিক চাকরির ফাইল, ভিসা স্ট্যাম্পিং, সাক্ষাৎকার ও BMET ছাড়পত্রের রিয়েল-টাইম প্রগ্রেস অনলাইনে ট্র্যাক করুন।',
};

interface TrackPageProps {
  searchParams?: Promise<{
    q?: string;
  }>;
}

export default async function TrackPublicPage({ searchParams }: TrackPageProps) {
  const resolved = searchParams ? await searchParams : {};
  const query = resolved.q || '';

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-[#F6F8FB] via-white to-[#EEF4FB] py-12 sm:py-16 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 font-bengali">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#24856A]">
            <FileSearch className="w-4 h-4 text-[#24856A]" />
            <span>সেন্ট্রাল ফাইল ট্র্যাকিং সিস্টেম</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#102B50] tracking-tight">
            আপনার ফাইল ও ভিসা ট্র্যাকিং
          </h1>

          <p className="text-xs sm:text-sm text-[#66758A] leading-relaxed">
            আপনার আবেদন নম্বর, পাসপোর্ট নম্বর অথবা ফাইল কোড দিয়ে আবেদনের বর্তমান অগ্রগতি ও পরবর্তী পদক্ষেপের তথ্য জানুন।
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-2xl border border-[#CBDDF0] p-6 sm:p-8 shadow-xl shadow-[#102B50]/[0.05]">
          <FileTrackingWidget initialQuery={query} variant="card" />
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#172B45]">
          <div className="p-4 rounded-xl bg-white border border-[#CBDDF0] shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-[#102B50]">
              <ShieldCheck className="w-4 h-4 text-[#24856A]" />
              <span>নিরাপদ ও নির্ভরযোগ্য</span>
            </div>
            <p className="text-[11px] text-[#66758A] leading-relaxed">
              সেন্ট্রাল ডাটাবেসের সাথে সংযুক্ত রিয়েল-টাইম ভেরিফাইড তথ্য।
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#CBDDF0] shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-[#102B50]">
              <CheckCircle2 className="w-4 h-4 text-[#102B50]" />
              <span>৭টি ধাপে সম্পূর্ণ অগ্রগতি</span>
            </div>
            <p className="text-[11px] text-[#66758A] leading-relaxed">
              আবেদন থেকে ফ্লাইট পর্যন্ত প্রতিটি ধাপ স্বচ্ছভাবে দৃশ্যমান।
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#CBDDF0] shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-[#102B50]">
              <Headphones className="w-4 h-4 text-[#24856A]" />
              <span>জরুরি সহায়তা</span>
            </div>
            <p className="text-[11px] text-[#66758A] leading-relaxed">
              কোনো তথ্যের অমিল বা অনুসন্ধানে আমাদের হটলাইনে যোগাযোগ করুন।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
