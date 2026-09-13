'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  FileCheck2,
  FileText,
  Calendar,
  Stamp,
  Receipt,
  CreditCard,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Activity,
  LifeBuoy,
  GraduationCap,
  Headset,
  Plane,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { BRAND } from '@/config/brand';
import { BrandLogo } from '@/components/brand/brand-logo';
import { ProfileAvatar } from '@/components/ui/profile-avatar';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, toggleLanguage, t } = useLanguage();

  const [applicant, setApplicant] = useState<any | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthPage =
    pathname.startsWith('/portal/login') ||
    pathname.startsWith('/portal/register') ||
    pathname.startsWith('/portal/forgot-password') ||
    pathname.startsWith('/portal/reset-password') ||
    pathname.startsWith('/portal/complete-profile');

  useEffect(() => {
    if (isAuthPage) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function loadSession() {
      try {
        const res = await fetch('/api/portal/auth/me');
        const data = await res.json();
        if (isMounted) {
          if (data.success) {
            setApplicant(data.data.applicant);
            setUnreadCount(data.data.counts?.unreadNotifications || 0);

            // Mandatory profile photo enforcement: redirect to complete-profile if missing
            if (!data.data.applicant?.hasPhoto && pathname !== '/portal/complete-profile') {
              router.push('/portal/complete-profile');
              return;
            }
          } else {
            router.push(`/portal/login?redirect=${encodeURIComponent(pathname)}`);
          }
        }
      } catch {
        if (isMounted) router.push('/portal/login');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSession();
    return () => {
      isMounted = false;
    };
  }, [pathname, isAuthPage, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/portal/auth/logout', { method: 'POST' });
    } finally {
      router.push('/portal/login');
    }
  };

  if (isAuthPage) {
    return <div className="min-h-screen bg-slate-50 font-sans">{children}</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium tracking-wide">
          {t('পোর্টাল লোড হচ্ছে...', 'Loading Candidate Portal...')}
        </p>
      </div>
    );
  }

  const navItems = [
    {
      label: 'Dashboard',
      labelBn: 'ড্যাশবোর্ড',
      href: '/portal',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: 'Skill Training',
      labelBn: 'স্কিল ট্রেনিং',
      href: '/portal/training',
      icon: GraduationCap,
    },
    {
      label: 'Find Jobs',
      labelBn: 'চাকরির বিজ্ঞপ্তি',
      href: '/portal/jobs',
      icon: Briefcase,
    },
    {
      label: 'My Applications',
      labelBn: 'আমার আবেদন',
      href: '/portal/applications',
      icon: FileCheck2,
    },
    {
      label: 'Deployment & Processing',
      labelBn: 'নিয়োগ ও বিদেশযাত্রা প্রসেসিং',
      href: '/portal/processing',
      icon: Plane,
    },
    {
      label: 'Documents',
      labelBn: 'নথিপত্র',
      href: '/portal/documents',
      icon: FileText,
    },
    {
      label: 'Interviews',
      labelBn: 'সাক্ষাৎকার',
      href: '/portal/interviews',
      icon: Calendar,
    },
    {
      label: 'Visa Tracking',
      labelBn: 'ভিসা ট্র্যাকিং',
      href: '/portal/visa',
      icon: Stamp,
    },
    {
      label: 'Invoices',
      labelBn: 'ইনভয়েস ও রসিদ',
      href: '/portal/invoices',
      icon: Receipt,
    },
    {
      label: 'Payments',
      labelBn: 'পেমেন্ট হিস্ট্রি',
      href: '/portal/payments',
      icon: CreditCard,
    },
    {
      label: 'Activity',
      labelBn: 'কার্যক্রম',
      href: '/portal/activity',
      icon: Activity,
    },
    {
      label: 'Notifications',
      labelBn: 'নোটিফিকেশন',
      href: '/portal/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      label: 'Help & FAQ',
      labelBn: 'সহায়তা ও এফএকিউ',
      href: '/portal/help',
      icon: LifeBuoy,
    },
    {
      label: 'Support Tickets',
      labelBn: 'সাপোর্ট টিকিট',
      href: '/portal/support',
      icon: Headset,
    },
    {
      label: 'Profile',
      labelBn: 'প্রোফাইল',
      href: '/portal/profile',
      icon: User,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 h-16 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          {/* Brand & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/portal" className="flex items-center gap-2.5">
              <BrandLogo href="/portal" size="sm" variant="horizontal" showTagline={false} />
              <span className="hidden lg:inline-block text-[10px] text-slate-500 uppercase tracking-wider font-semibold border-l border-slate-200 pl-2.5">
                {BRAND.licenseNumber} • {t('প্রার্থী পোর্টাল', 'Candidate Portal')}
              </span>
            </Link>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="text-[11px] font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer select-none"
              aria-label="Toggle language"
            >
              {language === 'bn' ? 'English' : 'বাংলা'}
            </button>

            {/* Notification Icon */}
            <Link
              href="/portal/notifications"
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title={t('নোটিফিকেশন', 'Notifications')}
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-white" />
              )}
            </Link>

            <div className="h-6 w-px bg-slate-200 mx-0.5 hidden sm:block" />

            {/* Profile Avatar & Info */}
            <Link
              href="/portal/profile"
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ProfileAvatar
                src={applicant?.profilePhoto}
                name={applicant?.fullName}
                size="sm"
              />
              <div className="hidden lg:block text-left leading-tight">
                <div className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                  {applicant?.fullName || 'Candidate'}
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {applicant?.applicantNumber || 'Candidate ID'}
                </div>
              </div>
            </Link>

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title={t('সাইন আউট', 'Sign Out')}
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white p-3 space-y-1 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{language === 'bn' ? item.labelBn : item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-600 text-white font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <Link
                href="/"
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                <ExternalLink className="w-4 h-4 text-emerald-600" />
                <span>{t('মূল ওয়েবসাইট (হোমপেজ)', 'Main Website (Home)')}</span>
              </Link>
              <Link
                href="/jobs"
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-900"
              >
                <Briefcase className="w-4 h-4 text-slate-400" />
                <span>{t('বিদেশি চাকরির মূল পাতা', 'Public Job Portal')}</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Body with Left Sidebar */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="w-60 shrink-0 hidden md:flex flex-col justify-between border-r border-slate-200/90 bg-white py-5 px-3">
          <div className="space-y-6">
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t('প্রধান মেনু', 'Main Menu')}
              </div>
              <nav className="space-y-0.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                        isActive
                          ? 'bg-slate-900 text-white font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{language === 'bn' ? item.labelBn : item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive
                              ? 'bg-rose-500 text-white'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t('মূল ওয়েবসাইট', 'Main Website')}
              </div>
              <div className="space-y-0.5">
                <Link
                  href="/"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{t('মূল ওয়েবসাইট (হোম)', 'Main Website (Home)')}</span>
                </Link>
                <Link
                  href="/jobs"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <Briefcase className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>{t('বৈদেশিক চাকরির পাতা', 'Public Job Portal')}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Agency License Info Card */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Govt. Approved</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
              License No: {BRAND.licenseNumber}
              <br />
              <strong className="text-slate-700">{BRAND.name}</strong>
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 pb-20 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-center justify-around py-2 shadow-lg">
        {[
          { label: 'হোম', labelEn: 'Home', href: '/portal', icon: LayoutDashboard },
          { label: 'চাকরি', labelEn: 'Jobs', href: '/portal/jobs', icon: Briefcase },
          { label: 'আবেদন', labelEn: 'Applied', href: '/portal/applications', icon: FileCheck2 },
          { label: 'নথিপত্র', labelEn: 'Docs', href: '/portal/documents', icon: FileText },
          { label: 'প্রোফাইল', labelEn: 'Profile', href: '/portal/profile', icon: User },
        ].map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/portal'
              ? pathname === '/portal'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 text-[10px] py-1 px-3 rounded-lg transition-colors ${
                isActive ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{language === 'bn' ? item.label : item.labelEn}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
