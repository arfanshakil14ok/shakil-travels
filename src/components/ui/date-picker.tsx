import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { CalendarDays } from 'lucide-react';

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
            {label}
            {props.required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <CalendarDays className="w-4 h-4" aria-hidden="true" />
          </div>
          <input
            id={inputId}
            ref={ref}
            type="date"
            className={cn(
              'block w-full rounded-lg border text-sm text-slate-900 bg-white pl-9 pr-3.5 py-2 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                : 'border-slate-300 focus:border-navy-600 focus:ring-navy-100',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
