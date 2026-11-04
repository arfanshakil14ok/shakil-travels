import React from 'react';
import { PublicHeader } from '@/components/public/public-header';
import { PublicFooter } from '@/components/public/public-footer';
import { AppShellDetector } from '@/components/public/app-shell-detector';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AppShellDetector />
      <div className="web-only-header">
        <PublicHeader />
      </div>
      <main className="flex-1">{children}</main>
      <div className="web-only-footer">
        <PublicFooter />
      </div>
    </div>
  );
}
