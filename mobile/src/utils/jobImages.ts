/**
 * Curated high-resolution imagery for job circulars and overseas trades
 */

export const JOB_CATEGORY_IMAGES: Record<string, string> = {
  restaurant: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  hospitality: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
  caregiver: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
  driving: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80',
  technical: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
  welding: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
  construction: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
  factory: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
  manufacturing: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
  logistics: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
  cleaning: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
  agriculture: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
  default: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=800&q=80',
};

/**
 * Automatically resolve an appropriate image for any job based on its category or title keywords
 */
export function getJobImage(job: { category?: string; title?: string; titleBn?: string; imageUrl?: string }): string {
  if (job.imageUrl && job.imageUrl.startsWith('http')) {
    return job.imageUrl;
  }

  const category = (job.category || '').toLowerCase();
  const text = `${job.title || ''} ${job.titleBn || ''}`.toLowerCase();

  // Match by keyword in title or category
  if (category.includes('restaurant') || text.includes('chef') || text.includes('cook') || text.includes('শেফ') || text.includes('রেস্তোরাঁ') || text.includes('waiter') || text.includes('ক্যাটারিং')) {
    return JOB_CATEGORY_IMAGES.restaurant;
  }
  if (category.includes('caregiver') || text.includes('caregiver') || text.includes('কেয়ারগিভার') || text.includes('নার্স') || text.includes('hospital')) {
    return JOB_CATEGORY_IMAGES.caregiver;
  }
  if (category.includes('driving') || text.includes('driver') || text.includes('ড্রাইভার') || text.includes('trailer') || text.includes('crane') || text.includes('ক্রেন') || text.includes('অপারেটর')) {
    return JOB_CATEGORY_IMAGES.driving;
  }
  if (category.includes('electric') || text.includes('electric') || text.includes('ইলেকট্রিশিয়ান') || text.includes('wireman')) {
    return JOB_CATEGORY_IMAGES.technical;
  }
  if (category.includes('weld') || text.includes('weld') || text.includes('ওয়েল্ডার') || text.includes('pipe') || text.includes('পাইপ')) {
    return JOB_CATEGORY_IMAGES.welding;
  }
  if (category.includes('construction') || text.includes('construction') || text.includes('mason') || text.includes('কনস্ট্রাকশন') || text.includes('বিল্ডিং')) {
    return JOB_CATEGORY_IMAGES.construction;
  }
  if (category.includes('factory') || category.includes('manufacturing') || text.includes('factory') || text.includes('ফ্যাক্টরি') || text.includes('অ্যাসেম্বলি')) {
    return JOB_CATEGORY_IMAGES.factory;
  }
  if (category.includes('cleaning') || text.includes('clean') || text.includes('ক্লিনার') || text.includes('হেল্পার') || text.includes('helper')) {
    return JOB_CATEGORY_IMAGES.cleaning;
  }
  if (category.includes('logistic') || text.includes('warehouse') || text.includes('প্যাকিং') || text.includes('লোডিং')) {
    return JOB_CATEGORY_IMAGES.logistics;
  }
  if (category.includes('agriculture') || text.includes('farm') || text.includes('কৃষি')) {
    return JOB_CATEGORY_IMAGES.agriculture;
  }

  // Match direct category key
  if (JOB_CATEGORY_IMAGES[category]) {
    return JOB_CATEGORY_IMAGES[category];
  }

  return JOB_CATEGORY_IMAGES.default;
}
