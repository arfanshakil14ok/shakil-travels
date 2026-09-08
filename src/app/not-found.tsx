import React from 'react';
import Link from 'next/link';
import { CircleX, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-sm">
          <CircleX className="w-8 h-8" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-rose-600 uppercase tracking-wider">
            Error 404
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Page Not Found / পৃষ্ঠাটি পাওয়া যায়নি
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed font-bengali">
            আপনি যে পৃষ্ঠাটি খুঁজছেন তা স্থানান্তরিত হয়েছে অথবা মুছে ফেলা হয়েছে।
          </p>
        </div>
        <div className="pt-2">
          <Link href="/">
            <Button
              variant="primary"
              leftIcon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}
            >
              Return Home / হোমে ফিরে যান
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
