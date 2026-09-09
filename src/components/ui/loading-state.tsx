'use client';

import React from 'react';
import { useLanguage } from '@/context/language-context';

export function LoadingSpinner({
  message,
  messageBn,
  size = 'md',
}: {
  message?: string;
  messageBn?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const { language } = useLanguage();

  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  const text = (language === 'bn' && messageBn)
    ? messageBn
    : message || (language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...');

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-2.5">
      <div
        className={`${sizeClasses[size]} border-slate-900 border-t-transparent rounded-full animate-spin`}
        aria-hidden="true"
      />
      {text && (
        <p
          className={`text-xs text-slate-500 font-medium ${
            language === 'bn' ? 'font-bengali' : ''
          }`}
        >
          {text}
        </p>
      )}
    </div>
  );
}

export function LoadingState({
  text,
  size = 'md',
}: {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  return <LoadingSpinner message={text} size={size} />;
}

export function SkeletonBlock({
  className = 'h-10 w-full',
}: {
  className?: string;
}) {
  return (
    <div className={`bg-slate-200/70 rounded-lg animate-pulse ${className}`} />
  );
}
