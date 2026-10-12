'use client';

import React, { useEffect } from 'react';
import { CandidateProfileWizard } from '@/components/portal/category-wizard/candidate-profile-wizard';

interface JobApplyWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: any | null;
  onApplicationSuccess: (applicationData: any) => void;
  applicationQuota?: {
    currentCount: number;
    maxLimit: number;
    isLimitReached: boolean;
  };
}

export function JobApplyWizardModal({
  isOpen,
  onClose,
  job,
  onApplicationSuccess,
  applicationQuota,
}: JobApplyWizardModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 animate-fadeIn">
      {/* Backdrop click dismiss */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog Content */}
      <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-scaleUp">
        <CandidateProfileWizard
          jobId={job.id}
          isModal={true}
          onClose={onClose}
          onSuccess={(data) => {
            onApplicationSuccess(data);
          }}
        />
      </div>
    </div>
  );
}
