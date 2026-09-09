/**
 * Centralized Brand Configuration for SHAKIL GLOBAL MANPOWER
 * Single source of truth for company identity, contacts, licensing, and brand assets.
 */

export const BRAND = {
  // Official Company Identity
  name: 'SHAKIL GLOBAL MANPOWER',
  shortName: 'Shakil Global',
  legalName: 'SHAKIL GLOBAL MANPOWER LTD.',
  bengaliName: 'শাকিল গ্লোবাল ম্যানপাওয়ার',

  // Taglines
  taglineBn: 'বিদেশে কর্মসংস্থান, বৈধ ভিসা ও জনশক্তি নিয়োগ',
  taglineEn: 'Manpower Recruitment & Overseas Employment',
  subTaglineBn: 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার ও বিএমইটি অনুমোদিত আন্তর্জাতিক রিক্রুটিং এজেন্সি',
  subTaglineEn: 'Govt. Approved International Recruiting Agency (RL-1892)',

  // Government Licensing
  licenseNumber: 'RL-1892',
  bmetApproved: true,

  // Contact Information
  phone: '01913681771',
  phoneTel: 'tel:01913681771',
  phoneDisplay: '01913681771',
  phoneFormatted: '+880 1913-681771',
  whatsappUrl: 'https://wa.me/8801913681771',
  email: 'info@shakilglobal.com',
  accountsEmail: 'accounts@shakilglobal.com',
  supportEmail: 'support@shakilglobal.com',
  complianceEmail: 'compliance@shakilglobal.com',
  website: 'https://shakilglobal.com',

  // Registered Office Addresses
  addressBn: 'ইসলামপুর মোড়, ডায়াবেটিক হাসপাতালের সামনে, পাসপোর্ট অফিস রোড, নেত্রকোনা-২৪০০',
  addressEn: 'Islampur Mor, In Front of Diabetic Hospital, Passport Office Road, Netrokona-2400',

  // Operational Hours
  hoursBn: 'শনিবার - বৃহস্পতিবার: সকাল ৯:০০ - সন্ধ্যা ৬:০০ (শুক্রবার সাপ্তাহিক ছুটি)',
  hoursEn: 'Sat - Thu: 9:00 AM - 6:00 PM (Friday Closed)',

  // Public Support Hotlines
  probashiHelpline: '16135',
  antiFraudDesk: 'compliance@shakilglobal.com',

  // Vector Brand Assets
  logos: {
    mark: '/brand/logo-mark.svg',
    full: '/brand/logo.svg',
    light: '/brand/logo-light.svg',
    dark: '/brand/logo-dark.svg',
    favicon: '/brand/favicon.svg',
  },

  // SEO & Metadata Descriptions
  seo: {
    titleTemplate: '%s | SHAKIL GLOBAL MANPOWER',
    defaultTitle: 'SHAKIL GLOBAL MANPOWER — আন্তর্জাতিক জনশক্তি নিয়োগ ও অভিবাসন কনসালটেন্সি',
    descriptionBn:
      'SHAKIL GLOBAL MANPOWER — বিদেশে কর্মসংস্থান, জনশক্তি নিয়োগ, চাকরি, ভিসা ও প্রবাস সংক্রান্ত তথ্যের জন্য একটি পেশাদার প্ল্যাটফর্ম। সরকারি লাইসেন্স RL-1892।',
    descriptionEn:
      'SHAKIL GLOBAL MANPOWER — Professional manpower recruitment, overseas employment, jobs, visa information and migrant support. Licensed agency RL-1892.',
    keywords: [
      'SHAKIL GLOBAL MANPOWER',
      'Shakil Global Manpower Netrokona',
      'Overseas Employment Bangladesh',
      'BMET Approved Recruiting Agency',
      'Saudi Arabia Work Visa',
      'Middle East Jobs Bangladesh',
      'Professional Manpower Recruitment',
      'শাকিল গ্লোবাল ম্যানপাওয়ার',
      'বিদেশে চাকরি নেত্রকোনা',
      'রিক্রুটিং এজেন্সি নেত্রকোনা',
    ],
  },
} as const;

export type BrandConfig = typeof BRAND;
