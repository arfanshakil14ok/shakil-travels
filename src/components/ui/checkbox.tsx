import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const checkboxId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="relative flex items-start">
        <div className="flex h-5 items-center">
          <input
            id={checkboxId}
            ref={ref}
            type="checkbox"
            className={cn(
              'h-4 w-4 rounded border-slate-300 text-navy-900 focus:ring-navy-800 cursor-pointer',
              className
            )}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="ml-2.5 text-sm">
            {label && (
              <label htmlFor={checkboxId} className="font-medium text-slate-700 cursor-pointer select-none">
                {label}
              </label>
            )}
            {description && <p className="text-xs text-slate-500">{description}</p>}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
