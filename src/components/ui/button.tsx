import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'gold' | 'blue' | 'brand';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variants = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm font-semibold border border-transparent',
      secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300 focus:ring-slate-300 font-semibold shadow-2xs',
      outline: 'border border-slate-300 bg-transparent text-slate-800 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400 focus:ring-slate-300 shadow-xs font-semibold',
      ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-950 focus:ring-slate-200 font-medium',
      destructive: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-600 shadow-sm font-semibold',
      gold: 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 focus:ring-amber-500 shadow-sm border border-amber-600/30',
      blue: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm font-semibold',
      brand: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm font-semibold',
      navy: 'bg-navy-900 text-white hover:bg-navy-800 focus:ring-navy-900 shadow-sm font-semibold',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5',
    };

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<any>;
      return React.cloneElement(child, {
        className: cn(baseStyles, variants[variant], sizes[size], className, child.props.className),
        children: (
          <>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-current" aria-hidden="true" />
            ) : (
              leftIcon
            )}
            {child.props.children}
            {!isLoading && rightIcon}
          </>
        ),
      });
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" aria-hidden="true" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
