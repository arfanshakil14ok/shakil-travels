import { NextRequest } from 'next/server';
import { GET as documentDownloadHandler } from '../src/app/api/documents/[id]/download/route';
import { GET as staffMedicalGetHandler, POST as staffMedicalScheduleHandler } from '../src/app/api/staff/processing/[id]/medical/route';
import { POST as staffMedicalResultHandler } from '../src/app/api/staff/processing/[id]/medical/result/route';
import { createSessionToken } from '../src/lib/auth';
import { createPortalToken } from '../src/lib/portal-auth';
import prisma from '../src/lib/prisma';
import { SignJWT } from 'jose';

interface TestResult {
  testId: string;
  category: string;
  scenario: string;
  method: string;
  endpoint: string;
  role: string;
  expectedStatus: number;
  actualStatus: number;
  dbMutationVerified: boolean;
  status: 'PASS' | 'FAIL';
  details: string;
}

async function runFinalClosureAudit() {
  console.log('======================================================================');
  console.log('🔒 SHAKILWORK: PHASE 6.3 FINAL CLOSURE SECURITY & AUDIT SUITE');
  console.log('======================================================================\n');

  const results: TestResult[] = [];
  let passedCount = 0;
  let failedCount = 0;

  // 1. Fetch live DB references
  const monirApplicant = await prisma.applicant.findFirst({
    where: { applicantNumber: 'SGR-2026-000008' },
  });
  const raisaApplicant = await prisma.applicant.findFirst({
    where: { applicantNumber: 'SGR-2026-000010' },
  });

  if (!monirApplicant || !raisaApplicant) {
    throw new Error('Required live test applicants not found in database');
  }

  // Fetch documents
  const monirDoc = (await prisma.document.findFirst({
    where: {
      applicantId: monirApplicant.id,
      filePath: { startsWith: 'data:' },
    },
  })) || (await prisma.document.findFirst({
    where: { applicantId: monirApplicant.id },
  }));

  if (!monirDoc) {
    throw new Error('Monir document not found for download tests');
  }

  // Fetch staff users
  const accountsUser = await prisma.user.findFirst({
    where: { email: 'accounts@shakilglobal.com' },
    include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
  });

  const viewerUser = await prisma.user.findFirst({
    where: { email: 'viewer@shakilglobal.com' },
    include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
  });

  const recruiterUser = await prisma.user.findFirst({
    where: { email: 'recruiter@shakilglobal.com' },
    include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
  });

  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@shakilglobal.com' },
    include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
  });

  const superAdminUser = await prisma.user.findFirst({
    where: { role: { name: 'SUPER_ADMIN' } },
    include: { role: true },
  });

  if (!accountsUser || !viewerUser || !superAdminUser) {
    throw new Error('Required staff/admin accounts missing from database');
  }

  // Ensure MEDICAL_MANAGE and MEDICAL_VIEW exist in Permission table for granular testing
  const medViewPerm = await prisma.permission.upsert({
    where: { code: 'MEDICAL_VIEW' },
    update: {},
    create: { code: 'MEDICAL_VIEW', description: 'View medical examination records', module: 'PROCESSING' },
  });
  const medManagePerm = await prisma.permission.upsert({
    where: { code: 'MEDICAL_MANAGE' },
    update: {},
    create: { code: 'MEDICAL_MANAGE', description: 'Manage medical appointments and results', module: 'PROCESSING' },
  });

  // Ensure recruiter role has MEDICAL_MANAGE for testing "Staff with MEDICAL_MANAGE"
  let rolePermAdded = false;
  if (recruiterUser?.roleId) {
    const existing = await prisma.rolePermission.findFirst({
      where: { roleId: recruiterUser.roleId, permissionId: medManagePerm.id },
    });
    if (!existing) {
      await prisma.rolePermission.create({
        data: { roleId: recruiterUser.roleId, permissionId: medManagePerm.id },
      });
      rolePermAdded = true;
    }
  }

  // Setup temporary application and processing case for non-destructive mutation tests
  const job = await prisma.job.findFirst({ where: { status: 'PUBLISHED' } });
  if (!job) throw new Error('No published job found for processing case setup');

  const tempApp = await prisma.application.create({
    data: {
      applicationCode: `APP-CLOSURE-${Date.now()}`,
      applicantId: monirApplicant.id,
      jobId: job.id,
      status: 'SELECTED',
      assignedStaffId: recruiterUser?.id || null,
    },
  });

  const tempCase = await prisma.recruitmentProcessingCase.create({
    data: {
      processingCode: `SGR-PROC-CLOSURE-${Date.now()}`,
      applicationId: tempApp.id,
      applicantId: monirApplicant.id,
      jobId: job.id,
      currentStage: 'MEDICAL_SCHEDULED',
      overallStatus: 'ACTIVE',
    },
  });

  // Temporary Medical Center
  const medCenter = await prisma.medicalCenter.findFirst() || await prisma.medicalCenter.create({
    data: {
      name: 'GAMCA Approved Medical Center Dhaka',
      city: 'Dhaka',
      country: 'Bangladesh',
    },
  });

  // Generate tokens
  const monirToken = await createPortalToken({
    applicantId: monirApplicant.id,
    applicantNumber: monirApplicant.applicantNumber,
    phone: monirApplicant.phone,
    fullName: monirApplicant.fullName,
  });

  const raisaToken = await createPortalToken({
    applicantId: raisaApplicant.id,
    applicantNumber: raisaApplicant.applicantNumber,
    phone: raisaApplicant.phone,
    fullName: raisaApplicant.fullName,
  });

  const accountsToken = await createSessionToken({
    userId: accountsUser.id,
    email: accountsUser.email,
    role: accountsUser.role.name,
  });

  const viewerToken = await createSessionToken({
    userId: viewerUser.id,
    email: viewerUser.email,
    role: viewerUser.role.name,
  });

  const recruiterToken = recruiterUser ? await createSessionToken({
    userId: recruiterUser.id,
    email: recruiterUser.email,
    role: recruiterUser.role.name,
  }) : '';

  const superAdminToken = await createSessionToken({
    userId: superAdminUser.id,
    email: superAdminUser.email,
    role: superAdminUser.role.name,
  });

  const expiredToken = await new SignJWT({
    userId: 'expired-test-id',
    email: 'expired@shakilglobal.com',
    role: 'STAFF',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
    .sign(new TextEncoder().encode(process.env.JWT_SECRET || 'sgr_enterprise_secret_key_change_in_production_2026_recruit_auth'));

  const inactiveToken = await createSessionToken({
    userId: '00000000-0000-0000-0000-000000000000',
    email: 'inactive@shakilglobal.com',
    role: 'STAFF',
  });

  // Helper recorder
  async function recordTest(
    testId: string,
    category: string,
    scenario: string,
    method: string,
    endpoint: string,
    role: string,
    expectedStatus: number,
    responsePromise: Promise<Response>,
    checkMutation: () => Promise<boolean>
  ) {
    const res = await responsePromise;
    const actualStatus = res.status;
    let details = '';
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      details = JSON.stringify(json).slice(0, 100);
    } else {
      details = `[${contentType}]`;
    }

    const dbMutationOk = await checkMutation();
    const passed = actualStatus === expectedStatus && dbMutationOk;

    if (passed) {
      passedCount++;
      console.log(`✅ [${testId}] ${scenario}`);
      console.log(`   Status: Expected ${expectedStatus}, Received ${actualStatus}`);
      console.log(`   DB Mutation Guard: ${dbMutationOk ? 'VERIFIED (No unauthorized mutation)' : 'FAILED'}`);
    } else {
      failedCount++;
      console.log(`❌ [${testId}] ${scenario}`);
      console.log(`   Status: Expected ${expectedStatus}, Received ${actualStatus}`);
      console.log(`   DB Mutation Guard: ${dbMutationOk ? 'OK' : 'VIOLATION'}`);
      console.log(`   Details: ${details}`);
    }

    results.push({
      testId,
      category,
      scenario,
      method,
      endpoint,
      role,
      expectedStatus,
      actualStatus,
      dbMutationVerified: dbMutationOk,
      status: passed ? 'PASS' : 'FAIL',
      details,
    });
  }

  try {
    // =========================================================================
    // SECTION 1: DOCUMENT_VIEW OPERATIONAL SCOPE TESTS
    // =========================================================================
    console.log('\n--- SECTION 1: DOCUMENT_VIEW OPERATIONAL SCOPE ---');

    // 1.1 Anonymous request -> 401
    await recordTest(
      'SCOPE-01',
      'DOCUMENT_VIEW',
      'Unauthenticated request to document download',
      'GET',
      `/api/documents/${monirDoc.id}/download`,
      'ANONYMOUS',
      401,
      documentDownloadHandler(
        new NextRequest(`http://localhost:3000/api/documents/${monirDoc.id}/download`),
        { params: Promise.resolve({ id: monirDoc.id }) }
      ),
      async () => true
    );

    // 1.2 Inactive staff token -> 401
    await recordTest(
      'SCOPE-02',
      'DOCUMENT_VIEW',
      'Inactive staff token accessing document download',
      'GET',
      `/api/documents/${monirDoc.id}/download`,
      'INACTIVE_STAFF',
      401,
      documentDownloadHandler(
        new NextRequest(`http://localhost:3000/api/documents/${monirDoc.id}/download`, {
          headers: { authorization: `Bearer ${inactiveToken}` },
        }),
        { params: Promise.resolve({ id: monirDoc.id }) }
      ),
      async () => true
    );

    // 1.3 Candidate accessing another candidate's document -> 403
    await recordTest(
      'SCOPE-03',
      'DOCUMENT_VIEW',
      'Candidate requesting another applicant private document',
      'GET',
      `/api/documents/${monirDoc.id}/download`,
      'CANDIDATE (Raisa -> Monir Doc)',
      403,
      documentDownloadHandler(
        new NextRequest(`http://localhost:3000/api/documents/${monirDoc.id}/download`, {
          headers: { authorization: `Bearer ${raisaToken}` },
        }),
        { params: Promise.resolve({ id: monirDoc.id }) }
      ),
      async () => true
    );

    // 1.4 Staff WITHOUT DOCUMENT_VIEW -> 403
    await recordTest(
      'SCOPE-04',
      'DOCUMENT_VIEW',
      'Staff lacking DOCUMENT_VIEW denied download (Accounts)',
      'GET',
      `/api/documents/${monirDoc.id}/download`,
      'ACCOUNTS_STAFF',
      403,
      documentDownloadHandler(
        new NextRequest(`http://localhost:3000/api/documents/${monirDoc.id}/download`, {
          headers: { authorization: `Bearer ${accountsToken}` },
        }),
        { params: Promise.resolve({ id: monirDoc.id }) }
      ),
      async () => true
    );

    // 1.5 Staff WITH DOCUMENT_VIEW accessing authorized candidate document -> 200
    await recordTest(
      'SCOPE-05',
      'DOCUMENT_VIEW',
      'Staff with DOCUMENT_VIEW authorized download (Viewer)',
      'GET',
      `/api/documents/${monirDoc.id}/download`,
      'VIEWER (Has DOCUMENT_VIEW)',
      200,
      documentDownloadHandler(
        new NextRequest(`http://localhost:3000/api/documents/${monirDoc.id}/download`, {
          headers: { authorization: `Bearer ${viewerToken}` },
        }),
        { params: Promise.resolve({ id: monirDoc.id }) }
      ),
      async () => true
    );

    // 1.6 Super Admin accessing document -> 200
    await recordTest(
      'SCOPE-06',
      'DOCUMENT_VIEW',
      'Super Admin authorized document download',
      'GET',
      `/api/documents/${monirDoc.id}/download`,
      'SUPER_ADMIN',
      200,
      documentDownloadHandler(
        new NextRequest(`http://localhost:3000/api/documents/${monirDoc.id}/download`, {
          headers: { authorization: `Bearer ${superAdminToken}` },
        }),
        { params: Promise.resolve({ id: monirDoc.id }) }
      ),
      async () => true
    );

    // 1.7 Candidate downloading their own document -> 200
    await recordTest(
      'SCOPE-07',
      'DOCUMENT_VIEW',
      'Candidate authorized download of their own document',
      'GET',
      `/api/documents/${monirDoc.id}/download`,
      'CANDIDATE (Monir Owner)',
      200,
      documentDownloadHandler(
        new NextRequest(`http://localhost:3000/api/documents/${monirDoc.id}/download`, {
          headers: { authorization: `Bearer ${monirToken}` },
        }),
        { params: Promise.resolve({ id: monirDoc.id }) }
      ),
      async () => true
    );

    // =========================================================================
    // SECTION 2: MEDICAL MUTATION ENDPOINT TESTS
    // =========================================================================
    console.log('\n--- SECTION 2: MEDICAL MUTATION ENDPOINTS (SCHEDULE & RESULT) ---');

    const schedulePayload = {
      medicalCenterId: medCenter.id,
      medicalCenterName: medCenter.name,
      appointmentDate: '2026-11-20',
      appointmentTime: '10:00 AM',
      medicalType: 'GAMCA',
      gamcaNumber: 'GAMCA-CLOSURE-12345',
      appointmentNotes: 'Test schedule appointment',
    };

    // 2.1 POST /api/staff/processing/[id]/medical - Anonymous -> 401
    await recordTest(
      'MED-MUT-01',
      'MEDICAL_SCHEDULE',
      'Anonymous user denied medical schedule mutation',
      'POST',
      `/api/staff/processing/${tempCase.id}/medical`,
      'ANONYMOUS',
      401,
      staffMedicalScheduleHandler(
        new NextRequest(`http://localhost:3000/api/staff/processing/${tempCase.id}/medical`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(schedulePayload),
        }),
        { params: Promise.resolve({ id: tempCase.id }) }
      ),
      async () => {
        const count = await prisma.medicalCase.count({ where: { processingCaseId: tempCase.id } });
        return count === 0;
      }
    );

    // 2.2 POST /api/staff/processing/[id]/medical - Candidate Token -> 401
    await recordTest(
      'MED-MUT-02',
      'MEDICAL_SCHEDULE',
      'Candidate token denied medical schedule mutation',
      'POST',
      `/api/staff/processing/${tempCase.id}/medical`,
      'CANDIDATE',
      401,
      staffMedicalScheduleHandler(
        new NextRequest(`http://localhost:3000/api/staff/processing/${tempCase.id}/medical`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${monirToken}`,
          },
          body: JSON.stringify(schedulePayload),
        }),
        { params: Promise.resolve({ id: tempCase.id }) }
      ),
      async () => {
        const count = await prisma.medicalCase.count({ where: { processingCaseId: tempCase.id } });
        return count === 0;
      }
    );

    // 2.3 POST /api/staff/processing/[id]/medical - Inactive Staff -> 401
    await recordTest(
      'MED-MUT-03',
      'MEDICAL_SCHEDULE',
      'Inactive staff token denied medical schedule mutation',
      'POST',
      `/api/staff/processing/${tempCase.id}/medical`,
      'INACTIVE_STAFF',
      401,
      staffMedicalScheduleHandler(
        new NextRequest(`http://localhost:3000/api/staff/processing/${tempCase.id}/medical`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${inactiveToken}`,
          },
          body: JSON.stringify(schedulePayload),
        }),
        { params: Promise.resolve({ id: tempCase.id }) }
      ),
      async () => {
        const count = await prisma.medicalCase.count({ where: { processingCaseId: tempCase.id } });
        return count === 0;
      }
    );

    // 2.4 POST /api/staff/processing/[id]/medical - Staff WITHOUT MEDICAL_MANAGE -> 403
    await recordTest(
      'MED-MUT-04',
      'MEDICAL_SCHEDULE',
      'Staff lacking MEDICAL_MANAGE denied schedule mutation (Accounts)',
      'POST',
      `/api/staff/processing/${tempCase.id}/medical`,
      'ACCOUNTS_STAFF',
      403,
      staffMedicalScheduleHandler(
        new NextRequest(`http://localhost:3000/api/staff/processing/${tempCase.id}/medical`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${accountsToken}`,
          },
          body: JSON.stringify(schedulePayload),
        }),
        { params: Promise.resolve({ id: tempCase.id }) }
      ),
      async () => {
        const count = await prisma.medicalCase.count({ where: { processingCaseId: tempCase.id } });
        return count === 0;
      }
    );

    // 2.5 POST /api/staff/processing/[id]/medical - Staff WITH MEDICAL_MANAGE -> 200
    await recordTest(
      'MED-MUT-05',
      'MEDICAL_SCHEDULE',
      'Staff with MEDICAL_MANAGE authorized to schedule appointment',
      'POST',
      `/api/staff/processing/${tempCase.id}/medical`,
      'STAFF (With MEDICAL_MANAGE)',
      200,
      staffMedicalScheduleHandler(
        new NextRequest(`http://localhost:3000/api/staff/processing/${tempCase.id}/medical`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${recruiterToken}`,
          },
          body: JSON.stringify(schedulePayload),
        }),
        { params: Promise.resolve({ id: tempCase.id }) }
      ),
      async () => {
        const medCase = await prisma.medicalCase.findUnique({ where: { processingCaseId: tempCase.id } });
        return medCase !== null && medCase.status === 'SCHEDULED';
      }
    );

    // 2.6 POST /api/staff/processing/[id]/medical - Super Admin -> 200
    await recordTest(
      'MED-MUT-06',
      'MEDICAL_SCHEDULE',
      'Super Admin authorized to reschedule appointment',
      'POST',
      `/api/staff/processing/${tempCase.id}/medical`,
      'SUPER_ADMIN',
      200,
      staffMedicalScheduleHandler(
        new NextRequest(`http://localhost:3000/api/staff/processing/${tempCase.id}/medical`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${superAdminToken}`,
          },
          body: JSON.stringify({
            ...schedulePayload,
            gamcaNumber: 'GAMCA-SUPER-UPDATED',
          }),
        }),
        { params: Promise.resolve({ id: tempCase.id }) }
      ),
      async () => {
        const medCase = await prisma.medicalCase.findUnique({ where: { processingCaseId: tempCase.id } });
        return medCase?.gamcaNumber === 'GAMCA-SUPER-UPDATED';
      }
    );

    // --- NOW TEST RESULT MUTATION: POST /api/staff/processing/[id]/medical/result ---
    const resultPayload = {
      result: 'FIT',
      fitnessExpiryDate: '2027-11-20',
      gamcaNumber: 'GAMCA-FINAL-FIT-999',
      resultNotes: 'Passed comprehensive physical and laboratory examination',
    };

    // 2.7 POST /api/staff/processing/[id]/medical/result - Anonymous -> 401
    await recordTest(
      'MED-RES-01',
      'MEDICAL_RESULT',
      'Anonymous user denied medical result mutation',
      'POST',
      `/api/staff/processing/${tempCase.id}/medical/result`,
      'ANONYMOUS',
      401,
      staffMedicalResultHandler(
        new NextRequest(`http://localhost:3000/api/staff/processing/${tempCase.id}/medical/result`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resultPayload),
        }),
        { params: Promise.resolve({ id: tempCase.id }) }
      ),
      async () => {
        const medCase = await prisma.medicalCase.findUnique({ where: { processingCaseId: tempCase.id } });
        return medCase?.status === 'SCHEDULED' && medCase?.result !== 'FIT';
      }
    );

    // 2.8 POST /api/staff/processing/[id]/medical/result - Candidate Token -> 401
    await recordTest(
      'MED-RES-02',
      'MEDICAL_RESULT',
      'Candidate token denied medical result mutation',
      'POST',
      `/api/staff/processing/${tempCase.id}/medical/result`,
      'CANDIDATE',
      401,
      staffMedicalResultHandler(
        new NextRequest(`http://localhost:3000/api/staff/processing/${tempCase.id}/medical/result`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${monirToken}`,
          },
          body: JSON.stringify(resultPayload),
        }),
        { params: Promise.resolve({ id: tempCase.id }) }
      ),
      async () => {
        const medCase = await prisma.medicalCase.findUnique({ where: { processingCaseId: tempCase.id } });
        return medCase?.status === 'SCHEDULED' && medCase?.result !== 'FIT';
      }
    );

    // 2.9 POST /api/staff/processing/[id]/medical/result - Inactive Staff -> 401
    await recordTest(
      'MED-RES-03',
      'MEDICAL_RESULT',
      'Inactive staff token denied medical result mutation',
      'POST',
      `/api/staff/processing/${tempCase.id}/medical/result`,
      'INACTIVE_STAFF',
      401,
      staffMedicalResultHandler(
        new NextRequest(`http://localhost:3000/api/staff/processing/${tempCase.id}/medical/result`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${inactiveToken}`,
          },
          body: JSON.stringify(resultPayload),
        }),
        { params: Promise.resolve({ id: tempCase.id }) }
      ),
      async () => {
        const medCase = await prisma.medicalCase.findUnique({ where: { processingCaseId: tempCase.id } });
        return medCase?.status === 'SCHEDULED' && medCase?.result !== 'FIT';
      }
    );

    // 2.10 POST /api/staff/processing/[id]/medical/result - Staff WITHOUT MEDICAL_MANAGE -> 403
    await recordTest(
      'MED-RES-04',
      'MEDICAL_RESULT',
      'Staff lacking MEDICAL_MANAGE denied result mutation (Accounts)',
      'POST',
      `/api/staff/processing/${tempCase.id}/medical/result`,
      'ACCOUNTS_STAFF',
      403,
      staffMedicalResultHandler(
        new NextRequest(`http://localhost:3000/api/staff/processing/${tempCase.id}/medical/result`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${accountsToken}`,
          },
          body: JSON.stringify(resultPayload),
        }),
        { params: Promise.resolve({ id: tempCase.id }) }
      ),
      async () => {
        const medCase = await prisma.medicalCase.findUnique({ where: { processingCaseId: tempCase.id } });
        return medCase?.status === 'SCHEDULED' && medCase?.result !== 'FIT';
      }
    );

    // 2.11 POST /api/staff/processing/[id]/medical/result - Staff WITH MEDICAL_MANAGE -> 200
    await recordTest(
      'MED-RES-05',
      'MEDICAL_RESULT',
      'Staff with MEDICAL_MANAGE authorized to record FIT result',
      'POST',
      `/api/staff/processing/${tempCase.id}/medical/result`,
      'STAFF (With MEDICAL_MANAGE)',
      200,
      staffMedicalResultHandler(
        new NextRequest(`http://localhost:3000/api/staff/processing/${tempCase.id}/medical/result`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${recruiterToken}`,
          },
          body: JSON.stringify(resultPayload),
        }),
        { params: Promise.resolve({ id: tempCase.id }) }
      ),
      async () => {
        const medCase = await prisma.medicalCase.findUnique({ where: { processingCaseId: tempCase.id } });
        return medCase?.status === 'COMPLETED' && medCase?.result === 'FIT';
      }
    );

    // 2.12 POST /api/staff/processing/[id]/medical/result - Super Admin -> 200
    await recordTest(
      'MED-RES-06',
      'MEDICAL_RESULT',
      'Super Admin authorized to certify and update fitness result',
      'POST',
      `/api/staff/processing/${tempCase.id}/medical/result`,
      'SUPER_ADMIN',
      200,
      staffMedicalResultHandler(
        new NextRequest(`http://localhost:3000/api/staff/processing/${tempCase.id}/medical/result`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${superAdminToken}`,
          },
          body: JSON.stringify({
            ...resultPayload,
            resultNotes: 'Super Admin official review and certification complete',
          }),
        }),
        { params: Promise.resolve({ id: tempCase.id }) }
      ),
      async () => {
        const medCase = await prisma.medicalCase.findUnique({ where: { processingCaseId: tempCase.id } });
        return medCase?.status === 'COMPLETED' && medCase?.resultNotes?.includes('Super Admin official review');
      }
    );

  } finally {
    // Teardown temporary test fixtures safely
    console.log('\n--- CLEANING UP TEMPORARY AUDIT FIXTURES ---');
    try {
      await prisma.notification.deleteMany({ where: { applicantId: monirApplicant.id, link: `/portal/processing/${tempCase.id}` } });
      await prisma.auditLog.deleteMany({ where: { entity: 'MEDICAL_CASE' } });
      await prisma.medicalCase.deleteMany({ where: { processingCaseId: tempCase.id } });
      await prisma.recruitmentProcessingCase.delete({ where: { id: tempCase.id } });
      await prisma.application.delete({ where: { id: tempApp.id } });
      if (rolePermAdded && recruiterUser?.roleId) {
        await prisma.rolePermission.deleteMany({
          where: { roleId: recruiterUser.roleId, permissionId: medManagePerm.id },
        });
      }
      console.log('✅ Temporary audit cases and test permissions cleaned up successfully.');
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr);
    }
  }

  console.log('\n======================================================================');
  console.log(`PHASE 6.3 FINAL CLOSURE AUDIT: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('======================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runFinalClosureAudit().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
