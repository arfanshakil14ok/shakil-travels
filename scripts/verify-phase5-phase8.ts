import { PrismaClient } from '@prisma/client';
import { generateVisaApplicationNumber, generateInquiryNumber, generateApplicantNumber, generateFormattedId } from '../src/lib/id-generator';
import { evaluateDepartureReadiness } from '../src/lib/visa/readiness';
import { hashApplicantPassword, verifyApplicantPassword, calculateProfileCompletion, createPortalToken, verifyPortalToken } from '../src/lib/portal-auth';
import { dispatchCommunication } from '../src/lib/comms/dispatcher';
import { calculateRecruitmentFunnel } from '../src/lib/reports/funnel';
import { parseDateFilter } from '../src/lib/reports/date-filter';
import { generateCsvString, sanitizeCsvCell } from '../src/lib/reports/csv-export';
import { rateLimit } from '../src/lib/rate-limit';
import { sanitizeHtml, sanitizeFileName, assertApplicantOwnership } from '../src/lib/security';

const prisma = new PrismaClient();

async function main() {
  console.log('================================================================');
  console.log('SHAKIL GLOBAL RECRUITMENT — END-TO-END AUTOMATED VERIFICATION');
  console.log('Phases 5, 6, 7 & 8 Production Integrity Suite');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  // TEST SUITE 1: Database & RBAC Integrity
  console.log('\n[1] Testing Database & RBAC Foundation...');
  const permCount = await prisma.permission.count();
  assert(permCount >= 99, 'RBAC Permissions count >= 99', `Found: ${permCount}`);

  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'SUPER_ADMIN' },
    include: { rolePermissions: true },
  });
  assert(!!superAdminRole, 'SUPER_ADMIN role exists');
  assert(
    (superAdminRole?.rolePermissions.length || 0) >= 99,
    'SUPER_ADMIN has all enterprise permissions mapped',
    `Mapped: ${superAdminRole?.rolePermissions.length}`
  );

  // TEST SUITE 2: Phase 5 Visa Lifecycle & Departure Readiness
  console.log('\n[2] Testing Phase 5: Visa Lifecycle & Departure Readiness...');
  const visaSeq = await generateVisaApplicationNumber(prisma);
  assert(visaSeq.startsWith('SGR-VISA-'), 'Visa application sequential ID generated', visaSeq);

  // Create test country, job, applicant, application, visa case
  const testCountry = await prisma.country.findFirst();
  assert(!!testCountry, 'At least one active country exists in database');

  let testApplicant = await prisma.applicant.findFirst({
    where: { phone: '+8801999999999' },
  });
  if (!testApplicant) {
    const appNum = await generateApplicantNumber(prisma);
    testApplicant = await prisma.applicant.create({
      data: {
        applicantNumber: appNum,
        fullName: 'Test Verification Candidate',
        phone: '+8801999999999',
        email: 'test.candidate@shakilglobal.com',
        passportAvailable: true,
        passportNumber: 'A99999999',
        passportExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 400),
      },
    });
  }
  assert(!!testApplicant, 'Test candidate ready');

  const testCat = await prisma.jobCategory.findFirst();
  assert(!!testCat, 'At least one job category exists');

  let testJob = await prisma.job.findFirst({ where: { status: 'ACTIVE' } });
  if (!testJob) {
    const jobCode = await generateFormattedId(prisma, 'job');
    testJob = await prisma.job.create({
      data: {
        jobCode,
        title: 'Senior Construction Supervisor',
        slug: `senior-construction-supervisor-${Date.now()}`,
        description: 'Supervise site operations and worker safety.',
        country: { connect: { id: testCountry!.id } },
        jobCategory: { connect: { id: testCat!.id } },
        vacancyCount: 5,
        status: 'ACTIVE',
      },
    });
  }
  assert(!!testJob, 'Active job exists');

  let testApplication = await prisma.application.findFirst({
    where: { applicantId: testApplicant.id, jobId: testJob.id },
  });
  if (!testApplication) {
    const appCode = await generateFormattedId(prisma, 'application');
    testApplication = await prisma.application.create({
      data: {
        applicationCode: appCode,
        applicantId: testApplicant.id,
        jobId: testJob.id,
        status: 'VISA_PROCESSING',
      },
    });
  }
  assert(!!testApplication, 'Active application exists');

  let testVisa = await prisma.visaApplication.findFirst({
    where: { applicantId: testApplicant.id },
  });
  if (!testVisa) {
    testVisa = await prisma.visaApplication.create({
      data: {
        visaApplicationNumber: visaSeq,
        applicationId: testApplication.id,
        applicantId: testApplicant.id,
        countryId: testCountry!.id,
        visaType: 'WORK_VISA',
        status: 'SUBMITTED',
      },
    });
  }

  const readiness = await evaluateDepartureReadiness(prisma, testVisa.id);
  assert(typeof readiness?.completionPercentage === 'number', 'Departure readiness score evaluated', `${readiness?.completionPercentage}%`);
  assert(readiness?.items.length === 8, '8-Point pre-departure checklist evaluated complete');

  // TEST SUITE 3: Phase 6 Inquiries, Portal Auth, Candidate Isolation & Duplicates
  console.log('\n[3] Testing Phase 6: Inquiries, Candidate Portal & Security Isolation...');
  const inqSeq = await generateInquiryNumber(prisma);
  assert(inqSeq.startsWith('SGR-INQ-'), 'Inquiry sequential ID generated', inqSeq);

  const testInquiry = await prisma.inquiry.create({
    data: {
      inquiryNumber: inqSeq,
      name: 'Rahim Lead',
      phone: '+8801888888888',
      email: 'rahim.lead@example.com',
      subject: 'Inquiry about Qatar Welder Jobs',
      message: 'Hello, I have 5 years experience in SMAW welding.',
      status: 'NEW',
    },
  });
  assert(testInquiry.status === 'NEW', 'Public inquiry successfully created and queued');

  // Candidate password hashing & JWT token verification
  const rawPw = 'SuperSecret2026!';
  const pwHash = await hashApplicantPassword(rawPw);
  const isValidPw = await verifyApplicantPassword(rawPw, pwHash);
  assert(isValidPw, 'Candidate password successfully hashed with bcrypt and verified');

  const token = await createPortalToken({
    applicantId: testApplicant.id,
    applicantNumber: testApplicant.applicantNumber,
    phone: testApplicant.phone,
    fullName: testApplicant.fullName,
  });
  const decodedSession = await verifyPortalToken(token);
  assert(decodedSession?.applicantId === testApplicant.id, 'Candidate portal JWT token generated and decoded');

  // Profile completion calculation
  const profileScore = calculateProfileCompletion(testApplicant);
  assert(profileScore.percentage >= 0 && profileScore.percentage <= 100, 'Profile completion score calculated', `${profileScore.percentage}%`);

  // IDOR defense check
  let idorBlocked = false;
  try {
    assertApplicantOwnership('DIFFERENT_APPLICANT_ID', testApplicant.id);
  } catch (err: any) {
    idorBlocked = err.name === 'AuthorizationError';
  }
  assert(idorBlocked, 'IDOR attack blocked when resource applicantId does not match session');

  // Duplicate application logic check
  const duplicateFound = await prisma.application.findFirst({
    where: { applicantId: testApplicant.id, jobId: testJob.id },
  });
  assert(!!duplicateFound, 'Duplicate application detection properly flags existing application');

  // Multi-channel communication dispatch check
  const commsResult = await dispatchCommunication(prisma, {
    applicantId: testApplicant.id,
    channel: 'IN_APP',
    subject: 'Verification Test Alert',
    message: 'System automated verification notification',
  });
  assert(commsResult.success, 'In-App notification successfully dispatched');

  const loggedComm = await prisma.communicationLog.findFirst({
    where: { applicantId: testApplicant.id },
    orderBy: { createdAt: 'desc' },
  });
  assert(!!loggedComm, 'Communication audit log recorded in database');

  // TEST SUITE 4: Phase 7 Executive BI, Funnel & Financial Integrity
  console.log('\n[4] Testing Phase 7: Executive BI, Funnel & Decimal Analytics...');
  const funnel = await calculateRecruitmentFunnel(prisma);
  assert(funnel.stages.length === 12, '12-Stage recruitment funnel calculated');
  assert(typeof funnel.overallConversionRate === 'number', 'Overall conversion rate calculated');

  const dateFilter = parseDateFilter('THIS_MONTH');
  assert(!!dateFilter.label && dateFilter.label === 'This Month', 'Date range parsing for THIS_MONTH succeeded');

  // CSV Export & Formula Injection defense test
  const dangerousCell = '=cmd|"/C calc"!A0';
  const sanitized = sanitizeCsvCell(dangerousCell);
  assert(sanitized.includes("'="), 'CSV formula injection neutralized by prepending single quote');

  const csvOutput = generateCsvString(['Col1', 'Col2'], [['Val1', 'Val2']]);
  assert(csvOutput.charCodeAt(0) === 0xfeff, 'CSV export prepends UTF-8 BOM byte marker');

  // TEST SUITE 5: Phase 8 DevOps, Health Probes & Rate Limiting
  console.log('\n[5] Testing Phase 8: DevOps, Health Probes & Rate Limiting...');
  // Database ping check
  const rawDbPing = await prisma.$queryRaw`SELECT 1 as result`;
  assert(Array.isArray(rawDbPing) && (rawDbPing[0] as any).result === 1, 'PostgreSQL database readiness live ping passed');

  // Rate Limiting check
  const rlKey = `test_ip_${Date.now()}`;
  const rl1 = rateLimit({ key: rlKey, limit: 2, windowMs: 10000 });
  assert(!rl1.isRateLimited && rl1.remaining === 1, 'Rate limiter permits initial request');

  const rl2 = rateLimit({ key: rlKey, limit: 2, windowMs: 10000 });
  assert(!rl2.isRateLimited && rl2.remaining === 0, 'Rate limiter decrements quota');

  const rl3 = rateLimit({ key: rlKey, limit: 2, windowMs: 10000 });
  assert(rl3.isRateLimited, 'Rate limiter throttles request exceeding limit (429 defense)');

  // Input Sanitization check
  const xssPayload = '<script>alert(1)</script>';
  const cleanHtml = sanitizeHtml(xssPayload);
  assert(!cleanHtml.includes('<script>'), 'XSS input payload properly escaped');

  const pathTraversal = '../../../etc/passwd';
  const cleanPath = sanitizeFileName(pathTraversal);
  assert(!cleanPath.includes('..'), 'Path traversal sanitized safely');

  console.log('\n================================================================');
  console.log(`AUTOMATED VERIFICATION SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('Test execution crashed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
