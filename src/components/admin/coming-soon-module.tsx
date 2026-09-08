import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock } from 'lucide-react';

export interface ComingSoonModuleProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  plannedPhase: string;
  features?: string[];
}

export const ComingSoonModule: React.FC<ComingSoonModuleProps> = ({
  title,
  description,
  icon,
  plannedPhase,
  features = [],
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/dashboard">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}
            aria-label="Back to dashboard"
          >
            Back
          </Button>
        </Link>
        <span className="text-xs text-slate-400">/</span>
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{title}</span>
      </div>

      <Card className="border-dashed border-2 border-slate-200">
        <CardContent className="p-8 sm:p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-navy-50 text-navy-900 flex items-center justify-center mb-5 shadow-sm border border-navy-100">
            {icon}
          </div>

          <div className="inline-flex items-center gap-2 mb-3">
            <Badge variant="gold" size="md">
              <Clock className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
              {plannedPhase}
            </Badge>
            <Badge variant="neutral" size="md">
              Module Architecture Ready
            </Badge>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">{title} Module</h2>
          <p className="text-slate-600 max-w-md mx-auto mb-8 text-sm leading-relaxed">
            {description}
          </p>

          {features.length > 0 && (
            <div className="w-full max-w-md text-left bg-slate-50/80 rounded-xl p-5 border border-slate-200/80 mb-8">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Planned Functional Capabilities
              </h4>
              <ul className="space-y-2">
                {features.map((f, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-navy-700 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard">
              <Button variant="primary">Return to Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
