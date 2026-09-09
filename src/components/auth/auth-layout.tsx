'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export interface AuthLayoutProps {
  title: string;
  titleBn?: string;
  description?: string;
  descriptionBn?: string;
  errorMessage?: string;
  successMessage?: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
  backLink?: {
    href: string;
    label: string;
    labelBn?: string;
  };
}

export function AuthLayout({
  title,
  titleBn,
  description,
  descriptionBn,
  errorMessage,
  successMessage,
  children,
  footerContent,
  backLink,
}: AuthLayoutProps) {
  const { language, toggleLanguage } = useLanguage();

  const displayTitle = (language === 'bn' && titleBn) ? titleBn : title;
  const displayDescription = (language === 'bn' && descriptionBn) ? descriptionBn : description;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8 sm:px-6 font-sans">
      {/* Centered Auth Card */}
      <div className="w-full max-w-[420px] bg-white border border-slate-200/90 rounded-xl shadow-xs p-6 sm:p-8 space-y-6">
        {/* Brand & Language Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105">
              <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            </div>
            <span className="text-[11px] font-bold tracking-wider text-slate-800 uppercase font-sans">
              Shakil Global
            </span>
          </Link>

          <button
            type="button"
            onClick={toggleLanguage}
            className="text-[11px] font-medium text-slate-500 hover:text-slate-900 px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer select-none"
            aria-label="Toggle language"
          >
            {language === 'bn' ? 'English' : 'বাংলা'}
          </button>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h1
            className={`text-xl sm:text-[22px] font-bold tracking-tight text-slate-900 ${
              language === 'bn' ? 'font-bengali' : ''
            }`}
          >
            {displayTitle}
          </h1>
          {displayDescription && (
            <p
              className={`text-xs sm:text-[13px] text-slate-500 leading-relaxed ${
                language === 'bn' ? 'font-bengali' : ''
              }`}
            >
              {displayDescription}
            </p>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800 leading-relaxed"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" aria-hidden="true" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div
            role="status"
            className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-xs text-emerald-800 leading-relaxed"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" aria-hidden="true" />
            <p className="font-medium">{successMessage}</p>
          </div>
        )}

        {/* Form Body */}
        {children}

        {/* Footer Content */}
        {footerContent && (
          <div className="pt-2 border-t border-slate-100 text-center">
            {footerContent}
          </div>
        )}

        {/* Back Link */}
        {backLink && (
          <div className="text-center pt-1">
            <Link
              href={backLink.href}
              className={`text-[11px] text-slate-400 hover:text-slate-600 transition-colors ${
                language === 'bn' ? 'font-bengali' : ''
              }`}
            >
              {(language === 'bn' && backLink.labelBn) ? backLink.labelBn : backLink.label}
            </Link>
          </div>
        )}
      </div>

      {/* Trust & License Subtitle */}
      <p className="text-center text-[11px] text-slate-400 mt-6 max-w-sm leading-relaxed">
        Government Approved Recruiting Agency • License No: RL-1892
      </p>
    </div>
  );
}
