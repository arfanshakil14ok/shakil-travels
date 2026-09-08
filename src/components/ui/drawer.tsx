'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { IconButton } from './icon-button';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  position?: 'left' | 'right';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  position = 'right',
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-xs',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className={cn('fixed inset-y-0 flex max-w-full', position === 'right' ? 'right-0' : 'left-0')}>
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            'w-screen bg-white shadow-2xl border-slate-200 flex flex-col',
            position === 'right' ? 'border-l' : 'border-r',
            maxWidths[maxWidth]
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-slate-100">
            <div>
              {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
              {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
            </div>
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="Close drawer"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 -mr-1 -mt-1"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </IconButton>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};
