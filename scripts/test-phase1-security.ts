import prisma from '../src/lib/prisma';
import { createPortalToken, hashApplicantPassword } from '../src/lib/portal-auth';
import { createSessionToken } from '../src/lib/auth';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
    if (detail) console.log(`     ℹ️ ${detail}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName}`);
    if (detail) console.error(`     ⚠️ ${detail}`);
  }
}

async function runSecuritySuite() {
  console.log('\n======================================================================');
  console.log('🔒 SHAKIL GLOBAL RECRUITMENT V2.0 — PHASE 1 SECURITY & AUTH AUDIT');
  console.log('======================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // MODULE 1: Edge Middleware Route Protection & Cross-Portal Isolation
    // -------------------------------------------------------------------------
    console.log('👉 MODULE 1: Edge Middleware Route Protection & Cross-Portal Isolation');

    // 1.1 Unauthenticated -> /admin/dashboard redirects to /admin/login
    const unauthAdminRes = await fetch(`${BASE_URL}/admin/dashboard`, { redirect: 'manual' });
    const adminLocation = unauthAdminRes.headers.get('location') || '';
    assert(
      (unauthAdminRes.status === 307 || unauthAdminRes.status === 302) && adminLocation.includes('/admin/login'),
      'Unauthenticated request to /admin/dashboard redirects to /admin/login',
      `Status: ${unauthAdminRes.status}, Redirect: ${adminLocation}`
    );

    // 1.2 Unauthenticated -> /staff/dashboard redirects to /staff/login
    const unauthStaffRes = await fetch(`${BASE_URL}/staff/dashboard`, { redirect: 'manual' });
    const staffLocation = unauthStaffRes.headers.get('location') || '';
    assert(
      (unauthStaffRes.status === 307 || unauthStaffRes.status === 302) && staffLocation.includes('/staff/login'),
      'Unauthenticated request to /staff/dashboard redirects to /staff/login',
      `Status: ${unauthStaffRes.status}, Redirect: ${staffLocation}`
    );

    // 1.3 Unauthenticated -> /portal/profile redirects to /portal/login
    const unauthPortalRes = await fetch(`${BASE_URL}/portal/profile`, { redirect: 'manual' });
    const portalLocation = unauthPortalRes.headers.get('location') || '';
    assert(
      (unauthPortalRes.status === 307 || unauthPortalRes.status === 302) && portalLocation.includes('/portal/login'),
      'Unauthenticated request to /portal/profile redirects to /portal/login',
      `Status: ${unauthPortalRes.status}, Redirect: ${portalLocation}`
    );

    // 1.4 Non-admin staff token -> /admin/dashboard redirects to /staff/dashboard
    const recruiterUser = await prisma.user.findFirst({
      where: { email: 'recruiter@shakilglobal.com' },
      include: { role: true },
    });
    const recruiterToken = await createSessionToken({
      userId: recruiterUser?.id || 'fake-recruiter',
      email: recruiterUser?.email || 'recruiter@shakilglobal.com',
      role: recruiterUser?.role?.name || 'RECRUITMENT_STAFF',
    });

    const recruiterAdminRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Cookie: `sgr_session=${recruiterToken}` },
      redirect: 'manual',
    });
    const recruiterAdminLoc = recruiterAdminRes.headers.get('location') || '';
    assert(
      (recruiterAdminRes.status === 307 || recruiterAdminRes.status === 302) &&
      recruiterAdminLoc.includes('/staff/dashboard') &&
      recruiterAdminLoc.includes('unauthorized_admin_access'),
      'Non-admin Staff accessing /admin/dashboard is strictly denied and redirected to /staff/dashboard',
      `Status: ${recruiterAdminRes.status}, Location: ${recruiterAdminLoc}`
    );

    // 1.5 Candidate token -> /admin/dashboard redirects to /admin/login
    const fakeCandidateToken = await createPortalToken({
      applicantId: 'fake-applicant-1',
      applicantNumber: 'SGR-2026-FAKE01',
      phone: '01700000000',
      email: 'candidate@fake.com',
      fullName: 'Fake Candidate',
    });

    const candidateAdminRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Cookie: `sgr_portal_session=${fakeCandidateToken}` },
      redirect: 'manual',
    });
    const candidateAdminLoc = candidateAdminRes.headers.get('location') || '';
    assert(
      (candidateAdminRes.status === 307 || candidateAdminRes.status === 302) &&
      candidateAdminLoc.includes('/admin/login'),
      'Candidate session attempting /admin/dashboard is strictly denied and redirected to /admin/login',
      `Status: ${candidateAdminRes.status}, Location: ${candidateAdminLoc}`
    );

    // 1.6 Candidate token -> /staff/dashboard redirects to /staff/login
    const candidateStaffRes = await fetch(`${BASE_URL}/staff/dashboard`, {
      headers: { Cookie: `sgr_portal_session=${fakeCandidateToken}` },
      redirect: 'manual',
    });
    const candidateStaffLoc = candidateStaffRes.headers.get('location') || '';
    assert(
      (candidateStaffRes.status === 307 || candidateStaffRes.status === 302) &&
      candidateStaffLoc.includes('/staff/login'),
      'Candidate session attempting /staff/dashboard is strictly denied and redirected to /staff/login',
      `Status: ${candidateStaffRes.status}, Location: ${candidateStaffLoc}`
    );

    // 1.7 Staff token -> /portal/profile redirects to /portal/login (staff cookie invalid for candidate portal)
    const staffPortalRes = await fetch(`${BASE_URL}/portal/profile`, {
      headers: { Cookie: `sgr_session=${recruiterToken}` },
      redirect: 'manual',
    });
    const staffPortalLoc = staffPortalRes.headers.get('location') || '';
    assert(
      (staffPortalRes.status === 307 || staffPortalRes.status === 302) &&
      staffPortalLoc.includes('/portal/login'),
      'Staff session without candidate session visiting /portal/profile redirects to /portal/login',
      `Status: ${staffPortalRes.status}, Location: ${staffPortalLoc}`
    );

    // 1.8 Super Admin session -> /admin/dashboard allows access
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@shakilglobal.com' },
      include: { role: true },
    });
    const adminToken = await createSessionToken({
      userId: adminUser?.id || 'admin-id',
      email: adminUser?.email || 'admin@shakilglobal.com',
      role: adminUser?.role?.name || 'SUPER_ADMIN',
    });

    const superAdminRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Cookie: `sgr_session=${adminToken}` },
      redirect: 'manual',
    });
    assert(
      superAdminRes.status === 200,
      'Super Admin session visiting /admin/dashboard is allowed access (HTTP 200)',
      `Status: ${superAdminRes.status}`
    );

    // -------------------------------------------------------------------------
    // MODULE 2: Login Hardening, Anti-Account-Enumeration & Portal Isolation
    // -------------------------------------------------------------------------
    console.log('\n👉 MODULE 2: Login Hardening, Anti-Account-Enumeration & Portal Isolation');

    // 2.1 Staff login with portalType: 'ADMIN' rejects non-admin staff
    const staffAdminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'recruiter@shakilglobal.com',
        password: 'Staff@SGR2026!',
        portalType: 'ADMIN',
      }),
    });
    const staffAdminLoginData = await staffAdminLoginRes.json();
    assert(
      staffAdminLoginRes.status === 403 && staffAdminLoginData.success === false,
      "Admin login route rejects non-admin staff with HTTP 403 when portalType: 'ADMIN'",
      `Status: ${staffAdminLoginRes.status}, Error: ${staffAdminLoginData.error}`
    );

    // 2.2 Staff login with portalType: 'ADMIN' succeeds for Super Admin
    const superAdminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@shakilglobal.com',
        password: 'Admin@SGR2026!',
        portalType: 'ADMIN',
      }),
    });
    const superAdminLoginData = await superAdminLoginRes.json();
    assert(
      superAdminLoginRes.status === 200 && superAdminLoginData.success === true,
      "Admin login route succeeds for Super Admin with portalType: 'ADMIN'",
      `Status: ${superAdminLoginRes.status}, User: ${superAdminLoginData.data?.name}`
    );

    // 2.3 Anti-Account-Enumeration on Staff Login
    const staffBadEmailRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent_user_xyz@shakilglobal.com',
        password: 'SomeRandomPassword123!',
      }),
    });
    const staffBadEmailData = await staffBadEmailRes.json();

    const staffBadPasswordRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@shakilglobal.com',
        password: 'DefinitivelyWrongPassword999!',
      }),
    });
    const staffBadPasswordData = await staffBadPasswordRes.json();

    assert(
      staffBadEmailRes.status === 401 &&
      staffBadPasswordRes.status === 401 &&
      staffBadEmailData.error === staffBadPasswordData.error,
      'Staff login returns identical generic error for unknown email vs wrong password (Anti-Enumeration)',
      `Both returned HTTP 401 with: "${staffBadEmailData.error}"`
    );

    // 2.4 Anti-Account-Enumeration on Candidate Login
    const candBadIdentifierRes = await fetch(`${BASE_URL}/api/portal/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '01999999999',
        password: 'RandomPassword123!',
      }),
    });
    const candBadIdentifierData = await candBadIdentifierRes.json();

    // Create a known candidate for wrong password test
    const testCandidatePhone = `01799${String(Date.now()).slice(-6)}`;
    const passHash = await hashApplicantPassword('CorrectPassword123!');
    const knownCandidate = await prisma.applicant.create({
      data: {
        applicantNumber: `SGR-2026-${String(Date.now()).slice(-6)}`,
        fullName: 'Test Candidate Enum Defense',
        phone: testCandidatePhone,
        email: `enum_defense_${Date.now()}@test.com`,
        passwordHash: passHash,
        candidateType: 'SKILLED',
        isActive: true,
      },
    });

    const candBadPasswordRes = await fetch(`${BASE_URL}/api/portal/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testCandidatePhone,
        password: 'IncorrectPassword999!',
      }),
    });
    const candBadPasswordData = await candBadPasswordRes.json();

    assert(
      candBadIdentifierRes.status === 401 &&
      candBadPasswordRes.status === 401 &&
      candBadIdentifierData.error === candBadPasswordData.error,
      'Candidate login returns identical generic error for unknown account vs wrong password (Anti-Enumeration)',
      `Both returned HTTP 401 with: "${candBadIdentifierData.error}"`
    );

    // -------------------------------------------------------------------------
    // MODULE 3: Candidate IDOR & Resource Ownership Defense
    // -------------------------------------------------------------------------
    console.log('\n👉 MODULE 3: Candidate IDOR & Resource Ownership Defense');

    // Setup Candidate A and Candidate B
    const candidateAPhone = `01811${String(Date.now()).slice(-6)}`;
    const candidateBPhone = `01822${String(Date.now() + 1).slice(-6)}`;

    const candidateA = await prisma.applicant.create({
      data: {
        applicantNumber: `SGR-2026-${String(Date.now()).slice(-6)}`,
        fullName: 'Candidate Alpha (Security Test)',
        phone: candidateAPhone,
        email: `cand_a_${Date.now()}@test.com`,
        passwordHash: passHash,
        candidateType: 'SKILLED',
        isActive: true,
      },
    });

    const candidateB = await prisma.applicant.create({
      data: {
        applicantNumber: `SGR-2026-${String(Date.now() + 2).slice(-6)}`,
        fullName: 'Candidate Beta (Security Test)',
        phone: candidateBPhone,
        email: `cand_b_${Date.now()}@test.com`,
        passwordHash: passHash,
        candidateType: 'SKILLED',
        isActive: true,
      },
    });

    const tokenA = await createPortalToken({
      applicantId: candidateA.id,
      applicantNumber: candidateA.applicantNumber,
      phone: candidateA.phone,
      email: candidateA.email,
      fullName: candidateA.fullName,
    });

    const tokenB = await createPortalToken({
      applicantId: candidateB.id,
      applicantNumber: candidateB.applicantNumber,
      phone: candidateB.phone,
      email: candidateB.email,
      fullName: candidateB.fullName,
    });

    // Create a document belonging to Candidate B
    const docType = await prisma.documentType.findFirst();
    const docB = await prisma.document.create({
      data: {
        applicantId: candidateB.id,
        documentTypeId: docType?.id || 'fake-doc-type',
        fileName: 'confidential_passport_b.pdf',
        filePath: `documents/${candidateB.id}/confidential_passport_b.pdf`,
        fileSize: 1024,
        mimeType: 'application/pdf',
        status: 'PENDING',
      },
    });

    // 3.1 Candidate A attempts to read Candidate B's document
    const idorReadDocRes = await fetch(`${BASE_URL}/api/portal/documents/${docB.id}`, {
      headers: { Cookie: `sgr_portal_session=${tokenA}` },
    });
    assert(
      idorReadDocRes.status === 403,
      "Candidate A is forbidden (HTTP 403) from reading Candidate B's document (IDOR Defense)",
      `Status: ${idorReadDocRes.status}`
    );

    // 3.2 Candidate A attempts to replace Candidate B's document
    const idorUpdateDocRes = await fetch(`${BASE_URL}/api/portal/documents/${docB.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_portal_session=${tokenA}`,
      },
      body: JSON.stringify({ fileName: 'malicious_overwrite.pdf' }),
    });
    assert(
      idorUpdateDocRes.status === 403,
      "Candidate A is forbidden (HTTP 403) from replacing Candidate B's document (IDOR Defense)",
      `Status: ${idorUpdateDocRes.status}`
    );

    // 3.3 Candidate A attempts to delete Candidate B's document
    const idorDeleteDocRes = await fetch(`${BASE_URL}/api/portal/documents/${docB.id}`, {
      method: 'DELETE',
      headers: { Cookie: `sgr_portal_session=${tokenA}` },
    });
    assert(
      idorDeleteDocRes.status === 403,
      "Candidate A is forbidden (HTTP 403) from deleting Candidate B's document (IDOR Defense)",
      `Status: ${idorDeleteDocRes.status}`
    );

    // 3.4 Support Ticket IDOR: Create ticket for Candidate B
    const ticketB = await prisma.supportTicket.create({
      data: {
        ticketNumber: `SGR-TCK-2026-${String(Date.now()).slice(-6)}`,
        applicantId: candidateB.id,
        category: 'FINANCE',
        priority: 'HIGH',
        subject: 'Confidential billing issue for B',
        status: 'OPEN',
      },
    });

    // Candidate A attempts to view Candidate B's ticket
    const idorTicketReadRes = await fetch(`${BASE_URL}/api/support/tickets/${ticketB.id}`, {
      headers: { Cookie: `sgr_portal_session=${tokenA}` },
    });
    assert(
      idorTicketReadRes.status === 403,
      "Candidate A is forbidden (HTTP 403) from accessing Candidate B's support ticket (IDOR Defense)",
      `Status: ${idorTicketReadRes.status}`
    );

    // 3.5 Candidate A attempts to patch Candidate B's ticket
    const idorTicketPatchRes = await fetch(`${BASE_URL}/api/support/tickets/${ticketB.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_portal_session=${tokenA}`,
      },
      body: JSON.stringify({ status: 'CLOSED' }),
    });
    assert(
      idorTicketPatchRes.status === 403,
      "Candidate A is forbidden (HTTP 403) from modifying Candidate B's support ticket (IDOR Defense)",
      `Status: ${idorTicketPatchRes.status}`
    );

    // 3.6 Application IDOR: Create application for Candidate B
    const job = await prisma.job.findFirst({ where: { status: 'PUBLISHED' } });
    const appB = await prisma.application.create({
      data: {
        applicationCode: `SGR-APP-2026-${String(Date.now()).slice(-6)}`,
        applicantId: candidateB.id,
        jobId: job?.id || 'fake-job',
        status: 'SUBMITTED',
      },
    });

    const idorAppReadRes = await fetch(`${BASE_URL}/api/portal/applications/${appB.id}`, {
      headers: { Cookie: `sgr_portal_session=${tokenA}` },
    });
    assert(
      idorAppReadRes.status === 404 || idorAppReadRes.status === 403,
      "Candidate A cannot view Candidate B's application details (IDOR Defense)",
      `Status: ${idorAppReadRes.status}`
    );

    // 3.7 Private document download: Unauthenticated access rejected
    const unauthDownloadRes = await fetch(`${BASE_URL}/api/documents/${docB.id}/download`);
    assert(
      unauthDownloadRes.status === 403 || unauthDownloadRes.status === 401,
      'Unauthenticated request to /api/documents/[id]/download is denied (HTTP 403)',
      `Status: ${unauthDownloadRes.status}`
    );

    // 3.8 Private document download: Candidate A downloading Candidate B's document rejected
    const candADownloadCandBRes = await fetch(`${BASE_URL}/api/documents/${docB.id}/download`, {
      headers: { Cookie: `sgr_portal_session=${tokenA}` },
    });
    assert(
      candADownloadCandBRes.status === 403,
      "Candidate A is forbidden (HTTP 403) from downloading Candidate B's document",
      `Status: ${candADownloadCandBRes.status}`
    );

    // -------------------------------------------------------------------------
    // MODULE 4: Finance Security Defense
    // -------------------------------------------------------------------------
    console.log('\n👉 MODULE 4: Finance Security Defense');

    // 4.1 Candidate session calling Staff invoice management GET /api/invoices -> denied
    const candStaffInvoicesRes = await fetch(`${BASE_URL}/api/invoices`, {
      headers: { Cookie: `sgr_portal_session=${tokenA}` },
    });
    assert(
      candStaffInvoicesRes.status === 403 || candStaffInvoicesRes.status === 401,
      'Candidate session calling staff invoice management GET /api/invoices is denied (HTTP 403)',
      `Status: ${candStaffInvoicesRes.status}`
    );

    // 4.2 Candidate session calling Staff invoice creation POST /api/invoices -> denied
    const candCreateInvoiceRes = await fetch(`${BASE_URL}/api/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_portal_session=${tokenA}`,
      },
      body: JSON.stringify({
        customerId: 'fake-customer',
        applicantId: candidateA.id,
        items: [{ description: 'Unauthorized service', unitPrice: 50000, quantity: 1 }],
      }),
    });
    assert(
      candCreateInvoiceRes.status === 403 || candCreateInvoiceRes.status === 401,
      'Candidate session calling staff invoice creation POST /api/invoices is denied (HTTP 403)',
      `Status: ${candCreateInvoiceRes.status}`
    );

    // 4.3 Candidate session calling Staff payment management GET /api/payments -> denied
    const candStaffPaymentsRes = await fetch(`${BASE_URL}/api/payments`, {
      headers: { Cookie: `sgr_portal_session=${tokenA}` },
    });
    assert(
      candStaffPaymentsRes.status === 403 || candStaffPaymentsRes.status === 401,
      'Candidate session calling staff payment management GET /api/payments is denied (HTTP 403)',
      `Status: ${candStaffPaymentsRes.status}`
    );

    // -------------------------------------------------------------------------
    // MODULE 5: Training Bridge & Public Certificate Security
    // -------------------------------------------------------------------------
    console.log('\n👉 MODULE 5: Training Bridge & Public Certificate Security');

    const course = await prisma.trainingCourse.findFirst();
    const center = await prisma.trainingCenter.findFirst();

    // 5.1 Unauthenticated request to complete bridge is rejected
    const unauthBridgeRes = await fetch(`${BASE_URL}/api/training/complete-bridge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicantId: candidateA.id, courseId: course?.id }),
    });
    assert(
      unauthBridgeRes.status === 401,
      'Unauthenticated request to complete training bridge is rejected (HTTP 401)',
      `Status: ${unauthBridgeRes.status}`
    );

    // 5.2 Candidate session calling complete bridge is rejected
    const candBridgeRes = await fetch(`${BASE_URL}/api/training/complete-bridge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_portal_session=${tokenA}`,
      },
      body: JSON.stringify({ applicantId: candidateA.id, courseId: course?.id }),
    });
    assert(
      candBridgeRes.status === 401 || candBridgeRes.status === 403,
      'Candidate session calling training bridge is denied (HTTP 401/403)',
      `Status: ${candBridgeRes.status}`
    );

    // 5.3 Staff without TRAINING_CERTIFICATE_ISSUE permission calling bridge is rejected
    const viewerUser = await prisma.user.findFirst({
      where: { email: 'viewer@shakilglobal.com' },
      include: { role: true },
    });
    const viewerToken = await createSessionToken({
      userId: viewerUser?.id || 'viewer-id',
      email: viewerUser?.email || 'viewer@shakilglobal.com',
      role: viewerUser?.role?.name || 'VIEWER',
    });

    const unauthorizedStaffBridgeRes = await fetch(`${BASE_URL}/api/training/complete-bridge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_session=${viewerToken}`,
      },
      body: JSON.stringify({ applicantId: candidateA.id, courseId: course?.id }),
    });
    assert(
      unauthorizedStaffBridgeRes.status === 403,
      'Staff without TRAINING_CERTIFICATE_ISSUE permission calling bridge is denied (HTTP 403)',
      `Status: ${unauthorizedStaffBridgeRes.status}`
    );

    // 5.4 Super Admin calling complete bridge succeeds atomically
    const superAdminBridgeRes = await fetch(`${BASE_URL}/api/training/complete-bridge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_session=${adminToken}`,
      },
      body: JSON.stringify({
        applicantId: candidateA.id,
        courseId: course?.id,
        centerId: center?.id,
        grade: 'A+',
        scorePercentage: 92,
      }),
    });
    const superAdminBridgeData = await superAdminBridgeRes.json();
    assert(
      superAdminBridgeRes.status === 201 && superAdminBridgeData.success === true,
      'Super Admin calling complete bridge succeeds atomically (HTTP 201)',
      `Certificate: ${superAdminBridgeData.data?.certificate?.certificateNumber}`
    );

    // 5.5 Duplicate bridge execution on same course/applicant is rejected with 409 (Idempotency)
    const duplicateBridgeRes = await fetch(`${BASE_URL}/api/training/complete-bridge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_session=${adminToken}`,
      },
      body: JSON.stringify({
        applicantId: candidateA.id,
        courseId: course?.id,
        centerId: center?.id,
      }),
    });
    assert(
      duplicateBridgeRes.status === 409,
      'Duplicate bridge execution on same course/applicant is rejected (HTTP 409 Idempotency)',
      `Status: ${duplicateBridgeRes.status}`
    );

    // 5.6 Public Certificate Verification: Valid certificate returns verified status
    const certNum = superAdminBridgeData.data?.certificate?.certificateNumber;
    const certVerifyRes = await fetch(`${BASE_URL}/api/certificates/verify/${certNum}`);
    const certVerifyData = await certVerifyRes.json();
    assert(
      certVerifyRes.status === 200 && certVerifyData.isAuthentic === true,
      'Public certificate verification endpoint returns authentic status (HTTP 200)',
      `Candidate: ${certVerifyData.data?.candidateName}, Course: ${certVerifyData.data?.courseTitle}`
    );

    // 5.7 Public Certificate Verification: Data Minimization (no passport, NID, phone leakage)
    const rawCertData = JSON.stringify(certVerifyData.data);
    const leaksSensitiveData =
      rawCertData.includes('password') ||
      rawCertData.includes(candidateAPhone) ||
      rawCertData.includes('passportNumber') ||
      rawCertData.includes('nidNumber');

    assert(
      !leaksSensitiveData,
      'Public certificate verification strictly maintains data minimization (zero passport/NID/phone leakage)',
      'Clean public disclosure verified'
    );

    // 5.8 Non-existent certificate verification returns 404
    const fakeCertRes = await fetch(`${BASE_URL}/api/certificates/verify/SGR-FAKE-000000`);
    assert(
      fakeCertRes.status === 404,
      'Public certificate verification rejects non-existent certificate with HTTP 404',
      `Status: ${fakeCertRes.status}`
    );

    // -------------------------------------------------------------------------
    // MODULE 6: Security Headers & Cookie Flags
    // -------------------------------------------------------------------------
    console.log('\n👉 MODULE 6: Security Headers & Cookie Flags');

    const headersRes = await fetch(`${BASE_URL}/`);
    const hContentType = headersRes.headers.get('x-content-type-options');
    const hFrameOptions = headersRes.headers.get('x-frame-options');
    const hHsts = headersRes.headers.get('strict-transport-security');
    const hCsp = headersRes.headers.get('content-security-policy');

    assert(
      hContentType === 'nosniff',
      'HTTP response includes X-Content-Type-Options: nosniff',
      `Value: ${hContentType}`
    );

    assert(
      hFrameOptions === 'DENY',
      'HTTP response includes X-Frame-Options: DENY',
      `Value: ${hFrameOptions}`
    );

    assert(
      !!hHsts && hHsts.includes('max-age'),
      'HTTP response includes Strict-Transport-Security (HSTS)',
      `Value: ${hHsts}`
    );

    assert(
      !!hCsp && hCsp.includes("default-src 'self'"),
      'HTTP response includes Content-Security-Policy (CSP)',
      `CSP Present: ${!!hCsp}`
    );

    // 6.5 Cookie Security: Verify HttpOnly & SameSite=lax on login responses
    const cookieHeader = staffAdminLoginRes.headers.get('set-cookie') || superAdminLoginRes.headers.get('set-cookie') || '';
    assert(
      cookieHeader.includes('HttpOnly') && cookieHeader.toLowerCase().includes('samesite=lax'),
      'Authentication session cookies enforce HttpOnly and SameSite=lax',
      `Cookie directives: ${cookieHeader.split(';').slice(1).join(';')}`
    );

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n======================================================================');
    console.log(`📊 PHASE 1 SECURITY AUDIT: ${passedTests} PASSED | ${failedTests} FAILED (TOTAL: ${totalTests})`);
    console.log('======================================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Fatal error during security audit:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSecuritySuite();
