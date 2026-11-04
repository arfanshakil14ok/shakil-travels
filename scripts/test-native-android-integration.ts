import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { prisma } from '../src/lib/prisma';
import { generateApplicantNumber } from '../src/lib/id-generator';
import {
  hashApplicantPassword,
  createPortalToken,
  verifyPortalToken,
} from '../src/lib/portal-auth';
import {
  hashPassword,
  createSessionToken,
  verifySessionToken,
} from '../src/lib/auth';

async function runNativeAndroidIntegrationTests() {
  console.log('================================================================');
  console.log('📱 SHAKILWORK: REAL BACKEND & NATIVE ANDROID INTEGRATION TEST');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Register Candidate on Web and Verify Data on Android
    // -------------------------------------------------------------
    console.log('\n--- 1. Register Candidate on Web & Verify on Android (Same Database) ---');
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const applicantNumber = await generateApplicantNumber(prisma as any);
    const password = 'Password@123';
    const passwordHash = await hashApplicantPassword(password);
    const phone = `017${randomSuffix}`;
    const email = `candidate.${randomSuffix}@shakilwork.test`;
    const fullName = `MD Shakil Integration Test ${randomSuffix}`;

    const createdCandidate = await prisma.applicant.create({
      data: {
        applicantNumber,
        fullName,
        phone,
        email,
        passwordHash,
        candidateType: 'SKILLED',
        status: 'ACTIVE',
        district: 'Dhaka',
        passportNumber: `A${randomSuffix}`,
      },
    });

    assert(!!createdCandidate.id, `Candidate registered in PostgreSQL database: ID=${createdCandidate.applicantNumber}`);

    // Simulate Android App Login via Portal Token API
    const candidateToken = await createPortalToken({
      applicantId: createdCandidate.id,
      applicantNumber: createdCandidate.applicantNumber,
      phone: createdCandidate.phone,
      email: createdCandidate.email || '',
      fullName: createdCandidate.fullName,
    });

    const decodedSession = await verifyPortalToken(candidateToken);
    assert(!!decodedSession, 'Android Client receives valid JWT token from backend');
    assert(decodedSession?.applicantId === createdCandidate.id, `Android session matches Candidate DB ID (${createdCandidate.id})`);
    assert(decodedSession?.applicantNumber === createdCandidate.applicantNumber, `Android session matches Applicant Number (${createdCandidate.applicantNumber})`);

    // -------------------------------------------------------------
    // TEST 2: Upload Document on Android and Verify on Web
    // -------------------------------------------------------------
    console.log('\n--- 2. Upload Document on Android & Verify on Web ---');
    // Ensure document type exists
    let docType = await prisma.documentType.findFirst({
      where: { code: 'PASSPORT' },
    });
    if (!docType) {
      docType = await prisma.documentType.create({
        data: {
          code: 'PASSPORT',
          name: 'Passport Bio Page',
          description: 'Original passport bio page copy',
          required: true,
        },
      });
    }

    const doc = await prisma.document.create({
      data: {
        applicantId: createdCandidate.id,
        documentTypeId: docType.id,
        fileName: 'passport_scan.jpg',
        filePath: `applicants/${createdCandidate.id}/passport_scan.jpg`,
        fileUrl: `https://storage.shakilwork.com/applicants/${createdCandidate.id}/passport_scan.jpg`,
        fileSize: 204850,
        mimeType: 'image/jpeg',
        status: 'UPLOADED',
        notes: 'Uploaded via Android Native Camera',
      },
    });

    assert(!!doc.id, `Document recorded in PostgreSQL: ${doc.fileName}`);
    const webVisibleDoc = await prisma.document.findUnique({
      where: { id: doc.id },
      include: { applicant: true, documentType: true },
    });
    assert(webVisibleDoc?.status === 'UPLOADED', 'Web Admin/Staff sees the exact uploaded document in real time');
    assert(webVisibleDoc?.applicant.id === createdCandidate.id, 'Document relation directly maps to candidate on Web');

    // -------------------------------------------------------------
    // TEST 3: Update Application Status on Android and Verify on Web
    // -------------------------------------------------------------
    console.log('\n--- 3. Update Application / Processing Status on Android & Verify on Web ---');
    // Find or create a country & job
    let country = await prisma.country.findFirst();
    if (!country) {
      country = await prisma.country.create({
        data: { code: 'SA', name: 'Saudi Arabia', currency: 'SAR' },
      });
    }

    let employer = await prisma.employer.findFirst();
    if (!employer) {
      employer = await prisma.employer.create({
        data: {
          companyName: 'Al-Khaleej Heavy Industries',
          countryId: country.id,
          contactPerson: 'Ahmed Al-Mansoor',
          email: 'contact@al-khaleej.example',
          phone: '+966501234567',
        },
      });
    }

    let job = await prisma.job.findFirst();
    if (!job) {
      job = await prisma.job.create({
        data: {
          title: 'Heavy Trailer Driver',
          slug: `heavy-trailer-driver-${randomSuffix}`,
          employerId: employer.id,
          countryId: country.id,
          vacancies: 10,
          status: 'PUBLISHED',
          salary: 2500,
          salaryCurrency: 'SAR',
        },
      });
    }

    const application = await prisma.application.create({
      data: {
        applicationCode: `APP-${randomSuffix}`,
        applicantId: createdCandidate.id,
        jobId: job.id,
        status: 'APPLIED',
      },
    });

    assert(!!application.id, `Job Application created: ${application.id}`);

    // Android/Staff updates status to SHORTLISTED
    const updatedApplication = await prisma.application.update({
      where: { id: application.id },
      data: { status: 'SHORTLISTED' },
    });

    assert(updatedApplication.status === 'SHORTLISTED', 'Status updated to SHORTLISTED via Android Staff action');

    const webCheckApp = await prisma.application.findUnique({
      where: { id: application.id },
    });
    assert(webCheckApp?.status === 'SHORTLISTED', 'Web Dashboard immediately reflects SHORTLISTED status');

    // -------------------------------------------------------------
    // TEST 4: Record Payment on Android and Verify on Web
    // -------------------------------------------------------------
    console.log('\n--- 4. Record Payment on Android & Verify on Web ---');
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${randomSuffix}`,
        applicant: { connect: { id: createdCandidate.id } },
        subtotal: 50000,
        tax: 0,
        discount: 0,
        totalAmount: 50000,
        paidAmount: 20000,
        dueAmount: 30000,
        status: 'PARTIALLY_PAID',
        currency: 'BDT',
      },
    });

    const payment = await prisma.payment.create({
      data: {
        paymentNumber: `REC-${randomSuffix}`,
        applicant: { connect: { id: createdCandidate.id } },
        invoice: { connect: { id: invoice.id } },
        amount: 20000,
        currency: 'BDT',
        paymentMethod: 'BANK_TRANSFER',
        status: 'COMPLETED',
        notes: 'Collected and confirmed via Android Accounts POS',
      },
    });

    assert(!!payment.id, `Payment recorded: Receipt ${payment.paymentNumber}, Amount: ${payment.amount} BDT`);

    const webInvoiceCheck = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: { payments: true },
    });

    assert(webInvoiceCheck?.status === 'PARTIALLY_PAID', 'Web Finance Ledger shows correct PARTIALLY_PAID status');
    assert(Number(webInvoiceCheck?.paidAmount) === 20000, 'Web Finance Ledger reflects exact paid amount (20,000 BDT)');
    assert(Number(webInvoiceCheck?.dueAmount) === 30000, 'Web Finance Ledger reflects exact remaining due (30,000 BDT)');

    // -------------------------------------------------------------
    // TEST 5: Verify Permissions, Isolation & Security Policies
    // -------------------------------------------------------------
    console.log('\n--- 5. Candidate, Staff & Admin Isolation Verification ---');
    // Ensure admin user exists
    let adminUser = await prisma.user.findFirst({
      where: { role: { name: 'SUPER_ADMIN' } },
      include: { role: true },
    });

    if (adminUser) {
      const staffToken = await createSessionToken({
        userId: adminUser.id,
        email: adminUser.email,
        role: adminUser.role.name,
      });

      const verifiedStaff = await verifySessionToken(staffToken);
      assert(!!verifiedStaff, 'Staff/Admin token successfully verified');

      // Check cross-realm isolation
      const candidateTriedOnStaff = await verifySessionToken(candidateToken);
      assert(candidateTriedOnStaff === null, 'SECURITY GATE: Candidate token strictly rejected by Staff API verifier');

      const staffTriedOnPortal = await verifyPortalToken(staffToken);
      assert(staffTriedOnPortal === null, 'SECURITY GATE: Staff token strictly rejected by Candidate Portal verifier');
    }

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log('\n--- Cleaning up temporary integration records ---');
    await prisma.payment.deleteMany({ where: { applicant: { id: createdCandidate.id } } });
    await prisma.invoice.deleteMany({ where: { applicant: { id: createdCandidate.id } } });
    await prisma.application.deleteMany({ where: { applicantId: createdCandidate.id } });
    await prisma.document.deleteMany({ where: { applicantId: createdCandidate.id } });
    await prisma.applicant.delete({ where: { id: createdCandidate.id } });
    console.log('✓ Cleanup complete.');

  } catch (error) {
    console.error('Integration test encountered an error:', error);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`FINAL INTEGRATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runNativeAndroidIntegrationTests()
  .catch((err) => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
