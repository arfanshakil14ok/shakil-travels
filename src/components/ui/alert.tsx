import React from 'react';
import { CircleCheck, TriangleAlert, CircleX, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  icon?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  className,
  variant = 'info',
  title,
  children,
  icon,
  ...props
}) => {
  const icons = {
    info: <Info className="w-5 h-5 text-sky-600 flex-shrink-0" aria-hidden="true" />,
    success: <CircleCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" aria-hidden="true" />,
    warning: <TriangleAlert className="w-5 h-5 text-amber-600 flex-shrink-0" aria-hidden="true" />,
    error: <CircleX className="w-5 h-5 text-rose-600 flex-shrink-0" aria-hidden="true" />,
  };

  const variants = {
    info: 'bg-sky-50/80 border-sky-200 text-sky-900',
    success: 'bg-emerald-50/80 border-emerald-200 text-emerald-900',
    warning: 'bg-amber-50/80 border-amber-200 text-amber-900',
    error: 'bg-rose-50/80 border-rose-200 text-rose-900',
  };

  return (
    <div
      role="alert"
      className={cn('flex items-start gap-3 p-4 rounded-xl border text-sm', variants[variant], className)}
      {...props}
    >
      {icon || icons[variant]}
      <div className="flex-1 min-w-0">
        {title && <h5 className="font-semibold text-sm mb-1">{title}</h5>}
        <div className="text-xs leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  );
};
