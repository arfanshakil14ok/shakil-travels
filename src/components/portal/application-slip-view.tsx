'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Printer,
  CheckCircle2,
  ShieldCheck,
  FileSearch,
  X,
  Phone,
  Briefcase,
  User,
  Copy,
  Check,
  Globe2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandMark } from '@/components/brand/brand-logo';
import { BRAND } from '@/config/brand';
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

  const verificationUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/track?q=${encodeURIComponent(data.applicationCode)}`
      : `https://shakiltravels.com/track?q=${encodeURIComponent(data.applicationCode)}`;

  useEffect(() => {
    generateQrDataUrl(verificationUrl, { width: 140, margin: 1 })
      .then((url) => setQrCodeUrl(url))
      .catch(() => {});
  }, [verificationUrl]);

  const handlePrint = () => {
    const container = printRef.current;
    if (!container) {
      window.print();
      return;
    }

    // Create a hidden isolated iframe to guarantee strictly 1 single page without DOM bleed
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      window.print();
      return;
    }

    // Collect all active style and link tags from current document
    const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    // Clone the slip element and remove no-print toolbars
    const slipClone = container.cloneNode(true) as HTMLElement;
    slipClone.querySelectorAll('.no-print').forEach((el) => el.remove());

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html lang="bn">
      <head>
        <meta charset="utf-8" />
        <title>Application-Slip-${data.applicationCode}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        ${styleTags}
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          @page :first {
            margin: 8mm 10mm;
          }
          * {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #172B45 !important;
            font-family: 'Hind Siliguri', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          .isolated-print-wrapper {
            width: 100% !important;
            max-width: 185mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            break-inside: avoid !important;
            break-after: avoid !important;
          }
          .application-slip-card {
            position: relative !important;
            left: auto !important;
            top: auto !important;
            width: 100% !important;
            max-width: 185mm !important;
            min-height: auto !important;
            max-height: 275mm !important;
            margin: 0 auto !important;
            padding: 14px 18px !important;
            border: 2px solid #102B50 !important;
            border-radius: 12px !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            break-inside: avoid !important;
            break-after: avoid !important;
            overflow: hidden !important;
          }
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div class="isolated-print-wrapper">
          ${slipClone.outerHTML}
        </div>
      </body>
      </html>
    `);
    iframeDoc.close();

    // Ensure all images are fully loaded before triggering print
    const images = Array.from(iframeDoc.images);
    const imagePromises = images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });

    Promise.all(imagePromises).then(() => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Print iframe error:', e);
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 3000);
        }
      }, 250);
    });
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
      className="bg-white text-[#172B45] p-4 sm:p-5 rounded-2xl border-2 border-[#CBDDF0] shadow-xl max-w-xl w-full mx-auto relative overflow-hidden font-bengali application-slip-card print-a5-slip"
    >
      {/* Background Watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none -rotate-12"
        aria-hidden="true"
      >
        <span className="text-6xl font-black font-sans uppercase tracking-widest text-[#102B50]">
          SHAKIL TRAVELS
        </span>
      </div>

      {/* Action Toolbar (Hidden during print) */}
      <div className="no-print flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-[#E4EAF1] gap-2.5">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#24856A] text-[11px] font-bold border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            আবেদন স্লিপ (Single Page Slip)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyCode}
            leftIcon={copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            className="text-[11px] font-semibold h-8 px-2.5"
          >
            {copied ? 'কপি হয়েছে' : 'কোড কপি'}
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-3 h-3" />}
            className="text-[11px] font-bold bg-[#102B50] hover:bg-[#0B1D35] text-white shadow-xs h-8 px-3"
          >
            প্রিন্ট স্লিপ (১ পাতা)
          </Button>

          <Link href={`/track?q=${encodeURIComponent(data.applicationCode)}`} target="_blank">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<FileSearch className="w-3 h-3 text-[#24856A]" />}
              className="text-[11px] font-semibold border-[#CBDDF0] h-8 px-2.5"
            >
              লাইভ ট্র্যাক
            </Button>
          </Link>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors ml-0.5"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Slip Header: Agency Branding & Contact Info (A5 Compact) */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#102B50] gap-2">
        <div className="flex items-center gap-2.5 text-left">
          <BrandMark size="md" className="rounded-xl border border-slate-300 shadow-2xs shrink-0" />
          <div>
            <h1 className="text-base sm:text-lg font-black text-[#102B50] tracking-tight uppercase font-sans leading-tight">
              {BRAND.name}
            </h1>
            <p className="text-[10px] font-bold text-[#24856A] leading-tight">
              আন্তর্জাতিক জনশক্তি নিয়োগ ও বৈদেশিক কর্মসংস্থান কনসালটেন্সি
            </p>
            <p className="text-[9px] text-[#66758A] leading-tight">
              বৈধ ও নিরাপদ অভিবাসন সহায়তায় আপনার বিশ্বস্ত প্রতিষ্ঠান
            </p>
          </div>
        </div>

        <div className="text-right text-[10px] text-[#66758A] space-y-0.5 font-sans shrink-0">
          <div className="font-bold text-[#102B50] flex items-center justify-end gap-1">
            <Phone className="w-3 h-3 text-[#24856A]" />
            <span>01913-681771</span>
          </div>
          <div className="text-[9px] text-[#24856A] font-semibold">shakiltravels.com/track</div>
        </div>
      </div>

      {/* Slip Title Banner (A5 Compact) */}
      <div className="my-2 py-1.5 px-3 rounded-lg bg-gradient-to-r from-[#102B50] via-[#1E3A8A] to-[#102B50] text-white flex items-center justify-between gap-2 print:bg-[#102B50] print:text-white">
        <div>
          <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-300 block leading-tight">
            OFFICIAL APPLICATION & TRACKING SLIP
          </span>
          <h2 className="text-xs sm:text-sm font-black tracking-tight leading-tight">
            নিয়োগ আবেদন স্বীকৃতি ও অফিসিয়াল ট্র্যাকিং স্লিপ
          </h2>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[9px] uppercase text-slate-300 leading-tight">স্লিপ নম্বর (Slip No)</div>
          <div className="text-xs sm:text-sm font-mono font-black tracking-wider text-emerald-300 leading-tight">
            {data.applicationCode}
          </div>
        </div>
      </div>

      {/* Main Grid: Left (Candidate Photo + QR Code) & Right (Candidate Particulars) */}
      <div className="grid grid-cols-12 gap-3 my-2.5">
        {/* Left Column: Photo & QR Seal (A5 Compact) */}
        <div className="col-span-4 flex flex-col items-center justify-start space-y-2 p-2 rounded-xl bg-[#F6F8FB] border border-[#CBDDF0]">
          {/* Candidate Profile Photo with Verified Frame */}
          <div className="relative w-20 h-24 rounded-lg overflow-hidden border-2 border-[#102B50] bg-white shadow-2xs flex items-center justify-center shrink-0">
            {data.applicant.profilePhoto ? (
              <Image
                src={data.applicant.profilePhoto}
                alt={data.applicant.fullName}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-1 text-center text-slate-400">
                <User className="w-8 h-8 text-slate-300" />
                <span className="text-[8px] font-bold text-slate-500">প্রার্থীর ছবি</span>
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 bg-[#24856A] text-white text-[8px] font-bold text-center py-0.5 uppercase tracking-wider">
              VERIFIED
            </div>
          </div>

          {/* QR Code for Instant Verification */}
          {qrCodeUrl && (
            <div className="flex flex-col items-center text-center space-y-0.5">
              <div className="w-16 h-16 relative p-1 bg-white border border-[#CBDDF0] rounded-lg shadow-2xs">
                <Image src={qrCodeUrl} alt="Verification QR" fill className="object-contain p-0.5" />
              </div>
              <span className="text-[8px] text-[#66758A] font-sans">স্ক্যান করে ট্র্যাক করুন</span>
            </div>
          )}
        </div>

        {/* Right Column: Candidate Personal & Contact Data Table (A5 Compact) */}
        <div className="col-span-8 space-y-2">
          <div className="text-[11px] font-bold text-[#102B50] uppercase tracking-wider pb-0.5 border-b border-[#CBDDF0] flex items-center justify-between">
            <span>প্রার্থীর বিবরণ (Candidate Particulars)</span>
            <span className="text-[10px] font-mono text-[#24856A]">
              আইডি: {data.applicant.applicantNumber || data.applicantNumber || 'N/A'}
            </span>
          </div>

          <table className="w-full text-[11px] text-[#172B45] border-collapse leading-tight">
            <tbody>
              <tr className="border-b border-[#E4EAF1]">
                <td className="py-1 pr-1.5 font-semibold text-[#66758A] w-24">প্রার্থীর নাম:</td>
                <td className="py-1 font-bold text-xs text-[#102B50]">{data.applicant.fullName}</td>
              </tr>
              {data.applicant.fatherName && (
                <tr className="border-b border-[#E4EAF1]">
                  <td className="py-1 pr-1.5 font-semibold text-[#66758A]">পিতার নাম:</td>
                  <td className="py-1 font-medium">{data.applicant.fatherName}</td>
                </tr>
              )}
              <tr className="border-b border-[#E4EAF1]">
                <td className="py-1 pr-1.5 font-semibold text-[#66758A]">পাসপোর্ট নম্বর:</td>
                <td className="py-1 font-bold font-mono text-[#102B50]">
                  {data.applicant.passportNumber || 'অপেক্ষমাণ / নথিপত্র সংযুক্ত'}
                </td>
              </tr>
              <tr className="border-b border-[#E4EAF1]">
                <td className="py-1 pr-1.5 font-semibold text-[#66758A]">মোবাইল নম্বর:</td>
                <td className="py-1 font-mono font-semibold">{data.applicant.phone}</td>
              </tr>
              <tr className="border-b border-[#E4EAF1]">
                <td className="py-1 pr-1.5 font-semibold text-[#66758A]">জেলা / ঠিকানা:</td>
                <td className="py-1 font-medium">{data.applicant.district || data.applicant.address || 'বাংলাদেশ'}</td>
              </tr>
              <tr className="border-b border-[#E4EAF1]">
                <td className="py-1 pr-1.5 font-semibold text-[#66758A]">আবেদনের তারিখ:</td>
                <td className="py-1 font-medium">{formattedDate}</td>
              </tr>
            </tbody>
          </table>

          {/* Job & Employment Section (A5 Compact) */}
          <div className="pt-1">
            <div className="text-[10px] font-bold text-[#102B50] uppercase tracking-wider pb-0.5 border-b border-[#CBDDF0] flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-[#102B50]" />
              <span>নিয়োগ ও কর্মসংস্থানের তথ্য</span>
            </div>

            <div className="mt-1 p-2 rounded-lg bg-[#F6F8FB] border border-[#CBDDF0] grid grid-cols-2 gap-1.5 text-[10px] leading-tight">
              <div>
                <span className="text-[#66758A] block text-[9px]">আবেদনকৃত পদবী:</span>
                <span className="font-bold text-[#102B50] text-[11px]">{data.job.title}</span>
              </div>
              <div>
                <span className="text-[#66758A] block text-[9px]">গন্তব্য দেশ:</span>
                <span className="font-bold text-[#102B50] flex items-center gap-1">
                  <span>{data.job.countryFlag || '🌐'}</span>
                  <span>{data.job.countryName || 'অনুমোদিত দেশ'}</span>
                </span>
              </div>
              {data.job.employerName && (
                <div className="col-span-2">
                  <span className="text-[#66758A] block text-[9px]">নিয়োগকর্তা প্রতিষ্ঠান:</span>
                  <span className="font-medium text-[#172B45]">{data.job.employerName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Linear Roadmap Stage Pills (A5 Compact 7 Stages) */}
      <div className="my-2 p-2 rounded-lg bg-white border border-[#CBDDF0]">
        <div className="text-[9px] font-bold text-[#66758A] uppercase tracking-wider mb-1">
          রিক্রুটমেন্ট ও ভিসা প্রসেসিং ধাপসমূহ:
        </div>
        <div className="grid grid-cols-7 gap-1 text-[8px] text-center leading-tight">
          <div className="p-1 rounded bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
            ১. আবেদন ✓
          </div>
          <div className="p-1 rounded bg-blue-50 text-blue-900 font-semibold border border-blue-200">
            ২. শর্টলিস্ট
          </div>
          <div className="p-1 rounded bg-slate-50 text-slate-700 font-semibold border border-slate-200">
            ৩. ইন্টারভিউ
          </div>
          <div className="p-1 rounded bg-slate-50 text-slate-700 font-semibold border border-slate-200">
            ৪. মেডিকেল
          </div>
          <div className="p-1 rounded bg-slate-50 text-slate-700 font-semibold border border-slate-200">
            ৫. ভিসা
          </div>
          <div className="p-1 rounded bg-slate-50 text-slate-700 font-semibold border border-slate-200">
            ৬. BMET
          </div>
          <div className="p-1 rounded bg-slate-50 text-slate-700 font-semibold border border-slate-200">
            ৭. ফ্লাইট
          </div>
        </div>
      </div>

      {/* Rules & General Notes (A5 Compact) */}
      <div className="p-2 bg-amber-50/60 rounded-lg border border-amber-200 text-[9.5px] text-amber-950 space-y-0.5 leading-tight">
        <div className="font-bold flex items-center gap-1 text-amber-900">
          <ShieldCheck className="w-3 h-3 text-amber-700" />
          <span>প্রার্থীর জন্য বিশেষ নির্দেশাবলী ও যাচাইকরণ নিয়মাবলী:</span>
        </div>
        <ul className="list-disc list-inside space-y-0.5 text-[8.5px] text-slate-700 leading-tight">
          <li>এই আবেদন স্লিপটি আপনার নিয়োগ আবেদনের অফিসিয়াল স্বীকৃতি। এটি যত্নসহকারে সংরক্ষণ করুন।</li>
          <li>স্লিপ নম্বর দিয়ে সরাসরি <span className="font-mono font-bold text-[#102B50]">www.shakiltravels.com/track</span> লিংকে অগ্রগতি ট্র্যাক করুন।</li>
          <li>দালাল বা মধ্যস্বত্বভোগীর সাথে আর্থিক লেনদেন করবেন না। সমস্ত ফি কেবল অফিসের মূল রসিদের মাধ্যমে প্রদেয়।</li>
        </ul>
      </div>

      {/* Verification Signatures & Stamp (A5 Compact) */}
      <div className="mt-4 pt-3 border-t border-[#CBDDF0] grid grid-cols-3 gap-2 items-end text-center text-[10px]">
        <div>
          <div className="h-6 border-b border-dashed border-slate-400 mx-auto w-24 mb-1" />
          <div className="font-semibold text-[#66758A]">প্রার্থীর স্বাক্ষর</div>
          <div className="text-[8px] text-slate-400">(Candidate Signature)</div>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-600/40 bg-emerald-50/60 flex flex-col items-center justify-center text-[7px] font-bold text-emerald-800 leading-tight select-none mb-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>CENTRAL</span>
            <span>VERIFIED</span>
          </div>
          <div className="text-[8px] font-bold text-emerald-700">সেন্ট্রাল রেজিস্ট্রি ভেরিফাইড</div>
        </div>

        <div>
          <div className="h-6 border-b border-dashed border-slate-400 mx-auto w-24 mb-1" />
          <div className="font-bold text-[#102B50]">অনুমোদিত কর্মকর্তা স্বাক্ষর</div>
          <div className="text-[8px] text-slate-400">SHAKIL TRAVELS</div>
        </div>
      </div>

      {/* Global Embedded Styles for Single Page Print */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 8mm 10mm;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden;
          }
          .application-slip-card,
          .application-slip-card * {
            visibility: visible;
          }
          .application-slip-card {
            position: fixed !important;
            left: 0 !important;
            right: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 185mm !important;
            min-height: auto !important;
            max-height: 275mm !important;
            margin: 0 auto !important;
            padding: 14px 18px !important;
            border: 2px solid #102B50 !important;
            border-radius: 12px !important;
            background: #ffffff !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-after: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
        <div className="my-8 max-w-xl w-full">
          {slipContent}
        </div>
      </div>
    );
  }

  return slipContent;
};
