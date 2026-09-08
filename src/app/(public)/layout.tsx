import React from 'react';
import { PublicHeader } from '@/components/public/public-header';
import { PublicFooter } from '@/components/public/public-footer';
import { LegalDisclaimer } from '@/components/public/legal-disclaimer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />
      <LegalDisclaimer />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
