import type { Metadata } from 'next';
import { Inter, Noto_Sans_Bengali } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast';
import { LanguageProvider } from '@/context/language-context';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-noto-bengali',
  display: 'swap',
});

import { BRAND } from '@/config/brand';

export const metadata: Metadata = {
  title: {
    template: BRAND.seo.titleTemplate,
    default: BRAND.seo.defaultTitle,
  },
  description: BRAND.seo.descriptionBn,
  keywords: [...BRAND.seo.keywords],
  authors: [{ name: BRAND.name }],
  icons: {
    icon: [
      { url: '/brand/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    shortcut: '/favicon.ico',
    apple: '/brand/logo-mark.svg',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'bn_BD',
    url: '/',
    siteName: BRAND.name,
    title: `${BRAND.name} — আন্তর্জাতিক জনশক্তি নিয়োগ`,
    description: BRAND.seo.descriptionBn,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className={`${inter.variable} ${notoSansBengali.variable}`}>
      <body className="min-h-screen flex flex-col font-sans">
        <LanguageProvider>
          <ToastProvider>{children}</ToastProvider>
        </LanguageProvider>
      </body>

    </html>
  );
}
