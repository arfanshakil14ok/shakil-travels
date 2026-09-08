import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PERMISSIONS = [
  // Dashboard
  { code: 'DASHBOARD_VIEW', description: 'View admin dashboard', module: 'DASHBOARD' },

  // Users
  { code: 'USER_VIEW', description: 'View staff users list and details', module: 'USERS' },
  { code: 'USER_CREATE', description: 'Create new staff users', module: 'USERS' },
  { code: 'USER_EDIT', description: 'Edit staff users and toggle status', module: 'USERS' },
  { code: 'USER_DELETE', description: 'Delete staff users', module: 'USERS' },

  // Applicants (Phase 2)
  { code: 'APPLICANT_VIEW', description: 'View candidate applicants', module: 'RECRUITMENT' },
  { code: 'APPLICANT_CREATE', description: 'Register new candidate applicants', module: 'RECRUITMENT' },
  { code: 'APPLICANT_EDIT', description: 'Edit candidate profile, status, and assignments', module: 'RECRUITMENT' },
  { code: 'APPLICANT_DELETE', description: 'Delete candidate records', module: 'RECRUITMENT' },
  { code: 'APPLICANT_EXPORT', description: 'Export applicant directory to CSV', module: 'RECRUITMENT' },

  // Jobs (Phase 2)
  { code: 'JOB_VIEW', description: 'View job demand listings', module: 'RECRUITMENT' },
  { code: 'JOB_CREATE', description: 'Create overseas job postings', module: 'RECRUITMENT' },
  { code: 'JOB_EDIT', description: 'Update job posting details and status', module: 'RECRUITMENT' },
  { code: 'JOB_DELETE', description: 'Delete job postings', module: 'RECRUITMENT' },
  { code: 'JOB_PUBLISH', description: 'Publish or pause public job postings', module: 'RECRUITMENT' },
  { code: 'JOB_EXPORT', description: 'Export job demands to CSV', module: 'RECRUITMENT' },

  // Employers (Phase 2)
  { code: 'EMPLOYER_VIEW', description: 'View overseas employers directory', module: 'RECRUITMENT' },
  { code: 'EMPLOYER_CREATE', description: 'Register foreign employers and companies', module: 'RECRUITMENT' },
  { code: 'EMPLOYER_EDIT', description: 'Verify and edit employer records', module: 'RECRUITMENT' },
  { code: 'EMPLOYER_DELETE', description: 'Delete employer records', module: 'RECRUITMENT' },

  // Countries (Phase 2)
  { code: 'COUNTRY_VIEW', description: 'View destination countries directory', module: 'SYSTEM' },
  { code: 'COUNTRY_CREATE', description: 'Add new destination country', module: 'SYSTEM' },
  { code: 'COUNTRY_EDIT', description: 'Update destination country policies', module: 'SYSTEM' },
  { code: 'COUNTRY_DELETE', description: 'Remove destination country', module: 'SYSTEM' },

  // Categories (Phase 2)
  { code: 'CATEGORY_VIEW', description: 'View job categories', module: 'SYSTEM' },
  { code: 'CATEGORY_CREATE', description: 'Create job category', module: 'SYSTEM' },
  { code: 'CATEGORY_EDIT', description: 'Edit job category', module: 'SYSTEM' },
  { code: 'CATEGORY_DELETE', description: 'Delete job category', module: 'SYSTEM' },

  // Applications (Phase 3)
  { code: 'APPLICATION_VIEW', description: 'View candidate applications', module: 'RECRUITMENT' },
  { code: 'APPLICATION_CREATE', description: 'Create candidate applications', module: 'RECRUITMENT' },
  { code: 'APPLICATION_EDIT', description: 'Edit candidate applications', module: 'RECRUITMENT' },
  { code: 'APPLICATION_DELETE', description: 'Delete candidate applications', module: 'RECRUITMENT' },
  { code: 'APPLICATION_STATUS_CHANGE', description: 'Advance and change recruitment application status', module: 'RECRUITMENT' },
  { code: 'APPLICATION_ASSIGN', description: 'Assign staff to applications', module: 'RECRUITMENT' },
  { code: 'APPLICATION_EXPORT', description: 'Export applications to CSV', module: 'RECRUITMENT' },

  // Documents (Phase 3)
  { code: 'DOCUMENT_VIEW', description: 'View candidate documents', module: 'DOCUMENTS' },
  { code: 'DOCUMENT_UPLOAD', description: 'Upload candidate documents', module: 'DOCUMENTS' },
  { code: 'DOCUMENT_VERIFY', description: 'Verify candidate documents', module: 'DOCUMENTS' },
  { code: 'DOCUMENT_REJECT', description: 'Reject candidate documents with reason', module: 'DOCUMENTS' },
  { code: 'DOCUMENT_DELETE', description: 'Delete candidate documents', module: 'DOCUMENTS' },
  { code: 'DOCUMENT_EXPORT', description: 'Export document records', module: 'DOCUMENTS' },

  // Interviews (Phase 3)
  { code: 'INTERVIEW_VIEW', description: 'View scheduled interviews', module: 'RECRUITMENT' },
  { code: 'INTERVIEW_CREATE', description: 'Schedule candidate interviews', module: 'RECRUITMENT' },
  { code: 'INTERVIEW_EDIT', description: 'Update and reschedule interviews', module: 'RECRUITMENT' },
  { code: 'INTERVIEW_CANCEL', description: 'Cancel candidate interviews', module: 'RECRUITMENT' },
  { code: 'INTERVIEW_RESULT', description: 'Record interview evaluation scores and outcomes', module: 'RECRUITMENT' },

  // Invoices (Phase 4)
  { code: 'INVOICE_VIEW', description: 'View invoices', module: 'FINANCE' },
  { code: 'INVOICE_CREATE', description: 'Generate candidate invoices', module: 'FINANCE' },
  { code: 'INVOICE_EDIT', description: 'Modify and update draft invoices', module: 'FINANCE' },
  { code: 'INVOICE_ISSUE', description: 'Officially issue invoices', module: 'FINANCE' },
  { code: 'INVOICE_VOID', description: 'Void and cancel invoices', module: 'FINANCE' },
  { code: 'INVOICE_EXPORT', description: 'Export invoices to CSV', module: 'FINANCE' },

  // Payments (Phase 4)
  { code: 'PAYMENT_VIEW', description: 'View payment records', module: 'FINANCE' },
  { code: 'PAYMENT_CREATE', description: 'Record candidate and employer payments', module: 'FINANCE' },
  { code: 'PAYMENT_EDIT', description: 'Modify payment records', module: 'FINANCE' },
  { code: 'PAYMENT_REVERSE', description: 'Reverse payment transactions', module: 'FINANCE' },
  { code: 'PAYMENT_EXPORT', description: 'Export payments to CSV', module: 'FINANCE' },

  // Receipts (Phase 4)
  { code: 'RECEIPT_VIEW', description: 'View payment receipts', module: 'FINANCE' },
  { code: 'RECEIPT_PRINT', description: 'Print payment receipts', module: 'FINANCE' },

  // Refunds (Phase 4)
  { code: 'REFUND_VIEW', description: 'View refund records', module: 'FINANCE' },
  { code: 'REFUND_CREATE', description: 'Initiate candidate refunds', module: 'FINANCE' },
  { code: 'REFUND_APPROVE', description: 'Approve and post refunds', module: 'FINANCE' },

  // Ledger & Reports (Phase 4)
  { code: 'LEDGER_VIEW', description: 'View customer accounts ledger', module: 'FINANCE' },
  { code: 'LEDGER_EXPORT', description: 'Export customer ledger', module: 'FINANCE' },
  { code: 'ACCOUNT_REPORT_VIEW', description: 'View executive accounting and collection reports', module: 'REPORTS' },
  { code: 'ACCOUNT_REPORT_EXPORT', description: 'Export financial reports', module: 'REPORTS' },
  { code: 'SERVICE_MANAGE', description: 'Manage service catalog and prices', module: 'FINANCE' },

  { code: 'REPORT_VIEW', description: 'Generate and view recruitment and financial reports', module: 'REPORTS' },
  { code: 'SETTINGS_MANAGE', description: 'Manage company and system settings', module: 'SYSTEM' },
  { code: 'AUDIT_VIEW', description: 'Inspect audit trail and activity logs', module: 'SYSTEM' },

  // Phase 5 Visa, Country & Migrant
  { code: 'VISA_VIEW', description: 'View visa applications and cases', module: 'VISA' },
  { code: 'VISA_CREATE', description: 'Create and open visa cases', module: 'VISA' },
  { code: 'VISA_EDIT', description: 'Edit visa case details and appointments', module: 'VISA' },
  { code: 'VISA_STATUS_CHANGE', description: 'Transition visa lifecycle status', module: 'VISA' },
  { code: 'VISA_ASSIGN', description: 'Assign staff to visa cases', module: 'VISA' },
  { code: 'VISA_EXPORT', description: 'Export visa records to CSV', module: 'VISA' },
  { code: 'VISA_DOCUMENT_VIEW', description: 'View visa compliance documents', module: 'VISA' },
  { code: 'VISA_DOCUMENT_MANAGE', description: 'Manage visa document requests', module: 'VISA' },
  { code: 'COUNTRY_INFO_MANAGE', description: 'Manage country recruitment and worker guidance', module: 'SYSTEM' },
  { code: 'VISA_INFO_MANAGE', description: 'Manage official visa rules and criteria', module: 'SYSTEM' },
  { code: 'MIGRANT_INFO_VIEW', description: 'View migrant advisory content', module: 'CONTENT' },
  { code: 'MIGRANT_INFO_CREATE', description: 'Author migrant advisory articles', module: 'CONTENT' },
  { code: 'MIGRANT_INFO_EDIT', description: 'Update migrant advisories and warnings', module: 'CONTENT' },
  { code: 'MIGRANT_INFO_PUBLISH', description: 'Publish or archive migrant articles', module: 'CONTENT' },
  { code: 'MIGRANT_INFO_DELETE', description: 'Delete migrant advisory articles', module: 'CONTENT' },

  // Phase 6 Portal & Comms & Leads
  { code: 'PORTAL_SUPPORT_VIEW', description: 'Safe support view of applicant portal', module: 'PORTAL' },
  { code: 'COMMUNICATION_VIEW', description: 'View message delivery logs', module: 'COMMUNICATIONS' },
  { code: 'COMMUNICATION_SEND', description: 'Dispatch manual and triggered communications', module: 'COMMUNICATIONS' },
  { code: 'COMMUNICATION_TEMPLATE_MANAGE', description: 'Manage communication templates', module: 'COMMUNICATIONS' },
  { code: 'COMMUNICATION_LOG_VIEW', description: 'Inspect message audit trail and retry queue', module: 'COMMUNICATIONS' },
  { code: 'NOTIFICATION_MANAGE', description: 'Broadcast and manage system notifications', module: 'COMMUNICATIONS' },
  { code: 'INQUIRY_VIEW', description: 'View public website inquiries and leads', module: 'LEADS' },
  { code: 'INQUIRY_MANAGE', description: 'Manage and convert inquiries to applicants', module: 'LEADS' },

  // Phase 7 Reporting & Analytics
  { code: 'REPORT_EXPORT', description: 'Export reports to CSV', module: 'REPORTS' },
  { code: 'RECRUITMENT_REPORT_VIEW', description: 'View recruitment funnel and placement analytics', module: 'REPORTS' },
  { code: 'FINANCIAL_REPORT_VIEW', description: 'View revenue trends and collection reports', module: 'REPORTS' },
  { code: 'STAFF_REPORT_VIEW', description: 'View staff workload and productivity metrics', module: 'REPORTS' },
  { code: 'VISA_REPORT_VIEW', description: 'View visa approval rates and processing duration analytics', module: 'REPORTS' },
  { code: 'COMMUNICATION_REPORT_VIEW', description: 'View delivery rates and communication analytics', module: 'REPORTS' },
];

const ROLES = [
  { name: 'SUPER_ADMIN', description: 'Full root access to all system modules and settings', isSystem: true },
  { name: 'ADMIN', description: 'Enterprise administrative access across operations', isSystem: true },
  { name: 'RECRUITMENT_STAFF', description: 'Handles applicants, jobs, interviews, employers, and categories', isSystem: true },
  { name: 'ACCOUNTS_STAFF', description: 'Handles invoices, payments, and financial records', isSystem: true },
  { name: 'CONTENT_MANAGER', description: 'Manages website content, blogs, and migrant guides', isSystem: true },
  { name: 'VIEWER', description: 'Read-only access to recruitment and reporting data', isSystem: true },
];

const ROLE_PERMISSION_MAPPING: Record<string, string[]> = {
  SUPER_ADMIN: PERMISSIONS.map((p) => p.code),
  ADMIN: PERMISSIONS.filter((p) => !['USER_DELETE', 'APPLICANT_DELETE', 'JOB_DELETE', 'APPLICATION_DELETE'].includes(p.code)).map((p) => p.code),
  RECRUITMENT_STAFF: [
    'DASHBOARD_VIEW',
    'APPLICANT_VIEW',
    'APPLICANT_CREATE',
    'APPLICANT_EDIT',
    'APPLICANT_EXPORT',
    'JOB_VIEW',
    'JOB_CREATE',
    'JOB_EDIT',
    'JOB_PUBLISH',
    'JOB_EXPORT',
    'EMPLOYER_VIEW',
    'EMPLOYER_CREATE',
    'EMPLOYER_EDIT',
    'CATEGORY_VIEW',
    'CATEGORY_CREATE',
    'CATEGORY_EDIT',
    'COUNTRY_VIEW',
    'APPLICATION_VIEW',
    'APPLICATION_CREATE',
    'APPLICATION_EDIT',
    'APPLICATION_STATUS_CHANGE',
    'APPLICATION_ASSIGN',
    'APPLICATION_EXPORT',
    'DOCUMENT_VIEW',
    'DOCUMENT_UPLOAD',
    'DOCUMENT_VERIFY',
    'DOCUMENT_REJECT',
    'DOCUMENT_EXPORT',
    'INTERVIEW_VIEW',
    'INTERVIEW_CREATE',
    'INTERVIEW_EDIT',
    'INTERVIEW_CANCEL',
    'INTERVIEW_RESULT',
    'VISA_VIEW',
    'VISA_CREATE',
    'VISA_EDIT',
    'VISA_STATUS_CHANGE',
    'VISA_ASSIGN',
    'VISA_EXPORT',
    'VISA_DOCUMENT_VIEW',
    'VISA_DOCUMENT_MANAGE',
    'RECRUITMENT_REPORT_VIEW',
    'VISA_REPORT_VIEW',
    'INQUIRY_VIEW',
    'INQUIRY_MANAGE',
  ],
  ACCOUNTS_STAFF: [
    'DASHBOARD_VIEW',
    'INVOICE_VIEW',
    'INVOICE_CREATE',
    'INVOICE_EDIT',
    'INVOICE_ISSUE',
    'INVOICE_EXPORT',
    'PAYMENT_VIEW',
    'PAYMENT_CREATE',
    'PAYMENT_EDIT',
    'PAYMENT_EXPORT',
    'RECEIPT_VIEW',
    'RECEIPT_PRINT',
    'REFUND_VIEW',
    'REFUND_CREATE',
    'LEDGER_VIEW',
    'LEDGER_EXPORT',
    'ACCOUNT_REPORT_VIEW',
    'ACCOUNT_REPORT_EXPORT',
    'FINANCIAL_REPORT_VIEW',
    'SERVICE_MANAGE',
    'REPORT_VIEW',
  ],
  CONTENT_MANAGER: [
    'DASHBOARD_VIEW',
    'REPORT_VIEW',
    'COUNTRY_VIEW',
    'CATEGORY_VIEW',
    'COUNTRY_INFO_MANAGE',
    'VISA_INFO_MANAGE',
    'MIGRANT_INFO_VIEW',
    'MIGRANT_INFO_CREATE',
    'MIGRANT_INFO_EDIT',
    'MIGRANT_INFO_PUBLISH',
    'MIGRANT_INFO_DELETE',
  ],
  VIEWER: [
    'DASHBOARD_VIEW',
    'USER_VIEW',
    'APPLICANT_VIEW',
    'JOB_VIEW',
    'EMPLOYER_VIEW',
    'COUNTRY_VIEW',
    'CATEGORY_VIEW',
    'APPLICATION_VIEW',
    'DOCUMENT_VIEW',
    'INTERVIEW_VIEW',
    'INVOICE_VIEW',
    'PAYMENT_VIEW',
    'RECEIPT_VIEW',
    'LEDGER_VIEW',
    'ACCOUNT_REPORT_VIEW',
    'REPORT_VIEW',
  ],
};

const SYSTEM_SETTINGS = [
  { key: 'company.name', value: 'SHAKIL GLOBAL RECRUITMENT', group: 'company', description: 'Official registered company name' },
  { key: 'company.address', value: 'House 12, Road 4, Sector 7, Uttara, Dhaka-1230, Bangladesh', group: 'company', description: 'Headquarters physical address' },
  { key: 'company.phone', value: '+880 2 9876543 / +880 1711-000000', group: 'company', description: 'Official telephone and hotline' },
  { key: 'company.email', value: 'info@shakilglobal.com', group: 'company', description: 'Official email address' },
  { key: 'company.website', value: 'https://shakilglobal.com', group: 'company', description: 'Official portal URL' },
  { key: 'company.logo', value: '/images/logo.png', group: 'company', description: 'Brand logo path' },
  { key: 'company.business_hours', value: 'Sat - Thu: 9:00 AM - 6:00 PM (Friday Closed)', group: 'company', description: 'Operational business hours' },
  { key: 'system.currency', value: 'BDT', group: 'system', description: 'Default system transaction currency' },
  { key: 'system.timezone', value: 'Asia/Dhaka', group: 'system', description: 'Platform default timezone' },
  { key: 'system.date_format', value: 'DD/MM/YYYY', group: 'system', description: 'System date formatting style' },
  { key: 'system.prefix_applicant', value: 'SGR', group: 'recruitment', description: 'Prefix for generated Applicant IDs' },
  { key: 'system.prefix_job', value: 'SGR-JOB', group: 'recruitment', description: 'Prefix for generated Job IDs' },
  { key: 'system.prefix_application', value: 'SGR-APP', group: 'recruitment', description: 'Prefix for generated Application IDs' },
  { key: 'system.prefix_invoice', value: 'SGR-INV', group: 'finance', description: 'Prefix for generated Invoice IDs' },
  { key: 'system.prefix_payment', value: 'SGR-PAY', group: 'finance', description: 'Prefix for generated Payment IDs' },
  { key: 'system.prefix_receipt', value: 'SGR-RCP', group: 'finance', description: 'Prefix for generated Receipt IDs' },
  { key: 'system.prefix_refund', value: 'SGR-REF', group: 'finance', description: 'Prefix for generated Refund IDs' },
];

const JOB_CATEGORIES = [
  { name: 'Construction', slug: 'construction', description: 'Masons, Carpenters, Steel fixers, Shuttering carpenters, Civil labor', icon: 'HardHat' },
  { name: 'Electrician', slug: 'electrician', description: 'Industrial, Residential, Building electrical wirers, Substation technicians', icon: 'Zap' },
  { name: 'Plumber', slug: 'plumber', description: 'Pipefitters, Sanitary plumbers, Water line technicians, Drainage installers', icon: 'Wrench' },
  { name: 'Welder', slug: 'welder', description: 'TIG, MIG, ARC, 6G Certified pipe welders and structural fabricators', icon: 'Flame' },
  { name: 'Driver', slug: 'driver', description: 'Heavy vehicle drivers, Trailer operators, Bus drivers, Light taxi drivers', icon: 'Car' },
  { name: 'Restaurant', slug: 'restaurant', description: 'Chefs, Line cooks, Kitchen helpers, Baristas, Dishwashers', icon: 'UtensilsCrossed' },
  { name: 'Hotel', slug: 'hotel', description: 'Housekeeping, Front desk, Bellboys, Laundry attendants, Room service', icon: 'Building' },
  { name: 'Cleaning', slug: 'cleaning', description: 'Office cleaners, Mall cleaners, Commercial facility cleaners, Janitors', icon: 'Sparkles' },
  { name: 'Factory', slug: 'factory', description: 'Assembly line workers, Manufacturing packaging, Production floor assistants', icon: 'Factory' },
  { name: 'Warehouse', slug: 'warehouse', description: 'Forklift operators, Cargo loaders, Inventory checkers, Pallet stackers', icon: 'Boxes' },
  { name: 'Agriculture', slug: 'agriculture', description: 'Greenhouse farmers, Date palm harvesters, Dairy farm workers, Crop handlers', icon: 'Sprout' },
  { name: 'Caregiver', slug: 'caregiver', description: 'Elderly caregivers, Certified nursing assistants, Home healthcare aides', icon: 'HeartHandshake' },
  { name: 'Security', slug: 'security', description: 'Commercial building security guards, Watchmen, CCTV surveillance operators', icon: 'Shield' },
  { name: 'IT', slug: 'it', description: 'Network technicians, Cable installers, Hardware maintenance, IT support', icon: 'Laptop' },
  { name: 'Hospitality', slug: 'hospitality', description: 'Catering staff, Event stewards, Resort service crew, Airline attendants', icon: 'Coffee' },
  { name: 'Other', slug: 'other', description: 'General trades, Semi-skilled workers, Custom occupational requirements', icon: 'Briefcase' },
];

const COUNTRIES = [
  { name: 'Australia', code: 'AU', flag: 'https://flagcdn.com/w40/au.png', slug: 'australia', description: 'Skilled migration, TSS visa programs, Agriculture, Caregiving and Hospitality pathways.' },
  { name: 'Japan', code: 'JP', flag: 'https://flagcdn.com/w40/jp.png', slug: 'japan', description: 'SSW (Specified Skilled Worker) and TITP technical intern training programs. Language N4/JFT required.' },
  { name: 'South Korea', code: 'KR', flag: 'https://flagcdn.com/w40/kr.png', slug: 'south-korea', description: 'EPS government manufacturing, fishing, agriculture programs. High wage structure with welfare.' },
  { name: 'Saudi Arabia', code: 'SA', flag: 'https://flagcdn.com/w40/sa.png', slug: 'saudi-arabia', description: 'Largest Middle East market: Mega construction (NEOM, Red Sea), driving, technicians, facilities.' },
  { name: 'UAE', code: 'AE', flag: 'https://flagcdn.com/w40/ae.png', slug: 'uae', description: 'Dubai, Abu Dhabi, Sharjah: Hospitality, security, mechanical trades, logistics, retail.' },
  { name: 'Qatar', code: 'QA', flag: 'https://flagcdn.com/w40/qa.png', slug: 'qatar', description: 'Doha infrastructure, facilities management, catering, industrial engineering, general labor.' },
  { name: 'Oman', code: 'OM', flag: 'https://flagcdn.com/w40/om.png', slug: 'oman', description: 'Construction, MEP trades, factory processing, heavy driving, technical maintenance.' },
  { name: 'Kuwait', code: 'KW', flag: 'https://flagcdn.com/w40/kw.png', slug: 'kuwait', description: 'Healthcare, certified nurses, automobile mechanics, government project technical roles.' },
  { name: 'Malaysia', code: 'MY', flag: 'https://flagcdn.com/w40/my.png', slug: 'malaysia', description: 'Manufacturing, electronics assembly, plantation agriculture, construction under BMET quota.' },
  { name: 'Singapore', code: 'SG', flag: 'https://flagcdn.com/w40/sg.png', slug: 'singapore', description: 'Shipyard marine trades, certified construction (BCA), process plant maintenance.' },
  { name: 'Romania', code: 'RO', flag: 'https://flagcdn.com/w40/ro.png', slug: 'romania', description: 'European Union work permits: Construction, factory packaging, restaurant delivery, warehousing.' },
  { name: 'Poland', code: 'PL', flag: 'https://flagcdn.com/w40/pl.png', slug: 'poland', description: 'Schengen zone employment: Food processing, manufacturing plants, warehouse logistics.' },
  { name: 'Portugal', code: 'PT', flag: 'https://flagcdn.com/w40/pt.png', slug: 'portugal', description: 'Agriculture, greenhouse farming, hospitality, tourism service personnel.' },
  { name: 'Croatia', code: 'HR', flag: 'https://flagcdn.com/w40/hr.png', slug: 'croatia', description: 'Adriatic coast tourism, seasonal hotel hospitality, civil construction workers.' },
];

async function main() {
  console.log('🌱 Starting SHAKIL GLOBAL RECRUITMENT Phase 2 database seed...');

  // 1. Seed Permissions
  console.log('  -> Seeding permissions (total: ' + PERMISSIONS.length + ')...');
  const permissionMap = new Map<string, string>();
  for (const perm of PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { code: perm.code },
      update: { description: perm.description, module: perm.module },
      create: perm,
    });
    permissionMap.set(record.code, record.id);
  }

  // 2. Seed Roles & Assign Permissions
  console.log('  -> Seeding roles and assigning permissions...');
  const roleMap = new Map<string, string>();
  for (const roleDef of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: { description: roleDef.description, isSystem: roleDef.isSystem },
      create: roleDef,
    });
    roleMap.set(role.name, role.id);

    const allowedCodes = ROLE_PERMISSION_MAPPING[role.name] || [];
    for (const code of allowedCodes) {
      const permissionId = permissionMap.get(code);
      if (permissionId) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId,
          },
        });
      }
    }
  }

  // 3. Seed Default Users
  console.log('  -> Seeding staff users...');
  const defaultPasswordHash = await bcrypt.hash('Admin@SGR2026!', 12);
  const staffPasswordHash = await bcrypt.hash('Staff@SGR2026!', 12);
  const viewerPasswordHash = await bcrypt.hash('Viewer@SGR2026!', 12);

  const superAdminRole = roleMap.get('SUPER_ADMIN')!;
  const recruitmentRole = roleMap.get('RECRUITMENT_STAFF')!;
  const accountsRole = roleMap.get('ACCOUNTS_STAFF')!;
  const viewerRole = roleMap.get('VIEWER')!;

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@shakilglobal.com' },
    update: {
      name: 'System Super Admin',
      phone: '+880 1711-000000',
      roleId: superAdminRole,
      isActive: true,
      passwordHash: defaultPasswordHash,
    },
    create: {
      name: 'System Super Admin',
      email: 'admin@shakilglobal.com',
      phone: '+880 1711-000000',
      passwordHash: defaultPasswordHash,
      roleId: superAdminRole,
      isActive: true,
    },
  });

  const recruiter = await prisma.user.upsert({
    where: { email: 'recruiter@shakilglobal.com' },
    update: {
      name: 'Tariqul Islam',
      phone: '+880 1711-111111',
      roleId: recruitmentRole,
      isActive: true,
      passwordHash: staffPasswordHash,
    },
    create: {
      name: 'Tariqul Islam',
      email: 'recruiter@shakilglobal.com',
      phone: '+880 1711-111111',
      passwordHash: staffPasswordHash,
      roleId: recruitmentRole,
      isActive: true,
    },
  });

  const accountant = await prisma.user.upsert({
    where: { email: 'accounts@shakilglobal.com' },
    update: {
      name: 'Nasrin Akhter',
      phone: '+880 1711-222222',
      roleId: accountsRole,
      isActive: true,
      passwordHash: staffPasswordHash,
    },
    create: {
      name: 'Nasrin Akhter',
      email: 'accounts@shakilglobal.com',
      phone: '+880 1711-222222',
      passwordHash: staffPasswordHash,
      roleId: accountsRole,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'viewer@shakilglobal.com' },
    update: {
      name: 'Audit Observer',
      phone: '+880 1711-333333',
      roleId: viewerRole,
      isActive: true,
      passwordHash: viewerPasswordHash,
    },
    create: {
      name: 'Audit Observer',
      email: 'viewer@shakilglobal.com',
      phone: '+880 1711-333333',
      passwordHash: viewerPasswordHash,
      roleId: viewerRole,
      isActive: true,
    },
  });

  // 4. Seed System Settings
  console.log('  -> Seeding system settings...');
  for (const setting of SYSTEM_SETTINGS) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {
        value: setting.value,
        group: setting.group,
        description: setting.description,
      },
      create: setting,
    });
  }

  // 5. Seed Job Categories
  console.log('  -> Seeding job categories (total: ' + JOB_CATEGORIES.length + ')...');
  const categoryMap = new Map<string, string>();
  for (const cat of JOB_CATEGORIES) {
    const record = await prisma.jobCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, icon: cat.icon, isActive: true },
      create: { name: cat.name, slug: cat.slug, description: cat.description, icon: cat.icon, isActive: true },
    });
    categoryMap.set(cat.slug, record.id);
  }

  // 6. Seed Countries
  console.log('  -> Seeding destination countries (total: ' + COUNTRIES.length + ')...');
  const countryMap = new Map<string, string>();
  for (const c of COUNTRIES) {
    const record = await prisma.country.upsert({
      where: { code: c.code },
      update: { name: c.name, flag: c.flag, slug: c.slug, description: c.description, isActive: true },
      create: { name: c.name, code: c.code, flag: c.flag, slug: c.slug, description: c.description, isActive: true },
    });
    countryMap.set(c.code, record.id);
  }

  // 7. Seed Verified Employers
  console.log('  -> Seeding verified employers...');
  const saudiId = countryMap.get('SA')!;
  const uaeId = countryMap.get('AE')!;
  const qatarId = countryMap.get('QA')!;
  const japanId = countryMap.get('JP')!;

  const employerSaudi = await prisma.employer.upsert({
    where: { id: 'emp-saudi-binladin-01' },
    update: {},
    create: {
      id: 'emp-saudi-binladin-01',
      companyName: 'Al-Bawani Contracting & Engineering Co.',
      countryId: saudiId,
      industry: 'Civil Construction & Mega Infrastructure',
      contactPerson: 'Eng. Fahad Al-Otaibi',
      email: 'recruitment@albawani.sa',
      phone: '+966 11 478 9900',
      address: 'King Fahd Road, Al-Olaya, Riyadh 12214, Saudi Arabia',
      website: 'https://albawani.sa',
      verificationStatus: 'VERIFIED',
      notes: 'Embassy demand letter #2026/SA/887 verified. Regular hiring client.',
    },
  });

  // Link to Customer record (Requirement 10)
  await prisma.customer.upsert({
    where: { employerId: employerSaudi.id },
    update: {},
    create: {
      customerType: 'EMPLOYER',
      name: employerSaudi.companyName,
      email: employerSaudi.email,
      phone: employerSaudi.phone,
      employerId: employerSaudi.id,
    },
  });

  const employerUAE = await prisma.employer.upsert({
    where: { id: 'emp-uae-emaar-01' },
    update: {},
    create: {
      id: 'emp-uae-emaar-01',
      companyName: 'Gulf Hospitality & Facilities Management LLC',
      countryId: uaeId,
      industry: 'Hospitality & Commercial Facilities',
      contactPerson: 'Ms. Sarah Al-Nuaimi',
      email: 'hr@gulfhospitality.ae',
      phone: '+971 4 367 3333',
      address: 'Business Bay, Tower 2, Level 18, Dubai, UAE',
      website: 'https://gulfhospitality.ae',
      verificationStatus: 'VERIFIED',
      notes: 'Luxury hotel maintenance and service staff supplier.',
    },
  });

  await prisma.customer.upsert({
    where: { employerId: employerUAE.id },
    update: {},
    create: {
      customerType: 'EMPLOYER',
      name: employerUAE.companyName,
      email: employerUAE.email,
      phone: employerUAE.phone,
      employerId: employerUAE.id,
    },
  });

  const employerJapan = await prisma.employer.upsert({
    where: { id: 'emp-japan-care-01' },
    update: {},
    create: {
      id: 'emp-japan-care-01',
      companyName: 'Tokyo Medical Welfare Association (TMWA)',
      countryId: japanId,
      industry: 'Healthcare & Elder Caregiving',
      contactPerson: 'Kenji Sato',
      email: 'global@tmwa-care.jp',
      phone: '+81 3 5555 0199',
      address: 'Shinjuku-ku, Nishi-Shinjuku 2-8-1, Tokyo, Japan',
      website: 'https://tmwa-care.jp',
      verificationStatus: 'VERIFIED',
      notes: 'Official SSW Caregiver receiving organization. JLPT N4 required.',
    },
  });

  await prisma.customer.upsert({
    where: { employerId: employerJapan.id },
    update: {},
    create: {
      customerType: 'EMPLOYER',
      name: employerJapan.companyName,
      email: employerJapan.email,
      phone: employerJapan.phone,
      employerId: employerJapan.id,
    },
  });

  // 8. Seed Overseas Jobs
  console.log('  -> Seeding overseas jobs...');
  const constructionCatId = categoryMap.get('construction')!;
  const electricianCatId = categoryMap.get('electrician')!;
  const driverCatId = categoryMap.get('driver')!;
  const caregiverCatId = categoryMap.get('caregiver')!;
  const restaurantCatId = categoryMap.get('restaurant')!;

  const job1 = await prisma.job.upsert({
    where: { jobCode: 'SGR-JOB-2026-000001' },
    update: {},
    create: {
      jobCode: 'SGR-JOB-2026-000001',
      title: 'হেভি ক্রেন ও এক্সকাভেটর অপারেটর (Heavy Equipment Operator)',
      slug: 'heavy-equipment-crane-operator-saudi-arabia',
      countryId: saudiId,
      jobCategoryId: driverCatId,
      employerId: employerSaudi.id,
      description: 'সৌদি আরবের রিয়াদে মেগা ইনফ্রাস্ট্রাকচার প্রজেক্টে অভিজ্ঞ মোবাইল ক্রেন এবং এক্সকাভেটর অপারেটর প্রয়োজন। বৈধ লাইসেন্স ও ন্যূনতম ৩ বছরের অভিজ্ঞতা থাকতে হবে।',
      salaryMin: new Prisma.Decimal('2500.00'),
      salaryMax: new Prisma.Decimal('3200.00'),
      currency: 'SAR',
      experienceRequired: 3,
      educationRequired: 'Class 8 / SSC Equivalent',
      ageMin: 22,
      ageMax: 42,
      languageRequirements: 'Basic Arabic / English preferred',
      skillsRequired: 'Heavy Crane Operation, Excavator, Hydraulic Maintenance, Site Safety',
      vacancyCount: 20,
      accommodation: true,
      food: true,
      transportation: true,
      medical: true,
      airTicket: true,
      workingHours: '8 hours / day (6 days / week) + Overtime',
      contractDuration: '2 Years (Renewable)',
      applicationDeadline: new Date('2026-11-30'),
      status: 'PUBLISHED',
      featured: true,
      createdBy: superAdmin.id,
    },
  });

  const job2 = await prisma.job.upsert({
    where: { jobCode: 'SGR-JOB-2026-000002' },
    update: {},
    create: {
      jobCode: 'SGR-JOB-2026-000002',
      title: 'ইন্ডাস্ট্রিয়াল সার্টিফাইড ইলেকট্রিশিয়ান (Industrial Electrician)',
      slug: 'industrial-electrician-dubai-uae',
      countryId: uaeId,
      jobCategoryId: electricianCatId,
      employerId: employerUAE.id,
      description: 'দুবাইয়ের বাণিজ্যিক টাওয়ার ও হোটেল প্রকল্পে অভিজ্ঞ ক্যাবল লেইং ও প্যানেল ওয়্যারিং ইলেকট্রিশিয়ান প্রয়োজন। ড্রয়িং রিডিং ও পাওয়ার টেস্ট পারদর্শী হতে হবে।',
      salaryMin: new Prisma.Decimal('2200.00'),
      salaryMax: new Prisma.Decimal('2800.00'),
      currency: 'AED',
      experienceRequired: 2,
      educationRequired: 'Trade Vocational Certificate / SSC',
      ageMin: 21,
      ageMax: 38,
      languageRequirements: 'English conversational',
      skillsRequired: 'Industrial Wiring, Cable Jointing, Distribution Board Setup, Voltage Testing',
      vacancyCount: 15,
      accommodation: true,
      food: false,
      transportation: true,
      medical: true,
      airTicket: true,
      workingHours: '8 hours / day + OT',
      contractDuration: '2 Years (Renewable)',
      applicationDeadline: new Date('2026-10-31'),
      status: 'PUBLISHED',
      featured: true,
      createdBy: superAdmin.id,
    },
  });

  const job3 = await prisma.job.upsert({
    where: { jobCode: 'SGR-JOB-2026-000003' },
    update: {},
    create: {
      jobCode: 'SGR-JOB-2026-000003',
      title: 'সার্টিফাইড বয়োবৃদ্ধ কেয়ারগিভার (Certified SSW Caregiver)',
      slug: 'certified-caregiver-tokyo-japan',
      countryId: japanId,
      jobCategoryId: caregiverCatId,
      employerId: employerJapan.id,
      description: 'টোকিওর নার্সিং হোমে বয়োবৃদ্ধ সেবা প্রদানকারী পুরুষ ও মহিলা কেয়ারগিভার নিয়োগ। জাপান সরকারের এসএসডব্লিউ (SSW) ক্যাটাগরির আওতায় আকর্ষণীয় বেতনে নিশ্চিত কর্মসংস্থান।',
      salaryMin: new Prisma.Decimal('185000.00'),
      salaryMax: new Prisma.Decimal('220000.00'),
      currency: 'JPY',
      experienceRequired: 1,
      educationRequired: 'HSC / Diploma in Nursing / Caregiver Certificate',
      ageMin: 20,
      ageMax: 35,
      languageRequirements: 'JLPT N4 or JFT-Basic passed (Mandatory)',
      skillsRequired: 'Elder Care, Vital Signs Monitoring, First Aid, Compassionate Assistance',
      vacancyCount: 10,
      accommodation: true,
      food: false,
      transportation: true,
      medical: true,
      airTicket: true,
      workingHours: '8 hours / shift (5 days / week)',
      contractDuration: '3 to 5 Years',
      applicationDeadline: new Date('2026-12-15'),
      status: 'PUBLISHED',
      featured: true,
      createdBy: superAdmin.id,
    },
  });

  const job4 = await prisma.job.upsert({
    where: { jobCode: 'SGR-JOB-2026-000004' },
    update: {},
    create: {
      jobCode: 'SGR-JOB-2026-000004',
      title: 'রেস্তোরাঁ সার্ভিস ক্রু ও সহকারী শেফ (Restaurant Crew & Assistant Chef)',
      slug: 'restaurant-service-crew-doha-qatar',
      countryId: qatarId,
      jobCategoryId: restaurantCatId,
      employerId: employerUAE.id,
      description: 'দোহা সিটির আন্তর্জাতিক ডাইনিং চেইনে ফুড প্রিপারেশন, টেবিল সার্ভিস ও কিচেন হাইজিন ম্যানেজমেন্টের জন্য উদ্যমী তরুণ কর্মী প্রয়োজন।',
      salaryMin: new Prisma.Decimal('1800.00'),
      salaryMax: new Prisma.Decimal('2400.00'),
      currency: 'QAR',
      experienceRequired: 1,
      educationRequired: 'SSC / HSC',
      ageMin: 20,
      ageMax: 32,
      languageRequirements: 'Basic English',
      skillsRequired: 'Food Handling, POS Operations, Customer Greeting, Sanitization',
      vacancyCount: 25,
      accommodation: true,
      food: true,
      transportation: true,
      medical: true,
      airTicket: true,
      workingHours: '9 hours / day (including 1 hr break)',
      contractDuration: '2 Years',
      applicationDeadline: new Date('2026-11-15'),
      status: 'PUBLISHED',
      featured: false,
      createdBy: superAdmin.id,
    },
  });

  // 9. Seed Initial Applicants & Staff Notes
  console.log('  -> Seeding candidates & internal staff notes...');
  const applicant1 = await prisma.applicant.upsert({
    where: { applicantNumber: 'SGR-2026-000001' },
    update: {},
    create: {
      applicantNumber: 'SGR-2026-000001',
      fullName: 'মোঃ নাজমুল হোসেন (Md. Nazmul Hossain)',
      fatherName: 'মোঃ শফিকুল ইসলাম',
      motherName: 'মোসাঃ রোকেয়া বেগম',
      dateOfBirth: new Date('1996-05-14'),
      gender: 'MALE',
      phone: '+880 1712-345678',
      email: 'nazmul.electric@gmail.com',
      nationality: 'Bangladeshi',
      district: 'Cumilla',
      upazila: 'Burichang',
      address: 'Village: Gosai Nagar, Post: Kangshanagar',
      education: 'Diploma in Electrical Technology (BTEB)',
      profession: 'Electrician',
      yearsOfExperience: 4,
      skills: 'Industrial Wiring, Control Panel Setup, Transformer Maintenance, Cable Splicing',
      languages: 'Bengali (Native), English (Conversational), Arabic (Basic)',
      passportAvailable: true,
      passportNumber: 'A04589211',
      passportExpiry: new Date('2031-08-20'),
      preferredCountryId: uaeId,
      preferredJobCategoryId: electricianCatId,
      status: 'SHORTLISTED',
      source: 'DIRECT_VISIT',
      assignedStaffId: recruiter.id,
    },
  });

  // Unified Customer Link
  await prisma.customer.upsert({
    where: { applicantId: applicant1.id },
    update: {},
    create: {
      customerType: 'APPLICANT',
      name: applicant1.fullName,
      email: applicant1.email,
      phone: applicant1.phone,
      applicantId: applicant1.id,
    },
  });

  // Staff internal note
  await prisma.applicantNote.create({
    data: {
      applicantId: applicant1.id,
      createdById: recruiter.id,
      note: 'Trade test conducted at Uttara Technical Center. Scored 88% on single & 3-phase wiring panel testing. Recommended for Dubai UAE project SGR-JOB-2026-000002.',
    },
  });

  const applicant2 = await prisma.applicant.upsert({
    where: { applicantNumber: 'SGR-2026-000002' },
    update: {},
    create: {
      applicantNumber: 'SGR-2026-000002',
      fullName: 'মোঃ জহিরুল ইসলাম (Md. Jahirul Islam)',
      fatherName: 'আব্দুল করিম',
      motherName: 'জাহানারা বেগম',
      dateOfBirth: new Date('1992-11-20'),
      gender: 'MALE',
      phone: '+880 1819-876543',
      email: 'jahirul.heavy@gmail.com',
      nationality: 'Bangladeshi',
      district: 'Tangail',
      upazila: 'Gopalpur',
      address: 'Holding 45, Station Road',
      education: 'SSC',
      profession: 'Heavy Equipment Driver',
      yearsOfExperience: 6,
      skills: 'Crawler Crane, Excavator, Heavy Dump Truck, BRTA Professional License',
      languages: 'Bengali, Arabic (Good speaking)',
      passportAvailable: true,
      passportNumber: 'B08972144',
      passportExpiry: new Date('2030-03-12'),
      preferredCountryId: saudiId,
      preferredJobCategoryId: driverCatId,
      status: 'ACTIVE',
      source: 'REFERRAL',
      assignedStaffId: recruiter.id,
    },
  });

  await prisma.customer.upsert({
    where: { applicantId: applicant2.id },
    update: {},
    create: {
      customerType: 'APPLICANT',
      name: applicant2.fullName,
      email: applicant2.email,
      phone: applicant2.phone,
      applicantId: applicant2.id,
    },
  });

  await prisma.applicantNote.create({
    data: {
      applicantId: applicant2.id,
      createdById: recruiter.id,
      note: 'Candidate has 3 years previous GCC driving experience in Dammam. Holds valid Saudi driver license. Strong candidate for Al-Bawani heavy equipment vacancy.',
    },
  });

  const applicant3 = await prisma.applicant.upsert({
    where: { applicantNumber: 'SGR-2026-000003' },
    update: {},
    create: {
      applicantNumber: 'SGR-2026-000003',
      fullName: 'সুমাইয়া সুলতানা (Sumaiya Sultana)',
      fatherName: 'মোঃ মোশাররফ হোসেন',
      motherName: 'সুলতানা রাজিয়া',
      dateOfBirth: new Date('1999-07-08'),
      gender: 'FEMALE',
      phone: '+880 1914-556677',
      email: 'sumaiya.care@outlook.com',
      nationality: 'Bangladeshi',
      district: 'Dhaka',
      upazila: 'Mirpur',
      address: 'Road 10, Block C, Section 12, Mirpur',
      education: 'Diploma in Nursing Science and Midwifery',
      profession: 'Caregiver / Nurse',
      yearsOfExperience: 2,
      skills: 'Geriatric Care, Patient Mobility, First Aid, JLPT N4 Japanese Language Certified',
      languages: 'Bengali, English, Japanese (N4 Passed)',
      passportAvailable: true,
      passportNumber: 'A11298402',
      passportExpiry: new Date('2032-11-05'),
      preferredCountryId: japanId,
      preferredJobCategoryId: caregiverCatId,
      status: 'SHORTLISTED',
      source: 'WEBSITE',
      assignedStaffId: recruiter.id,
    },
  });

  await prisma.customer.upsert({
    where: { applicantId: applicant3.id },
    update: {},
    create: {
      customerType: 'APPLICANT',
      name: applicant3.fullName,
      email: applicant3.email,
      phone: applicant3.phone,
      applicantId: applicant3.id,
    },
  });

  await prisma.applicantNote.create({
    data: {
      applicantId: applicant3.id,
      createdById: recruiter.id,
      note: 'Verified JLPT N4 certificate and nursing diploma. Excellent Japanese conversation skills. Scheduled for Tokyo Medical Welfare Association interview.',
    },
  });

  // 10. Seed Document Types (Phase 3)
  console.log('  -> Seeding document types...');
  const DOCUMENT_TYPES = [
    { name: 'Passport (Original Copy)', code: 'PASSPORT', description: 'Machine Readable Passport (MRP) or E-Passport', isRequired: true, requiresExpiry: true },
    { name: 'National Identity Card (NID)', code: 'NID', description: 'Smart NID or laminated regular NID card', isRequired: true, requiresExpiry: false },
    { name: 'Birth Certificate', code: 'BIRTH_CERT', description: 'Digital online verifiable birth certificate', isRequired: false, requiresExpiry: false },
    { name: 'Passport Size Photograph', code: 'PHOTO', description: 'Lab printed photo with white background (35x45mm)', isRequired: true, requiresExpiry: false },
    { name: 'Curriculum Vitae (CV / Bio-data)', code: 'CV', description: 'Complete professional work history and contact sheet', isRequired: true, requiresExpiry: false },
    { name: 'Educational Certificates', code: 'EDU_CERT', description: 'Board certificates and transcripts (SSC/HSC/Degree)', isRequired: false, requiresExpiry: false },
    { name: 'Trade Experience Certificate', code: 'EXP_CERT', description: 'Employer testimonial or trade certification', isRequired: true, requiresExpiry: false },
    { name: 'Police Clearance Certificate', code: 'POLICE_CLEARANCE', description: 'Special branch verified clearance certificate', isRequired: true, requiresExpiry: true },
    { name: 'GAMCA Medical Fitness Certificate', code: 'MEDICAL_CERT', description: 'Official Gulf Approved Medical Centers Association report', isRequired: true, requiresExpiry: true },
    { name: 'BMET Technical Training Certificate', code: 'TRAINING_CERT', description: 'Bureau of Manpower, Employment and Training trade certificate', isRequired: false, requiresExpiry: false },
    { name: 'Language Proficiency Certificate', code: 'LANG_CERT', description: 'JLPT, IELTS, or official language pass certificate', isRequired: false, requiresExpiry: false },
    { name: 'Job Offer Letter', code: 'JOB_OFFER', description: 'Official employment offer from overseas principal', isRequired: false, requiresExpiry: false },
    { name: 'Foreign Employment Contract', code: 'CONTRACT', description: 'Bilingual employment agreement signed by employer', isRequired: true, requiresExpiry: false },
    { name: 'Visa Stamping Document', code: 'VISA', description: 'Electronic visa authorization or passport visa stamp', isRequired: true, requiresExpiry: true },
    { name: 'Air Ticket Copy', code: 'AIR_TICKET', description: 'Confirmed international one-way flight booking', isRequired: false, requiresExpiry: false },
    { name: 'Other Supporting Document', code: 'OTHER', description: 'Miscellaneous agency documentation', isRequired: false, requiresExpiry: false },
  ];

  const seededDocTypes: Record<string, any> = {};
  for (const dt of DOCUMENT_TYPES) {
    const docType = await prisma.documentType.upsert({
      where: { code: dt.code },
      update: {},
      create: dt,
    });
    seededDocTypes[dt.code] = docType;
  }

  // 11. Seed Service Catalog (Phase 4)
  console.log('  -> Seeding service catalog...');
  const SERVICES = [
    { serviceName: 'Overseas Recruitment & Placement Fee', serviceCode: 'REC-001', description: 'End-to-end recruitment processing and candidate mobilization fee', defaultPrice: new Prisma.Decimal('50000.00'), currency: 'BDT', taxRate: new Prisma.Decimal('0.00') },
    { serviceName: 'Embassy Visa Processing & Stamping', serviceCode: 'VISA-001', description: 'Attestation, medical submission, and embassy consular visa stamping', defaultPrice: new Prisma.Decimal('25000.00'), currency: 'BDT', taxRate: new Prisma.Decimal('0.00') },
    { serviceName: 'GAMCA Medical Coordination', serviceCode: 'MED-001', description: 'Hospital appointment scheduling, medical slip, and online report verification', defaultPrice: new Prisma.Decimal('10000.00'), currency: 'BDT', taxRate: new Prisma.Decimal('0.00') },
    { serviceName: 'Pre-Departure Briefing & Training', serviceCode: 'TRN-001', description: 'BMET clearance, finger biometric registration, and cultural orientation', defaultPrice: new Prisma.Decimal('5000.00'), currency: 'BDT', taxRate: new Prisma.Decimal('0.00') },
    { serviceName: 'International Air Ticketing', serviceCode: 'AIR-001', description: 'Direct flight ticket reservation with excess baggage allowance', defaultPrice: new Prisma.Decimal('45000.00'), currency: 'BDT', taxRate: new Prisma.Decimal('0.00') },
  ];

  const seededServices: Record<string, any> = {};
  for (const s of SERVICES) {
    const srv = await prisma.service.upsert({
      where: { serviceCode: s.serviceCode },
      update: {},
      create: s,
    });
    seededServices[s.serviceCode] = srv;
  }

  // 12. Seed Applications across stages (Phase 3)
  console.log('  -> Seeding candidate applications & timelines...');

  // Application 1: Applicant 1 -> Job 1 (Selected)
  const app1 = await prisma.application.upsert({
    where: { applicationCode: 'SGR-APP-2026-000001' },
    update: {},
    create: {
      applicationCode: 'SGR-APP-2026-000001',
      applicationNumber: 'SGR-APP-2026-000001',
      applicantId: applicant1.id,
      jobId: job1.id,
      employerId: employerSaudi.id,
      countryId: saudiId,
      currentStage: 'SELECTED',
      status: 'SELECTED',
      priority: 'HIGH',
      source: 'DIRECT_VISIT',
      assignedStaffId: recruiter.id,
      selectedAt: new Date('2026-08-25'),
      notes: 'Qualified structural welder candidate with flawless 6G weld test sample. Employer selected for Metro Viaduct project.',
    },
  });

  await prisma.applicationStatusHistory.createMany({
    data: [
      { applicationId: app1.id, fromStage: 'NEW', toStage: 'UNDER_REVIEW', changedById: recruiter.id, notes: 'Profile bio-data and passport reviewed by recruitment desk' },
      { applicationId: app1.id, fromStage: 'UNDER_REVIEW', toStage: 'SHORTLISTED', changedById: recruiter.id, notes: 'Shortlisted for Saudi Al-Bawani delegation interview' },
      { applicationId: app1.id, fromStage: 'SHORTLISTED', toStage: 'INTERVIEW_SCHEDULED', changedById: recruiter.id, notes: 'Trade test scheduled at Mirpur Technical Center' },
      { applicationId: app1.id, fromStage: 'INTERVIEW_SCHEDULED', toStage: 'INTERVIEW_COMPLETED', changedById: recruiter.id, notes: 'Practical welding test completed with grade A' },
      { applicationId: app1.id, fromStage: 'INTERVIEW_COMPLETED', toStage: 'SELECTED', changedById: recruiter.id, notes: 'Selected by Saudi Technical Project Director' },
    ],
  });

  // Application 2: Applicant 2 -> Job 1 (Interview Scheduled)
  const app2 = await prisma.application.upsert({
    where: { applicationCode: 'SGR-APP-2026-000002' },
    update: {},
    create: {
      applicationCode: 'SGR-APP-2026-000002',
      applicationNumber: 'SGR-APP-2026-000002',
      applicantId: applicant2.id,
      jobId: job1.id,
      employerId: employerSaudi.id,
      countryId: saudiId,
      currentStage: 'INTERVIEW_SCHEDULED',
      status: 'INTERVIEW_SCHEDULED',
      priority: 'MEDIUM',
      source: 'REFERRAL',
      assignedStaffId: recruiter.id,
      notes: 'Driver candidate with previous GCC experience.',
    },
  });

  await prisma.applicationStatusHistory.createMany({
    data: [
      { applicationId: app2.id, fromStage: 'NEW', toStage: 'SHORTLISTED', changedById: recruiter.id, notes: 'Shortlisted based on valid Saudi driver license' },
      { applicationId: app2.id, fromStage: 'SHORTLISTED', toStage: 'INTERVIEW_SCHEDULED', changedById: recruiter.id, notes: 'Driving simulation and oral interview scheduled' },
    ],
  });

  // Application 3: Applicant 3 -> Job 3 (Document Verified)
  const app3 = await prisma.application.upsert({
    where: { applicationCode: 'SGR-APP-2026-000003' },
    update: {},
    create: {
      applicationCode: 'SGR-APP-2026-000003',
      applicationNumber: 'SGR-APP-2026-000003',
      applicantId: applicant3.id,
      jobId: job3.id,
      employerId: employerJapan.id,
      countryId: japanId,
      currentStage: 'DOCUMENT_VERIFIED',
      status: 'DOCUMENT_VERIFIED',
      priority: 'HIGH',
      source: 'WEBSITE',
      assignedStaffId: recruiter.id,
      notes: 'Certified SSW candidate with JLPT N4. Documents verified and awaiting Tokyo interview schedule.',
    },
  });

  await prisma.applicationStatusHistory.createMany({
    data: [
      { applicationId: app3.id, fromStage: 'NEW', toStage: 'DOCUMENT_PENDING', changedById: recruiter.id, notes: 'Nursing diploma verification in progress' },
      { applicationId: app3.id, fromStage: 'DOCUMENT_PENDING', toStage: 'DOCUMENT_VERIFIED', changedById: recruiter.id, notes: 'All certificates, Japanese N4, and passport verified' },
    ],
  });

  // 13. Seed Candidate Documents
  console.log('  -> Seeding candidate documents...');
  await prisma.document.createMany({
    data: [
      {
        applicantId: applicant1.id,
        applicationId: app1.id,
        documentTypeId: seededDocTypes['PASSPORT'].id,
        fileName: 'tariqul_islam_passport_scan.pdf',
        filePath: 'uploads/documents/tariqul_passport.pdf',
        fileUrl: '/uploads/documents/tariqul_passport.pdf',
        fileSize: 1048576,
        mimeType: 'application/pdf',
        version: 1,
        isLatest: true,
        status: 'VERIFIED',
        uploadedById: recruiter.id,
        verifiedById: recruiter.id,
        verifiedAt: new Date('2026-08-20'),
        expiryDate: new Date('2031-05-14'),
      },
      {
        applicantId: applicant1.id,
        applicationId: app1.id,
        documentTypeId: seededDocTypes['EXP_CERT'].id,
        fileName: 'welder_6g_certificate.pdf',
        filePath: 'uploads/documents/welder_6g.pdf',
        fileUrl: '/uploads/documents/welder_6g.pdf',
        fileSize: 850000,
        mimeType: 'application/pdf',
        version: 1,
        isLatest: true,
        status: 'VERIFIED',
        uploadedById: recruiter.id,
        verifiedById: recruiter.id,
        verifiedAt: new Date('2026-08-21'),
      },
      {
        applicantId: applicant3.id,
        applicationId: app3.id,
        documentTypeId: seededDocTypes['LANG_CERT'].id,
        fileName: 'jlpt_n4_official_result.pdf',
        filePath: 'uploads/documents/jlpt_n4.pdf',
        fileUrl: '/uploads/documents/jlpt_n4.pdf',
        fileSize: 640000,
        mimeType: 'application/pdf',
        version: 1,
        isLatest: true,
        status: 'VERIFIED',
        uploadedById: recruiter.id,
        verifiedById: recruiter.id,
        verifiedAt: new Date('2026-08-22'),
      },
    ],
  });

  // 14. Seed Interviews
  console.log('  -> Seeding candidate interviews...');
  await prisma.interview.createMany({
    data: [
      {
        applicationId: app1.id,
        applicantId: applicant1.id,
        jobId: job1.id,
        interviewType: 'AGENCY',
        scheduledAt: new Date('2026-08-24T10:00:00Z'),
        durationMinutes: 45,
        location: 'Mirpur Technical Training Center',
        interviewer: 'Engr. Mahbubur Rahman (Technical Chief)',
        status: 'PASSED',
        result: 'PASSED',
        score: 92,
        feedback: 'Demonstrated exceptional pipe welding bead uniformity. Passed X-ray inspection.',
        createdById: recruiter.id,
      },
      {
        applicationId: app2.id,
        applicantId: applicant2.id,
        jobId: job1.id,
        interviewType: 'IN_PERSON',
        scheduledAt: new Date(Date.now() + 86400000 * 2), // 2 days from now
        durationMinutes: 30,
        location: 'Shakil Global Headquarters, Uttara, Dhaka',
        interviewer: 'Capt. Selim Ahmed',
        status: 'SCHEDULED',
        createdById: recruiter.id,
      },
    ],
  });

  // 15. Seed Invoices, Payments, Receipts, and Ledgers (Phase 4)
  console.log('  -> Seeding financial accounts, invoices, payments & ledgers...');

  const applicantCustomer1 = await prisma.customer.findFirst({
    where: { applicantId: applicant1.id },
  });

  // Invoice 1: Tariqul Islam (Partially Paid)
  const inv1 = await prisma.invoice.upsert({
    where: { invoiceNumber: 'SGR-INV-2026-000001' },
    update: {},
    create: {
      invoiceNumber: 'SGR-INV-2026-000001',
      customerId: applicantCustomer1?.id || null,
      applicantId: applicant1.id,
      applicationId: app1.id,
      invoiceDate: new Date('2026-08-26'),
      dueDate: new Date('2026-09-15'),
      currency: 'BDT',
      subtotal: new Prisma.Decimal('85000.00'),
      discount: new Prisma.Decimal('5000.00'),
      tax: new Prisma.Decimal('0.00'),
      adjustment: new Prisma.Decimal('0.00'),
      totalAmount: new Prisma.Decimal('80000.00'),
      paidAmount: new Prisma.Decimal('50000.00'),
      dueAmount: new Prisma.Decimal('30000.00'),
      status: 'PARTIALLY_PAID',
      notes: 'Initial recruitment & visa processing installment invoice.',
      terms: 'Remaining balance of BDT 30,000 due upon visa stamping.',
      createdById: accountant.id,
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      {
        invoiceId: inv1.id,
        serviceId: seededServices['REC-001'].id,
        serviceCode: 'REC-001',
        description: 'Overseas Recruitment & Placement Fee (Saudi Arabia)',
        quantity: 1,
        unitPrice: new Prisma.Decimal('50000.00'),
        discount: new Prisma.Decimal('0.00'),
        tax: new Prisma.Decimal('0.00'),
        lineTotal: new Prisma.Decimal('50000.00'),
      },
      {
        invoiceId: inv1.id,
        serviceId: seededServices['VISA-001'].id,
        serviceCode: 'VISA-001',
        description: 'Saudi Embassy Visa Processing & Stamping',
        quantity: 1,
        unitPrice: new Prisma.Decimal('25000.00'),
        discount: new Prisma.Decimal('0.00'),
        tax: new Prisma.Decimal('0.00'),
        lineTotal: new Prisma.Decimal('25000.00'),
      },
      {
        invoiceId: inv1.id,
        serviceId: seededServices['MED-001'].id,
        serviceCode: 'MED-001',
        description: 'GAMCA Medical Coordination & Verification',
        quantity: 1,
        unitPrice: new Prisma.Decimal('10000.00'),
        discount: new Prisma.Decimal('5000.00'),
        tax: new Prisma.Decimal('0.00'),
        lineTotal: new Prisma.Decimal('5000.00'),
      },
    ],
  });

  // Payment 1 for Invoice 1
  const pay1 = await prisma.payment.upsert({
    where: { paymentNumber: 'SGR-PAY-2026-000001' },
    update: {},
    create: {
      paymentNumber: 'SGR-PAY-2026-000001',
      receiptNumber: 'SGR-RCP-2026-000001',
      invoiceId: inv1.id,
      customerId: applicantCustomer1?.id || null,
      amount: new Prisma.Decimal('50000.00'),
      currency: 'BDT',
      paymentDate: new Date('2026-08-28'),
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'IBBL-TXN-984210',
      receivedById: accountant.id,
      status: 'COMPLETED',
      notes: 'First installment received via Islami Bank transfer.',
    },
  });

  // Financial ledger entry for Invoice 1 and Payment 1
  await prisma.financialTransaction.createMany({
    data: [
      {
        transactionType: 'INVOICE',
        referenceNumber: inv1.invoiceNumber,
        customerId: applicantCustomer1?.id || null,
        applicantId: applicant1.id,
        invoiceId: inv1.id,
        debit: new Prisma.Decimal('80000.00'),
        credit: new Prisma.Decimal('0.00'),
        balance: new Prisma.Decimal('80000.00'),
        notes: 'Invoice issued for Saudi recruitment & visa processing',
        createdAt: new Date('2026-08-26'),
      },
      {
        transactionType: 'PAYMENT',
        referenceNumber: pay1.paymentNumber,
        customerId: applicantCustomer1?.id || null,
        applicantId: applicant1.id,
        invoiceId: inv1.id,
        paymentId: pay1.id,
        debit: new Prisma.Decimal('0.00'),
        credit: new Prisma.Decimal('50000.00'),
        balance: new Prisma.Decimal('30000.00'),
        notes: 'Payment received via Bank Transfer. Receipt #SGR-RCP-2026-000001',
        createdAt: new Date('2026-08-28'),
      },
    ],
  });

  // 16. Audit Log for Phase 3 & 4 Seed
  await prisma.auditLog.create({
    data: {
      userId: superAdmin.id,
      action: 'SYSTEM_INIT_PHASE_3_4',
      entity: 'DATABASE',
      entityId: 'SYSTEM',
      ipAddress: '127.0.0.1',
      userAgent: 'Prisma Phase 3 & 4 Seeder CLI',
      newValue: JSON.stringify({
        status: 'PHASE_3_4_INITIALIZED',
        documentTypesCount: DOCUMENT_TYPES.length,
        servicesCount: SERVICES.length,
        applicationsCount: 3,
        invoicesCount: 1,
        paymentsCount: 1,
      }),
    },
  });

  console.log('✅ Phase 3 & Phase 4 Database seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
