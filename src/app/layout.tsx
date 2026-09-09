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

export const metadata: Metadata = {
  title: {
    template: '%s | SHAKIL GLOBAL RECRUITMENT',
    default: 'SHAKIL GLOBAL RECRUITMENT — আন্তর্জাতিক জনশক্তি নিয়োগ ও অভিবাসন কনসালটেন্সি',
  },
  description:
    'বাংলাদেশ সরকারের অনুমোদিত বৈধ ও নিরাপদ আন্তর্জাতিক রিক্রুটিং ও অভিবাসন কনসালটেন্সি প্ল্যাটফর্ম। সৌদি আরব, কাতার, মালয়েশিয়া সহ বিভিন্ন দেশে কর্মসংস্থান।',
  keywords: [
    'Shakil Global Recruitment',
    'Overseas Jobs Bangladesh',
    'BMET Approved Recruitment',
    'Saudi Arabia Visa',
    'Manpower Agency Dhaka',
    'শাকিল গ্লোবাল রিক্রুটমেন্ট',
    'বিদেশে চাকরি',
  ],
  authors: [{ name: 'SHAKIL GLOBAL RECRUITMENT' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'bn_BD',
    url: '/',
    siteName: 'SHAKIL GLOBAL RECRUITMENT',
    title: 'SHAKIL GLOBAL RECRUITMENT — আন্তর্জাতিক জনশক্তি নিয়োগ',
    description:
      'বিদেশে আপনার ক্যারিয়ারের নতুন সুযোগ শুরু হোক এখান থেকেই। নির্ভরযোগ্য সরকারি অনুমোদনপ্রাপ্ত অভিবাসন প্ল্যাটফর্ম।',
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
