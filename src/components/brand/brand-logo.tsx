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
 * Incorporates the official upward arrow geometric S-emblem mark.
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
        'relative inline-flex items-center justify-center shrink-0 rounded-xl bg-white border border-slate-200/90 shadow-xs select-none transition-transform group-hover:scale-105 overflow-hidden p-1',
        sizeClasses[size],
        className
      )}
      aria-hidden="true"
    >
      <Image
        src="/brand/logo-mark.png"
        alt="SHAKIL TRAVELS"
        fill
        sizes="56px"
        className="object-contain p-0.5"
      />
    </div>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'horizontal',
  theme = 'dark',
  size = 'md',
  showTagline = false,
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
