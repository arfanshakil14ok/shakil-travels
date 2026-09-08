'use client';

import React, { useEffect } from 'react';
import { TriangleAlert, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100 shadow-sm">
          <TriangleAlert className="w-8 h-8" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-amber-600 uppercase tracking-wider">
            Runtime Exception (500)
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Something went wrong / একটি ত্রুটি ঘটেছে
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed font-bengali">
            অনাকাঙ্ক্ষিত কোনো সমস্যা দেখা দিয়েছে। দয়া করে পুনরায় চেষ্টা করুন।
          </p>
        </div>
        <div className="pt-2">
          <Button
            variant="primary"
            onClick={() => reset()}
            leftIcon={<RefreshCw className="w-4 h-4" aria-hidden="true" />}
          >
            Try Again / আবার চেষ্টা করুন
          </Button>
        </div>
      </div>
    </div>
  );
}
