/**
 * Image System Constants and Fallbacks
 * SHAKIL TRAVELS Public Portal
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
  MU: {
    src: 'https://images.unsplash.com/photo-1589556264800-08ae9e129a8c?auto=format&fit=crop&w=800&q=80',
    alt: 'Mauritius tropical coastline and Port Louis commercial district',
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
  retail: {
    src: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80',
    alt: 'Modern supermarket retail aisles and super shop merchandising staff',
  },
  hotel: {
    src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    alt: 'Luxury international hotel housekeeping and guest room service',
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
    if (s.includes('mauritius') || s.includes('মরিশাস') || s === 'mu') return COUNTRY_IMAGES.MU;
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
  if (query.includes('retail') || query.includes('shop') || query.includes('store') || query.includes('pharmacy') || query.includes('market') || query.includes('super')) {
    return CATEGORY_IMAGES.retail;
  }
  if (query.includes('housekeep') || query.includes('cleaning') || query.includes('room')) {
    return CATEGORY_IMAGES.hotel;
  }
  if (query.includes('factory') || query.includes('manufactur') || query.includes('assembl') || query.includes('part') || query.includes('brake') || query.includes('aluminum') || query.includes('brewery')) {
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

/**
 * Dedicated Trade & Job Specific High-Resolution Imagery
 */
export const TRADE_JOB_IMAGES: Record<string, ImageAsset> = {
  // Malaysia Specific Matches
  pharmacy: {
    src: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=800&q=80',
    alt: 'Modern retail pharmacy medicine store, products display and sales counter',
  },
  housekeeping: {
    src: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    alt: 'Luxury resort hotel housekeeping, room attendant and bed making',
  },
  parts_factory: {
    src: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    alt: 'Precision metal and electronic components parts factory production operator',
  },
  super_shop_nonfood: {
    src: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
    alt: 'Retail home improvement, hardware and non-food super shop aisles',
  },
  supermarket_hypermarket: {
    src: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80',
    alt: 'Modern supermarket hypermarket merchandise and display shelves',
  },
  coffee_shop: {
    src: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    alt: 'Coffee shop cafe waiter, espresso brewing and dining service',
  },
  restaurant_dining: {
    src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    alt: 'Traditional restaurant dining hall service and kitchen crew',
  },
  grocery_food: {
    src: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=800&q=80',
    alt: 'Grocery supermarket food items, packaged merchandise and store aisles',
  },
  brewery_factory: {
    src: 'https://images.unsplash.com/photo-1584225064785-c62a8b43d148?auto=format&fit=crop&w=800&q=80',
    alt: 'Automated beverage bottling line and brewery packaging plant',
  },
  car_brake_factory: {
    src: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80',
    alt: 'Automotive car brake disc rotor and automotive parts manufacturing',
  },
  medical_equipment: {
    src: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=800&q=80',
    alt: 'Sterile cleanroom medical equipment and healthcare devices packaging',
  },
  aluminum_factory: {
    src: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
    alt: 'Heavy aluminum profiles extrusion, fabrication and metal finishing',
  },

  // Mauritius Specific Matches
  furniture_carpenter: {
    src: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80',
    alt: 'Skilled furniture carpenter crafting wooden chairs and cabinetry',
  },
  spray_painter: {
    src: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80',
    alt: 'Furniture spray painter applying fine lacquer wood finish with spray gun',
  },
  event_decorator: {
    src: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    alt: 'Luxury event and wedding hall stage floral and lighting decorator',
  },
  car_denting: {
    src: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80',
    alt: 'Automotive vehicle body denting, sheet metal panel beating repair',
  },
  car_painting: {
    src: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?auto=format&fit=crop&w=800&q=80',
    alt: 'Automobile spray booth paint technician finishing car exterior body',
  },
  bobcat_operator: {
    src: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80',
    alt: 'Bobcat skid steer loader machine operator on construction earthwork site',
  },
  mobile_technician: {
    src: 'https://images.unsplash.com/photo-1597740985671-2a8a3b80532e?auto=format&fit=crop&w=800&q=80',
    alt: 'Certified mobile phone repair technician servicing smartphone motherboard',
  },
  ice_cream_maker: {
    src: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=800&q=80',
    alt: 'Artisan ice cream gelato maker scooping delicious fresh gelato desserts',
  },
  bengali_chef: {
    src: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=800&q=80',
    alt: 'Professional culinary chef cooking authentic Bengali cuisine dishes',
  },
};

/**
 * High-accuracy helper to resolve real matching job imagery based on trade, designation and employer
 */
export function getJobImage(job?: {
  title?: string | null;
  slug?: string | null;
  jobCategory?: { name?: string | null } | null;
  country?: { code?: string | null; slug?: string | null; name?: string | null } | null;
} | null): ImageAsset {
  if (!job) return DEFAULT_CATEGORY_IMAGE;

  const query = `${job.title || ''} ${job.slug || ''} ${job.jobCategory?.name || ''}`.toLowerCase();

  // Car Brake Factory (check before general parts)
  if (query.includes('brake') || query.includes('ব্রেক')) {
    return TRADE_JOB_IMAGES.car_brake_factory;
  }

  // Car Denting
  if (query.includes('ডেন্টিং') || query.includes('denting') || query.includes('panel beater')) {
    return TRADE_JOB_IMAGES.car_denting;
  }

  // Car Painting (check before general spray painter)
  if (
    query.includes('গাড়ী পেইন্টিং') ||
    query.includes('গাড়ীর পেইন্টিং') ||
    query.includes('car paint') ||
    query.includes('auto paint') ||
    query.includes('vehicle paint') ||
    query.includes('automotive spray') ||
    query.includes('automotive vehicle spray')
  ) {
    return TRADE_JOB_IMAGES.car_painting;
  }

  // Wood & Furniture Spray Painter
  if (query.includes('স্প্রে') || query.includes('spray')) {
    return TRADE_JOB_IMAGES.spray_painter;
  }

  // Mobile Phone Technician (exclude automobile/অটোমোবাইল)
  if (
    query.includes('phone') ||
    query.includes('ফোন') ||
    (query.includes('মোবাইল') && !query.includes('অটোমোবাইল')) ||
    (query.includes('mobile') && !query.includes('automobile'))
  ) {
    return TRADE_JOB_IMAGES.mobile_technician;
  }

  // Ice Cream Maker
  if (query.includes('আইসক্রিম') || query.includes('ice cream') || query.includes('gelato')) {
    return TRADE_JOB_IMAGES.ice_cream_maker;
  }

  // Bengali Chef / Babuর্চি
  if (query.includes('বাবুর্চি') || query.includes('বাংলা খাবার') || query.includes('bengali') || query.includes('cook') || (query.includes('chef') && !query.includes('assistant'))) {
    return TRADE_JOB_IMAGES.bengali_chef;
  }

  // Furniture Carpenter
  if (query.includes('ফার্নিচার') || query.includes('furniture') || query.includes('কার্পেন্টার') || query.includes('carpenter') || query.includes('wood')) {
    return TRADE_JOB_IMAGES.furniture_carpenter;
  }

  // Bobcat Machine Operator
  if (query.includes('বোবকাট') || query.includes('bobcat') || query.includes('loader') || query.includes('skid')) {
    return TRADE_JOB_IMAGES.bobcat_operator;
  }

  // Event & Stage Decorator
  if (query.includes('ডেকোরেটর') || query.includes('decorator') || query.includes('stage') || query.includes('event')) {
    return TRADE_JOB_IMAGES.event_decorator;
  }

  // Malaysia Specific Trade Keywords
  if (query.includes('pharmacy') || query.includes('ফার্মেসি') || query.includes('caring') || query.includes('big pharmacy')) {
    return TRADE_JOB_IMAGES.pharmacy;
  }
  if (query.includes('housekeep') || query.includes('হাউসকিপার') || query.includes('skyworlds') || query.includes('genting')) {
    return TRADE_JOB_IMAGES.housekeeping;
  }
  if (query.includes('precision') || query.includes('notion') || (query.includes('parts') && query.includes('factory')) || query.includes('পার্টস')) {
    return TRADE_JOB_IMAGES.parts_factory;
  }
  if (query.includes('mr diy') || query.includes('diy') || query.includes('non-food') || query.includes('নন-ফুড')) {
    return TRADE_JOB_IMAGES.super_shop_nonfood;
  }
  if (query.includes('lotus') || query.includes('swopno') || query.includes('hypermarket') || (query.includes('super shop') && query.includes('crew'))) {
    return TRADE_JOB_IMAGES.supermarket_hypermarket;
  }
  if (query.includes('coffee') || query.includes('oldtown') || query.includes('কফি') || query.includes('waiter') || query.includes('ওয়েটার')) {
    return TRADE_JOB_IMAGES.coffee_shop;
  }
  if (query.includes('burung hantu') || query.includes('বুরং হান্তু') || query.includes('nasi lemak')) {
    return TRADE_JOB_IMAGES.restaurant_dining;
  }
  if (query.includes('speedmart') || query.includes('99') || (query.includes('food') && query.includes('shop')) || query.includes('ফুড')) {
    return TRADE_JOB_IMAGES.grocery_food;
  }
  if (query.includes('brewery') || query.includes('carlsberg') || query.includes('beer') || query.includes('bear') || query.includes('ব্রিউয়ারি')) {
    return TRADE_JOB_IMAGES.brewery_factory;
  }
  if (query.includes('brake') || query.includes('ব্রেক') || query.includes('alpha brake')) {
    return TRADE_JOB_IMAGES.car_brake_factory;
  }
  if (query.includes('medical') || query.includes('tpoc') || query.includes('মেডিকেল')) {
    return TRADE_JOB_IMAGES.medical_equipment;
  }
  if (query.includes('aluminum') || query.includes('অ্যালুমিনিয়াম') || query.includes('extrusion') || query.includes('empire')) {
    return TRADE_JOB_IMAGES.aluminum_factory;
  }

  // Fallback to Category
  const cat = getJobCategoryImage(job.jobCategory?.name, job.title);
  if (cat && cat !== DEFAULT_CATEGORY_IMAGE) return cat;

  // Fallback to Country
  const country = getCountryImage(job.country?.code, job.country?.slug || job.country?.name);
  if (country && country !== DEFAULT_COUNTRY_IMAGE) return country;

  return DEFAULT_CATEGORY_IMAGE;
}

/**
 * Dedicated Training & Technical Vocational Course Imagery
 */
export const TRAINING_IMAGES: Record<string, ImageAsset> = {
  welding: {
    src: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
    alt: 'Certified 6G Pipe Welding and Structural Metal Fabrication Training',
  },
  electrical: {
    src: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    alt: 'Industrial and Building Electrical Wiring Vocational Lab Training',
  },
  caregiving: {
    src: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
    alt: 'Specialized SSW Caregiver & Nursing Healthcare Practical Training',
  },
  driving: {
    src: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80',
    alt: 'Heavy Logistics Commercial Vehicle and Heavy Equipment Driving Course',
  },
  construction: {
    src: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    alt: 'Civil Construction Scaffolding, Formwork and Finishing Training',
  },
  plumbing: {
    src: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    alt: 'Industrial Pipe Fitting and Commercial Plumbing Practical Workshop',
  },
  hospitality: {
    src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    alt: 'Culinary Chef, Food & Beverage and Professional Hotel Staff Training',
  },
  language: {
    src: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    alt: 'Overseas Language Course (Japanese, Korean, Arabic & English)',
  },
  it: {
    src: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    alt: 'Information Technology, Computer Hardware and Data Entry Vocational Lab',
  },
  default: {
    src: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    alt: 'Technical Vocational Training Academy Laboratory & Workshop',
  },
};

/**
 * Helper to resolve high-resolution training course image
 */
export function getTrainingCourseImage(courseTitle?: string | null, categoryName?: string | null): ImageAsset {
  const query = `${courseTitle || ''} ${categoryName || ''}`.toLowerCase();

  if (query.includes('weld') || query.includes('পাইপ') || query.includes('ওয়েল্ডিং') || query.includes('fabricat')) {
    return TRAINING_IMAGES.welding;
  }
  if (query.includes('electr') || query.includes('ইলেকট্রিক') || query.includes('ওয়্যারিং')) {
    return TRAINING_IMAGES.electrical;
  }
  if (query.includes('care') || query.includes('কেয়ার') || query.includes('nurse') || query.includes('নার্সিং') || query.includes('health')) {
    return TRAINING_IMAGES.caregiving;
  }
  if (query.includes('driv') || query.includes('ড্রাইভিং') || query.includes('operator') || query.includes('অপারেটর')) {
    return TRAINING_IMAGES.driving;
  }
  if (query.includes('construct') || query.includes('নির্মাণ') || query.includes('scaffold') || query.includes('ম্যাসন')) {
    return TRAINING_IMAGES.construction;
  }
  if (query.includes('plumb') || query.includes('প্লাম্বিং') || query.includes('fitter')) {
    return TRAINING_IMAGES.plumbing;
  }
  if (query.includes('cook') || query.includes('chef') || query.includes('hotel') || query.includes('হসপিটালিটি') || query.includes('রান্না')) {
    return TRAINING_IMAGES.hospitality;
  }
  if (query.includes('lang') || query.includes('ভাষা') || query.includes('japanese') || query.includes('korean') || query.includes('english') || query.includes('arabic')) {
    return TRAINING_IMAGES.language;
  }
  if (query.includes('computer') || query.includes('কম্পিউটার') || query.includes('it') || query.includes('software')) {
    return TRAINING_IMAGES.it;
  }

  return TRAINING_IMAGES.default;
}
