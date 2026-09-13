'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Menu,
  X,
  LogIn,
  LogOut,
  UserPlus,
  Search,
  Globe,
  ChevronDown,
  UserRound,
  Lock,
  Phone,
  Mail,
  Briefcase,
  Globe2,
  FileText,
  LifeBuoy,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  LayoutDashboard,
  FileCheck2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils';
import { POPULAR_COUNTRIES_NAV } from '@/lib/image-constants';
import { BRAND } from '@/config/brand';
import { BrandLogo } from '@/components/brand/brand-logo';
import { ProfileAvatar } from '@/components/ui/profile-avatar';

interface SessionState {
  authenticated: boolean;
  type?: 'APPLICANT' | 'STAFF' | null;
  role?: string | null;
  user?: {
    id?: string;
    name?: string;
    email?: string | null;
    phone?: string | null;
    applicantNumber?: string | null;
    roleTitle?: string | null;
    avatarUrl?: string | null;
  } | null;
  dashboardUrl?: string | null;
}

export const PublicHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSignInDropdownOpen, setIsSignInDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isCountriesDropdownOpen, setIsCountriesDropdownOpen] = useState(false);
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');

  const [session, setSession] = useState<SessionState>({
    authenticated: false,
  });

  const signInRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const countriesRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Load session state safely without blocking SSR
  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session-state', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setSession(data);
          }
        }
      } catch {
        if (isMounted) {
          setSession({ authenticated: false });
        }
      }
    }
    checkSession();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (signInRef.current && !signInRef.current.contains(event.target as Node)) {
        setIsSignInDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
      if (countriesRef.current && !countriesRef.current.contains(event.target as Node)) {
        setIsCountriesDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when activated
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/jobs?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (session.type === 'APPLICANT') {
        await fetch('/api/portal/auth/logout', { method: 'POST' });
      } else {
        await fetch('/api/auth/logout', { method: 'POST' });
      }
      setSession({ authenticated: false });
      setIsUserDropdownOpen(false);
      setIsMobileMenuOpen(false);
      router.push('/');
      router.refresh();
    } catch {
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs transition-all">
      {/* Top Micro Announcement & Quick Contact Bar */}
      <div className="bg-navy-950 text-slate-300 text-[11px] py-1.5 px-4 sm:px-8 border-b border-navy-900 font-sans">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-bengali text-slate-200 font-medium hidden sm:inline">
              {language === 'bn'
                ? `গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত রিক্রুটিং লাইসেন্স (${BRAND.licenseNumber})`
                : `Govt. Approved International Recruiting Agency (${BRAND.licenseNumber})`}
            </span>
            <span className="font-bengali text-slate-200 font-medium sm:hidden">
              {BRAND.licenseNumber} অনুমোদিত
            </span>
            <span className="text-slate-600 hidden md:inline">•</span>
            <Link
              href="/scam-awareness"
              className="text-rose-300 hover:text-rose-200 transition-colors font-bengali hidden md:inline-flex items-center gap-1"
            >
              <ShieldAlert className="w-3 h-3" />
              <span>প্রতারণা রোধে হেল্পলাইন: ১৬১৩৫</span>
            </Link>
          </div>

          <div className="flex items-center gap-4 text-slate-300 font-mono text-[11px]">
            <a
              href="tel:01913681771"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <Phone className="w-3 h-3 text-gold-400" />
              <span className="hidden sm:inline">01913681771</span>
              <span className="sm:hidden">হটলাইন</span>
            </a>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <a
              href="mailto:info@shakilglobal.com"
              className="hidden lg:flex items-center gap-1 hover:text-white transition-colors"
            >
              <Mail className="w-3 h-3 text-gold-400" />
              <span>info@shakilglobal.com</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo (Always links directly to / without resetting session) */}
        <BrandLogo href="/" size="md" variant="horizontal" />

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center space-x-1 xl:space-x-1.5" aria-label="Main Navigation">
          <Link
            href="/"
            className={cn(
              'px-3 py-2 rounded-lg text-xs xl:text-sm font-semibold transition-colors font-bengali',
              pathname === '/'
                ? 'text-emerald-800 bg-emerald-50'
                : 'text-slate-700 hover:text-navy-950 hover:bg-slate-100/70'
            )}
          >
            {language === 'bn' ? 'হোম' : 'Home'}
          </Link>

          <Link
            href="/jobs"
            className={cn(
              'px-3 py-2 rounded-lg text-xs xl:text-sm font-semibold transition-colors font-bengali flex items-center gap-1',
              pathname === '/jobs'
                ? 'text-emerald-800 bg-emerald-50'
                : 'text-slate-700 hover:text-navy-950 hover:bg-slate-100/70'
            )}
          >
            <span>{language === 'bn' ? 'চাকরি' : 'Jobs'}</span>
            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-mono rounded-full font-bold">
              নতুন
            </span>
          </Link>

          {/* Interactive Countries Dropdown Menu */}
          <div className="relative" ref={countriesRef}>
            <button
              onClick={() => setIsCountriesDropdownOpen(!isCountriesDropdownOpen)}
              onMouseEnter={() => setIsCountriesDropdownOpen(true)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs xl:text-sm font-semibold transition-colors font-bengali flex items-center gap-1',
                pathname?.startsWith('/countries')
                  ? 'text-emerald-800 bg-emerald-50'
                  : 'text-slate-700 hover:text-navy-950 hover:bg-slate-100/70'
              )}
            >
              <span>{language === 'bn' ? 'দেশসমূহ' : 'Countries'}</span>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 text-slate-400 transition-transform duration-200',
                  isCountriesDropdownOpen && 'rotate-180 text-emerald-600'
                )}
              />
            </button>

            {/* Countries Mega Dropdown */}
            {isCountriesDropdownOpen && (
              <div
                onMouseLeave={() => setIsCountriesDropdownOpen(false)}
                className="absolute top-full left-0 mt-1 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 animate-fadeIn font-sans"
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 font-bengali">
                  <div className="flex items-center gap-2">
                    <Globe2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-slate-900">জনপ্রিয় গন্তব্য দেশসমূহ</span>
                  </div>
                  <Link
                    href="/countries"
                    onClick={() => setIsCountriesDropdownOpen(false)}
                    className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                  >
                    সকল দেশ ({POPULAR_COUNTRIES_NAV.length}+) <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {POPULAR_COUNTRIES_NAV.map((c) => (
                    <Link
                      key={c.code}
                      href={`/countries/${c.slug}`}
                      onClick={() => setIsCountriesDropdownOpen(false)}
                      className="p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 flex items-center gap-2.5 transition-all group"
                    >
                      <div className="relative w-6 h-4 rounded-xs overflow-hidden shadow-2xs border border-slate-200 flex-shrink-0">
                        <Image src={c.flag} alt={c.name} fill className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 truncate font-bengali">
                          {c.nameBn}
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans truncate">{c.name}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/skill-training"
            className={cn(
              'px-3 py-2 rounded-lg text-xs xl:text-sm font-semibold transition-colors font-bengali flex items-center gap-1',
              pathname?.startsWith('/skill-training')
                ? 'text-emerald-800 bg-emerald-50'
                : 'text-slate-700 hover:text-navy-950 hover:bg-slate-100/70'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-gold-500" />
            <span>{language === 'bn' ? 'স্কিল ট্রেনিং' : 'Training'}</span>
          </Link>

          <Link
            href="/verify-certificate"
            className={cn(
              'px-3 py-2 rounded-lg text-xs xl:text-sm font-semibold transition-colors font-bengali flex items-center gap-1',
              pathname?.startsWith('/verify-certificate')
                ? 'text-emerald-800 bg-emerald-50'
                : 'text-slate-700 hover:text-navy-950 hover:bg-slate-100/70'
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === 'bn' ? 'সার্টিফিকেট যাচাই' : 'Verify Certificate'}</span>
          </Link>

          <Link
            href="/visa-information"
            className={cn(
              'px-3 py-2 rounded-lg text-xs xl:text-sm font-semibold transition-colors font-bengali',
              pathname?.startsWith('/visa-information')
                ? 'text-emerald-800 bg-emerald-50'
                : 'text-slate-700 hover:text-navy-950 hover:bg-slate-100/70'
            )}
          >
            {language === 'bn' ? 'ভিসা তথ্য' : 'Visa Info'}
          </Link>

          <Link
            href="/migrant-information"
            className={cn(
              'px-3 py-2 rounded-lg text-xs xl:text-sm font-semibold transition-colors font-bengali',
              pathname?.startsWith('/migrant-information')
                ? 'text-emerald-800 bg-emerald-50'
                : 'text-slate-700 hover:text-navy-950 hover:bg-slate-100/70'
            )}
          >
            {language === 'bn' ? 'প্রবাসী তথ্য' : 'Migrant Info'}
          </Link>

          <Link
            href="/about"
            className={cn(
              'px-3 py-2 rounded-lg text-xs xl:text-sm font-semibold transition-colors font-bengali',
              pathname === '/about'
                ? 'text-emerald-800 bg-emerald-50'
                : 'text-slate-700 hover:text-navy-950 hover:bg-slate-100/70'
            )}
          >
            {language === 'bn' ? 'আমাদের সম্পর্কে' : 'About Us'}
          </Link>

          <Link
            href="/contact"
            className={cn(
              'px-3 py-2 rounded-lg text-xs xl:text-sm font-semibold transition-colors font-bengali',
              pathname === '/contact'
                ? 'text-emerald-800 bg-emerald-50'
                : 'text-slate-700 hover:text-navy-950 hover:bg-slate-100/70'
            )}
          >
            {language === 'bn' ? 'যোগাযোগ' : 'Contact'}
          </Link>
        </nav>

        {/* Right Action Bar: Search, Language, Auth / Dashboard CTAs */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Desktop Search Trigger / Input */}
          <div className="relative hidden md:block">
            {isSearchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={language === 'bn' ? 'পদবী বা দেশ দিয়ে খুঁজুন...' : 'Search job or country...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-52 lg:w-64 pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 placeholder:text-slate-400 font-bengali"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
                  aria-label="Close search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors font-bengali"
                aria-label="Open search"
              >
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden xl:inline">{language === 'bn' ? 'অনুসন্ধান' : 'Search'}</span>
              </button>
            )}
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            aria-label="Toggle language"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>{language === 'bn' ? 'EN' : 'বাং'}</span>
          </button>

          {/* Dynamic Authenticated State VS Unauthenticated Sign In */}
          {session.authenticated ? (
            /* Authenticated User Menu */
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                aria-label="User profile menu"
              >
                <ProfileAvatar
                  name={session.user?.name || 'User'}
                  photoUrl={session.user?.avatarUrl}
                  size="sm"
                  className="w-7 h-7"
                />
                <div className="hidden xl:flex flex-col text-left leading-tight pr-1">
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                    {session.user?.name || 'My Account'}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium">
                    {session.type === 'APPLICANT' ? (language === 'bn' ? 'প্রার্থী' : 'Applicant') : (session.user?.roleTitle || 'Staff')}
                  </span>
                </div>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 text-slate-400 transition-transform duration-200',
                    isUserDropdownOpen && 'rotate-180 text-emerald-600'
                  )}
                />
              </button>

              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 text-slate-800 animate-fadeIn font-sans">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {session.user?.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate font-mono">
                      {session.user?.phone || session.user?.email || session.user?.applicantNumber || 'Active User'}
                    </p>
                    <div className="mt-1.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {session.type === 'APPLICANT' ? 'Candidate Portal' : (session.user?.roleTitle || 'Staff Console')}
                    </div>
                  </div>

                  <div className="py-1 font-bengali text-xs">
                    <Link
                      href={session.dashboardUrl || '/portal'}
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 text-slate-700 font-semibold"
                    >
                      <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                      <span>{language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
                    </Link>

                    {session.type === 'APPLICANT' && (
                      <>
                        <Link
                          href="/portal/profile"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700"
                        >
                          <UserRound className="w-4 h-4 text-slate-400" />
                          <span>{language === 'bn' ? 'আমার প্রোফাইল' : 'My Profile'}</span>
                        </Link>
                        <Link
                          href="/portal/applications"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700"
                        >
                          <FileCheck2 className="w-4 h-4 text-slate-400" />
                          <span>{language === 'bn' ? 'আমার আবেদনসমূহ' : 'My Applications'}</span>
                        </Link>
                      </>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 font-bold transition-colors font-bengali text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>{language === 'bn' ? 'সাইন আউট (লগআউট)' : 'Sign Out'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Unauthenticated Sign In Dropdown */
            <div className="relative" ref={signInRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSignInDropdownOpen(!isSignInDropdownOpen)}
                leftIcon={<LogIn className="w-3.5 h-3.5 text-slate-700" />}
                rightIcon={
                  <ChevronDown
                    className={cn(
                      'w-3 h-3 text-slate-500 transition-transform duration-200',
                      isSignInDropdownOpen && 'rotate-180 text-emerald-600'
                    )}
                  />
                }
                className="text-xs font-semibold border-slate-300 text-slate-800 hover:bg-slate-50 font-bengali"
              >
                {language === 'bn' ? 'লগইন' : 'Sign In'}
              </Button>

              {isSignInDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 text-slate-800 animate-fadeIn font-sans">
                  <div className="px-3.5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    {language === 'bn' ? 'লগইন পোর্টাল নির্বাচন করুন' : 'Select Access Portal'}
                  </div>

                  {/* Option 1: Applicant Portal */}
                  <Link
                    href="/portal/login"
                    onClick={() => setIsSignInDropdownOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-emerald-50 text-left transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-2xs">
                      <UserRound className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-800 font-bengali">
                        {language === 'bn' ? 'প্রার্থী পোর্টাল লগইন' : 'Applicant Portal Login'}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-0.5 font-bengali">
                        {language === 'bn' ? 'আবেদন, ট্রেনিং ও ভিসা স্ট্যাটাস ট্র্যাক করুন' : 'Track your applications, training & visa'}
                      </div>
                    </div>
                  </Link>

                  {/* Option 2: Staff ERP */}
                  <Link
                    href="/staff/login"
                    onClick={() => setIsSignInDropdownOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-navy-50 text-left transition-colors group border-t border-slate-100"
                  >
                    <div className="w-9 h-9 rounded-xl bg-navy-100 text-navy-800 flex items-center justify-center flex-shrink-0 group-hover:bg-navy-950 group-hover:text-white transition-all shadow-2xs">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 group-hover:text-navy-900 font-bengali">
                        {language === 'bn' ? 'স্টাফ / অফিসার ERP লগইন' : 'Staff ERP Login'}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-0.5 font-bengali">
                        {language === 'bn' ? 'ট্রেনিং, ভিসা ও পোস্ট-সিলেকশন অফিসার' : 'Departmental officers & staff operations'}
                      </div>
                    </div>
                  </Link>

                  {/* Option 3: Super Admin */}
                  <Link
                    href="/admin/login"
                    onClick={() => setIsSignInDropdownOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-100 text-left transition-colors group border-t border-slate-100"
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-800 group-hover:text-white transition-all shadow-2xs">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 group-hover:text-slate-900 font-bengali">
                        {language === 'bn' ? 'সুপার অ্যাডমিন কনসোল' : 'Super Admin Console'}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-0.5 font-bengali">
                        {language === 'bn' ? 'পূর্ণাঙ্গ সিস্টেম ও হিসাব নিয়ন্ত্রণ' : 'Master management, security & audit'}
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* High-Visibility Quick Action: Dashboard if logged in, Create Account if not */}
          {session.authenticated ? (
            <Link href={session.dashboardUrl || '/portal'} className="hidden sm:block">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<LayoutDashboard className="w-3.5 h-3.5 text-white" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-emerald-600/25 transition-all px-3.5 font-bengali"
              >
                {language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}
              </Button>
            </Link>
          ) : (
            <Link href="/portal/register" className="hidden sm:block">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<UserPlus className="w-3.5 h-3.5 text-white" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-emerald-600/25 transition-all px-3.5 font-bengali"
              >
                {language === 'bn' ? 'অ্যাকাউন্ট খুলুন' : 'Create Account'}
              </Button>
            </Link>
          )}

          {/* Mobile Hamburger Toggle */}
          <IconButton
            variant="ghost"
            size="md"
            aria-label="Open mobile navigation menu"
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-slate-700 lg:hidden"
          >
            <Menu className="w-6 h-6" aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      {/* Mobile App-Like Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 max-w-sm w-full bg-white shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <BrandLogo href="/" size="sm" variant="horizontal" />
                <IconButton
                  variant="ghost"
                  size="sm"
                  aria-label="Close mobile navigation menu"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="w-5 h-5 text-slate-600" aria-hidden="true" />
                </IconButton>
              </div>

              {/* Mobile Auth Status Banner */}
              {session.authenticated && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between font-bengali">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      {session.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                        {session.user?.name}
                      </div>
                      <div className="text-[10px] text-emerald-800 font-mono">
                        {session.type === 'APPLICANT' ? 'Candidate' : (session.user?.roleTitle || 'Staff')}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={session.dashboardUrl || '/portal'}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-2.5 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-lg hover:bg-emerald-700"
                  >
                    ড্যাশবোর্ড
                  </Link>
                </div>
              )}

              {/* Mobile Search */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'পদবী বা দেশ দিয়ে খুঁজুন...' : 'Search jobs or country...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bengali"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </form>

              {/* Nav Links */}
              <div className="space-y-1 font-bengali">
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'block px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                    pathname === '/' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {language === 'bn' ? 'হোম' : 'Home'}
                </Link>

                <Link
                  href="/jobs"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                    pathname === '/jobs' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <span>{language === 'bn' ? 'আন্তর্জাতিক চাকরি' : 'Overseas Jobs'}</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    চলমান
                  </span>
                </Link>

                <Link
                  href="/skill-training"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                    pathname?.startsWith('/skill-training') ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold-500" />
                    <span>{language === 'bn' ? 'স্কিল ট্রেনিং ও কোর্স' : 'Skill Training'}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                    ট্রেনিং
                  </span>
                </Link>

                <Link
                  href="/training-centers"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'block px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                    pathname === '/training-centers' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {language === 'bn' ? 'অনুমোদিত ট্রেনিং সেন্টার' : 'Accredited Centers'}
                </Link>

                <Link
                  href="/verify-certificate"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                    pathname?.startsWith('/verify-certificate') ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'bn' ? 'সার্টিফিকেট যাচাই' : 'Verify Certificate'}</span>
                </Link>

                <Link
                  href="/countries"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'block px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                    pathname === '/countries' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {language === 'bn' ? 'গন্তব্য দেশসমূহ' : 'Destination Countries'}
                </Link>

                <Link
                  href="/visa-information"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'block px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                    pathname?.startsWith('/visa-information') ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {language === 'bn' ? 'ভিসা ও ওয়ার্ক পারমিট' : 'Visa & Permits'}
                </Link>

                <Link
                  href="/migrant-information"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'block px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                    pathname?.startsWith('/migrant-information') ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {language === 'bn' ? 'প্রবাসী তথ্য ও সুরক্ষা' : 'Migrant Information'}
                </Link>

                <Link
                  href="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'block px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                    pathname === '/about' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {language === 'bn' ? 'আমাদের সম্পর্কে' : 'About Us'}
                </Link>

                <Link
                  href="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'block px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                    pathname === '/contact' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {language === 'bn' ? 'যোগাযোগ ও সহায়তা' : 'Contact'}
                </Link>
              </div>

              {/* Popular Countries Chips in Mobile Drawer */}
              <div className="pt-2 border-t border-slate-100 font-bengali">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  জনপ্রিয় দেশ
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {POPULAR_COUNTRIES_NAV.slice(0, 6).map((c) => (
                    <Link
                      key={c.code}
                      href={`/countries/${c.slug}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
                    >
                      <div className="relative w-5 h-3.5 rounded-xs overflow-hidden flex-shrink-0">
                        <Image src={c.flag} alt={c.name} fill className="object-cover" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 truncate">{c.nameBn}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Footer CTAs */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-3 font-bengali">
              {session.authenticated ? (
                <>
                  <Link
                    href={session.dashboardUrl || '/portal'}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block"
                  >
                    <Button
                      variant="primary"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white justify-center text-xs font-bold py-3 flex items-center gap-2 shadow-md"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      {language === 'bn' ? 'আমার ড্যাশবোর্ডে যান' : 'Go to Dashboard'}
                    </Button>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full p-2.5 rounded-xl border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {language === 'bn' ? 'সাইন আউট (লগআউট)' : 'Sign Out'}
                  </button>
                </>
              ) : (
                <>
                  {/* Create Applicant Account */}
                  <Link
                    href="/portal/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block"
                  >
                    <Button
                      variant="primary"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white justify-center text-xs font-bold py-3 flex items-center gap-2 shadow-md"
                    >
                      <UserPlus className="w-4 h-4" />
                      {language === 'bn' ? 'প্রার্থী অ্যাকাউন্ট খুলুন' : 'Create Applicant Account'}
                    </Button>
                  </Link>

                  {/* Applicant Login */}
                  <Link
                    href="/portal/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block"
                  >
                    <Button
                      variant="outline"
                      className="w-full border-slate-300 text-slate-800 justify-center text-xs font-bold py-2.5 flex items-center gap-2 hover:bg-white"
                    >
                      <UserRound className="w-4 h-4 text-emerald-600" />
                      {language === 'bn' ? 'প্রার্থী লগইন (Applicant Portal)' : 'Applicant Portal Login'}
                    </Button>
                  </Link>

                  {/* Staff Login */}
                  <Link
                    href="/admin/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-center pt-1"
                  >
                    <span className="text-xs text-slate-500 hover:text-navy-950 font-semibold inline-flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      {language === 'bn' ? 'স্টাফ / অ্যাডমিন ERP লগইন' : 'Staff ERP Login'}
                    </span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
