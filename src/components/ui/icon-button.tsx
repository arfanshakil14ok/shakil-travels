import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string; // Enforce accessible label
  tooltip?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      'aria-label': ariaLabel,
      tooltip,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.96]';

    const variants = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm',
      secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300 focus:ring-slate-300',
      outline: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-950 focus:ring-slate-300 shadow-2xs',
      ghost: 'bg-transparent text-slate-700 hover:text-slate-950 hover:bg-slate-100 focus:ring-slate-200',
      destructive: 'bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 focus:ring-rose-400 border border-rose-200',
      blue: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm',
    };

    const sizes = {
      sm: 'w-7 h-7 p-1 text-xs',
      md: 'w-9 h-9 p-1.5 text-sm',
      lg: 'w-11 h-11 p-2 text-base',
    };

    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        title={tooltip || ariaLabel}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" aria-hidden="true" />
        ) : (
          children
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
