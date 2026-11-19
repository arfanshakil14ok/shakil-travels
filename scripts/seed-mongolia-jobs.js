const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Mongolia Jobs & Country ---');

  // 1. Upsert Country Mongolia
  const mongolia = await prisma.country.upsert({
    where: { code: 'MN' },
    update: {
      name: 'Mongolia',
      slug: 'mongolia',
      flag: 'https://flagcdn.com/w80/mn.png',
      description: 'পূর্ব ও মধ্য এশিয়ার উদীয়মান শিল্প ও খনিজ অর্থনীতির দেশ মঙ্গোলিয়াতে ফ্যাক্টরি ওয়ার্কার ও দক্ষ কন্সট্রাকশন টেকনিক্যাল সেক্টরে সরকারি অনুমোদিত বৈধ কর্মসংস্থান। সরাসরি কোম্পানিতে আকর্ষণীয় সুযোগ-সুবিধা ও ১০০% নিশ্চিত প্রসেসিং।',
      currency: 'US Dollar',
      currencyCode: 'USD',
      recruitmentStatus: 'ACTIVE',
      continent: 'ASIA',
      featured: true,
      displayOrder: 3,
      isActive: true,
    },
    create: {
      name: 'Mongolia',
      code: 'MN',
      slug: 'mongolia',
      flag: 'https://flagcdn.com/w80/mn.png',
      description: 'পূর্ব ও মধ্য এশিয়ার উদীয়মান শিল্প ও খনিজ অর্থনীতির দেশ মঙ্গোলিয়াতে ফ্যাক্টরি ওয়ার্কার ও দক্ষ কন্সট্রাকশন টেকনিক্যাল সেক্টরে সরকারি অনুমোদিত বৈধ কর্মসংস্থান। সরাসরি কোম্পানিতে আকর্ষণীয় সুযোগ-সুবিধা ও ১০০% নিশ্চিত প্রসেসিং।',
      currency: 'US Dollar',
      currencyCode: 'USD',
      recruitmentStatus: 'ACTIVE',
      continent: 'ASIA',
      featured: true,
      displayOrder: 3,
      isActive: true,
    },
  });
  console.log('Mongolia Country ID:', mongolia.id);

  // 2. Admin User for createdBy
  const adminUser = await prisma.user.findFirst({
    where: { role: { name: { contains: 'Admin', mode: 'insensitive' } } },
  }) || await prisma.user.findFirst();
  const adminId = adminUser ? adminUser.id : null;

  // 3. Upsert Employer
  const employerMongolia = await prisma.employer.upsert({
    where: { id: 'emp-mn-direct-company' },
    update: {
      employerCode: 'SGR-EMP-MN-001',
      companyName: 'Direct Company Mongolia Ltd. & Partners',
      companyNameLocal: 'ডিরেক্ট কোম্পানি মঙ্গোলিয়া লিমিটেড',
      country: { connect: { id: mongolia.id } },
      industry: 'Manufacturing & Construction',
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE',
      email: 'recruitment@mongolia-jobs.gov.mn',
      phone: '+976-11-322-100',
      address: 'Peace Avenue, Sukhbaatar District, Ulaanbaatar, Mongolia',
      notes: 'মঙ্গোলিয়া সরকারের অনুমোদিত শীর্ষস্থানীয় শিল্প উৎপাদন ও সিভিল কন্সট্রাকশন কনসোর্টিয়াম।',
    },
    create: {
      id: 'emp-mn-direct-company',
      employerCode: 'SGR-EMP-MN-001',
      companyName: 'Direct Company Mongolia Ltd. & Partners',
      companyNameLocal: 'ডিরেক্ট কোম্পানি মঙ্গোলিয়া লিমিটেড',
      country: { connect: { id: mongolia.id } },
      industry: 'Manufacturing & Construction',
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE',
      email: 'recruitment@mongolia-jobs.gov.mn',
      phone: '+976-11-322-100',
      address: 'Peace Avenue, Sukhbaatar District, Ulaanbaatar, Mongolia',
      notes: 'মঙ্গোলিয়া সরকারের অনুমোদিত শীর্ষস্থানীয় শিল্প উৎপাদন ও সিভিল কন্সট্রাকশন কনসোর্টিয়াম।',
    },
  });
  console.log('Mongolia Employer ID:', employerMongolia.id);

  // 4. Job Categories
  const factoryCat = await prisma.jobCategory.findFirst({ where: { slug: 'factory' } });
  const constructionCat = await prisma.jobCategory.findFirst({ where: { slug: 'construction' } });
  const welderCat = await prisma.jobCategory.findFirst({ where: { slug: 'welder' } }) || constructionCat;
  const plumberCat = await prisma.jobCategory.findFirst({ where: { slug: 'plumber' } }) || constructionCat;
  const electricianCat = await prisma.jobCategory.findFirst({ where: { slug: 'electrician' } }) || constructionCat;

  // 5. Jobs Data
  const jobsData = [
    {
      jobCode: 'SGR-JOB-2026-000027',
      title: 'ফ্যাক্টরি ওয়ার্কার (Factory Worker - Production & Packaging)',
      titleLocal: 'ফ্যাক্টরি ওয়ার্কার - মঙ্গোলিয়া',
      slug: 'factory-worker-mongolia',
      countryId: mongolia.id,
      city: 'Ulaanbaatar',
      jobCategoryId: factoryCat.id,
      employerId: employerMongolia.id,
      description: '🇲🇳 মঙ্গোলিয়াতে ফ্যাক্টরি ওয়ার্কার পদে আকর্ষণীয় সুযোগে জরুরি নিয়োগ বিজ্ঞপ্তি।\n\nবেতন: ৪০০ USD\nসুযোগ সুবিধা:\n• ডিউটি: ১০ ঘণ্টা (৬ দিন)\n• খাবার: ডিউটি টাইমে কোম্পানির পক্ষ থেকে খাবার সরবরাহ করা হবে\n• বয়স: ২০-৪০ বছর\n• সময়: ২-৩ মাস\n• হাইট: ৫ ফিট ৬ ইঞ্চি\n\n📌 কোটা সীমিত, শতভাগ নিশ্চয়তা সহকারে প্রসেসিং করা হয়। আগ্রহী প্রার্থীরা অবিলম্বে প্রয়োজনীয় কাগজপত্র জমা দিন।',
      salaryMin: new Prisma.Decimal('400.00'),
      salaryMax: new Prisma.Decimal('450.00'),
      currency: 'USD',
      salaryPeriod: 'MONTHLY',
      experienceRequired: 0,
      educationRequired: 'অষ্টম শ্রেণি / এসএসসি পাস',
      ageMin: 20,
      ageMax: 40,
      languageRequirements: 'সাধারণ বাংলা / ইংরেজি',
      skillsRequired: 'Factory Assembly, Packaging, Material Handling, Quality Check, Physical Fitness (5\'6")',
      vacancyCount: 20,
      accommodation: true,
      food: true,
      transportation: true,
      medical: true,
      airTicket: true,
      workingHours: '10 hours / day (6 days / week)',
      contractDuration: '2 Years (Renewable)',
      applicationDeadline: new Date('2026-12-31'),
      status: 'PUBLISHED',
      featured: true,
      createdBy: adminId,
      publishedAt: new Date(),
    },
    {
      jobCode: 'SGR-JOB-2026-000028',
      title: 'দক্ষ কন্সট্রাকশন টেকনিক্যাল ওয়ার্কার - মেসন (Construction Mason)',
      titleLocal: 'দক্ষ কন্সট্রাকশন মেসন (রাজমিস্ত্রি) - মঙ্গোলিয়া',
      slug: 'construction-mason-mongolia',
      countryId: mongolia.id,
      city: 'Ulaanbaatar',
      jobCategoryId: constructionCat.id,
      employerId: employerMongolia.id,
      description: '🇲🇳 মঙ্গোলিয়াতে ডিরেক্ট কোম্পানিতে আর্জেন্ট নিয়োগ বিজ্ঞপ্তি।\n\nপদবী: দক্ষ কন্সট্রাকশন টেকনিক্যাল ওয়ার্কার - মেসন (Mason)\nবেতন: ৫০০ USD\nসুযোগ সুবিধা:\n• ডিউটি: ১০ ঘণ্টা (৬ দিন)\n• খাবার: ডিউটি টাইমে কোম্পানির পক্ষ থেকে খাবার সরবরাহ\n• বয়স: ২০-৪০ বছর\n• সময়: ২-৩ মাস\n• হাইট: ৫ ফিট ৬ ইঞ্চি\n\n📌 শর্তাবলী: অবশ্য কাজের দক্ষতা লাগবে, সিরিয়াল কনফার্ম করার জন্য (মেন পাসপোর্ট, NID, CV, ছবি) ৩১ তারিখের মধ্যে জমা করুন। সিরিয়াল ছাড়া কারো ইন্টারভিউ নেওয়া হবে না।',
      salaryMin: new Prisma.Decimal('500.00'),
      salaryMax: new Prisma.Decimal('550.00'),
      currency: 'USD',
      salaryPeriod: 'MONTHLY',
      experienceRequired: 2,
      educationRequired: 'কাজের বাস্তব অভিজ্ঞতা ও ট্রেড দক্ষতা',
      ageMin: 20,
      ageMax: 40,
      languageRequirements: 'সাধারণ যোগাযোগ দক্ষতা',
      skillsRequired: 'Bricklaying, Concrete Work, Plastering, Blueprint Reading, Height 5\'6"',
      vacancyCount: 15,
      accommodation: true,
      food: true,
      transportation: true,
      medical: true,
      airTicket: true,
      workingHours: '10 hours / day (6 days / week)',
      contractDuration: '2 Years (Renewable)',
      applicationDeadline: new Date('2026-12-31'),
      status: 'PUBLISHED',
      featured: true,
      createdBy: adminId,
      publishedAt: new Date(),
    },
    {
      jobCode: 'SGR-JOB-2026-000029',
      title: 'দক্ষ কন্সট্রাকশন টেকনিক্যাল ওয়ার্কার - ওয়েল্ডার (Construction Welder)',
      titleLocal: 'দক্ষ কন্সট্রাকশন ওয়েল্ডার (ঝালাইকারী) - মঙ্গোলিয়া',
      slug: 'construction-welder-mongolia',
      countryId: mongolia.id,
      city: 'Ulaanbaatar',
      jobCategoryId: welderCat.id,
      employerId: employerMongolia.id,
      description: '🇲🇳 মঙ্গোলিয়াতে ডিরেক্ট কোম্পানিতে আর্জেন্ট নিয়োগ বিজ্ঞপ্তি।\n\nপদবী: দক্ষ কন্সট্রাকশন টেকনিক্যাল ওয়ার্কার - ওয়েল্ডার (Welder)\nবেতন: ৫০০ USD\nসুযোগ সুবিধা:\n• ডিউটি: ১০ ঘণ্টা (৬ দিন)\n• খাবার: ডিউটি টাইমে কোম্পানির পক্ষ থেকে খাবার সরবরাহ\n• বয়স: ২০-৪০ বছর\n• সময়: ২-৩ মাস\n• হাইট: ৫ ফিট ৬ ইঞ্চি\n\n📌 শর্তাবলী: অবশ্য কাজের দক্ষতা লাগবে, সিরিয়াল কনফার্ম করার জন্য (মেন পাসপোর্ট, NID, CV, ছবি) ৩১ তারিখের মধ্যে জমা করুন। সিরিয়াল ছাড়া কারো ইন্টারভিউ নেওয়া হবে না।',
      salaryMin: new Prisma.Decimal('500.00'),
      salaryMax: new Prisma.Decimal('550.00'),
      currency: 'USD',
      salaryPeriod: 'MONTHLY',
      experienceRequired: 2,
      educationRequired: 'ওয়েল্ডিং ট্রেড সনদ ও বাস্তব অভিজ্ঞতা',
      ageMin: 20,
      ageMax: 40,
      languageRequirements: 'সাধারণ যোগাযোগ দক্ষতা',
      skillsRequired: 'SMAW/MIG/TIG Welding, Structural Steel Fabrication, Joint Fitting, Height 5\'6"',
      vacancyCount: 15,
      accommodation: true,
      food: true,
      transportation: true,
      medical: true,
      airTicket: true,
      workingHours: '10 hours / day (6 days / week)',
      contractDuration: '2 Years (Renewable)',
      applicationDeadline: new Date('2026-12-31'),
      status: 'PUBLISHED',
      featured: true,
      createdBy: adminId,
      publishedAt: new Date(),
    },
    {
      jobCode: 'SGR-JOB-2026-000030',
      title: 'দক্ষ কন্সট্রাকশন টেকনিক্যাল ওয়ার্কার - প্লামবার (Construction Plumber)',
      titleLocal: 'দক্ষ কন্সট্রাকশন প্লামবার (পাইপফিটার) - মঙ্গোলিয়া',
      slug: 'construction-plumber-mongolia',
      countryId: mongolia.id,
      city: 'Ulaanbaatar',
      jobCategoryId: plumberCat.id,
      employerId: employerMongolia.id,
      description: '🇲🇳 মঙ্গোলিয়াতে ডিরেক্ট কোম্পানিতে আর্জেন্ট নিয়োগ বিজ্ঞপ্তি।\n\nপদবী: দক্ষ কন্সট্রাকশন টেকনিক্যাল ওয়ার্কার - প্লামবার (Plumber)\nবেতন: ৫০০ USD\nসুযোগ সুবিধা:\n• ডিউটি: ১০ ঘণ্টা (৬ দিন)\n• খাবার: ডিউটি টাইমে কোম্পানির পক্ষ থেকে খাবার সরবরাহ\n• বয়স: ২০-৪০ বছর\n• সময়: ২-৩ মাস\n• হাইট: ৫ ফিট ৬ ইঞ্চি\n\n📌 শর্তাবলী: অবশ্য কাজের দক্ষতা লাগবে, সিরিয়াল কনফার্ম করার জন্য (মেন পাসপোর্ট, NID, CV, ছবি) ৩১ তারিখের মধ্যে জমা করুন। সিরিয়াল ছাড়া কারো ইন্টারভিউ নেওয়া হবে না।',
      salaryMin: new Prisma.Decimal('500.00'),
      salaryMax: new Prisma.Decimal('550.00'),
      currency: 'USD',
      salaryPeriod: 'MONTHLY',
      experienceRequired: 2,
      educationRequired: 'প্লাম্বিং ট্রেড কোর্স ও কাজের বাস্তব অভিজ্ঞতা',
      ageMin: 20,
      ageMax: 40,
      languageRequirements: 'সাধারণ যোগাযোগ দক্ষতা',
      skillsRequired: 'Pipe Fitting, Water Line Layout, Drainage System, PPR/PVC Welding, Height 5\'6"',
      vacancyCount: 12,
      accommodation: true,
      food: true,
      transportation: true,
      medical: true,
      airTicket: true,
      workingHours: '10 hours / day (6 days / week)',
      contractDuration: '2 Years (Renewable)',
      applicationDeadline: new Date('2026-12-31'),
      status: 'PUBLISHED',
      featured: true,
      createdBy: adminId,
      publishedAt: new Date(),
    },
    {
      jobCode: 'SGR-JOB-2026-000031',
      title: 'দক্ষ কন্সট্রাকশন টেকনিক্যাল ওয়ার্কার - ইলেকট্রিশিয়ান (Construction Electrician)',
      titleLocal: 'দক্ষ কন্সট্রাকশন ইলেকট্রিশিয়ান (বৈদ্যুতিক মিস্ত্রি) - মঙ্গোলিয়া',
      slug: 'construction-electrician-mongolia',
      countryId: mongolia.id,
      city: 'Ulaanbaatar',
      jobCategoryId: electricianCat.id,
      employerId: employerMongolia.id,
      description: '🇲🇳 মঙ্গোলিয়াতে ডিরেক্ট কোম্পানিতে আর্জেন্ট নিয়োগ বিজ্ঞপ্তি।\n\nপদবী: দক্ষ কন্সট্রাকশন টেকনিক্যাল ওয়ার্কার - ইলেকট্রিশিয়ান (Electrician)\nবেতন: ৫০০ USD\nসুযোগ সুবিধা:\n• ডিউটি: ১০ ঘণ্টা (৬ দিন)\n• খাবার: ডিউটি টাইমে কোম্পানির পক্ষ থেকে খাবার সরবরাহ\n• বয়স: ২০-৪০ বছর\n• সময়: ২-৩ মাস\n• হাইট: ৫ ফিট ৬ ইঞ্চি\n\n📌 শর্তাবলী: অবশ্য কাজের দক্ষতা লাগবে, সিরিয়াল কনফার্ম করার জন্য (মেন পাসপোর্ট, NID, CV, ছবি) ৩১ তারিখের মধ্যে জমা করুন। সিরিয়াল ছাড়া কারো ইন্টারভিউ নেওয়া হবে না।',
      salaryMin: new Prisma.Decimal('500.00'),
      salaryMax: new Prisma.Decimal('550.00'),
      currency: 'USD',
      salaryPeriod: 'MONTHLY',
      experienceRequired: 2,
      educationRequired: 'ইলেকট্রিক্যাল কোর্স বা কাজের সনদ',
      ageMin: 20,
      ageMax: 40,
      languageRequirements: 'সাধারণ যোগাযোগ দক্ষতা',
      skillsRequired: 'Electrical Conduit, Industrial Wiring, DB Board Termination, Height 5\'6"',
      vacancyCount: 12,
      accommodation: true,
      food: true,
      transportation: true,
      medical: true,
      airTicket: true,
      workingHours: '10 hours / day (6 days / week)',
      contractDuration: '2 Years (Renewable)',
      applicationDeadline: new Date('2026-12-31'),
      status: 'PUBLISHED',
      featured: true,
      createdBy: adminId,
      publishedAt: new Date(),
    },
  ];

  for (const job of jobsData) {
    const upsertedJob = await prisma.job.upsert({
      where: { jobCode: job.jobCode },
      update: job,
      create: job,
    });
    console.log(`[OK] Upserted Job ${upsertedJob.jobCode}: ${upsertedJob.title}`);
  }

  console.log('--- Mongolia Jobs Seeding Completed Successfully ---');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
