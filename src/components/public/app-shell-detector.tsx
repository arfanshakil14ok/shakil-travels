'use client';

import { useEffect } from 'react';

/**
 * Detects if the ERP website is being rendered inside the native Android App or mobile simulator
 * and applies the mobile-app optimization classes so there are no duplicate headers or footers.
 */
export function AppShellDetector() {
  useEffect(() => {
    try {
      const inIframe = typeof window !== 'undefined' && window.self !== window.top;
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const hasAppParam = urlParams?.has('app') || urlParams?.get('source') === 'app';
      const isMobileUserAgent = typeof navigator !== 'undefined' && (
        navigator.userAgent.includes('ShakilTravelsApp') ||
        navigator.userAgent.includes('wv') // Android WebView
      );

      if (inIframe || hasAppParam || isMobileUserAgent) {
        document.body.classList.add('in-mobile-app');
      }
    } catch {
      // In case of cross-origin iframe security restrictions
      document.body.classList.add('in-mobile-app');
    }
  }, []);

  return null;
}
