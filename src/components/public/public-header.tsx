'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Menu, X, LogIn, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils';

export const PublicHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');
  const pathname = usePathname();

  const navLinks = [
    { href: '/', labelBn: 'হোম', labelEn: 'Home' },
    { href: '/jobs', labelBn: 'চাকরি', labelEn: 'Jobs' },
    { href: '/countries', labelBn: 'দেশসমূহ', labelEn: 'Countries' },
    { href: '/visa-info', labelBn: 'ভিসা তথ্য', labelEn: 'Visa Info' },
    { href: '/migrant-info', labelBn: 'প্রবাসী তথ্য', labelEn: 'Migrant Info' },
    { href: '/about', labelBn: 'আমাদের সম্পর্কে', labelEn: 'About Us' },
    { href: '/contact', labelBn: 'যোগাযোগ', labelEn: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top micro announcement bar */}
      <div className="bg-navy-950 text-slate-300 text-[11px] py-1.5 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>
            {language === 'bn'
              ? 'সরকারি অনুমোদনপ্রাপ্ত আন্তর্জাতিক জনশক্তি নিয়োগ ও অভিবাসন কনসালটেন্সি'
              : 'Government-Approved International Manpower Recruitment & Migration Consultancy'}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-slate-300">
          <span>হটলাইন: +880 1711-000000</span>
          <span>•</span>
          <span>ইমেইল: info@shakilglobal.com</span>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-navy-900 border border-navy-800 text-gold-400 flex items-center justify-center shadow-md">
            <ShieldCheck className="w-7 h-7 text-emerald-400" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm sm:text-base text-navy-950 tracking-tight leading-tight uppercase font-sans">
              Shakil Global Recruitment
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold font-bengali">
              শাকিল গ্লোবাল রিক্রুটমেন্ট
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors font-bengali',
                  isActive
                    ? 'text-navy-900 bg-slate-100 font-semibold'
                    : 'text-slate-600 hover:text-navy-900 hover:bg-slate-50'
                )}
              >
                {language === 'bn' ? link.labelBn : link.labelEn}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Bar */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            aria-label="Toggle language"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
          </button>

          {/* Login Button */}
          <Link href="/admin/login">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<LogIn className="w-4 h-4" aria-hidden="true" />}
              className="bg-navy-950 hover:bg-navy-900 text-xs font-semibold"
            >
              {language === 'bn' ? 'লগইন' : 'ERP Login'}
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            className="px-2 py-1 text-xs font-medium border border-slate-200 rounded text-slate-700"
            aria-label="Toggle language"
          >
            {language === 'bn' ? 'EN' : 'বাং'}
          </button>
          <IconButton
            variant="ghost"
            size="md"
            aria-label="Open mobile navigation menu"
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-slate-700"
          >
            <Menu className="w-6 h-6" aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-navy-900" />
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                    Menu
                  </span>
                </div>
                <IconButton
                  variant="ghost"
                  size="sm"
                  aria-label="Close mobile navigation menu"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </IconButton>
              </div>

              <div className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 font-bengali"
                  >
                    {language === 'bn' ? link.labelBn : link.labelEn}
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-3">
              <Link href="/admin/login" onClick={() => setIsMobileMenuOpen(false)} className="block">
                <Button variant="primary" className="w-full bg-navy-950 text-white justify-center text-sm">
                  {language === 'bn' ? 'লগইন' : 'ERP Login'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
