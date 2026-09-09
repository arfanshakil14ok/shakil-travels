'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BRAND } from '@/config/brand';

export interface BrandLogoProps {
  variant?: 'full' | 'horizontal' | 'compact' | 'icon-only';
  theme?: 'dark' | 'light' | 'auto';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  href?: string;
  className?: string;
  iconOnlyOnMobile?: boolean;
}

/**
 * Clean SVG Emblem Mark for SHAKIL GLOBAL MANPOWER
 * Features global meridians, upward career talent nexus, and gold apex crest.
 */
export const BrandMark: React.FC<{
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
  };

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center shrink-0 rounded-xl bg-gradient-to-br from-navy-950 via-navy-900 to-slate-900 border border-slate-800 shadow-xs select-none transition-transform group-hover:scale-105',
        sizeClasses[size],
        className
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[85%] h-[85%]"
      >
        <defs>
          <linearGradient id="mark-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="mark-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        {/* Global Connectivity Meridians */}
        <circle cx="24" cy="24" r="14" stroke="#475569" strokeWidth="1.2" strokeDasharray="2 3" opacity="0.6" />
        <ellipse cx="24" cy="24" rx="7" ry="14" stroke="#64748b" strokeWidth="1.2" opacity="0.5" />
        <line x1="10" y1="24" x2="38" y2="24" stroke="#475569" strokeWidth="1" opacity="0.4" />

        {/* Talent & Career Upward Shape */}
        <path
          d="M15 31C15 22 20 18 24 16C28 18 33 22 33 31"
          stroke="url(#mark-emerald)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M24 33V18M24 18L20 22M24 18L28 22"
          stroke="url(#mark-emerald)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Leadership Gold Star / Apex */}
        <circle cx="24" cy="12" r="3.2" fill="url(#mark-gold)" />
      </svg>
    </div>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'horizontal',
  theme = 'dark',
  size = 'md',
  showTagline = true,
  href,
  className,
  iconOnlyOnMobile = false,
}) => {
  const isLight = theme === 'light';

  const markSizes: Record<'sm' | 'md' | 'lg' | 'xl', 'xs' | 'sm' | 'md' | 'lg'> = {
    sm: 'xs',
    md: 'sm',
    lg: 'md',
    xl: 'lg',
  };

  const nameSizes = {
    sm: 'text-xs sm:text-sm',
    md: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg',
    xl: 'text-lg sm:text-xl',
  };

  const content = (
    <div
      className={cn(
        'group inline-flex items-center gap-2.5 sm:gap-3 transition-opacity select-none',
        className
      )}
    >
      <BrandMark size={markSizes[size]} />

      {variant !== 'icon-only' && (
        <div
          className={cn(
            'flex flex-col min-w-0 leading-tight',
            iconOnlyOnMobile && 'hidden sm:flex'
          )}
        >
          <span
            className={cn(
              'font-black tracking-tight uppercase font-sans truncate',
              nameSizes[size],
              isLight ? 'text-white' : 'text-slate-900'
            )}
          >
            {BRAND.name}
          </span>

          {showTagline && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={cn(
                  'text-[9px] sm:text-[10px] font-bold uppercase tracking-wider truncate',
                  isLight ? 'text-emerald-400' : 'text-emerald-700'
                )}
              >
                {BRAND.taglineEn}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center no-underline">
        {content}
      </Link>
    );
  }

  return content;
};
