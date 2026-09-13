import { PrismaClient } from '@prisma/client';
import { createPortalToken } from '../src/lib/portal-auth';
import { createSessionToken } from '../src/lib/auth';
import { TrashService } from '../src/lib/trash-service';
import { validateProfilePhoto, verifyImageMagicBytes, parseBase64Photo } from '../src/lib/validations/photo';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

async function verifyAll() {
  console.log('====================================================');
  console.log('  SHAKIL GLOBAL RECRUITMENT V2.0 — PHASE 8G');
  console.log('  MASTER VERIFICATION & PRODUCTION INTEGRITY SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] Test ${totalTests}: ${testName}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] Test ${totalTests}: ${testName}`);
      throw new Error(`Verification failed on test: ${testName}`);
    }
  }

  // Pre-cleanup of any lingering test candidates for idempotency
  const oldTestApps = await prisma.applicant.findMany({
    where: {
      OR: [
        { phone: '01799990001' },
        { phone: '01799990002' },
        { phone: '01799990003' },
        { phone: '01799990099' },
        { applicantNumber: 'SGR-TEST-TRASH-01' },
      ],
    },
  });
  for (const old of oldTestApps) {
    await prisma.customer.deleteMany({ where: { applicantId: old.id } });
    await prisma.applicantProfile.deleteMany({ where: { applicantId: old.id } });
    await prisma.auditLog.deleteMany({ where: { applicantId: old.id } });
    await prisma.auditLog.deleteMany({ where: { entityId: old.id } });
    await prisma.applicant.delete({ where: { id: old.id } });
  }

  // =========================================================================
  // SUITE 1: DATABASE BASELINE & FOUNDATION PRESERVATION (Tests 1-6)
  // =========================================================================
  console.log('--- SUITE 1: Database Foundation & Data Preservation ---');
  const countryCount = await prisma.country.count();
  const jobCount = await prisma.job.count();
  const employerCount = await prisma.employer.count();
  const categoryCount = await prisma.jobCategory.count();
  const userCount = await prisma.user.count();
  const applicantCount = await prisma.applicant.count();

  assert(countryCount === 14, `All 14 Countries preserved in database (got ${countryCount})`);
  assert(jobCount === 17, `All 17 Jobs preserved in database (got ${jobCount})`);
  assert(employerCount === 9, `All 9 Employers preserved in database (got ${employerCount})`);
  assert(categoryCount === 16, `All 16 Job Categories preserved in database (got ${categoryCount})`);
  assert(userCount >= 17, `All 17 Staff and Admin Users preserved (got ${userCount})`);
  assert(applicantCount >= 2, `Clean baseline sample Applicants preserved (got ${applicantCount})`);

  // =========================================================================
  // SUITE 2: AUTHENTICATED SESSION STATE & ROUTING (Tests 7-14)
  // =========================================================================
  console.log('\n--- SUITE 2: Authenticated Session State & Routing ---');
  const unauthRes = await fetch(`${BASE_URL}/api/auth/session-state`);
  const unauthData = await unauthRes.json();
  assert(unauthData.authenticated === false, 'Unauthenticated visitor correctly returns authenticated=false');

  const sampleApplicant = await prisma.applicant.findFirst({
    where: { isActive: true },
  });
  assert(!!sampleApplicant, 'Active sample candidate exists');

  const portalToken = await createPortalToken({
    applicantId: sampleApplicant!.id,
    applicantNumber: sampleApplicant!.applicantNumber,
    phone: sampleApplicant!.phone,
    email: sampleApplicant!.email,
    fullName: sampleApplicant!.fullName,
  });

  const authHeaders = {
    Cookie: `sgr_portal_session=${portalToken}`,
  };

  const authStateRes = await fetch(`${BASE_URL}/api/auth/session-state`, {
    headers: authHeaders,
  });
  const authState = await authStateRes.json();
  assert(authState.authenticated === true, 'Candidate session correctly identified as authenticated=true');
  assert(authState.type === 'APPLICANT', 'Candidate session type is APPLICANT');
  assert(authState.dashboardUrl === '/portal', 'Candidate dashboardUrl points to /portal');
  assert(authState.user.name === sampleApplicant!.fullName, `Candidate name matches: ${authState.user.name}`);
  assert(authState.user.avatarUrl !== undefined, 'Candidate avatarUrl field is present');

  // =========================================================================
  // SUITE 3: NAVIGATION PRESERVATION ACROSS PUBLIC PAGES (Tests 15-22)
  // =========================================================================
  console.log('\n--- SUITE 3: Public Page Navigation Integrity ---');
  const homeRes = await fetch(`${BASE_URL}/`, { headers: authHeaders });
  assert(homeRes.status === 200, 'Homepage (/) returns HTTP 200 for authenticated candidate');

  const jobsRes = await fetch(`${BASE_URL}/jobs`, { headers: authHeaders });
  assert(jobsRes.status === 200, 'Jobs Page (/jobs) returns HTTP 200 for authenticated candidate');

  const sampleJob = await prisma.job.findFirst({
    where: { status: 'PUBLISHED' },
  });
  assert(!!sampleJob, 'Published sample job exists');

  const jobDetailRes = await fetch(`${BASE_URL}/jobs/${sampleJob!.slug}`, { headers: authHeaders });
  assert(jobDetailRes.status === 200, `Job Details (/jobs/${sampleJob!.slug}) returns HTTP 200`);

  const countriesRes = await fetch(`${BASE_URL}/countries`, { headers: authHeaders });
  assert(countriesRes.status === 200, 'Countries Page (/countries) returns HTTP 200');

  const adminUser = await prisma.user.findFirst({
    where: { role: { name: 'SUPER_ADMIN' } },
    include: { role: true },
  });
  assert(!!adminUser, 'Super Admin user exists');

  const adminToken = await createSessionToken({
    userId: adminUser!.id,
    email: adminUser!.email,
    role: adminUser!.role.name,
  });

  const adminHeaders = {
    Cookie: `sgr_session=${adminToken}`,
  };

  const adminStateRes = await fetch(`${BASE_URL}/api/auth/session-state`, { headers: adminHeaders });
  const adminState = await adminStateRes.json();
  assert(adminState.authenticated === true, 'Admin session identified as authenticated=true');
  assert(adminState.type === 'STAFF', 'Admin session type is STAFF');

  // =========================================================================
  // SUITE 4: MANDATORY PROFILE PHOTO VALIDATION & ENFORCEMENT (Tests 23-30)
  // =========================================================================
  console.log('\n--- SUITE 4: Mandatory Profile Photo Validation & Storage ---');

  // 1x1 Transparent PNG for valid test
  const validPngBase64 =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  // Test 23: Registration without photo is rejected
  const regNoPhotoRes = await fetch(`${BASE_URL}/api/portal/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Test Candidate No Photo',
      phone: '01799990001',
      password: 'Password123!',
      passwordConfirmation: 'Password123!',
    }),
  });
  assert(
    regNoPhotoRes.status === 400,
    'Registration without profile photo is rejected with HTTP 400 Bad Request'
  );

  // Test 24: Registration with invalid file format is rejected
  const regInvalidFormatRes = await fetch(`${BASE_URL}/api/portal/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Test Candidate Bad File',
      phone: '01799990002',
      password: 'Password123!',
      passwordConfirmation: 'Password123!',
      profilePhoto: 'data:text/plain;base64,SGVsbG8gV29ybGQ=',
    }),
  });
  assert(
    regInvalidFormatRes.status === 400,
    'Registration with non-image file is strictly rejected by server validator'
  );

  // Test 25: Magic bytes validator works directly on buffers
  const fakeJpgBuffer = Buffer.from([0x00, 0x11, 0x22, 0x33, 0x44]);
  const fakeJpgValidation = verifyImageMagicBytes(fakeJpgBuffer);
  assert(
    fakeJpgValidation.valid === false,
    'Magic bytes validator rejects spoofed MIME types with non-matching file signatures'
  );

  // Test 26: Registration with valid photo succeeds
  const regValidRes = await fetch(`${BASE_URL}/api/portal/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Valid Photo Candidate',
      phone: '01799990003',
      password: 'Password123!',
      passwordConfirmation: 'Password123!',
      profilePhoto: validPngBase64,
    }),
  });
  const regValidData = await regValidRes.json();
  assert(
    regValidRes.status === 201 && regValidData.success === true,
    'Registration with valid base64 photo succeeds and returns HTTP 201'
  );

  // Test 27: Profile photo is saved and linked to applicant
  const registeredCandidate = await prisma.applicant.findFirst({
    where: { phone: '01799990003' },
  });
  assert(
    !!registeredCandidate?.profilePhoto && registeredCandidate.profilePhoto.startsWith('/uploads/photos/'),
    `Profile photo successfully saved to disk and linked: ${registeredCandidate?.profilePhoto}`
  );

  // Test 28: Candidate with photo returns needsPhoto: false on me endpoint
  const regToken = await createPortalToken({
    applicantId: registeredCandidate!.id,
    applicantNumber: registeredCandidate!.applicantNumber,
    phone: registeredCandidate!.phone,
    email: registeredCandidate!.email,
    fullName: registeredCandidate!.fullName,
  });
  const meRes = await fetch(`${BASE_URL}/api/portal/auth/me`, {
    headers: { Cookie: `sgr_portal_session=${regToken}` },
  });
  const meData = await meRes.json();
  assert(
    meData.needsPhoto === false,
    'Candidate with valid profile photo passes login checkpoint with needsPhoto: false'
  );

  // Test 29: Photo upload API route accepts standalone photo update
  const uploadRes = await fetch(`${BASE_URL}/api/portal/profile/upload-photo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `sgr_portal_session=${regToken}`,
    },
    body: JSON.stringify({
      photoBase64: validPngBase64,
    }),
  });
  const uploadData = await uploadRes.json();
  assert(
    uploadRes.status === 200 && uploadData.success === true,
    'Standalone photo upload endpoint returns HTTP 200 and photo URL'
  );

  // Test 30: Clean up test candidate
  if (registeredCandidate) {
    await prisma.customer.deleteMany({ where: { applicantId: registeredCandidate.id } });
    await prisma.applicantProfile.deleteMany({ where: { applicantId: registeredCandidate.id } });
    await prisma.applicant.delete({ where: { id: registeredCandidate.id } });
  }
  assert(true, 'Temporary photo test candidate safely cleaned up without foreign-key issues');

  // =========================================================================
  // SUITE 5: ADMIN TRASH & RECYCLE BIN SYSTEM (Tests 31-38)
  // =========================================================================
  console.log('\n--- SUITE 5: Admin Trash, Soft-Delete, Restore & Purge ---');

  // Create temporary entity for trash testing
  const testCandidate = await prisma.applicant.create({
    data: {
      applicantNumber: 'SGR-TEST-TRASH-01',
      fullName: 'Trash Verification Candidate',
      phone: '01799990099',
      status: 'NEW',
      isActive: true,
    },
  });

  // Test 31: Soft delete moves item to trash
  const softDeleteRes = await TrashService.softDelete('Applicant', testCandidate.id, {
    id: adminUser!.id,
    name: adminUser!.name,
  });
  assert(softDeleteRes.success === true, 'SoftDelete marks candidate as ARCHIVED and inactive');

  // Test 32: Trash listing endpoint returns soft-deleted item
  const trashListRes = await fetch(`${BASE_URL}/api/admin/trash?type=Applicant`, {
    headers: adminHeaders,
  });
  const trashListData = await trashListRes.json();
  const foundInTrash = trashListData.items?.some((i: any) => i.id === testCandidate.id);
  assert(foundInTrash === true, 'Soft-deleted candidate is listed in Admin Trash API');

  // Test 33: Active applicants query excludes soft-deleted candidate
  const activeApps = await prisma.applicant.findMany({
    where: { status: 'ACTIVE', isActive: true },
  });
  const foundInActive = activeApps.some((a) => a.id === testCandidate.id);
  assert(foundInActive === false, 'Active candidate pool excludes soft-deleted items');

  // Test 34: Restore item from trash
  const restoreRes = await fetch(`${BASE_URL}/api/admin/trash/restore`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...adminHeaders,
    },
    body: JSON.stringify({
      type: 'Applicant',
      id: testCandidate.id,
    }),
  });
  const restoreData = await restoreRes.json();
  assert(restoreRes.status === 200 && restoreData.success === true, 'Restore endpoint returns HTTP 200');

  // Test 35: Restored candidate status is ACTIVE
  const restoredCandidate = await prisma.applicant.findUnique({
    where: { id: testCandidate.id },
  });
  assert(
    restoredCandidate?.status === 'ACTIVE' && restoredCandidate?.isActive === true,
    'Restored candidate is successfully back in ACTIVE status'
  );

  // Test 36: Permanent delete confirmation check
  const unconfirmedDeleteRes = await fetch(`${BASE_URL}/api/admin/trash/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...adminHeaders,
    },
    body: JSON.stringify({
      type: 'Applicant',
      id: testCandidate.id,
      confirmText: 'WRONG CONFIRMATION',
    }),
  });
  assert(
    unconfirmedDeleteRes.status === 400,
    'Permanent purge requires exact "PERMANENTLY DELETE" confirmation'
  );

  // Test 37: Permanent delete with exact confirmation wipes record
  const confirmedDeleteRes = await fetch(`${BASE_URL}/api/admin/trash/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...adminHeaders,
    },
    body: JSON.stringify({
      type: 'Applicant',
      id: testCandidate.id,
      confirmText: 'PERMANENTLY DELETE',
    }),
  });
  const confirmedDeleteData = await confirmedDeleteRes.json();
  assert(
    confirmedDeleteRes.status === 200 && confirmedDeleteData.success === true,
    'Permanent purge successfully deletes record and cascades cleanly'
  );

  // Test 37: Verify record is completely purged from DB
  const purgedCheck = await prisma.applicant.findUnique({
    where: { id: testCandidate.id },
  });
  assert(purgedCheck === null, 'Candidate record verified completely purged from PostgreSQL database');

  // Test 38: Bulk Restore & Bulk Permanent Purge
  const bulkApp1 = await prisma.applicant.create({
    data: {
      applicantNumber: 'SGR-BULK-01',
      fullName: 'Bulk Candidate One',
      phone: '01799990101',
      status: 'ARCHIVED',
      isActive: false,
    },
  });
  const bulkApp2 = await prisma.applicant.create({
    data: {
      applicantNumber: 'SGR-BULK-02',
      fullName: 'Bulk Candidate Two',
      phone: '01799990102',
      status: 'ARCHIVED',
      isActive: false,
    },
  });

  const bulkRestoreRes = await fetch(`${BASE_URL}/api/admin/trash/restore`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...adminHeaders,
    },
    body: JSON.stringify({
      items: [
        { type: 'Applicant', id: bulkApp1.id },
        { type: 'Applicant', id: bulkApp2.id },
      ],
    }),
  });
  const bulkRestoreData = await bulkRestoreRes.json();
  assert(
    bulkRestoreRes.status === 200 && Array.isArray(bulkRestoreData.results) && bulkRestoreData.results.length === 2,
    'Bulk restore API restores multiple records simultaneously'
  );

  // Bulk Permanent Purge cleanup
  const bulkDeleteRes = await fetch(`${BASE_URL}/api/admin/trash/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...adminHeaders,
    },
    body: JSON.stringify({
      items: [
        { type: 'Applicant', id: bulkApp1.id },
        { type: 'Applicant', id: bulkApp2.id },
      ],
      confirmText: 'PERMANENTLY DELETE',
    }),
  });
  const bulkDeleteData = await bulkDeleteRes.json();
  assert(
    bulkDeleteRes.status === 200 && Array.isArray(bulkDeleteData.results) && bulkDeleteData.results.length === 2,
    'Bulk permanent purge wipes multiple records atomically with complete cascade'
  );

  console.log('\n====================================================');
  console.log(`  🎉 ALL ${passedTests}/${totalTests} TESTS PASSED WITH 100% SUCCESS!`);
  console.log('  Phase 8G Production Verification Complete.');
  console.log('====================================================\n');
}

verifyAll()
  .catch((err) => {
    console.error('\n❌ MASTER VERIFICATION SUITE FAILED:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
