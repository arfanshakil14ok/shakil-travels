'use client';

import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export interface StageInfo {
  key: string;
  label: string;
  labelBn: string;
}

const DEFAULT_STAGES: StageInfo[] = [
  { key: 'PROFILE', label: 'Profile Ready', labelBn: 'প্রোফাইল তৈরি' },
  { key: 'SUBMITTED', label: 'Application Submitted', labelBn: 'আবেদন দাখিল' },
  { key: 'DOCUMENT_VERIFICATION', label: 'Document Check', labelBn: 'ডকুমেন্ট যাচাই' },
  { key: 'INTERVIEW', label: 'Interview', labelBn: 'ইন্টারভিউ' },
  { key: 'SELECTED', label: 'Selected', labelBn: 'নির্বাচিত' },
  { key: 'VISA_PROCESSING', label: 'Visa Processing', labelBn: 'ভিসা প্রসেসিং' },
  { key: 'DEPARTURE', label: 'Departure', labelBn: 'বিদেশ গমন' },
];

export function RecruitmentProgressTracker({
  currentStatus,
  currentStage,
  isRejected = false,
  stages = DEFAULT_STAGES,
}: {
  currentStatus?: string;
  currentStage?: string;
  isRejected?: boolean;
  stages?: StageInfo[];
}) {
  const { language } = useLanguage();
  const activeStatus = currentStage || currentStatus || 'SUBMITTED';

  const getStageIndex = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'NEW' || s === 'PROFILE_INCOMPLETE' || s === 'PROFILE') return 0;
    if (s === 'SUBMITTED' || s === 'APPLIED' || s === 'APPLICATION_SUBMITTED') return 1;
    if (s === 'UNDER_REVIEW' || s === 'DOCUMENT_CHECK' || s === 'DOCUMENT_VERIFICATION') return 2;
    if (s === 'INTERVIEW_SCHEDULED' || s === 'INTERVIEW') return 3;
    if (s === 'SELECTED' || s === 'OFFER_ACCEPTED' || s === 'MEDICAL_PASSED') return 4;
    if (s === 'VISA_PROCESSING' || s === 'VISA_APPLIED' || s === 'VISA_APPROVED' || s === 'VISA_STAMPED') return 5;
    if (s === 'DEPLOYED' || s === 'DEPARTED' || s === 'COMPLETED' || s === 'TICKET_CONFIRMED' || s === 'DEPARTURE') return 6;
    return 1;
  };

  const currentIndex = getStageIndex(activeStatus);

  return (
    <div className="w-full bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <span
          className={`text-xs font-semibold text-slate-800 ${
            language === 'bn' ? 'font-bengali' : ''
          }`}
        >
          {language === 'bn' ? 'রিক্রুটমেন্ট অগ্রগতি ট্র্যাক' : 'Recruitment Progress Tracker'}
        </span>
        <span
          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
            isRejected
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {activeStatus}
        </span>
      </div>

      <div className="relative">
        {/* Progress Line */}
        <div className="hidden sm:block absolute top-3.5 left-6 right-6 h-0.5 bg-slate-200 -z-0" />

        <div className="grid grid-cols-2 sm:grid-cols-7 gap-3 sm:gap-2">
          {stages.map((stage, idx) => {
            const isCompleted = !isRejected && idx < currentIndex;
            const isCurrent = !isRejected && idx === currentIndex;
            const isPending = !isRejected && idx > currentIndex;

            return (
              <div
                key={stage.key}
                className="flex flex-col items-center text-center relative z-10 space-y-1.5"
              >
                {/* Node Circle */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-slate-900 text-white ring-4 ring-slate-900/10'
                      : isRejected && idx === currentIndex
                      ? 'bg-rose-600 text-white ring-4 ring-rose-600/10'
                      : 'bg-white border-2 border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : isCurrent ? (
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                  ) : isRejected && idx === currentIndex ? (
                    <AlertCircle className="w-3.5 h-3.5" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Stage Label */}
                <span
                  className={`text-[11px] font-medium leading-tight ${
                    isCurrent
                      ? 'text-slate-900 font-bold'
                      : isCompleted
                      ? 'text-emerald-700 font-semibold'
                      : 'text-slate-400'
                  } ${language === 'bn' ? 'font-bengali' : ''}`}
                >
                  {language === 'bn' ? stage.labelBn : stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
