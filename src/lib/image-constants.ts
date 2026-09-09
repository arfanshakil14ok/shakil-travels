/**
 * Image System Constants and Fallbacks
 * SHAKIL GLOBAL MANPOWER Public Portal
 *
 * Professional, high-resolution imagery for countries, job categories,
 * hero banners, and visa documentation.
 */

export interface ImageAsset {
  src: string;
  alt: string;
  credit?: string;
}

// Hero and Platform Banners
export const HERO_IMAGES = {
  mainRecruitment: {
    src: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=1200&q=80',
    alt: 'Professional international engineering and construction workforce on site',
  },
  technicalWorkforce: {
    src: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    alt: 'Certified industrial technicians and engineers operating precision machinery',
  },
  caregivers: {
    src: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=80',
    alt: 'Healthcare and specialized caregiving staff in professional medical facility',
  },
  aviationDeparture: {
    src: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
    alt: 'International commercial airplane preparing for overseas worker departure',
  },
  careerAssessment: {
    src: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1000&q=80',
    alt: 'Professional career counseling and skill eligibility evaluation session',
  },
};

// Destination Country Images (Key landmarks and cityscapes)
export const COUNTRY_IMAGES: Record<string, ImageAsset> = {
  SA: {
    src: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=800&q=80',
    alt: 'Riyadh skyline Kingdom of Saudi Arabia modern infrastructure',
  },
  AE: {
    src: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    alt: 'Dubai United Arab Emirates architectural skyline and business center',
  },
  QA: {
    src: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=800&q=80',
    alt: 'Doha Qatar modern commercial towers and corniche',
  },
  KW: {
    src: 'https://images.unsplash.com/photo-1549918864-48ac978761a4?auto=format&fit=crop&w=800&q=80',
    alt: 'Kuwait City modern architecture and towers',
  },
  OM: {
    src: 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?auto=format&fit=crop&w=800&q=80',
    alt: 'Muscat Sultanate of Oman cultural landmarks and coast',
  },
  SG: {
    src: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=800&q=80',
    alt: 'Singapore Marina Bay Sands and modern technological skyline',
  },
  MY: {
    src: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80',
    alt: 'Kuala Lumpur Malaysia Petronas Twin Towers and urban center',
  },
  JP: {
    src: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    alt: 'Tokyo Japan modern commercial district and Mount Fuji',
  },
  KR: {
    src: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    alt: 'Seoul South Korea vibrant metropolis and manufacturing economy',
  },
  PT: {
    src: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=800&q=80',
    alt: 'Lisbon Portugal historic architecture and European commerce',
  },
  PL: {
    src: 'https://images.unsplash.com/photo-1519197924294-4ba991a11128?auto=format&fit=crop&w=800&q=80',
    alt: 'Warsaw Poland modern industrial center and historic old town',
  },
  RO: {
    src: 'https://images.unsplash.com/photo-1584646098378-0874589d76b1?auto=format&fit=crop&w=800&q=80',
    alt: 'Bucharest Romania European industrial and commercial infrastructure',
  },
  AU: {
    src: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
    alt: 'Sydney Australia harbour and skilled migration destination',
  },
  HR: {
    src: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
    alt: 'Croatia European Mediterranean architecture and employment hubs',
  },
};

export const DEFAULT_COUNTRY_IMAGE: ImageAsset = {
  src: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
  alt: 'Global destination and international overseas employment location',
};

// Job Category Images (Field-specific, professional photos)
export const CATEGORY_IMAGES: Record<string, ImageAsset> = {
  construction: {
    src: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    alt: 'Construction engineering, site supervisors, and civil infrastructure',
  },
  heavy_equipment: {
    src: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80',
    alt: 'Heavy equipment machinery, crane operator and industrial transport',
  },
  electrician: {
    src: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    alt: 'Industrial electrical technician servicing power control panels',
  },
  welder: {
    src: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
    alt: 'Certified pipe welder performing precision industrial TIG welding',
  },
  driver: {
    src: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80',
    alt: 'Professional logistics heavy vehicle driver and transport fleet',
  },
  hospitality: {
    src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    alt: 'Fine dining culinary chefs, restaurant crew, and hotel hospitality staff',
  },
  caregiver: {
    src: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    alt: 'Professional elderly care and healthcare nursing specialist',
  },
  manufacturing: {
    src: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    alt: 'High-tech manufacturing assembly plant and automated production line',
  },
  agriculture: {
    src: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
    alt: 'Modern greenhouse agriculture, horticultural production and harvesting',
  },
  logistics: {
    src: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    alt: 'Global logistics warehouse storage, forklift operations and inventory',
  },
  security: {
    src: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
    alt: 'Licensed commercial security supervisor and facility safety personnel',
  },
  it_admin: {
    src: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    alt: 'Information technology network administration and software workstation',
  },
};

export const DEFAULT_CATEGORY_IMAGE: ImageAsset = {
  src: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=80',
  alt: 'Professional international career and verified overseas employment opportunity',
};

// Visa & Document Visuals
export const VISA_IMAGES = {
  workPermit: {
    src: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    alt: 'Official international passport with stamped government employment work visa',
  },
  documentVerification: {
    src: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
    alt: 'Legal document verification, embassy attestation and BMET compliance review',
  },
  medicalClearance: {
    src: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80',
    alt: 'GAMCA approved medical fitness center and health screening certificate',
  },
};

/**
 * Popular Countries for Navigation Quick Menu
 */
export const POPULAR_COUNTRIES_NAV = [
  { name: 'Saudi Arabia', nameBn: 'সৌদি আরব', code: 'SA', slug: 'saudi-arabia', flag: 'https://flagcdn.com/w80/sa.png', image: COUNTRY_IMAGES.SA.src },
  { name: 'UAE', nameBn: 'সংযুক্ত আরব আমিরাত', code: 'AE', slug: 'united-arab-emirates', flag: 'https://flagcdn.com/w80/ae.png', image: COUNTRY_IMAGES.AE.src },
  { name: 'Qatar', nameBn: 'কাতার', code: 'QA', slug: 'qatar', flag: 'https://flagcdn.com/w80/qa.png', image: COUNTRY_IMAGES.QA.src },
  { name: 'Kuwait', nameBn: 'কুয়েত', code: 'KW', slug: 'kuwait', flag: 'https://flagcdn.com/w80/kw.png', image: COUNTRY_IMAGES.KW.src },
  { name: 'Oman', nameBn: 'ওমান', code: 'OM', slug: 'oman', flag: 'https://flagcdn.com/w80/om.png', image: COUNTRY_IMAGES.OM.src },
  { name: 'Singapore', nameBn: 'সিঙ্গাপুর', code: 'SG', slug: 'singapore', flag: 'https://flagcdn.com/w80/sg.png', image: COUNTRY_IMAGES.SG.src },
  { name: 'Malaysia', nameBn: 'মালয়েশিয়া', code: 'MY', slug: 'malaysia', flag: 'https://flagcdn.com/w80/my.png', image: COUNTRY_IMAGES.MY.src },
  { name: 'Japan', nameBn: 'জাপান', code: 'JP', slug: 'japan', flag: 'https://flagcdn.com/w80/jp.png', image: COUNTRY_IMAGES.JP.src },
];

/**
 * Helper to resolve country image with graceful fallback (supports code, slug or name)
 */
export function getCountryImage(countryCode?: string | null, slugOrName?: string | null): ImageAsset {
  if (countryCode) {
    const code = countryCode.toUpperCase().trim();
    if (COUNTRY_IMAGES[code]) return COUNTRY_IMAGES[code];
  }

  if (slugOrName) {
    const s = slugOrName.toLowerCase().trim();
    if (s.includes('saudi') || s.includes('সৌদি') || s === 'sa') return COUNTRY_IMAGES.SA;
    if (s.includes('emirate') || s.includes('uae') || s.includes('আমিরাত') || s === 'ae') return COUNTRY_IMAGES.AE;
    if (s.includes('qatar') || s.includes('কাতার') || s === 'qa') return COUNTRY_IMAGES.QA;
    if (s.includes('kuwait') || s.includes('কুয়েত') || s === 'kw') return COUNTRY_IMAGES.KW;
    if (s.includes('oman') || s.includes('ওমান') || s === 'om') return COUNTRY_IMAGES.OM;
    if (s.includes('singapore') || s.includes('সিঙ্গাপুর') || s === 'sg') return COUNTRY_IMAGES.SG;
    if (s.includes('malaysia') || s.includes('মালয়েশিয়া') || s === 'my') return COUNTRY_IMAGES.MY;
    if (s.includes('japan') || s.includes('জাপান') || s === 'jp') return COUNTRY_IMAGES.JP;
    if (s.includes('korea') || s.includes('কোরিয়া') || s === 'kr') return COUNTRY_IMAGES.KR;
    if (s.includes('portugal') || s.includes('পর্তুগাল') || s === 'pt') return COUNTRY_IMAGES.PT;
    if (s.includes('poland') || s.includes('পোল্যান্ড') || s === 'pl') return COUNTRY_IMAGES.PL;
    if (s.includes('romania') || s.includes('রোমানিয়া') || s === 'ro') return COUNTRY_IMAGES.RO;
    if (s.includes('australia') || s.includes('অস্ট্রেলিয়া') || s === 'au') return COUNTRY_IMAGES.AU;
    if (s.includes('croatia') || s.includes('ক্রোয়েশিয়া') || s === 'hr') return COUNTRY_IMAGES.HR;
  }

  return DEFAULT_COUNTRY_IMAGE;
}

/**
 * Helper to get CDN flag url from 2-letter ISO code
 */
export function getCountryFlagUrl(countryCode?: string | null): string {
  if (!countryCode || countryCode.length !== 2) {
    return 'https://flagcdn.com/w80/un.png';
  }
  return `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
}

/**
 * Helper to resolve job category image with keyword detection
 */
export function getJobCategoryImage(categoryName?: string | null, jobTitle?: string | null): ImageAsset {
  const query = `${categoryName || ''} ${jobTitle || ''}`.toLowerCase();

  if (query.includes('crane') || query.includes('heavy') || query.includes('operator')) {
    return CATEGORY_IMAGES.heavy_equipment;
  }
  if (query.includes('electr')) {
    return CATEGORY_IMAGES.electrician;
  }
  if (query.includes('weld') || query.includes('pipe') || query.includes('fitter')) {
    return CATEGORY_IMAGES.welder;
  }
  if (query.includes('caregiver') || query.includes('nurse') || query.includes('health')) {
    return CATEGORY_IMAGES.caregiver;
  }
  if (query.includes('restaurant') || query.includes('hotel') || query.includes('chef') || query.includes('cook') || query.includes('hospitality')) {
    return CATEGORY_IMAGES.hospitality;
  }
  if (query.includes('driver') || query.includes('transport') || query.includes('chauffeur')) {
    return CATEGORY_IMAGES.driver;
  }
  if (query.includes('construct') || query.includes('civil') || query.includes('mason') || query.includes('carpenter')) {
    return CATEGORY_IMAGES.construction;
  }
  if (query.includes('factory') || query.includes('manufactur') || query.includes('assembl')) {
    return CATEGORY_IMAGES.manufacturing;
  }
  if (query.includes('agri') || query.includes('farm') || query.includes('harvest')) {
    return CATEGORY_IMAGES.agriculture;
  }
  if (query.includes('warehouse') || query.includes('logistics') || query.includes('storekeeper')) {
    return CATEGORY_IMAGES.logistics;
  }
  if (query.includes('secur')) {
    return CATEGORY_IMAGES.security;
  }
  if (query.includes('it') || query.includes('computer') || query.includes('admin')) {
    return CATEGORY_IMAGES.it_admin;
  }

  return DEFAULT_CATEGORY_IMAGE;
}
