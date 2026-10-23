'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Printer,
  Copy,
  Check,
  FileSearch,
  X,
  Scissors,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/config/brand';

export interface ApplicationSlipData {
  id?: string;
  applicationCode: string;
  applicantNumber?: string;
  appliedAt?: string | Date;
  status?: string;
  applicant: {
    fullName: string;
    fatherName?: string | null;
    motherName?: string | null;
    passportNumber?: string | null;
    phone: string;
    email?: string | null;
    district?: string | null;
    address?: string | null;
    profilePhoto?: string | null;
    applicantNumber?: string;
    dateOfBirth?: string | Date | null;
    gender?: string | null;
    maritalStatus?: string | null;
    nidNumber?: string | null;
    emergencyContactName?: string | null;
    emergencyContactRelation?: string | null;
    emergencyContactPhone?: string | null;
    emergencyContactAddress?: string | null;
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
  payment?: {
    challanNo?: string;
    amount?: number;
    status?: string;
    bankName?: string;
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
  const [copied, setCopied] = useState(false);
  const slipContainerRef = useRef<HTMLDivElement>(null);

  // Split Name into Surname and Given Name
  const rawName = (data.applicant.fullName || 'MD SUMON MIA').trim();
  const nameParts = rawName.split(/\s+/);
  const surname = nameParts.length > 1 ? nameParts[nameParts.length - 1].toUpperCase() : 'MIA';
  const givenName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ').toUpperCase() : rawName.toUpperCase();
  const fullNameUpper = rawName.toUpperCase();

  // Dates
  const enrolmentDateObj = data.appliedAt ? new Date(data.appliedAt) : new Date();
  const formatDdMmYyyy = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const enrolmentDateStr = formatDdMmYyyy(enrolmentDateObj);
  const tentativeDateObj = new Date(enrolmentDateObj);
  tentativeDateObj.setDate(tentativeDateObj.getDate() + 10);
  const tentativeDateStr = formatDdMmYyyy(tentativeDateObj);

  const dobStr = data.applicant.dateOfBirth
    ? formatDdMmYyyy(new Date(data.applicant.dateOfBirth))
    : '04/01/2006';

  const slipCode = data.applicationCode || '4225-000123259';
  const districtName = (data.applicant.district || 'NETROKONA').toUpperCase();
  const professionName = (data.job?.title || 'LABOR').toUpperCase();
  const genderUpper = (data.applicant.gender || 'MALE').toUpperCase();
  const maritalUpper = (data.applicant.maritalStatus || 'SINGLE').toUpperCase();
  const fatherNameUpper = (data.applicant.fatherName || 'MD NUR JAMAN MIA').toUpperCase();
  const motherNameUpper = (data.applicant.motherName || 'JESMIN AKTER').toUpperCase();
  const addressUpper = (
    data.applicant.address || `RAJIBPUR, KENDUA, GOPALPUR - 2780, ${districtName}`
  ).toUpperCase();
  const emergencyRelation = (data.applicant.emergencyContactRelation || 'MOTHER').toUpperCase();
  const emergencyName = (data.applicant.emergencyContactName || motherNameUpper).toUpperCase();
  const emergencyAddress = (data.applicant.emergencyContactAddress || addressUpper).toUpperCase();
  const emergencyPhone = data.applicant.emergencyContactPhone || data.applicant.phone || '+8801345827946';

  // Personal Number / NID
  const personalNo =
    data.applicant.nidNumber ||
    (slipCode.replace(/[^0-9]/g, '').slice(-10) || '6033137511');

  // Challan
  const challanNo = data.payment?.challanNo || '2627-0022068649';
  const challanAmount = data.payment?.amount || 8050;

  // Clean print handler guaranteeing EXACTLY 1 PAGE
  const handlePrint = () => {
    const slipElement = document.getElementById('delivery-slip-content');
    if (!slipElement) {
      window.print();
      return;
    }

    // Create an isolated hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="bn">
      <head>
        <meta charset="utf-8" />
        <title>Delivery Slip - ${slipCode}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            width: 100%;
            height: 100%;
            background: #ffffff;
            color: #000000;
            font-family: Arial, "Helvetica Neue", "SolaimanLipi", "Noto Sans Bengali", sans-serif;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .delivery-slip-sheet {
            width: 100%;
            max-width: 194mm;
            margin: 0 auto;
            padding: 4mm 6mm;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            break-inside: avoid !important;
            break-after: avoid !important;
          }
          .barcode-line {
            display: inline-block;
            height: 32px;
            background: #000000;
          }
          table {
            border-collapse: collapse;
          }
        </style>
      </head>
      <body>
        <div class="delivery-slip-sheet">
          ${slipElement.innerHTML}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
              setTimeout(function() {
                window.parent.document.body.removeChild(window.frameElement);
              }, 1000);
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    doc.close();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(slipCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Render Barcode Lines (Code 128 / Code 39 aesthetic matching the image)
  const renderBarcode = () => {
    const bars = [
      3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 3, 1, 2, 2, 1, 3, 1,
      1, 2, 3, 2, 1, 1, 2, 1, 3, 2, 1, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2,
      1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 3, 2, 1, 1, 2, 1, 3, 2, 1, 2, 1, 3, 1, 1,
      2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2,
    ];

    let currentX = 0;
    return (
      <svg viewBox="0 0 200 32" className="h-8 w-44 object-contain">
        {bars.map((width, idx) => {
          const x = currentX;
          currentX += width * 1.8;
          return idx % 2 === 0 ? (
            <rect key={idx} x={x} y={0} width={width * 1.5} height={32} fill="#000" />
          ) : null;
        })}
      </svg>
    );
  };

  const slipContent = (
    <div
      ref={slipContainerRef}
      className="bg-white text-black p-4 sm:p-6 rounded-xl border border-slate-300 shadow-2xl max-w-4xl w-full mx-auto font-sans relative delivery-slip-print-container"
    >
      {/* Action Toolbar (Screen Only - Hidden during print) */}
      <div className="no-print flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-200 gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ডেলিভারি স্লিপ (Single 1-Page Delivery Slip)
          </span>
          <span className="text-[11px] text-slate-500 font-mono font-bold">
            {slipCode}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyCode}
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            className="text-xs font-bold border-slate-300 h-8"
          >
            {copied ? 'কোড কপি হয়েছে' : 'কোড কপি'}
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
            className="text-xs font-black bg-[#102B50] hover:bg-[#0B1D35] text-white h-8 px-4 shadow-sm"
          >
            প্রিন্ট / ১-পেজ PDF ডাউনলোড
          </Button>

          <Link href={`/track?q=${encodeURIComponent(slipCode)}`} target="_blank">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<FileSearch className="w-3.5 h-3.5 text-[#24856A]" />}
              className="text-xs font-bold border-slate-300 h-8"
            >
              লাইভ ট্র্যাক
            </Button>
          </Link>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors ml-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* THE ACTUAL DELIVERY SLIP CONTENT (EXACT REPLICA OF UPLOADED IMAGE) */}
      {/* ================================================================ */}
      <div id="delivery-slip-content" className="bg-white text-black text-[12px] leading-tight select-text">
        {/* Top Header Block */}
        <div className="grid grid-cols-12 gap-2 items-start pb-2">
          {/* Top Left Details */}
          <div className="col-span-4 space-y-1 text-[11px] leading-snug">
            <div className="text-sm font-black font-mono tracking-tight text-black mb-1">
              {slipCode}
            </div>
            <div className="grid grid-cols-12 gap-1">
              <span className="col-span-6 text-black font-semibold">Passport Office:</span>
              <span className="col-span-6 font-bold">{districtName}</span>
            </div>
            <div className="grid grid-cols-12 gap-1">
              <span className="col-span-6 text-black font-semibold">Enrolment Date:</span>
              <span className="col-span-6 font-bold">{enrolmentDateStr}</span>
            </div>
            <div className="grid grid-cols-12 gap-1">
              <span className="col-span-6 text-black font-semibold">Tentative Collection Date:</span>
              <span className="col-span-6 font-bold">{tentativeDateStr}</span>
            </div>
            <div className="grid grid-cols-12 gap-1">
              <span className="col-span-6 text-black font-semibold">Passport Type:</span>
              <span className="col-span-6 font-bold">ORDINARY</span>
            </div>
            <div className="grid grid-cols-12 gap-1">
              <span className="col-span-6 text-black font-semibold">Duration/Pages:</span>
              <span className="col-span-6 font-bold">10y / 48p</span>
            </div>
            <div className="grid grid-cols-12 gap-1">
              <span className="col-span-6 text-black font-semibold">Issuance Passport Office:</span>
              <span className="col-span-6 font-bold">{districtName}</span>
            </div>
          </div>

          {/* Center Title */}
          <div className="col-span-4 text-center pt-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-black font-sans leading-none">
              Delivery Slip
            </h1>
            <div className="text-base sm:text-lg font-black tracking-wider text-black mt-1">
              EXPRESS
            </div>
          </div>

          {/* Top Right Details & Barcode */}
          <div className="col-span-4 space-y-1 text-[11px] text-right leading-snug">
            {/* Barcode */}
            <div className="flex flex-col items-end">
              {renderBarcode()}
              <div className="font-mono text-xs font-black tracking-widest text-black mt-0.5">
                {slipCode}
              </div>
            </div>

            <div className="space-y-0.5 pt-1 text-left inline-block w-full">
              <div className="flex justify-between gap-1 text-[10.5px]">
                <span className="font-semibold text-black">SB/DSB (Present Address):</span>
                <span className="font-bold">Not required</span>
              </div>
              <div className="flex justify-between gap-1 text-[10.5px]">
                <span className="font-semibold text-black">SB/DSB (Permanent Address):</span>
                <span className="font-bold">Not required</span>
              </div>
              <div className="flex justify-between gap-1 text-[10.5px]">
                <span className="font-semibold text-black">Enrolled by:</span>
                <span className="font-bold">miahasan</span>
              </div>
              <div className="flex justify-between gap-1 text-[10.5px]">
                <span className="font-semibold text-black">Marital Status:</span>
                <span className="font-bold">{maritalUpper}</span>
              </div>
              <div className="flex justify-between gap-1 text-[10.5px]">
                <span className="font-semibold text-black">Profession:</span>
                <span className="font-bold">{professionName}</span>
              </div>
              <div className="flex justify-between gap-1 text-[10.5px]">
                <span className="font-semibold text-black">Contact No.:</span>
                <span className="font-bold font-mono">{data.applicant.phone || '+8801346951088'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Thick Horizontal Divider Line */}
        <div className="border-t-[1.5px] border-black my-1.5" />

        {/* Subheaders in Bengali (Exact text from uploaded image) */}
        <div className="grid grid-cols-12 gap-3 text-[10.5px] font-bold text-black font-bengali pb-1">
          <div className="col-span-6">
            নিজের অঙ্গুলিযুক্ত পাসপোর্ট মূল হিসাবে দেখা যাবে:
          </div>
          <div className="col-span-6 pl-2">
            নিজের অঙ্গুলিযুক্ত পাসপোর্ট অতিরিক্ত তথ্য হিসাবে দেখা যাবে:
          </div>
        </div>

        {/* 2-Column Information Area */}
        <div className="grid grid-cols-12 gap-3 text-[11px] leading-tight pb-2 border-b-[1.5px] border-black">
          {/* Left Column (Photo & Particulars) */}
          <div className="col-span-6 pr-2 border-r border-black/40">
            {/* Top row of Left Column: Photo on left, Particulars on right */}
            <div className="grid grid-cols-12 gap-2">
              {/* Photo Box */}
              <div className="col-span-4">
                <div className="w-24 h-28 border border-black bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {data.applicant.profilePhoto ? (
                    <Image
                      src={data.applicant.profilePhoto}
                      alt={fullNameUpper}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-1 bg-slate-100 text-black">
                      <div className="w-10 h-10 rounded-full border border-black flex items-center justify-center mb-1 text-xs font-bold">
                        PHOTO
                      </div>
                      <span className="text-[9px] font-bold">প্রার্থীর ছবি</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Beside Photo Fields */}
              <div className="col-span-8 space-y-1 text-[10.5px]">
                <div>
                  <span className="font-semibold">Type/ শ্রেণী: </span>
                  <span className="font-bold">ORDINARY</span>
                </div>
                <div>
                  <span className="font-semibold">Country Code/ দেশ কোড: </span>
                  <span className="font-bold">BGD</span>
                </div>
                <div>
                  <span className="font-semibold">Surname/ বংশগত নাম: </span>
                  <span className="font-bold">{surname}</span>
                </div>
                <div>
                  <span className="font-semibold">Personal Number/ ব্যক্তিগত নং: </span>
                  <span className="font-bold font-mono">{personalNo}</span>
                </div>
                <div>
                  <span className="font-semibold">Given Name/ প্রদত্ত নাম: </span>
                  <span className="font-bold">{givenName}</span>
                </div>
                <div>
                  <span className="font-semibold">Previous Passport No./ পূর্ববর্তী পাসপোর্ট নং: </span>
                  <span className="font-bold">-</span>
                </div>
              </div>
            </div>

            {/* Below Photo Fields (Exact format) */}
            <div className="mt-2 space-y-1 text-[10.5px] border-t border-slate-200 pt-1.5">
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-5 font-semibold">Gender/ লিঙ্গ:</span>
                <span className="col-span-7 font-bold">{genderUpper}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-5 font-semibold">Passport No./ পাসপোর্ট নং:</span>
                <span className="col-span-7 font-bold font-mono">
                  {data.applicant.passportNumber || 'XXXXXXXXX'}
                </span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-5 font-semibold">Place of Birth/ জন্মস্থান:</span>
                <span className="col-span-7 font-bold">{districtName}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-5 font-semibold">Date of Birth/ জন্ম তারিখ:</span>
                <span className="col-span-7 font-bold font-mono">{dobStr}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-5 font-semibold">Date of Issue/ প্রদানের তারিখ:</span>
                <span className="col-span-7 font-bold font-mono">##/##/####</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-5 font-semibold">Issuing Authority/ প্রদানকারী কর্তৃপক্ষ:</span>
                <span className="col-span-7 font-bold">DIP/Dhaka</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-5 font-semibold">Nationality/ জাতীয়তা:</span>
                <span className="col-span-7 font-bold">BANGLADESHI</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-5 font-semibold">Date of Expiry/ মেয়াদোত্তীর্ণের তারিখ:</span>
                <span className="col-span-7 font-bold font-mono">##/##/####</span>
              </div>
              <div className="grid grid-cols-12 gap-1 pt-1">
                <span className="col-span-5 font-semibold">Holder Signature/ স্বাক্ষর:</span>
                <span className="col-span-7 font-bengali font-bold text-sm tracking-wide border-b border-black/40 pb-0.5">
                  {data.applicant.fullName || 'সুমন মিয়া'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column (Family & Emergency Details) */}
          <div className="col-span-6 pl-2 space-y-1.5 text-[10.5px]">
            <div className="grid grid-cols-12 gap-1">
              <span className="col-span-4 font-semibold">Name:</span>
              <span className="col-span-8 font-bold">{fullNameUpper}</span>
            </div>

            <div className="grid grid-cols-12 gap-1">
              <span className="col-span-4 font-semibold">Father:</span>
              <span className="col-span-8 font-bold">{fatherNameUpper}</span>
            </div>

            <div className="grid grid-cols-12 gap-1">
              <span className="col-span-4 font-semibold">Mother:</span>
              <span className="col-span-8 font-bold">{motherNameUpper}</span>
            </div>

            <div className="grid grid-cols-12 gap-1">
              <span className="col-span-4 font-semibold">Legal Guardian:</span>
              <span className="col-span-8 font-bold">-</span>
            </div>

            <div className="grid grid-cols-12 gap-1">
              <span className="col-span-4 font-semibold">Permanent address:</span>
              <span className="col-span-8 font-bold leading-tight">{addressUpper}</span>
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-1">
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold">Emergency Contact:</span>
                <span className="col-span-8 font-bold">{emergencyRelation}</span>
              </div>

              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold">Name:</span>
                <span className="col-span-8 font-bold">{emergencyName}</span>
              </div>

              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold">Address:</span>
                <span className="col-span-8 font-bold leading-tight">{emergencyAddress}</span>
              </div>

              <div className="grid grid-cols-12 gap-1 pt-1">
                <span className="col-span-4 font-semibold">Contact No:</span>
                <span className="col-span-8 font-bold font-mono">{emergencyPhone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Table and Signatures Block */}
        <div className="grid grid-cols-12 gap-4 items-center py-2.5">
          {/* Table on Left (Exact 5 columns) */}
          <div className="col-span-7">
            <table className="w-full text-[10px] border border-black text-center border-collapse">
              <thead>
                <tr className="border-b border-black bg-slate-50 font-bold">
                  <th className="border-r border-black p-1 w-8">No</th>
                  <th className="border-r border-black p-1">Bank Name</th>
                  <th className="border-r border-black p-1">Reference Number</th>
                  <th className="border-r border-black p-1">Paid Amount</th>
                  <th className="p-1">Payment Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1 font-bold">1.</td>
                  <td className="border-r border-black p-1 font-bold">A-CHALLAN</td>
                  <td className="border-r border-black p-1 font-mono font-bold">{challanNo}</td>
                  <td className="border-r border-black p-1 font-bold">Tk {challanAmount}</td>
                  <td className="p-1 font-bold text-emerald-800">Done</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1 font-bold">2.</td>
                  <td className="border-r border-black p-1">-</td>
                  <td className="border-r border-black p-1"></td>
                  <td className="border-r border-black p-1"></td>
                  <td className="p-1"></td>
                </tr>
                <tr className="font-bold">
                  <td colSpan={3} className="border-r border-black p-1 text-right pr-2">
                    Total Amount Paid
                  </td>
                  <td className="border-r border-black p-1">Tk {challanAmount}</td>
                  <td className="p-1"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatures on Right */}
          <div className="col-span-5 space-y-4 pl-3 text-[11px]">
            <div>
              <span className="font-semibold">Operator signature: </span>
              <span className="inline-block border-b border-black w-36 ml-1" />
            </div>
            <div>
              <span className="font-semibold">Received by: </span>
              <span className="inline-block border-b border-black w-44 ml-1" />
            </div>
          </div>
        </div>

        {/* Bottom SMS and Hotline Notice (Exact text from uploaded image) */}
        <div className="pt-2 border-t border-black text-[10px] leading-snug font-bengali text-black">
          <p>
            পাসপোর্ট প্রস্তুত হলে এসএমএস/ই-মেইলে জানানো হবে। এছাড়া অনুসন্ধানের জন্য ১৬৪৪৫ নাম্বারে এসএমএস পাঠান এইভাবে: START EPP APPLICATION ID (যেমন: START EPP {slipCode} ) । পাসপোর্ট বাতায়ন হটলাইন (তথ্য সেবা কল সেন্টার): বাংলাদেশ থেকে ১৬৪৪৫ এবং বিদেশ থেকে ০০৯৮৮৭১৬৪৪৫
          </p>
        </div>

        {/* Scissor Cut Line (Tear-off line at bottom) */}
        <div className="pt-4 flex items-center gap-2 text-black select-none">
          <Scissors className="w-4 h-4 transform -rotate-90 shrink-0" />
          <div className="w-full border-b border-dashed border-black" />
        </div>
      </div>

      {/* Embedded Print Styling */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 6mm 8mm;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            height: 100% !important;
            overflow: hidden !important;
          }
          body * {
            visibility: hidden !important;
          }
          .delivery-slip-print-container,
          .delivery-slip-print-container * {
            visibility: visible !important;
          }
          .delivery-slip-print-container {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 194mm !important;
            margin: 0 auto !important;
            padding: 4mm 6mm !important;
            border: none !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            break-inside: avoid !important;
            break-after: avoid !important;
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
        <div className="my-6 max-w-4xl w-full">
          {slipContent}
        </div>
      </div>
    );
  }

  return slipContent;
};
