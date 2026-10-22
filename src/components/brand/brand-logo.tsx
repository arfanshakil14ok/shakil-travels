'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
 * Official Brand Emblem Mark for SHAKIL TRAVELS
 * Modern custom emblem incorporating the S-curve aviation mark.
 */
export const BrandMark: React.FC<{
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
  };

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center shrink-0 rounded-xl bg-white border border-slate-200/90 shadow-xs select-none transition-transform group-hover:scale-105 overflow-hidden p-0.5',
        sizeClasses[size],
        className
      )}
      aria-hidden="true"
    >
      <Image
        src="/brand/logo-mark.png"
        alt="SHAKIL TRAVELS Logo"
        fill
        sizes="64px"
        className="object-contain"
        priority
      />
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
        'group inline-flex items-center gap-2.5 sm:gap-3 transition-opacity select-none shrink-0',
        className
      )}
    >
      <BrandMark size={markSizes[size]} />

      {variant !== 'icon-only' && (
        <div
          className={cn(
            'flex flex-col min-w-0 leading-tight justify-center',
            iconOnlyOnMobile && 'hidden sm:flex'
          )}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'font-black tracking-tight uppercase font-sans truncate',
                nameSizes[size],
                isLight ? 'text-white' : 'text-[#102B50]'
              )}
            >
              {BRAND.name}
            </span>
          </div>
          {showTagline && (
            <span
              className={cn(
                'text-[10px] tracking-tight font-medium mt-0.5 truncate font-bengali',
                isLight ? 'text-slate-300' : 'text-[#66758A]'
              )}
            >
              আন্তর্জাতিক রিক্রুটমেন্ট ও ভিসা সার্ভিস
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center no-underline shrink-0">
        {content}
      </Link>
    );
  }

  return content;
};
