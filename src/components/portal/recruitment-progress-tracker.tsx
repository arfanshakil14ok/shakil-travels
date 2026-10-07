'use client';

import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { CANONICAL_MILESTONES, getCanonicalMilestoneIndex } from '@/lib/pipeline-sync';

export interface StageInfo {
  key: string;
  label: string;
  labelBn: string;
}

export function RecruitmentProgressTracker({
  currentStatus,
  currentStage,
  isRejected: explicitRejected,
  stages = CANONICAL_MILESTONES,
}: {
  currentStatus?: string;
  currentStage?: string;
  isRejected?: boolean;
  stages?: StageInfo[];
}) {
  const { language } = useLanguage();
  const activeStatus = (currentStage || currentStatus || 'APPLIED').toUpperCase();

  const isTerminal =
    explicitRejected ||
    ['REJECTED', 'CANCELLED', 'WITHDRAWN', 'MEDICAL_FAILED', 'VISA_REJECTED'].includes(activeStatus);

  const currentIndex = isTerminal ? -1 : getCanonicalMilestoneIndex(activeStatus);
  const progressPercent = isTerminal
    ? 0
    : Math.min(100, Math.round(((currentIndex + 1) / stages.length) * 100));

  return (
    <div className="w-full bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold text-slate-800 ${
              language === 'bn' ? 'font-bengali' : ''
            }`}
          >
            {language === 'bn' ? 'রিক্রুটমেন্ট অগ্রগতি ট্র্যাকার' : 'Recruitment Milestone Progress'}
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {progressPercent}%
          </span>
        </div>
        <span
          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
            isTerminal
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {activeStatus}
        </span>
      </div>

      <div className="relative">
        {/* Progress Line */}
        <div className="hidden sm:block absolute top-3.5 left-4 right-4 h-0.5 bg-slate-200 -z-0" />

        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2 sm:gap-1">
          {stages.map((stage, idx) => {
            const isCompleted = !isTerminal && idx < currentIndex;
            const isCurrent = !isTerminal && idx === currentIndex;

            return (
              <div
                key={stage.key}
                className="flex flex-col items-center text-center relative z-10 space-y-1"
              >
                {/* Node Circle */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-slate-900 text-white ring-4 ring-slate-900/10'
                      : isTerminal && idx === 0
                      ? 'bg-rose-600 text-white ring-4 ring-rose-600/10'
                      : 'bg-white border-2 border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : isCurrent ? (
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                  ) : isTerminal && idx === 0 ? (
                    <AlertCircle className="w-3.5 h-3.5" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Stage Label */}
                <span
                  className={`text-[10px] font-medium leading-tight line-clamp-2 px-0.5 ${
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
