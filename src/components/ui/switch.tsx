import React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  onCheckedChange,
  label,
  description,
  disabled = false,
  id,
}) => {
  const switchId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const toggle = () => {
    if (disabled) return;
    const nextVal = !checked;
    if (onCheckedChange) onCheckedChange(nextVal);
    if (onChange) onChange(nextVal);
  };

  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label
              htmlFor={switchId}
              className={cn(
                'text-sm font-medium text-slate-800 select-none cursor-pointer',
                disabled && 'opacity-60 cursor-not-allowed'
              )}
            >
              {label}
            </label>
          )}
          {description && <span className="text-xs text-slate-500">{description}</span>}
        </div>
      )}
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={toggle}
        className={cn(
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-navy-900 focus:ring-offset-2',
          checked ? 'bg-navy-900' : 'bg-slate-200',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
};
