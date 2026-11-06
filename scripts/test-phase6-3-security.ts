import { NextRequest } from 'next/server';
import { GET as documentDownloadHandler } from '../src/app/api/documents/[id]/download/route';
import { GET as staffMedicalHandler } from '../src/app/api/staff/processing/[id]/medical/route';
import { POST as documentVerifyHandler } from '../src/app/api/documents/[id]/verify/route';
import { createSessionToken } from '../src/lib/auth';
import { createPortalToken } from '../src/lib/portal-auth';
import prisma from '../src/lib/prisma';
import { SignJWT } from 'jose';

interface TestResult {
  testId: string;
  scenario: string;
  method: string;
  endpoint: string;
  role: string;
  permissions: string;
  expectedStatus: number;
  actualStatus: number;
  responseSnippet: string;
  dbMutation: boolean;
  status: 'PASS' | 'FAIL';
}

async function runDirectSecurityTests() {
  console.log('======================================================================');
  console.log('🔒 SHAKILWORK: DIRECT ROUTE HANDLER HTTP API SECURITY AUDIT (PHASE 6.3)');
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

  const monirDoc = (await prisma.document.findFirst({
    where: {
      applicantId: monirApplicant?.id,
      filePath: { startsWith: 'data:' },
    },
  })) || (await prisma.document.findFirst({
    where: { applicantId: monirApplicant?.id },
  }));

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

  // Check or setup a processing case for medical testing
  let tempCase = await prisma.recruitmentProcessingCase.findFirst({
    include: { medicalCase: true },
  });

  let createdTempCase = false;
  let tempAppId: string | null = null;

  if (!tempCase && monirApplicant) {
    const job = await prisma.job.findFirst({ where: { status: 'PUBLISHED' } });
    if (job) {
      const app = await prisma.application.create({
        data: {
          applicationCode: `APP-TEST-SEC-${Date.now()}`,
          applicantId: monirApplicant.id,
          jobId: job.id,
          status: 'SELECTED',
        },
      });
      tempAppId = app.id;

      tempCase = await prisma.recruitmentProcessingCase.create({
        data: {
          processingCode: `SGR-PROC-TEST-${Date.now()}`,
          applicationId: app.id,
          applicantId: monirApplicant.id,
          jobId: job.id,
          currentStage: 'MEDICAL_SCHEDULED',
          overallStatus: 'ACTIVE',
        },
        include: { medicalCase: true },
      });

      // Create medicalCase record
      await prisma.medicalCase.create({
        data: {
          processingCaseId: tempCase.id,
          candidateId: monirApplicant.id,
          medicalCenterName: 'Al-Farabi GAMCA Medical',
          appointmentDate: new Date(),
          status: 'SCHEDULED',
        },
      });

      createdTempCase = true;
    }
  }

  const docId = monirDoc!.id;
  const caseId = tempCase ? tempCase.id : 'non-existent-case-uuid';

  // Generate tokens
  const monirToken = await createPortalToken({
    applicantId: monirApplicant!.id,
    applicantNumber: monirApplicant!.applicantNumber,
    phone: monirApplicant!.phone,
    fullName: monirApplicant!.fullName,
  });

  const raisaToken = await createPortalToken({
    applicantId: raisaApplicant!.id,
    applicantNumber: raisaApplicant!.applicantNumber,
    phone: raisaApplicant!.phone,
    fullName: raisaApplicant!.fullName,
  });

  const accountsToken = await createSessionToken({
    userId: accountsUser!.id,
    email: accountsUser!.email,
    role: accountsUser!.role.name,
  });

  const viewerToken = await createSessionToken({
    userId: viewerUser!.id,
    email: viewerUser!.email,
    role: viewerUser!.role.name,
  });

  const recruiterToken = await createSessionToken({
    userId: recruiterUser!.id,
    email: recruiterUser!.email,
    role: recruiterUser!.role.name,
  });

  const adminToken = await createSessionToken({
    userId: adminUser!.id,
    email: adminUser!.email,
    role: adminUser!.role.name,
  });

  // Create an expired JWT token
  const expiredSecret = new TextEncoder().encode(
    process.env.JWT_SECRET || 'sgr_enterprise_secret_key_change_in_production_2026_recruit_auth'
  );
  const expiredToken = await new SignJWT({
    userId: adminUser!.id,
    email: adminUser!.email,
    role: 'SUPER_ADMIN',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
    .sign(expiredSecret);

  // Inactive user token (user whose isActive is false, or synthetic UUID)
  const inactiveToken = await createSessionToken({
    userId: '00000000-0000-0000-0000-000000000000',
    email: 'inactive@shakilglobal.com',
    role: 'RECRUITMENT_STAFF',
  });

  // Helper to record test results
  async function recordTest(
    testId: string,
    scenario: string,
    method: string,
    endpoint: string,
    role: string,
    permissions: string,
    expectedStatus: number,
    resPromise: Promise<Response>,
    dbMutation = false
  ) {
    let actualStatus = 500;
    let snippet = '';
    try {
      const res = await resPromise;
      actualStatus = res.status;
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        snippet = JSON.stringify(json).slice(0, 100);
      } catch {
        snippet = `[Binary/Stream ${text.length} bytes]`;
      }
    } catch (err: any) {
      snippet = `Error: ${err.message}`;
    }

    const isPass = actualStatus === expectedStatus;
    if (isPass) passedCount++;
    else failedCount++;

    const item: TestResult = {
      testId,
      scenario,
      method,
      endpoint,
      role,
      permissions,
      expectedStatus,
      actualStatus,
      responseSnippet: snippet,
      dbMutation,
      status: isPass ? 'PASS' : 'FAIL',
    };
    results.push(item);

    const mark = isPass ? '✅' : '❌';
    console.log(`${mark} [${testId}] ${scenario}`);
    console.log(`   Endpoint: ${method} ${endpoint}`);
    console.log(`   Identity: Role=${role}, Perms=${permissions}`);
    console.log(`   Status: Expected ${expectedStatus}, Received ${actualStatus}`);
    console.log(`   Response: ${snippet}\n`);
  }

  try {
    // --- SUITE A: Document Download Authorization ---

    // 1. Unauthenticated request to document download
    await recordTest(
      'SEC-01',
      'Unauthenticated request to document download',
      'GET',
      `/api/documents/${docId}/download`,
      'ANONYMOUS',
      'NONE',
      401,
      documentDownloadHandler(
        new NextRequest(`http://localhost:3000/api/documents/${docId}/download`, {
          method: 'GET',
        }),
        { params: Promise.resolve({ id: docId }) }
      )
    );

    // 2. Expired JWT to document download
    await recordTest(
      'SEC-02',
      'Expired JWT token accessing document download',
      'GET',
      `/api/documents/${docId}/download`,
      'EXPIRED_USER',
      'EXPIRED',
      401,
      documentDownloadHandler(
        new NextRequest(`http://localhost:3000/api/documents/${docId}/download`, {
          method: 'GET',
          headers: { authorization: `Bearer ${expiredToken}` },
        }),
        { params: Promise.resolve({ id: docId }) }
      )
    );

    // 3. Inactive staff JWT accessing document download
    await recordTest(
      'SEC-03',
      'Inactive / non-existent staff token accessing document download',
      'GET',
      `/api/documents/${docId}/download`,
      'INACTIVE_STAFF',
      'INACTIVE',
      401,
      documentDownloadHandler(
        new NextRequest(`http://localhost:3000/api/documents/${docId}/download`, {
          method: 'GET',
          headers: { authorization: `Bearer ${inactiveToken}` },
        }),
        { params: Promise.resolve({ id: docId }) }
      )
    );

    // 4. Candidate accessing another candidate's private document
    await recordTest(
      'SEC-04',
      'Candidate accessing another candidate private document',
      'GET',
      `/api/documents/${docId}/download`,
      'CANDIDATE',
      'PORTAL_APPLICANT (Raisa)',
      403,
      documentDownloadHandler(
        new NextRequest(`http://localhost:3000/api/documents/${docId}/download`, {
          method: 'GET',
          headers: { authorization: `Bearer ${raisaToken}` },
        }),
        { params: Promise.resolve({ id: docId }) }
      )
    );

    // 5. Candidate accessing their own document
    await recordTest(
      'SEC-05',
      'Candidate authorized download of their own document',
      'GET',
      `/api/documents/${docId}/download`,
      'CANDIDATE',
      'PORTAL_APPLICANT (Monir Owner)',
      200,
      documentDownloadHandler(
        new NextRequest(`http://localhost:3000/api/documents/${docId}/download`, {
          method: 'GET',
          headers: { authorization: `Bearer ${monirToken}` },
        }),
        { params: Promise.resolve({ id: docId }) }
      )
    );

    // 6. Staff without DOCUMENT_VIEW (Accounts Staff)
    await recordTest(
      'SEC-06',
      'Staff lacking DOCUMENT_VIEW denied document download',
      'GET',
      `/api/documents/${docId}/download`,
      'ACCOUNTS_STAFF',
      'NO DOCUMENT_VIEW',
      403,
      documentDownloadHandler(
        new NextRequest(`http://localhost:3000/api/documents/${docId}/download`, {
          method: 'GET',
          headers: { authorization: `Bearer ${accountsToken}` },
        }),
        { params: Promise.resolve({ id: docId }) }
      )
    );

    // 7. Staff with DOCUMENT_VIEW (Viewer Role)
    await recordTest(
      'SEC-07',
      'Staff with DOCUMENT_VIEW granted document download',
      'GET',
      `/api/documents/${docId}/download`,
      'VIEWER',
      'HAS DOCUMENT_VIEW',
      200,
      documentDownloadHandler(
        new NextRequest(`http://localhost:3000/api/documents/${docId}/download`, {
          method: 'GET',
          headers: { authorization: `Bearer ${viewerToken}` },
        }),
        { params: Promise.resolve({ id: docId }) }
      )
    );

    // 8. Super Admin granted document download
    await recordTest(
      'SEC-08',
      'Super Admin authorized document download',
      'GET',
      `/api/documents/${docId}/download`,
      'SUPER_ADMIN',
      'ALL_PERMISSIONS',
      200,
      documentDownloadHandler(
        new NextRequest(`http://localhost:3000/api/documents/${docId}/download`, {
          method: 'GET',
          headers: { authorization: `Bearer ${adminToken}` },
        }),
        { params: Promise.resolve({ id: docId }) }
      )
    );

    // --- SUITE B: Medical API Authorization (Task 2) ---

    // 9. Unauthenticated request to medical API
    await recordTest(
      'SEC-09',
      'Unauthenticated request to staff medical API',
      'GET',
      `/api/staff/processing/${caseId}/medical`,
      'ANONYMOUS',
      'NONE',
      401,
      staffMedicalHandler(
        new NextRequest(`http://localhost:3000/api/staff/processing/${caseId}/medical`, {
          method: 'GET',
        }),
        { params: Promise.resolve({ id: caseId }) }
      )
    );

    // 10. Candidate JWT accessing staff medical API
    await recordTest(
      'SEC-10',
      'Candidate token rejected by staff medical endpoint',
      'GET',
      `/api/staff/processing/${caseId}/medical`,
      'CANDIDATE',
      'PORTAL_SECRET',
      401,
      staffMedicalHandler(
        new NextRequest(`http://localhost:3000/api/staff/processing/${caseId}/medical`, {
          method: 'GET',
          headers: { authorization: `Bearer ${monirToken}` },
        }),
        { params: Promise.resolve({ id: caseId }) }
      )
    );

    // 11. Inactive staff token accessing medical API
    await recordTest(
      'SEC-11',
      'Inactive staff token accessing medical API',
      'GET',
      `/api/staff/processing/${caseId}/medical`,
      'INACTIVE_STAFF',
      'INACTIVE',
      401,
      staffMedicalHandler(
        new NextRequest(`http://localhost:3000/api/staff/processing/${caseId}/medical`, {
          method: 'GET',
          headers: { authorization: `Bearer ${inactiveToken}` },
        }),
        { params: Promise.resolve({ id: caseId }) }
      )
    );

    // 12. Staff without MEDICAL_VIEW (Accounts Staff)
    await recordTest(
      'SEC-12',
      'Staff lacking MEDICAL_VIEW denied medical endpoint',
      'GET',
      `/api/staff/processing/${caseId}/medical`,
      'ACCOUNTS_STAFF',
      'NO MEDICAL_VIEW',
      403,
      staffMedicalHandler(
        new NextRequest(`http://localhost:3000/api/staff/processing/${caseId}/medical`, {
          method: 'GET',
          headers: { authorization: `Bearer ${accountsToken}` },
        }),
        { params: Promise.resolve({ id: caseId }) }
      )
    );

    // 13. Staff without MEDICAL_VIEW (Recruiter)
    await recordTest(
      'SEC-13',
      'Recruiter lacking MEDICAL_VIEW denied medical endpoint',
      'GET',
      `/api/staff/processing/${caseId}/medical`,
      'RECRUITMENT_STAFF',
      'NO MEDICAL_VIEW',
      403,
      staffMedicalHandler(
        new NextRequest(`http://localhost:3000/api/staff/processing/${caseId}/medical`, {
          method: 'GET',
          headers: { authorization: `Bearer ${recruiterToken}` },
        }),
        { params: Promise.resolve({ id: caseId }) }
      )
    );

    // 14. Super Admin authorized on medical API
    await recordTest(
      'SEC-14',
      'Super Admin authorized access to staff medical API',
      'GET',
      `/api/staff/processing/${caseId}/medical`,
      'SUPER_ADMIN',
      'ALL_PERMISSIONS',
      200,
      staffMedicalHandler(
        new NextRequest(`http://localhost:3000/api/staff/processing/${caseId}/medical`, {
          method: 'GET',
          headers: { authorization: `Bearer ${adminToken}` },
        }),
        { params: Promise.resolve({ id: caseId }) }
      )
    );

    // --- SUITE C: Mutation and Cross-Realm Rejection ---

    // 15. Candidate JWT attempting document verify mutation
    await recordTest(
      'SEC-15',
      'Candidate token rejected on staff mutation endpoint',
      'POST',
      `/api/documents/${docId}/verify`,
      'CANDIDATE',
      'PORTAL_SECRET',
      401,
      documentVerifyHandler(
        new NextRequest(`http://localhost:3000/api/documents/${docId}/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${monirToken}`,
          },
          body: JSON.stringify({ status: 'VERIFIED' }),
        }),
        { params: Promise.resolve({ id: docId }) }
      ),
      false
    );

    // 16. Staff lacking DOCUMENT_VERIFY attempting mutation (Viewer)
    await recordTest(
      'SEC-16',
      'Staff lacking DOCUMENT_VERIFY denied mutation',
      'POST',
      `/api/documents/${docId}/verify`,
      'VIEWER',
      'DOCUMENT_VIEW ONLY',
      403,
      documentVerifyHandler(
        new NextRequest(`http://localhost:3000/api/documents/${docId}/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${viewerToken}`,
          },
          body: JSON.stringify({ status: 'VERIFIED' }),
        }),
        { params: Promise.resolve({ id: docId }) }
      ),
      false
    );

    // 17. Super Admin authorized on document verify mutation
    await recordTest(
      'SEC-17',
      'Super Admin authorized on document verify mutation',
      'POST',
      `/api/documents/${docId}/verify`,
      'SUPER_ADMIN',
      'ALL_PERMISSIONS',
      200,
      documentVerifyHandler(
        new NextRequest(`http://localhost:3000/api/documents/${docId}/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ status: 'VERIFIED' }),
        }),
        { params: Promise.resolve({ id: docId }) }
      ),
      true
    );
  } finally {
    // Clean up temporary processing case and application if created
    if (createdTempCase && tempCase) {
      await prisma.medicalCase.deleteMany({ where: { processingCaseId: tempCase.id } });
      await prisma.recruitmentProcessingCase.delete({ where: { id: tempCase.id } });
      if (tempAppId) {
        await prisma.application.delete({ where: { id: tempAppId } });
      }
    }
  }

  console.log('======================================================================');
  console.log(`PHASE 6.3 DIRECT HTTP API AUDIT: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('======================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runDirectSecurityTests()
  .catch((err) => {
    console.error('Fatal error during security tests:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
