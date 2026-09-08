import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  return (
    <nav className={cn('flex items-center text-xs text-slate-500', className)} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1.5 md:space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="inline-flex items-center">
              {index > 0 && (
                <ArrowRight className="w-3 h-3 text-slate-400 mx-1.5 flex-shrink-0" aria-hidden="true" />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="font-medium text-slate-500 hover:text-navy-900 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={cn('font-semibold', isLast ? 'text-slate-800' : 'text-slate-500')}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
