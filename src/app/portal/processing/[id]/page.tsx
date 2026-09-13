'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ShieldCheck,
  ArrowLeft,
  Plane,
  HeartPulse,
  Stamp,
  FileCheck2,
  Clock,
  RefreshCw,
  Building2,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Download,
  Upload,
  Eye,
  FileText,
  Phone,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useLanguage } from '@/context/language-context';

export default function PortalProcessingDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const { language, t } = useLanguage();

  const [caseData, setCaseData] = useState<any | null>(null);
  const [timelineData, setTimelineData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setErrorMsg(null);

      const [resCase, resTimeline] = await Promise.all([
        fetch(`/api/portal/processing/${id}`),
        fetch(`/api/portal/processing/${id}/timeline`),
      ]);

      const dataCase = await resCase.json();
      const dataTimeline = await resTimeline.json();

      if (!resCase.ok || !dataCase.success) {
        throw new Error(dataCase.error || 'Failed to fetch processing details');
      }

      setCaseData(dataCase.data);
      if (dataTimeline.success) {
        setTimelineData(dataTimeline.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !uploadUrl) return;

    try {
      setIsUploading(true);
      setUploadError(null);

      const res = await fetch(`/api/portal/processing/${id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirementId: selectedReq.id,
          fileUrl: uploadUrl,
          title: uploadTitle || selectedReq.title,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload document');
      }

      setIsUploadModalOpen(false);
      setUploadUrl('');
      setUploadTitle('');
      fetchDetails();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading && !caseData) {
    return (
      <div className="py-24 text-center text-xs text-slate-500 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
        <p>{t('প্রসেসিং ফাইল লোড হচ্ছে...', 'Loading processing case file...')}</p>
      </div>
    );
  }

  if (errorMsg || !caseData) {
    return (
      <div className="py-16 text-center space-y-3 font-sans">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-sm font-semibold text-rose-700">{errorMsg || 'Case not found'}</p>
        <Link href="/portal/processing">
          <Button size="sm" variant="outline">
            ← {t('তালিকায় ফিরে যান', 'Back to Processing List')}
          </Button>
        </Link>
      </div>
    );
  }

  const nextAction = timelineData?.nextAction;
  const { readiness } = caseData;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 font-sans">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/portal/processing">
          <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            {t('সকল প্রসেসিং ফাইল', 'All Processing Cases')}
          </Button>
        </Link>

        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
          {caseData.processingCode}
        </span>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {caseData.job?.title}
            </h1>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{caseData.employer?.companyName}</span>
              <span>•</span>
              <span className="font-semibold text-indigo-700">
                {caseData.job?.country?.name || 'Saudi Arabia'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block sm:text-right">
              {t('বর্তমান পর্যায়', 'Current Stage')}
            </span>
            <span className="text-sm font-bold text-indigo-700 font-mono">
              {caseData.currentStage}
            </span>
          </div>
        </div>

        {/* Next Action Required Banner */}
        {nextAction && (
          <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-indigo-600" />
              <span>{t('আপনার করণীয় পদক্ষেপ', 'Next Action Required')}</span>
            </div>
            <div className="text-sm font-bold text-indigo-950">
              {language === 'bn' ? nextAction.titleBn : nextAction.title}
            </div>
            <p className="text-xs text-indigo-800 leading-relaxed">
              {language === 'bn' ? nextAction.descriptionBn : nextAction.description}
            </p>
          </div>
        )}

        {/* 5-Pillar Readiness Tracker */}
        {readiness && (
          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>{t('বিদেশযাত্রার ৫-স্তম্ভ প্রস্তুতি', '5-Pillar Deployment Readiness')}</span>
              <span className={readiness.ready ? 'text-emerald-700' : 'text-amber-700'}>
                {readiness.ready ? t('✓ সম্পূর্ণ প্রস্তুত', '✓ Fully Ready') : t('প্রক্রিয়াধীন', 'In Progress')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div className={`p-2.5 rounded-lg border ${readiness.pillarStatus?.documents?.passed ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <div className="font-bold flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  1. {t('কাগজপত্র', 'Docs')}
                </div>
                <div className="text-[10px] mt-1 font-medium">{readiness.pillarStatus?.documents?.message}</div>
              </div>

              <div className={`p-2.5 rounded-lg border ${readiness.pillarStatus?.medical?.passed ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <div className="font-bold flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5 text-teal-600" />
                  2. {t('মেডিকেল', 'Medical')}
                </div>
                <div className="text-[10px] mt-1 font-medium">{readiness.pillarStatus?.medical?.message}</div>
              </div>

              <div className={`p-2.5 rounded-lg border ${readiness.pillarStatus?.visa?.passed ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <div className="font-bold flex items-center gap-1">
                  <Stamp className="w-3.5 h-3.5 text-purple-600" />
                  3. {t('ভিসা', 'Visa')}
                </div>
                <div className="text-[10px] mt-1 font-medium">{readiness.pillarStatus?.visa?.message}</div>
              </div>

              <div className={`p-2.5 rounded-lg border ${readiness.pillarStatus?.clearance?.passed ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <div className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  4. {t('বিএমইটি', 'BMET')}
                </div>
                <div className="text-[10px] mt-1 font-medium">{readiness.pillarStatus?.clearance?.message}</div>
              </div>

              <div className={`p-2.5 rounded-lg border ${readiness.pillarStatus?.ticket?.passed ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <div className="font-bold flex items-center gap-1">
                  <Plane className="w-3.5 h-3.5 text-sky-600" />
                  5. {t('টিকিট', 'Ticket')}
                </div>
                <div className="text-[10px] mt-1 font-medium">{readiness.pillarStatus?.ticket?.message}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Documents Upload & Verification Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {t('প্রয়োজনীয় কাগজপত্র জমা ও যাচাই', 'Required Documents Checklist')}
            </h2>
            <p className="text-xs text-slate-500">
              {t('পাসপোর্ট, এনআইডি এবং অন্যান্য আবশ্যকীয় কাগজপত্রের কপি আপলোড করুন।', 'Upload clear copies of your passport, NID, and other required documents.')}
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {caseData.documentRequirements?.map((req: any) => (
            <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
              <div>
                <div className="font-bold text-slate-800">
                  {language === 'bn' && req.titleLocal ? req.titleLocal : req.title}
                  {req.required && (
                    <span className="text-[9px] ml-2 px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-bold">
                      {t('বাধ্যতামূলক', 'REQUIRED')}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Type: {req.documentType}
                </div>
                {req.rejectionReason && (
                  <div className="text-[11px] text-rose-600 mt-1 font-semibold">
                    {t('প্রত্যাখ্যানের কারণ: ', 'Rejection Reason: ')} {req.rejectionReason}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    req.status === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : req.status === 'UPLOADED'
                      ? 'bg-blue-100 text-blue-800'
                      : req.status === 'REJECTED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {req.status}
                </span>

                {req.document?.fileUrl ? (
                  <a
                    href={req.document.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border text-indigo-600 hover:bg-slate-50"
                    title="View uploaded document"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </a>
                ) : null}

                {req.status !== 'VERIFIED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedReq(req);
                      setUploadTitle(req.title);
                      setIsUploadModalOpen(true);
                    }}
                    className="h-7 text-xs font-semibold text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    {req.status === 'REJECTED' ? t('পুনরায় আপলোড', 'Re-upload') : t('আপলোড করুন', 'Upload')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Flight Ticket & Departure Card (If Issued) */}
      {caseData.travelTicket && (
        <div className="bg-white rounded-2xl border border-sky-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-sky-950 flex items-center gap-2">
              <Plane className="w-5 h-5 text-sky-600" />
              {t('ফ্লাইট টিকিট ও ভ্রমণ সূচি', 'Flight Ticket & Travel Schedule')}
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
              PNR: {caseData.travelTicket.bookingReference || 'ISSUED'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-sky-50/50 rounded-xl text-xs">
            <div>
              <span className="text-slate-400">{t('এয়ারলাইন ও ফ্লাইট', 'Airline & Flight')}</span>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {caseData.travelTicket.airline} ({caseData.travelTicket.flightNumber})
              </div>
            </div>

            <div>
              <span className="text-slate-400">{t('ফ্লাইটের তারিখ ও সময়', 'Departure Schedule')}</span>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {new Date(caseData.travelTicket.departureDate).toLocaleDateString()} at {caseData.travelTicket.departureTime || 'TBA'}
              </div>
              <div className="text-[10px] text-slate-500">{caseData.travelTicket.departureAirport}</div>
            </div>

            <div>
              <span className="text-slate-400">{t('গন্তব্য এয়ারপোর্ট ও লাগেজ', 'Arrival & Baggage')}</span>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {caseData.travelTicket.arrivalAirport}
              </div>
              <div className="text-[10px] text-slate-500">{caseData.travelTicket.baggageAllowance}</div>
            </div>
          </div>
        </div>
      )}

      {/* Status History Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          {t('প্রসেসিং হিস্ট্রি ও অগ্রগতির বিবরণ', 'Processing Status History')}
        </h2>

        <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-5 text-xs">
          {caseData.statusHistory?.map((h: any) => (
            <div key={h.id} className="relative">
              <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white shadow-xs" />
              <div className="text-[10px] text-slate-400">
                {new Date(h.createdAt).toLocaleString()}
              </div>
              <div className="font-bold text-slate-900 mt-0.5">
                {h.fromStage} → <span className="text-indigo-600">{h.toStage}</span>
              </div>
              {h.reason && <p className="text-slate-600 mt-0.5">{h.reason}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Upload Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload Document">
        <form onSubmit={handleUploadDocument} className="p-4 space-y-3 text-xs">
          <p className="text-slate-600">
            {t('নিচের ডকুমেন্টটির জন্য ফাইল লিংক অথবা ক্লাউড ইউআরএল প্রদান করুন:', 'Provide the document link or file URL for:')}{' '}
            <strong>{selectedReq?.title}</strong>
          </p>

          <div>
            <label className="font-bold block mb-1">{t('ফাইলের নাম', 'Document Title')}</label>
            <Input
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              className="text-xs"
            />
          </div>

          <div>
            <label className="font-bold block mb-1">{t('ফাইল ইউআরএল / স্ক্যান লিংক *', 'File URL / Scan Link *')}</label>
            <Input
              placeholder="https://... or /uploads/..."
              value={uploadUrl}
              onChange={(e) => setUploadUrl(e.target.value)}
              required
              className="text-xs"
            />
          </div>

          {uploadError && <p className="text-rose-600 font-bold">{uploadError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsUploadModalOpen(false)}>
              {t('বাতিল', 'Cancel')}
            </Button>
            <Button
              size="sm"
              disabled={isUploading || !uploadUrl}
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              {isUploading ? t('আপলোড হচ্ছে...', 'Uploading...') : t('জমা দিন', 'Submit Document')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
