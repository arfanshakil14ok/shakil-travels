'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Printer,
  Download,
  Share2,
  CheckCircle2,
  ShieldCheck,
  FileSearch,
  ExternalLink,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Globe2,
  Building2,
  Briefcase,
  User,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandMark } from '@/components/brand/brand-logo';
import { BRAND } from '@/config/brand';
import { cn } from '@/lib/utils';
import { generateQrDataUrl } from '@/lib/qrcode';

export interface ApplicationSlipData {
  id?: string;
  applicationCode: string;
  applicantNumber?: string;
  appliedAt?: string | Date;
  status?: string;
  applicant: {
    fullName: string;
    fatherName?: string | null;
    passportNumber?: string | null;
    phone: string;
    email?: string | null;
    district?: string | null;
    address?: string | null;
    profilePhoto?: string | null;
    applicantNumber?: string;
  };
  job: {
    title: string;
    jobCode?: string;
    countryName?: string;
    countryFlag?: string;
    employerName?: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
    currency?: string | null;
  };
}

interface ApplicationSlipViewProps {
  data: ApplicationSlipData;
  onClose?: () => void;
  isModal?: boolean;
}

export const ApplicationSlipView: React.FC<ApplicationSlipViewProps> = ({
  data,
  onClose,
  isModal = false,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/track?q=${encodeURIComponent(data.applicationCode)}`
    : `https://shakiltravels.com/track?q=${encodeURIComponent(data.applicationCode)}`;

  useEffect(() => {
    generateQrDataUrl(verificationUrl, { width: 180, margin: 1 })
      .then((url) => setQrCodeUrl(url))
      .catch(() => {});
  }, [verificationUrl]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(data.applicationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formattedDate = data.appliedAt
    ? new Date(data.appliedAt).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const slipContent = (
    <div
      ref={printRef}
      className="bg-white text-[#172B45] p-6 sm:p-8 rounded-2xl border border-[#CBDDF0] shadow-xl max-w-3xl w-full mx-auto relative overflow-hidden font-bengali print:p-0 print:border-none print:shadow-none print:max-w-none print:rounded-none"
    >
      {/* Background Watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none -rotate-12"
        aria-hidden="true"
      >
        <span className="text-7xl font-black font-sans uppercase tracking-widest text-[#102B50]">
          SHAKIL TRAVELS
        </span>
      </div>

      {/* Action Toolbar (Hidden during print) */}
      <div className="print:hidden flex flex-wrap items-center justify-between pb-4 mb-6 border-b border-[#E4EAF1] gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#24856A] text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            অফিসিয়াল আবেদন স্লিপ (Application Slip)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyCode}
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            className="text-xs font-semibold"
          >
            {copied ? 'স্লিপ কোড কপি হয়েছে' : 'স্লিপ নম্বর কপি'}
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
            className="text-xs font-bold bg-[#102B50] hover:bg-[#0B1D35] text-white shadow-xs"
          >
            প্রিন্ট / ডাউনলোড স্লিপ
          </Button>

          <Link href={`/track?q=${encodeURIComponent(data.applicationCode)}`} target="_blank">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<FileSearch className="w-3.5 h-3.5 text-[#24856A]" />}
              className="text-xs font-semibold border-[#CBDDF0]"
            >
              লাইভ ট্র্যাক
            </Button>
          </Link>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors ml-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Slip Header: Agency Branding & Contact Info */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between pb-5 border-b-2 border-[#102B50] gap-4">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <BrandMark size="lg" className="rounded-2xl border border-slate-300 shadow-sm" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#102B50] tracking-tight uppercase font-sans">
              {BRAND.name}
            </h1>
            <p className="text-xs font-bold text-[#24856A] mt-0.5">
              আন্তর্জাতিক জনশক্তি নিয়োগ ও বৈদেশিক কর্মসংস্থান কনসালটেন্সি
            </p>
            <p className="text-[11px] text-[#66758A]">
              গণপ্রজাতন্ত্রী বাংলাদেশ সরকার ও BMET অনুমোদিত রিক্রুটমেন্ট প্রতিষ্ঠান
            </p>
          </div>
        </div>

        <div className="text-right text-[11px] text-[#66758A] space-y-0.5 font-sans hidden sm:block">
          <div className="font-bold text-[#102B50] flex items-center justify-end gap-1">
            <Phone className="w-3 h-3 text-[#24856A]" />
            <span>হটলাইন: 01913-681771</span>
          </div>
          <div>ইমেইল: info@shakiltravels.com</div>
          <div>অনলাইন ট্র্যাকিং: www.shakiltravels.com/track</div>
        </div>
      </div>

      {/* Slip Title Banner */}
      <div className="my-5 p-3 rounded-xl bg-gradient-to-r from-[#102B50] via-[#1E3A8A] to-[#102B50] text-white flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-2 print:bg-[#102B50] print:text-white">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
            OFFICIAL APPLICATION & TRACKING SLIP
          </span>
          <h2 className="text-base sm:text-lg font-black tracking-tight">
            নিয়োগ আবেদন স্বীকৃতি ও অফিসিয়াল ট্র্যাকিং স্লিপ
          </h2>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase text-slate-300">আবেদন স্লিপ নম্বর (Slip No)</div>
          <div className="text-base sm:text-lg font-mono font-black tracking-wider text-emerald-300">
            {data.applicationCode}
          </div>
        </div>
      </div>

      {/* Main Grid: Left (Candidate Photo + QR Code) & Right (Candidate Particulars) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 my-4">
        {/* Left Column: Photo & QR Seal */}
        <div className="md:col-span-4 flex flex-col items-center justify-start space-y-3 p-3.5 rounded-xl bg-[#F6F8FB] border border-[#CBDDF0]">
          {/* Candidate Profile Photo with Verified Frame */}
          <div className="relative w-28 h-36 rounded-xl overflow-hidden border-2 border-[#102B50] bg-white shadow-xs flex items-center justify-center">
            {data.applicant.profilePhoto ? (
              <Image
                src={data.applicant.profilePhoto}
                alt={data.applicant.fullName}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-2 text-center text-slate-400">
                <User className="w-10 h-10 mb-1 text-slate-300" />
                <span className="text-[10px] font-bold text-slate-500">প্রার্থীর ছবি</span>
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 bg-[#24856A] text-white text-[9px] font-bold text-center py-0.5 uppercase tracking-wider">
              VERIFIED APPLICANT
            </div>
          </div>

          {/* QR Code for Instant Verification */}
          {qrCodeUrl && (
            <div className="flex flex-col items-center text-center space-y-1">
              <div className="w-24 h-24 relative p-1 bg-white border border-[#CBDDF0] rounded-lg shadow-2xs">
                <Image src={qrCodeUrl} alt="Verification QR" fill className="object-contain p-1" />
              </div>
              <span className="text-[9px] text-[#66758A] font-sans">স্ক্যান করে অনলাইনে ফাইল ট্র্যাক করুন</span>
            </div>
          )}
        </div>

        {/* Right Column: Candidate Personal & Contact Data Table */}
        <div className="md:col-span-8 space-y-3">
          <div className="text-xs font-bold text-[#102B50] uppercase tracking-wider pb-1 border-b border-[#CBDDF0] flex items-center justify-between">
            <span>প্রার্থীর ব্যক্তিগত বিবরণ (Candidate Details)</span>
            <span className="text-[11px] font-mono text-[#24856A]">
              আইডি: {data.applicant.applicantNumber || data.applicantNumber || 'N/A'}
            </span>
          </div>

          <table className="w-full text-xs text-[#172B45] border-collapse">
            <tbody>
              <tr className="border-b border-[#E4EAF1]">
                <td className="py-1.5 pr-2 font-semibold text-[#66758A] w-36">প্রার্থীর পূর্ণ নাম:</td>
                <td className="py-1.5 font-bold text-sm text-[#102B50]">{data.applicant.fullName}</td>
              </tr>
              {data.applicant.fatherName && (
                <tr className="border-b border-[#E4EAF1]">
                  <td className="py-1.5 pr-2 font-semibold text-[#66758A]">পিতার নাম:</td>
                  <td className="py-1.5 font-medium">{data.applicant.fatherName}</td>
                </tr>
              )}
              <tr className="border-b border-[#E4EAF1]">
                <td className="py-1.5 pr-2 font-semibold text-[#66758A]">পাসপোর্ট নম্বর:</td>
                <td className="py-1.5 font-bold font-mono text-[#102B50]">
                  {data.applicant.passportNumber || 'অপেক্ষমাণ / নথিপত্র সংযুক্ত'}
                </td>
              </tr>
              <tr className="border-b border-[#E4EAF1]">
                <td className="py-1.5 pr-2 font-semibold text-[#66758A]">মোবাইল নম্বর:</td>
                <td className="py-1.5 font-mono font-bold">{data.applicant.phone}</td>
              </tr>
              <tr className="border-b border-[#E4EAF1]">
                <td className="py-1.5 pr-2 font-semibold text-[#66758A]">জেলা / ঠিকানা:</td>
                <td className="py-1.5 font-medium">{data.applicant.district || data.applicant.address || 'বাংলাদেশ'}</td>
              </tr>
              <tr>
                <td className="py-1.5 pr-2 font-semibold text-[#66758A]">আবেদনের তারিখ:</td>
                <td className="py-1.5 font-medium">{formattedDate}</td>
              </tr>
            </tbody>
          </table>

          {/* Job & Employment Section */}
          <div className="pt-2">
            <div className="text-xs font-bold text-[#102B50] uppercase tracking-wider pb-1 border-b border-[#CBDDF0] flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#102B50]" />
              <span>নিয়োগ ও কর্মসংস্থানের তথ্য (Job & Placement)</span>
            </div>

            <div className="mt-2 p-3 rounded-xl bg-[#F6F8FB] border border-[#CBDDF0] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[11px] text-[#66758A] block">আবেদনকৃত পদবী:</span>
                <span className="font-bold text-[#102B50] text-sm">{data.job.title}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#66758A] block">গন্তব্য দেশ:</span>
                <span className="font-bold text-[#102B50] flex items-center gap-1">
                  <span>{data.job.countryFlag || '🌐'}</span>
                  <span>{data.job.countryName || 'অনুমোদিত দেশ'}</span>
                </span>
              </div>
              {data.job.employerName && (
                <div className="sm:col-span-2">
                  <span className="text-[11px] text-[#66758A] block">নিয়োগকর্তা প্রতিষ্ঠান:</span>
                  <span className="font-semibold text-[#172B45]">{data.job.employerName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Linear Roadmap Stage Pills */}
      <div className="my-5 p-3 rounded-xl bg-white border border-[#CBDDF0]">
        <div className="text-[11px] font-bold text-[#66758A] uppercase tracking-wider mb-2">
          নিয়োগ ও ভিসা প্রসেসিং ধাপসমূহ:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 text-[10px] text-center">
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
            ১. আবেদন জমা ✓
          </div>
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-900 font-semibold border border-blue-200">
            ২. শর্টলিস্ট
          </div>
          <div className="p-1.5 rounded-lg bg-slate-50 text-slate-700 font-semibold border border-slate-200">
            ৩. ইন্টারভিউ
          </div>
          <div className="p-1.5 rounded-lg bg-slate-50 text-slate-700 font-semibold border border-slate-200">
            ৪. মেডিকেল
          </div>
          <div className="p-1.5 rounded-lg bg-slate-50 text-slate-700 font-semibold border border-slate-200">
            ৫. ভিসা স্ট্যাম্পিং
          </div>
          <div className="p-1.5 rounded-lg bg-slate-50 text-slate-700 font-semibold border border-slate-200">
            ৬. BMET ছাড়পত্র
          </div>
          <div className="p-1.5 rounded-lg bg-slate-50 text-slate-700 font-semibold border border-slate-200">
            ৭. ফ্লাইট
          </div>
        </div>
      </div>

      {/* Rules & General Notes */}
      <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-[11px] text-amber-950 space-y-1">
        <div className="font-bold flex items-center gap-1.5 text-amber-900">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
          <span>প্রার্থীর জন্য বিশেষ নির্দেশাবলী ও যাচাইকরণ নিয়মাবলী:</span>
        </div>
        <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-700">
          <li>এই আবেদন স্লিপটি আপনার নিয়োগ আবেদনের অফিসিয়াল স্বীকৃতি। এটি যত্নসহকারে সংরক্ষণ করুন।</li>
          <li>স্লিপ নম্বর দিয়ে সরাসরি <span className="font-mono font-bold text-[#102B50]">www.shakiltravels.com/track</span> লিংকে যেকোনো সময় অগ্রগতি যাচাই করতে পারবেন।</li>
          <li>কোনো মধ্যস্বত্বভোগী বা দালালের সাথে আর্থিক লেনদেন করবেন না। সমস্ত ফি কেবল অফিসের মূল রসিদের মাধ্যমে প্রদেয়।</li>
        </ul>
      </div>

      {/* Verification Signatures & Stamp */}
      <div className="mt-8 pt-6 border-t border-[#CBDDF0] grid grid-cols-3 gap-4 items-end text-center text-xs">
        <div>
          <div className="h-10 border-b border-dashed border-slate-400 mx-auto w-36 mb-1" />
          <div className="font-semibold text-[#66758A]">প্রার্থীর স্বাক্ষর</div>
          <div className="text-[10px] text-slate-400">(Candidate Signature)</div>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full border-2 border-emerald-600/40 bg-emerald-50/50 flex flex-col items-center justify-center text-[9px] font-bold text-emerald-800 p-1 leading-tight select-none mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mb-0.5" />
            <span>CENTRAL</span>
            <span>VERIFIED</span>
          </div>
          <div className="text-[10px] font-bold text-emerald-700">সেন্ট্রাল রেজিস্ট্রি কর্তৃক যাচাইকৃত</div>
        </div>

        <div>
          <div className="h-10 border-b border-dashed border-slate-400 mx-auto w-36 mb-1" />
          <div className="font-bold text-[#102B50]">অনুমোদিত কর্মকর্তা স্বাক্ষর</div>
          <div className="text-[10px] text-slate-400">SHAKIL TRAVELS</div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
        <div className="my-8 max-w-3xl w-full">
          {slipContent}
        </div>
      </div>
    );
  }

  return slipContent;
};
