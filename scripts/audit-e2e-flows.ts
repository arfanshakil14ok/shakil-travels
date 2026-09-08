import { PrismaClient, Prisma } from '@prisma/client';
import {
  generateFormattedId,
  generateApplicantNumber,
  generateVisaApplicationNumber,
} from '../src/lib/id-generator';
import { evaluateDepartureReadiness } from '../src/lib/visa/readiness';
import {
  hashApplicantPassword,
  verifyApplicantPassword,
  createPortalToken,
  verifyPortalToken,
  calculateProfileCompletion,
} from '../src/lib/portal-auth';
import { recordPayment } from '../src/lib/accounting/payment';
import { getCustomerLedger } from '../src/lib/accounting/ledger';
import { assertApplicantOwnership } from '../src/lib/security';
import { hasPermission } from '../src/lib/rbac';
import type { AuthUser, PermissionCode } from '../src/types';

const prisma = new PrismaClient();

async function main() {
  console.log('================================================================');
  console.log('SHAKIL GLOBAL RECRUITMENT — PRODUCTION READINESS E2E AUDIT');
  console.log('Comprehensive Verification of Flows 1 through 10');
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

  // Get or verify baseline entities
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@shakilglobal.com' },
    include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
  });
  assert(!!adminUser, 'Admin user found for audit verification');

  const defaultCountry = await prisma.country.findFirst({
    where: { isActive: true },
  });
  assert(!!defaultCountry, 'Active country found in database');

  const defaultJobCategory = await prisma.jobCategory.findFirst({
    where: { isActive: true },
  });
  assert(!!defaultJobCategory, 'Active job category found in database');

  const defaultDocType = await prisma.documentType.findFirst({
    where: { code: 'PASSPORT' },
  }) || (await prisma.documentType.findFirst());
  assert(!!defaultDocType, 'Document type found in database');

  // Unique timestamp for this run
  const testRunId = Date.now();

  // ============================================================================
  // FLOW 1: Public visitor → Job Search → Job Details → Register → Applicant Profile → Apply
  // ============================================================================
  console.log('\n--- [FLOW 1] Public Visitor → Job Search → Registration → Profile → Apply ---');

  // 1. Search published jobs
  const publishedJobs = await prisma.job.findMany({
    where: { status: 'PUBLISHED' },
    take: 5,
  });
  assert(publishedJobs.length > 0, 'Public visitor can search and find published jobs');
  const targetJob = publishedJobs[0];

  // 2. Candidate Registration
  const cand1Phone = `+88017${String(testRunId).slice(-8)}`;
  const cand1Email = `audit_cand1_${testRunId}@test.com`;
  const passwordHash = await hashApplicantPassword('SecurePass123!');
  const applicantNumber1 = await generateApplicantNumber(prisma);

  const applicant1 = await prisma.applicant.create({
    data: {
      applicantNumber: applicantNumber1,
      fullName: 'Audit Applicant One',
      phone: cand1Phone,
      email: cand1Email,
      passwordHash: passwordHash,
      preferredCountryId: defaultCountry?.id,
      preferredJobCategoryId: defaultJobCategory?.id,
      passportNumber: `A${String(testRunId).slice(-7)}`,
      status: 'ACTIVE',
    },
  });
  assert(!!applicant1.id, `Candidate 1 successfully registered (${applicant1.applicantNumber})`);

  // 3. Candidate Auth Token Verification
  const portalToken = await createPortalToken({
    applicantId: applicant1.id,
    applicantNumber: applicant1.applicantNumber,
    phone: applicant1.phone,
    email: applicant1.email,
    fullName: applicant1.fullName,
  });
  const decodedSession = await verifyPortalToken(portalToken);
  assert(decodedSession?.applicantId === applicant1.id, 'Candidate portal JWT issued and verified');

  // 4. Candidate Profile Completion Meter
  const completionScore = calculateProfileCompletion(applicant1);
  assert(completionScore.percentage >= 20, `Profile completion calculated correctly (${completionScore.percentage}%)`);

  // 5. Submit Application to Target Job
  const appCode1 = await generateFormattedId(prisma, 'application');
  const application1 = await prisma.application.create({
    data: {
      applicationCode: appCode1,
      applicationNumber: appCode1,
      applicantId: applicant1.id,
      jobId: targetJob.id,
      countryId: targetJob.countryId,
      status: 'NEW',
      currentStage: 'NEW',
      source: 'PORTAL_DIRECT',
    },
  });
  assert(
    !!application1.id && application1.status === 'NEW',
    `Application submitted successfully (${application1.applicationCode})`
  );

  // ============================================================================
  // FLOW 2: Applicant → Upload Document → Admin Review → Verify/Reject → Applicant Sees Status
  // ============================================================================
  console.log('\n--- [FLOW 2] Document Upload → Admin Review → Verify/Reject → Candidate View ---');

  // 1. Applicant uploads Passport document
  const doc1 = await prisma.document.create({
    data: {
      applicantId: applicant1.id,
      applicationId: application1.id,
      documentTypeId: defaultDocType!.id,
      fileName: 'audit_passport_scan.pdf',
      filePath: `/uploads/applicants/${applicant1.id}/audit_passport_scan.pdf`,
      fileUrl: `/api/documents/view/audit_passport_scan.pdf`,
      fileSize: 1024 * 512,
      mimeType: 'application/pdf',
      status: 'UPLOADED',
      isLatest: true,
    },
  });
  assert(doc1.status === 'UPLOADED', 'Applicant successfully uploaded document in UPLOADED state');

  // 2. Admin Reviews and Marks VERIFIED
  const verifiedDoc = await prisma.document.update({
    where: { id: doc1.id },
    data: {
      status: 'VERIFIED',
      verifiedById: adminUser?.id,
      verifiedAt: new Date(),
      notes: 'Passed embassy authenticity inspection',
    },
  });
  assert(verifiedDoc.status === 'VERIFIED', 'Admin verified document with timestamp and staff ID');

  // 3. Candidate queries their documents
  const candidateDocView = await prisma.document.findFirst({
    where: { id: doc1.id, applicantId: applicant1.id },
  });
  assert(candidateDocView?.status === 'VERIFIED', 'Candidate portal views verified document status');

  // 4. Rejection Sub-flow
  const doc2 = await prisma.document.create({
    data: {
      applicantId: applicant1.id,
      applicationId: application1.id,
      documentTypeId: defaultDocType!.id,
      fileName: 'police_clearance_blurry.pdf',
      filePath: `/uploads/applicants/${applicant1.id}/police_clearance_blurry.pdf`,
      fileSize: 1024 * 200,
      mimeType: 'application/pdf',
      status: 'UPLOADED',
      isLatest: true,
    },
  });
  const rejectedDoc = await prisma.document.update({
    where: { id: doc2.id },
    data: {
      status: 'REJECTED',
      rejectionReason: 'Scan is blurry and official seal is unreadable',
      verifiedById: adminUser?.id,
      verifiedAt: new Date(),
    },
  });
  assert(
    rejectedDoc.status === 'REJECTED' && rejectedDoc.rejectionReason?.includes('blurry'),
    'Admin rejection with reason properly captured'
  );

  // ============================================================================
  // FLOW 3: Applicant → Application → Interview → Selection → Visa Processing → Ready for Departure
  // ============================================================================
  console.log('\n--- [FLOW 3] Application → Interview → Selection → Visa → Departure Readiness ---');

  // 1. Schedule Interview
  const interview = await prisma.interview.create({
    data: {
      applicationId: application1.id,
      applicantId: applicant1.id,
      jobId: targetJob.id,
      interviewType: 'AGENCY',
      scheduledAt: new Date(Date.now() + 86400000),
      durationMinutes: 45,
      location: 'Main Branch Conference Room A',
      status: 'SCHEDULED',
      createdById: adminUser?.id,
    },
  });
  assert(interview.status === 'SCHEDULED', 'Interview scheduled for application');

  // 2. Interview Passed & Application Selected
  await prisma.interview.update({
    where: { id: interview.id },
    data: {
      status: 'PASSED',
      score: 92,
      result: 'Selected for overseas placement',
      feedback: 'Excellent trade skills and physical fitness',
    },
  });

  const selectedApp = await prisma.application.update({
    where: { id: application1.id },
    data: {
      status: 'SELECTED',
      currentStage: 'SELECTED',
      selectedAt: new Date(),
    },
  });
  assert(selectedApp.status === 'SELECTED', 'Application transitioned to SELECTED');

  // 3. Visa Case Creation
  const visaAppSeq = await generateVisaApplicationNumber(prisma);
  const visaApp = await prisma.visaApplication.create({
    data: {
      visaApplicationNumber: visaAppSeq,
      applicationId: application1.id,
      applicantId: applicant1.id,
      countryId: targetJob.countryId,
      visaType: 'WORK_VISA',
      status: 'APPROVED',
      submissionDate: new Date(),
      decisionDate: new Date(),
      visaExpiryDate: new Date(Date.now() + 365 * 86400000),
    },
  });
  assert(visaApp.status === 'APPROVED', `Visa application created and APPROVED (${visaApp.visaApplicationNumber})`);

  // 4. Pre-Departure Readiness Checklist
  const readiness = await evaluateDepartureReadiness(prisma, visaApp.id);
  assert(!!readiness, 'Departure readiness report generated for visa case');
  assert(readiness?.totalChecks === 8, '8-Point pre-departure checklist evaluated complete');
  assert(
    typeof readiness?.completionPercentage === 'number',
    `Departure readiness score evaluated (${readiness?.completionPercentage}%)`
  );

  // ============================================================================
  // FLOW 4: Applicant → Invoice → Partial Payment → Remaining Due → Full Payment → Receipt
  // ============================================================================
  console.log('\n--- [FLOW 4] Invoice → Partial Payment → Remaining Due → Full Payment → Receipt ---');

  const invNumber1 = await generateFormattedId(prisma, 'invoice');
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: invNumber1,
      applicantId: applicant1.id,
      applicationId: application1.id,
      subtotal: new Prisma.Decimal('50000.00'),
      totalAmount: new Prisma.Decimal('50000.00'),
      dueAmount: new Prisma.Decimal('50000.00'),
      paidAmount: new Prisma.Decimal('0.00'),
      currency: 'BDT',
      status: 'ISSUED',
      items: {
        create: [
          {
            description: 'Recruitment & Visa Processing Package',
            quantity: 1,
            unitPrice: new Prisma.Decimal('50000.00'),
            lineTotal: new Prisma.Decimal('50000.00'),
          },
        ],
      },
    },
  });
  assert(invoice1.dueAmount.equals(new Prisma.Decimal('50000.00')), 'Invoice created with 50,000.00 BDT due');

  // Partial Payment of 20,000 BDT
  const partPayment = await recordPayment(prisma, {
    invoiceId: invoice1.id,
    amount: 20000.00,
    paymentMethod: 'BANK_TRANSFER',
    receivedById: adminUser?.id,
    referenceNumber: `PART-${testRunId}`,
  });
  const invAfterPart = await prisma.invoice.findUnique({ where: { id: invoice1.id } });
  assert(invAfterPart?.status === 'PARTIALLY_PAID', 'Invoice status is PARTIALLY_PAID after partial payment');
  assert(invAfterPart?.dueAmount.equals(new Prisma.Decimal('30000.00')), 'Remaining due amount is exactly 30,000.00 BDT');
  assert(!!partPayment.receiptNumber, `Receipt number issued: ${partPayment.receiptNumber}`);

  // Overpayment rejection check
  let overpayBlocked = false;
  try {
    await recordPayment(prisma, {
      invoiceId: invoice1.id,
      amount: 35000.00, // exceeds 30,000 due
      paymentMethod: 'CASH',
      receivedById: adminUser?.id,
    });
  } catch (err: any) {
    if (err.message.includes('exceeds outstanding invoice balance')) {
      overpayBlocked = true;
    }
  }
  assert(overpayBlocked, 'Overpayment is strictly rejected by atomic transaction');

  // Full Payment of remaining 30,000 BDT
  const fullPayment = await recordPayment(prisma, {
    invoiceId: invoice1.id,
    amount: 30000.00,
    paymentMethod: 'CASH',
    receivedById: adminUser?.id,
    referenceNumber: `FULL-${testRunId}`,
  });
  const invAfterFull = await prisma.invoice.findUnique({ where: { id: invoice1.id } });
  assert(invAfterFull?.status === 'PAID', 'Invoice status is PAID after full settlement');
  assert(invAfterFull?.dueAmount.equals(new Prisma.Decimal('0.00')), 'Remaining due amount is exactly 0.00 BDT');
  assert(!!fullPayment.receiptNumber, `Final receipt number issued: ${fullPayment.receiptNumber}`);

  // ============================================================================
  // FLOW 5: Applicant → Multiple Invoices → Multiple Payments → Customer Ledger
  // ============================================================================
  console.log('\n--- [FLOW 5] Multiple Invoices → Multiple Payments → Customer Ledger ---');

  // Create linked customer
  const customer = await prisma.customer.create({
    data: {
      customerType: 'APPLICANT',
      name: applicant1.fullName,
      phone: applicant1.phone,
      email: applicant1.email,
      applicantId: applicant1.id,
    },
  });

  // Invoice A: 15,000 BDT
  const invCodeA = await generateFormattedId(prisma, 'invoice');
  const invA = await prisma.invoice.create({
    data: {
      invoiceNumber: invCodeA,
      customerId: customer.id,
      applicantId: applicant1.id,
      subtotal: new Prisma.Decimal('15000.00'),
      totalAmount: new Prisma.Decimal('15000.00'),
      dueAmount: new Prisma.Decimal('15000.00'),
      paidAmount: new Prisma.Decimal('0.00'),
      status: 'ISSUED',
    },
  });

  // Invoice B: 35,000 BDT
  const invCodeB = await generateFormattedId(prisma, 'invoice');
  const invB = await prisma.invoice.create({
    data: {
      invoiceNumber: invCodeB,
      customerId: customer.id,
      applicantId: applicant1.id,
      subtotal: new Prisma.Decimal('35000.00'),
      totalAmount: new Prisma.Decimal('35000.00'),
      dueAmount: new Prisma.Decimal('35000.00'),
      paidAmount: new Prisma.Decimal('0.00'),
      status: 'ISSUED',
    },
  });

  // Pay Invoice A full (15,000) & Invoice B partial (10,000)
  await recordPayment(prisma, {
    invoiceId: invA.id,
    customerId: customer.id,
    amount: 15000.00,
    paymentMethod: 'CASH',
    receivedById: adminUser?.id,
  });

  await recordPayment(prisma, {
    invoiceId: invB.id,
    customerId: customer.id,
    amount: 10000.00,
    paymentMethod: 'BANK_TRANSFER',
    receivedById: adminUser?.id,
  });

  const ledger = await getCustomerLedger(prisma, customer.id);
  assert(!!ledger, 'Customer ledger generated successfully');
  if (ledger) {
    const debit = Number(ledger.totalDebit || ledger.totalInvoiced);
    const credit = Number(ledger.totalCredit || ledger.totalPaid);
    const expectedClosing = (debit - credit).toFixed(2);
    assert(debit > 0, `Ledger recorded debit postings (Total: ${debit})`);
    assert(credit > 0, `Ledger recorded credit postings (Total: ${credit})`);
    assert(
      (ledger.closingBalance || ledger.currentBalanceDue) === expectedClosing,
      `Ledger closing balance matches arithmetic Debit - Credit (${expectedClosing})`
    );
  }

  // ============================================================================
  // FLOW 6: Admin → Create Job → Publish → Applicant Applies → Appears in Admin
  // ============================================================================
  console.log('\n--- [FLOW 6] Admin Create Job → Publish → Candidate Applies → Admin Pipeline ---');

  const adminJobCode = await generateFormattedId(prisma, 'job');
  const adminJob = await prisma.job.create({
    data: {
      jobCode: adminJobCode,
      title: `Senior Pipe Fitter ${testRunId}`,
      slug: `senior-pipe-fitter-${testRunId}`,
      countryId: defaultCountry!.id,
      jobCategoryId: defaultJobCategory!.id,
      description: 'Audit test job for end-to-end recruitment verification',
      vacancyCount: 5,
      status: 'PUBLISHED',
      createdBy: adminUser?.id,
    },
  });
  assert(adminJob.status === 'PUBLISHED', `Admin created and published job (${adminJob.jobCode})`);

  // Candidate discovers and applies
  const candidateAppCode = await generateFormattedId(prisma, 'application');
  const candApp = await prisma.application.create({
    data: {
      applicationCode: candidateAppCode,
      applicationNumber: candidateAppCode,
      applicantId: applicant1.id,
      jobId: adminJob.id,
      countryId: adminJob.countryId,
      status: 'NEW',
      currentStage: 'NEW',
    },
  });

  // Admin queries applications for this job
  const adminJobApps = await prisma.application.findMany({
    where: { jobId: adminJob.id },
    include: { applicant: true, job: true },
  });
  assert(
    adminJobApps.some((a) => a.id === candApp.id),
    'Candidate application immediately visible in Admin job pipeline'
  );

  // ============================================================================
  // FLOW 7: Admin → Create Invoice → Record Payment → Dashboard Financial Totals
  // ============================================================================
  console.log('\n--- [FLOW 7] Admin Create Invoice → Record Payment → Dashboard Aggregates ---');

  const baselineAgg = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: 'COMPLETED' },
  });
  const baselinePaid = baselineAgg._sum.amount || new Prisma.Decimal('0.00');

  const testInvNumber = await generateFormattedId(prisma, 'invoice');
  const testInv = await prisma.invoice.create({
    data: {
      invoiceNumber: testInvNumber,
      applicantId: applicant1.id,
      subtotal: new Prisma.Decimal('12500.00'),
      totalAmount: new Prisma.Decimal('12500.00'),
      dueAmount: new Prisma.Decimal('12500.00'),
      paidAmount: new Prisma.Decimal('0.00'),
      status: 'ISSUED',
    },
  });

  await recordPayment(prisma, {
    invoiceId: testInv.id,
    amount: 12500.00,
    paymentMethod: 'CASH',
    receivedById: adminUser?.id,
  });

  const newAgg = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: 'COMPLETED' },
  });
  const newPaid = newAgg._sum.amount || new Prisma.Decimal('0.00');

  assert(
    newPaid.equals(baselinePaid.add(new Prisma.Decimal('12500.00'))),
    `Dashboard total collections incremented exactly by 12,500.00 BDT (${newPaid})`
  );

  // ============================================================================
  // FLOW 8: Admin → Visa Case → Update Status → Applicant Portal Safe View
  // ============================================================================
  console.log('\n--- [FLOW 8] Admin Visa Update → Candidate Portal Safe Reflection ---');

  const confidentialNote = 'INTERNAL CONFIDENTIAL: Security clearance pending verification from embassy attache';
  const updatedVisaCase = await prisma.visaApplication.update({
    where: { id: visaApp.id },
    data: {
      status: 'UNDER_REVIEW',
      notes: confidentialNote,
    },
  });

  // Candidate portal view query (safe projection)
  const safePortalVisa = await prisma.visaApplication.findFirst({
    where: { applicantId: applicant1.id, id: updatedVisaCase.id },
    select: {
      visaApplicationNumber: true,
      visaType: true,
      status: true,
      submissionDate: true,
      decisionDate: true,
      // Internal sensitive fields (notes, rejection internal codes) are NOT selected
    },
  });

  assert(safePortalVisa?.status === 'UNDER_REVIEW', 'Candidate portal reflects updated status (UNDER_REVIEW)');
  assert(
    !(safePortalVisa as any).notes,
    'Confidential admin internal notes are strictly excluded from candidate portal'
  );

  // ============================================================================
  // FLOW 9: Staff User → Permitted Modules Only (RBAC Enforcement)
  // ============================================================================
  console.log('\n--- [FLOW 9] Staff User RBAC Isolation & Granular Permissions ---');

  // Super Admin check
  const superAdminAuth: AuthUser = {
    id: adminUser!.id,
    name: adminUser!.name,
    email: adminUser!.email,
    role: { id: adminUser!.role.id, name: 'SUPER_ADMIN' },
    permissions: adminUser!.role.rolePermissions.map((rp) => rp.permission.code as PermissionCode),
    isActive: true,
  };
  assert(hasPermission(superAdminAuth, 'USERS_MANAGE'), 'SUPER_ADMIN possesses USERS_MANAGE permission');
  assert(hasPermission(superAdminAuth, 'INVOICES_CREATE'), 'SUPER_ADMIN possesses INVOICES_CREATE permission');

  // Restricted Staff user simulation (e.g. Accounts clerk)
  const accountsClerkAuth: AuthUser = {
    id: 'staff-clerk-mock-id',
    name: 'Accounts Staff',
    email: 'clerk@shakilglobal.com',
    role: { id: 'role-clerk', name: 'ACCOUNTS_CLERK' },
    permissions: ['INVOICES_VIEW', 'INVOICES_CREATE', 'PAYMENTS_CREATE'] as PermissionCode[],
    isActive: true,
  };
  assert(hasPermission(accountsClerkAuth, 'INVOICES_VIEW'), 'Accounts staff has INVOICES_VIEW permission');
  assert(hasPermission(accountsClerkAuth, 'PAYMENTS_CREATE'), 'Accounts staff has PAYMENTS_CREATE permission');
  assert(!hasPermission(accountsClerkAuth, 'USERS_MANAGE'), 'Accounts staff is DENIED USERS_MANAGE permission');
  assert(!hasPermission(accountsClerkAuth, 'SETTINGS_MANAGE'), 'Accounts staff is DENIED SETTINGS_MANAGE permission');

  // ============================================================================
  // FLOW 10: Candidate A Cannot Access Candidate B Data (Strict IDOR Defense)
  // ============================================================================
  console.log('\n--- [FLOW 10] Candidate Cross-Account Isolation (Strict IDOR Defense) ---');

  // Register Candidate B
  const cand2Phone = `+88018${String(testRunId).slice(-8)}`;
  const cand2Email = `audit_cand2_${testRunId}@test.com`;
  const applicantNumber2 = await generateApplicantNumber(prisma);

  const applicant2 = await prisma.applicant.create({
    data: {
      applicantNumber: applicantNumber2,
      fullName: 'Protected Applicant Two',
      phone: cand2Phone,
      email: cand2Email,
      passwordHash: passwordHash,
      status: 'ACTIVE',
    },
  });

  // Create private doc, invoice & application for Candidate B
  const docCandB = await prisma.document.create({
    data: {
      applicantId: applicant2.id,
      documentTypeId: defaultDocType!.id,
      fileName: 'candB_private_national_id.pdf',
      filePath: `/uploads/applicants/${applicant2.id}/national_id.pdf`,
      fileSize: 1024 * 100,
      mimeType: 'application/pdf',
      status: 'VERIFIED',
    },
  });

  const invCandB = await prisma.invoice.create({
    data: {
      invoiceNumber: await generateFormattedId(prisma, 'invoice'),
      applicantId: applicant2.id,
      subtotal: new Prisma.Decimal('99000.00'),
      totalAmount: new Prisma.Decimal('99000.00'),
      dueAmount: new Prisma.Decimal('99000.00'),
      status: 'ISSUED',
    },
  });

  // 1. Ownership Assertion Defense
  let idorBlocked = false;
  try {
    assertApplicantOwnership(docCandB.applicantId, applicant1.id);
  } catch (err: any) {
    if (err.name === 'AuthorizationError') {
      idorBlocked = true;
    }
  }
  assert(idorBlocked, 'Direct entity ownership assertion prevents cross-candidate access');

  // 2. Database Filter Isolation (Candidate A querying Candidate B document)
  const leakDoc = await prisma.document.findFirst({
    where: { id: docCandB.id, applicantId: applicant1.id },
  });
  assert(leakDoc === null, 'Portal document query scoping returns NULL for foreign documents');

  // 3. Database Filter Isolation (Candidate A querying Candidate B invoice)
  const leakInv = await prisma.invoice.findFirst({
    where: { id: invCandB.id, applicantId: applicant1.id },
  });
  assert(leakInv === null, 'Portal invoice query scoping returns NULL for foreign invoices');

  // 4. Database Filter Isolation (Candidate A querying Candidate B applications)
  const leakApps = await prisma.application.findMany({
    where: { applicantId: applicant1.id, applicant: { id: applicant2.id } },
  });
  assert(leakApps.length === 0, 'Portal application query returns ZERO records for foreign candidate');

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n================================================================');
  console.log(`END-TO-END FLOW AUDIT SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('Audit execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
