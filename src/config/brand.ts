/**
 * Centralized Brand Configuration for SHAKIL TRAVELS
 * Single source of truth for company identity, contacts, brand assets, and positioning.
 * Updated to reflect 7 years of professional experience in overseas employment-related work
 * serving Netrokona and surrounding areas.
 */

export const BRAND = {
  // Official Company Identity
  name: 'SHAKIL TRAVELS',
  shortName: 'SHAKIL TRAVELS',
  legalName: 'SHAKIL TRAVELS',
  bengaliName: 'শাকিল ট্রাভেলস',
  agencyName: 'SHAKIL TRAVELS',
  agencyNameBn: 'শাকিল ট্রাভেলস',

  // Core Brand Messages & Positioning
  positioningBn: '৭ বছরের অভিজ্ঞতায় বিদেশে কর্মসংস্থানের প্রস্তুতিতে আপনার পাশে।',
  positioningSupportBn:
    'নেত্রকোনার মানুষের জন্য বিদেশে কর্মসংস্থানসংক্রান্ত তথ্য, সঠিক দিকনির্দেশনা ও বৈধ প্রক্রিয়ায় সহযোগিতা।',
  taglineBn: '৭ বছরের অভিজ্ঞতায় বিদেশে কর্মসংস্থানের প্রস্তুতিতে আপনার পাশে।',
  taglineEn: 'Overseas Employment Information, Guidance & Legal Process Support',
  subTaglineBn:
    'নেত্রকোনার মানুষের জন্য বিদেশে কর্মসংস্থানসংক্রান্ত তথ্য, সঠিক দিকনির্দেশনা ও বৈধ প্রক্রিয়ায় সহযোগিতা।',
  subTaglineEn:
    'Overseas employment information and guidance in Netrokona based on 7 years of professional experience.',

  // Licensing flags (empty string to avoid false claims while preserving type compatibility)
  licenseNumber: '',
  bmetApproved: false,

  // Founder & Industry Experience
  experienceYears: 7,
  founderExperienceBn: 'বিদেশে কর্মসংস্থানসংক্রান্ত কাজে ৭ বছরের অভিজ্ঞতা',

  // Contact Information
  phone: '01913681771',
  altPhone: '01604836148',
  phoneTel: 'tel:01913681771',
  altPhoneTel: 'tel:01604836148',
  phoneDisplay: '01913681771',
  altPhoneDisplay: '01604836148',
  phoneFormatted: '+880 1913-681771',
  altPhoneFormatted: '+880 1604-836148',
  whatsappUrl: 'https://wa.me/8801913681771',
  email: 'info@shakiltravels.com',
  accountsEmail: 'accounts@shakiltravels.com',
  supportEmail: 'support@shakiltravels.com',
  complianceEmail: 'support@shakiltravels.com',
  website: 'https://shakiltravels.com',

  // Registered Office Addresses
  addressBn: 'ইসলামপুর মোড়, ডায়াবেটিস হাসপাতালের সামনে, নেত্রকোনা',
  addressEn: 'Islampur Mor, In Front of Diabetic Hospital, Netrokona',

  // Operational Hours
  hoursBn: 'শনিবার - বৃহস্পতিবার: সকাল ৯:০০ - সন্ধ্যা ৬:০০ (শুক্রবার সাপ্তাহিক ছুটি)',
  hoursEn: 'Sat - Thu: 9:00 AM - 6:00 PM (Friday Closed)',

  // Public Support Hotlines
  probashiHelpline: '16135',
  antiFraudDesk: 'support@shakiltravels.com',

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
    titleTemplate: '%s | শাকিল ট্রাভেলস',
    defaultTitle: 'বিদেশে কর্মসংস্থান ও চাকরির তথ্য | শাকিল ট্রাভেলস',
    descriptionBn:
      'নেত্রকোনায় বিদেশে কর্মসংস্থানসংক্রান্ত তথ্য, চাকরির সুযোগ, আবেদনপ্রক্রিয়া ও নিরাপদ অভিবাসন সম্পর্কে দিকনির্দেশনা। ৭ বছরের অভিজ্ঞতার ভিত্তিতে সহযোগিতা।',
    descriptionEn:
      'Overseas employment information, guidance, application procedures and safe migration awareness in Netrokona based on 7 years of professional experience.',
    keywords: [
      'নেত্রকোনায় বিদেশে চাকরি',
      'বিদেশে কর্মসংস্থান',
      'বিদেশে চাকরির তথ্য',
      'বৈধ অভিবাসন',
      'বিদেশে চাকরির আবেদন',
      'manpower services Netrokona',
      'শাকিল ট্রাভেলস',
      'Shakil Travels Netrokona',
    ],
  },
} as const;

export type BrandConfig = typeof BRAND;
