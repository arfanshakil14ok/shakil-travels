'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'bn' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (bnText: string, enText: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'bn',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (bnText: string, _enText: string) => bnText,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('bn');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sgr_lang');
      if (saved === 'en' || saved === 'bn') {
        setLanguageState(saved);
      }
    } catch {
      // ignore
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sgr_lang' && (e.newValue === 'en' || e.newValue === 'bn')) {
        setLanguageState(e.newValue);
      }
    };

    const handleCustomChange = (e: any) => {
      if (e.detail === 'en' || e.detail === 'bn') {
        setLanguageState(e.detail);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sgr_lang_change', handleCustomChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sgr_lang_change', handleCustomChange);
    };
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('sgr_lang', lang);
      window.dispatchEvent(new CustomEvent('sgr_lang_change', { detail: lang }));
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  const t = (bnText: string, enText: string) => {
    return language === 'bn' ? bnText : enText;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
