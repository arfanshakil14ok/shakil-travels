'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProfileAvatarProps {
  src?: string | null;
  photoUrl?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBadge?: boolean;
  badgeContent?: React.ReactNode;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-28 h-28 text-2xl',
};

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  src,
  photoUrl,
  name,
  size = 'md',
  className,
  showBadge = false,
  badgeContent,
}) => {
  const [imageError, setImageError] = useState(false);
  const effectiveSrc = photoUrl || src;

  const getInitials = (fullName?: string | null) => {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const hasValidImage = effectiveSrc && !imageError && typeof effectiveSrc === 'string' && effectiveSrc.trim().length > 0;

  return (
    <div className={cn('relative inline-flex items-center justify-center flex-shrink-0', className)}>
      <div
        className={cn(
          'rounded-full overflow-hidden bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center select-none shadow-2xs',
          sizeClasses[size]
        )}
      >
        {hasValidImage ? (
          <div className="relative w-full h-full">
            <Image
              src={effectiveSrc!}
              alt={name || 'Profile avatar'}
              fill
              sizes="(max-width: 768px) 64px, 128px"
              className="object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        ) : name ? (
          <span className="font-semibold text-slate-800 tracking-tight">{getInitials(name)}</span>
        ) : (
          <User className="w-1/2 h-1/2 text-slate-400" />
        )}
      </div>

      {showBadge && badgeContent && (
        <span className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4">
          {badgeContent}
        </span>
      )}
    </div>
  );
};
