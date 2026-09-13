import prisma from '../src/lib/prisma';

const V2_PERMISSIONS = [
  // Training
  { code: 'TRAINING_VIEW', description: 'View training courses, centers, and enrollments', module: 'TRAINING' },
  { code: 'TRAINING_COURSE_MANAGE', description: 'Manage training courses and curriculum', module: 'TRAINING' },
  { code: 'TRAINING_CENTER_MANAGE', description: 'Manage training center facilities', module: 'TRAINING' },
  { code: 'TRAINING_BATCH_MANAGE', description: 'Schedule and manage training cohorts', module: 'TRAINING' },
  { code: 'TRAINING_ENROLL_MANAGE', description: 'Review applications and enroll candidates', module: 'TRAINING' },
  { code: 'TRAINING_ATTENDANCE_MANAGE', description: 'Log and review student attendance', module: 'TRAINING' },
  { code: 'TRAINING_CERTIFICATE_ISSUE', description: 'Issue certified credentials to passing candidates', module: 'TRAINING' },
  { code: 'TRAINING_CERTIFICATE_VERIFY', description: 'Verify and revoke issued certificates', module: 'TRAINING' },

  // Post Selection
  { code: 'MEDICAL_VIEW', description: 'View candidate medical tests and GAMCA records', module: 'RECRUITMENT' },
  { code: 'MEDICAL_MANAGE', description: 'Schedule exams, record results, and upload reports', module: 'RECRUITMENT' },
  { code: 'CLEARANCE_VIEW', description: 'View government and BMET clearance records', module: 'RECRUITMENT' },
  { code: 'CLEARANCE_MANAGE', description: 'Track BMET clearance and Smart Cards', module: 'RECRUITMENT' },
  { code: 'DEPARTURE_VIEW', description: 'View flight schedules and departure itineraries', module: 'RECRUITMENT' },
  { code: 'DEPARTURE_MANAGE', description: 'Manage tickets, airport assistance, and reporting', module: 'RECRUITMENT' },

  // Support
  { code: 'SUPPORT_TICKET_VIEW', description: 'View candidate support inquiries and tickets', module: 'SUPPORT' },
  { code: 'SUPPORT_TICKET_MANAGE', description: 'Respond to tickets and assign resolution status', module: 'SUPPORT' },
];

const V2_ROLES = [
  { name: 'RECRUITMENT_MANAGER', description: 'Supervises end-to-end recruitment operations and job pipelines', isSystem: true },
  { name: 'RECRUITER', description: 'Manages candidate sourcing, interviews, and job matching', isSystem: true },
  { name: 'DOCUMENT_OFFICER', description: 'Validates candidate identification, passports, and compliance files', isSystem: true },
  { name: 'TRAINING_MANAGER', description: 'Supervises technical skill courses, batches, centers, and certification', isSystem: true },
  { name: 'FINANCE_OFFICER', description: 'Oversees candidate billing, invoices, receipts, and ledger reconciliation', isSystem: true },
  { name: 'VISA_OFFICER', description: 'Handles embassy submissions, biometrics, and visa endorsements', isSystem: true },
  { name: 'SUPPORT_OFFICER', description: 'Provides applicant assistance and ticket resolution', isSystem: true },
];

const TRAINING_CATEGORIES = [
  { name: 'Electrical & Wiring', banglaName: 'ইলেকট্রিশিয়ান ও ওয়্যারিং', slug: 'electrical-wiring', icon: 'Zap', description: 'Residential, commercial, and industrial electrical wiring and maintenance.' },
  { name: 'Plumbing & Pipe Fitting', banglaName: 'প্লাম্বিং ও পাইপ ফিটিং', slug: 'plumbing-pipe-fitting', icon: 'Wrench', description: 'Sanitary installation, pipeline layout, and high-pressure fitting.' },
  { name: 'Welding & Fabrication', banglaName: 'ওয়েল্ডিং ও ফ্যাব্রিকেশন', slug: 'welding-fabrication', icon: 'Flame', description: 'Shielded Metal Arc (SMAW), TIG, MIG, and structural metal fabrication.' },
  { name: 'Masonry & Tiling', banglaName: 'রাজমিস্ত্রি ও টাইলস ফিক্সিং', slug: 'masonry-tiling', icon: 'Hammer', description: 'Brick laying, plastering, ceramic tiling, and construction masonry.' },
  { name: 'Carpentry & Shuttering', banglaName: 'কার্পেন্ট্রি ও শাটারিং', slug: 'carpentry-shuttering', icon: 'Layers', description: 'Building shuttering, formwork, framing, and interior woodcraft.' },
  { name: 'Heavy Equipment & Crane', banglaName: 'ভারী যন্ত্রপাতি ও ক্রেন চালনা', slug: 'heavy-equipment-crane', icon: 'Truck', description: 'Excavator, crane, bulldozer, and heavy earthmoving machinery operation.' },
  { name: 'HVAC & Refrigeration', banglaName: 'এইচভিএসি ও এয়ার কন্ডিশনিং', slug: 'hvac-refrigeration', icon: 'Wind', description: 'Commercial AC installation, refrigeration repair, and ventilation ducts.' },
  { name: 'Professional Driving', banglaName: 'পেশাদার ড্রাইভিং', slug: 'professional-driving', icon: 'Navigation', description: 'Light and heavy commercial vehicle driving, traffic compliance, and GPS navigation.' },
  { name: 'Culinary & Catering', banglaName: 'রান্না ও ক্যাটারিং', slug: 'culinary-catering', icon: 'Utensils', description: 'Commercial kitchen operation, continental culinary, and hygiene standards.' },
  { name: 'Hospitality & Service', banglaName: 'হসপিটালিটি ও রেস্তোরাঁ সার্ভিস', slug: 'hospitality-service', icon: 'Coffee', description: 'Hotel guest service, table waiting, housekeeping, and customer communication.' },
  { name: 'Caregiving & Nursing Aid', banglaName: 'কেয়ারগিভিং ও স্বাস্থ্যসেবা', slug: 'caregiving-nursing-aid', icon: 'HeartPulse', description: 'Elderly care, home assistance, patient support, and vital signs monitoring.' },
  { name: 'Garments & Machine Operation', banglaName: 'গার্মেন্টস ও মেশিন অপারেশন', slug: 'garments-machine-operation', icon: 'Scissors', description: 'Industrial sewing, flatlock, overlock, and apparel manufacturing.' },
];

const TRAINING_CENTERS = [
  {
    code: 'TC-DHK-001',
    name: 'Shakil Global Technical Institute (Dhaka)',
    banglaName: 'শাকিল গ্লোবাল টেকনিক্যাল ট্রেনিং ইনস্টিটিউট, ঢাকা',
    district: 'Dhaka',
    division: 'Dhaka',
    address: 'Plot 14, Main Road, Mirpur-10, Dhaka-1216',
    contactPerson: 'Engr. Mahbubur Rahman',
    contactPhone: '01711002233',
    email: 'dhaka.training@shakilglobal.com',
    capacity: 120,
    facilities: 'Practical labs for electrical, welding, HVAC, multimedia classrooms, computer lab',
    operatingStatus: 'ACTIVE',
  },
  {
    code: 'TC-NET-002',
    name: 'Shakil Global Manpower Training Center (Netrokona)',
    banglaName: 'শাকিল গ্লোবাল ম্যানপাওয়ার ট্রেনিং সেন্টার, নেত্রকোনা',
    district: 'Netrokona',
    division: 'Mymensingh',
    address: 'ইসলামপুর মোড়, ডায়াবেটিক হাসপাতালের সামনে, পাসপোর্ট অফিস রোড, নেত্রকোনা-২৪০০',
    contactPerson: 'Al-Amin Shakil',
    contactPhone: '01913681771',
    email: 'netrokona@shakilglobal.com',
    capacity: 80,
    facilities: 'Carpentry, plumbing fixtures, masonry ground, driving simulation, bilingual interview room',
    operatingStatus: 'ACTIVE',
  },
  {
    code: 'TC-CTG-003',
    name: 'Shakil Vocational Academy (Chittagong)',
    banglaName: 'শাকিল ভোকেশনাল একাডেমি, চট্টগ্রাম',
    district: 'Chittagong',
    division: 'Chittagong',
    address: 'Agrabad Commercial Area, Chittagong-4100',
    contactPerson: 'Md. Tareq Hasan',
    contactPhone: '01819887766',
    email: 'ctg.training@shakilglobal.com',
    capacity: 100,
    facilities: 'Heavy mechanical workshop, shipyard welding bay, marine electrical lab',
    operatingStatus: 'ACTIVE',
  },
];

async function seedV2() {
  console.log('Seeding V2 Roles and Permissions...');

  // 1. Seed Permissions
  for (const p of V2_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: { description: p.description, module: p.module },
      create: p,
    });
  }

  // 2. Seed Roles
  for (const r of V2_ROLES) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description, isSystem: true },
      create: r,
    });
  }

  // Connect Super Admin to all permissions
  const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
  if (superAdminRole) {
    const allPerms = await prisma.permission.findMany();
    for (const perm of allPerms) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      });
    }
  }

  // 3. Seed Training Categories
  console.log('Seeding Training Categories...');
  for (const cat of TRAINING_CATEGORIES) {
    await prisma.trainingCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        banglaName: cat.banglaName,
        icon: cat.icon,
        description: cat.description,
      },
      create: cat,
    });
  }

  // 4. Seed Training Centers
  console.log('Seeding Training Centers...');
  const centerRecords: Record<string, any> = {};
  for (const tc of TRAINING_CENTERS) {
    const created = await prisma.trainingCenter.upsert({
      where: { code: tc.code },
      update: tc,
      create: tc,
    });
    centerRecords[tc.code] = created;
  }

  // 5. Seed Training Courses
  console.log('Seeding Training Courses...');
  const electricalCat = await prisma.trainingCategory.findUnique({ where: { slug: 'electrical-wiring' } });
  const weldingCat = await prisma.trainingCategory.findUnique({ where: { slug: 'welding-fabrication' } });
  const plumbingCat = await prisma.trainingCategory.findUnique({ where: { slug: 'plumbing-pipe-fitting' } });
  const drivingCat = await prisma.trainingCategory.findUnique({ where: { slug: 'heavy-equipment-crane' } });
  const caregivingCat = await prisma.trainingCategory.findUnique({ where: { slug: 'caregiving-nursing-aid' } });

  const sampleCourses = [
    {
      courseCode: 'TC-ELE-01',
      title: 'Industrial Electrical & Building Wiring Level 1',
      banglaTitle: 'ইন্ডাস্ট্রিয়াল ইলেকট্রিক্যাল ও বিল্ডিং ওয়্যারিং (লেভেল ১)',
      slug: 'industrial-electrical-wiring-level-1',
      categoryId: electricalCat!.id,
      description: 'Comprehensive hands-on training on single and three-phase wiring, circuit breakers, conduit installation, motor starters, and BMET safety protocols for Gulf countries.',
      durationWeeks: 4,
      hoursTotal: 120,
      fee: 15000,
      certificationType: 'BMET_AFFILIATED',
      status: 'ACTIVE',
      featured: true,
      eligibility: 'Minimum 8th Grade / JSC pass. Age 18-35. Basic physical fitness.',
      requiredDocuments: 'NID/Birth Certificate, 2 passport-size photos, Educational certificate copy.',
    },
    {
      courseCode: 'TC-WLD-01',
      title: 'Structural ARC & 6G Pipe Welding',
      banglaTitle: 'স্ট্রাকচারাল আর্ক ও সিক্স-জি পাইপ ওয়েল্ডিং',
      slug: 'structural-arc-6g-pipe-welding',
      categoryId: weldingCat!.id,
      description: 'Master SMAW and GMAW techniques in all positions including 1G to 6G pipe joints, gas cutting, safety precautions, and structural standards for Saudi/UAE construction.',
      durationWeeks: 6,
      hoursTotal: 180,
      fee: 18000,
      certificationType: 'BMET_AFFILIATED',
      status: 'ACTIVE',
      featured: true,
      eligibility: 'Minimum 8th Grade pass with good eyesight.',
      requiredDocuments: 'NID, 2 photos, Medical clearance.',
    },
    {
      courseCode: 'TC-PLM-01',
      title: 'Modern Plumbing & Sanitary Systems',
      banglaTitle: 'মডার্ন প্লাম্বিং ও স্যানিটারি সিস্টেম',
      slug: 'modern-plumbing-sanitary-systems',
      categoryId: plumbingCat!.id,
      description: 'PPR/CPVC pipe installation, drainage layout, water pump connection, bathroom fixture mounting, and plumbing blueprint reading.',
      durationWeeks: 4,
      hoursTotal: 120,
      fee: 12000,
      certificationType: 'BMET_AFFILIATED',
      status: 'ACTIVE',
      featured: true,
      eligibility: 'Minimum 8th Grade pass.',
      requiredDocuments: 'NID copy, 2 photos.',
    },
    {
      courseCode: 'TC-EQP-01',
      title: 'Heavy Crane & Excavator Operations',
      banglaTitle: 'হেভি ক্রেন ও এক্সকাভেটর চালনা',
      slug: 'heavy-crane-excavator-operations',
      categoryId: drivingCat!.id,
      description: 'Controls and hydraulic systems of crawler cranes and hydraulic excavators. Trenching, heavy lifting, site safety, and international hand signals.',
      durationWeeks: 8,
      hoursTotal: 240,
      fee: 25000,
      certificationType: 'BMET_AFFILIATED',
      status: 'ACTIVE',
      featured: true,
      eligibility: 'Valid Bangladesh BRTA Driving License (Medium/Heavy preferred). Age 21-40.',
      requiredDocuments: 'BRTA Driving License copy, NID, 2 photos.',
    },
    {
      courseCode: 'TC-CRG-01',
      title: 'Overseas Professional Caregiving & Geriatric Care',
      banglaTitle: 'পেশাদার কেয়ারগিভিং ও প্রবীণ সেবা',
      slug: 'overseas-caregiving-geriatric-care',
      categoryId: caregivingCat!.id,
      description: 'Specialized training for elderly care in European and Asian countries. Patient mobility, vital sign monitoring, nutrition management, medication reminders, and first aid.',
      durationWeeks: 6,
      hoursTotal: 180,
      fee: 22000,
      certificationType: 'BMET_AFFILIATED',
      status: 'ACTIVE',
      featured: true,
      eligibility: 'Minimum SSC / 10th grade pass. Basic English communication ability.',
      requiredDocuments: 'SSC Certificate copy, NID, 4 photos.',
    },
  ];

  for (const c of sampleCourses) {
    const createdCourse = await prisma.trainingCourse.upsert({
      where: { courseCode: c.courseCode },
      update: c,
      create: c,
    });

    // Create upcoming batch for this course at Dhaka and Netrokona centers
    const batchDhakaCode = `BATCH-2026-${c.courseCode}-DHK`;
    await prisma.trainingBatch.upsert({
      where: { batchCode: batchDhakaCode },
      update: {
        startDate: new Date('2026-10-01'),
        endDate: new Date('2026-11-15'),
        capacity: 30,
        classSchedule: 'রবি - বৃহস্পতি (সকাল ৯:০০ - দুপুর ১:০০)',
        status: 'ENROLLING',
      },
      create: {
        batchCode: batchDhakaCode,
        courseId: createdCourse.id,
        centerId: centerRecords['TC-DHK-001'].id,
        startDate: new Date('2026-10-01'),
        endDate: new Date('2026-11-15'),
        capacity: 30,
        classSchedule: 'রবি - বৃহস্পতি (সকাল ৯:০০ - দুপুর ১:০০)',
        status: 'ENROLLING',
      },
    });

    const batchNetCode = `BATCH-2026-${c.courseCode}-NET`;
    await prisma.trainingBatch.upsert({
      where: { batchCode: batchNetCode },
      update: {
        startDate: new Date('2026-10-15'),
        endDate: new Date('2026-11-30'),
        capacity: 25,
        classSchedule: 'শনি - বুধ (সকাল ৯:৩০ - দুপুর ১:৩০)',
        status: 'ENROLLING',
      },
      create: {
        batchCode: batchNetCode,
        courseId: createdCourse.id,
        centerId: centerRecords['TC-NET-002'].id,
        startDate: new Date('2026-10-15'),
        endDate: new Date('2026-11-30'),
        capacity: 25,
        classSchedule: 'শনি - বুধ (সকাল ৯:৩০ - দুপুর ১:৩০)',
        status: 'ENROLLING',
      },
    });
  }

  console.log('✅ V2 Database Seeding completed successfully!');
}

seedV2()
  .catch((e) => {
    console.error('V2 Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
