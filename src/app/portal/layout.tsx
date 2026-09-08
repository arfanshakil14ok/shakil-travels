'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Globe,
  Home,
  Briefcase,
  FileCheck2,
  FileText,
  Stamp,
  Bell,
  User,
  LogOut,
  CreditCard,
  Calendar,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [applicant, setApplicant] = useState<any | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthPage =
    pathname.startsWith('/portal/login') ||
    pathname.startsWith('/portal/register') ||
    pathname.startsWith('/portal/forgot-password');

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
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950">{children}</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Loading Candidate Portal...</p>
      </div>
    );
  }

  const navLinks = [
    { label: 'Dashboard', href: '/portal', icon: Home },
    { label: 'Find Jobs', href: '/portal/jobs', icon: Briefcase },
    { label: 'My Applications', href: '/portal/applications', icon: FileCheck2 },
    { label: 'Documents', href: '/portal/documents', icon: FileText },
    { label: 'Interviews', href: '/portal/interviews', icon: Calendar },
    { label: 'Visa Tracking', href: '/portal/visa', icon: Stamp },
    { label: 'Billing & Receipts', href: '/portal/invoices', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground flex flex-col pb-16 md:pb-0">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/portal" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow">
                SG
              </div>
              <div className="leading-tight">
                <span className="font-bold text-base text-foreground block">SHAKIL GLOBAL</span>
                <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">
                  Candidate Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/portal/notifications"
              className="relative p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <Link
              href="/portal/profile"
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
                {applicant?.fullName?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                  {applicant?.fullName}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">
                  {applicant?.applicantNumber}
                </div>
              </div>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-rose-600 p-2"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card p-4 space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">{children}</main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex items-center justify-around py-2 shadow-lg">
        {[
          { label: 'Home', href: '/portal', icon: Home },
          { label: 'Jobs', href: '/portal/jobs', icon: Briefcase },
          { label: 'Applied', href: '/portal/applications', icon: FileCheck2 },
          { label: 'Docs', href: '/portal/documents', icon: FileText },
          { label: 'Profile', href: '/portal/profile', icon: User },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-[11px] py-1 px-3 rounded-lg transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
