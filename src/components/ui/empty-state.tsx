'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, Inbox } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  titleBn?: string;
  description: string;
  descriptionBn?: string;
  action?: {
    label: string;
    labelBn?: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  titleBn,
  description,
  descriptionBn,
  action,
  className = '',
}: EmptyStateProps) {
  const { language } = useLanguage();

  const displayTitle = (language === 'bn' && titleBn) ? titleBn : title;
  const displayDescription = (language === 'bn' && descriptionBn) ? descriptionBn : description;
  const displayAction = action
    ? (language === 'bn' && action.labelBn) ? action.labelBn : action.label
    : null;

  return (
    <div
      className={`text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl bg-white/60 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6 text-slate-500" aria-hidden="true" />
      </div>
      <h3
        className={`text-sm font-semibold text-slate-800 ${
          language === 'bn' ? 'font-bengali' : ''
        }`}
      >
        {displayTitle}
      </h3>
      <p
        className={`text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed ${
          language === 'bn' ? 'font-bengali' : ''
        }`}
      >
        {displayDescription}
      </p>

      {action && displayAction && (
        <div className="mt-4">
          {action.href ? (
            <Link
              href={action.href}
              className={`inline-flex items-center justify-center h-9 px-4 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs ${
                language === 'bn' ? 'font-bengali' : ''
              }`}
            >
              {displayAction}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className={`inline-flex items-center justify-center h-9 px-4 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs cursor-pointer ${
                language === 'bn' ? 'font-bengali' : ''
              }`}
            >
              {displayAction}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
