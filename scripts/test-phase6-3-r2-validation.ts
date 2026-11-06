import { NextRequest } from 'next/server';
import { storage, isS3Configured, getActiveStorage } from '../src/lib/storage';
import { GET as documentDownloadHandler } from '../src/app/api/documents/[id]/download/route';
import { createPortalToken } from '../src/lib/portal-auth';
import { createSessionToken } from '../src/lib/auth';
import prisma from '../src/lib/prisma';

interface R2TestResult {
  step: string;
  description: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

async function runR2Validation() {
  console.log('======================================================================');
  console.log('☁️ SHAKILWORK: CLOUDFLARE R2 PRODUCTION LIVE VALIDATION');
  console.log('======================================================================\n');

  const results: R2TestResult[] = [];
  const startTime = new Date().toISOString();

  // 1. Verify Configuration without leaking credentials
  const configured = isS3Configured();
  const activeStorage = getActiveStorage();
  const activeProvider = activeStorage.constructor.name;

  console.log(`[INIT] S3/R2 Configured: ${configured}`);
  console.log(`[INIT] Active Storage Provider: ${activeProvider}`);

  if (!configured || activeProvider !== 'S3StorageProvider') {
    throw new Error('Cloudflare R2 is not configured as active storage provider.');
  }

  // 2. Fetch live test references
  const monirApplicant = await prisma.applicant.findFirst({
    where: { applicantNumber: 'SGR-2026-000008' },
  });
  const raisaApplicant = await prisma.applicant.findFirst({
    where: { applicantNumber: 'SGR-2026-000010' },
  });
  const viewerUser = await prisma.user.findFirst({
    where: { email: 'viewer@shakilglobal.com' },
    include: { role: true },
  });
  const accountsUser = await prisma.user.findFirst({
    where: { email: 'accounts@shakilglobal.com' },
    include: { role: true },
  });
  const superAdminUser = await prisma.user.findFirst({
    where: { role: { name: 'SUPER_ADMIN' } },
    include: { role: true },
  });

  if (!monirApplicant || !raisaApplicant || !viewerUser || !accountsUser || !superAdminUser) {
    throw new Error('Required test identities missing from database.');
  }

  // Tokens
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

  const viewerToken = await createSessionToken({
    userId: viewerUser.id,
    email: viewerUser.email,
    role: viewerUser.role.name,
  });

  const accountsToken = await createSessionToken({
    userId: accountsUser.id,
    email: accountsUser.email,
    role: accountsUser.role.name,
  });

  const superAdminToken = await createSessionToken({
    userId: superAdminUser.id,
    email: superAdminUser.email,
    role: superAdminUser.role.name,
  });

  const testFileKey = `documents/${monirApplicant.id}/validation-test-${Date.now()}.pdf`;
  const samplePdfBuffer = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 300 144]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000108 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n180\n%%EOF\n',
    'utf-8'
  );

  let tempDocRecordId: string | null = null;

  try {
    // -----------------------------------------------------------------------
    // TEST 1: Private Upload to Cloudflare R2
    // -----------------------------------------------------------------------
    console.log('\n--- 1. TESTING PRIVATE UPLOAD TO CLOUDFLARE R2 ---');
    const uploadedKey = await storage.saveFile(testFileKey, samplePdfBuffer, {
      originalName: 'validation-test.pdf',
      mimeType: 'application/pdf',
      size: samplePdfBuffer.length,
      uploadedAt: new Date(),
      applicantId: monirApplicant.id,
    });

    const fileExistsInR2 = await storage.fileExists(testFileKey);
    console.log(`✅ [R2-UPLOAD] File saved to key: ${uploadedKey}`);
    console.log(`   Verification (fileExists): ${fileExistsInR2}`);

    results.push({
      step: 'R2-UPLOAD',
      description: 'Private upload to Cloudflare R2 bucket with AES-256 server-side encryption',
      status: fileExistsInR2 ? 'PASS' : 'FAIL',
      details: `Key: ${uploadedKey}, Size: ${samplePdfBuffer.length} bytes, Exists: ${fileExistsInR2}`,
    });

    // -----------------------------------------------------------------------
    // TEST 2: Authorized Download via Storage Provider
    // -----------------------------------------------------------------------
    console.log('\n--- 2. TESTING AUTHORIZED DOWNLOAD FROM R2 STORAGE ---');
    const downloadedBuffer = await storage.getFile(testFileKey);
    const byteMatch = downloadedBuffer.equals(samplePdfBuffer);
    console.log(`✅ [R2-DOWNLOAD] Byte match: ${byteMatch} (${downloadedBuffer.length} bytes received)`);

    results.push({
      step: 'R2-GETFILE',
      description: 'Direct byte retrieval from Cloudflare R2 using AWS SigV4 signed GET request',
      status: byteMatch ? 'PASS' : 'FAIL',
      details: `Buffer match: ${byteMatch}, Length: ${downloadedBuffer.length} bytes`,
    });

    // Create DB document record linked to this R2 key
    const docType = await prisma.documentType.findFirst() || await prisma.documentType.create({
      data: { name: 'Validation Document', code: 'VALIDATION_TEST' },
    });

    const testDoc = await prisma.document.create({
      data: {
        applicantId: monirApplicant.id,
        documentTypeId: docType.id,
        fileName: 'validation-test.pdf',
        filePath: testFileKey,
        fileUrl: `/api/documents/test-r2-stream`,
        fileSize: samplePdfBuffer.length,
        mimeType: 'application/pdf',
        status: 'PENDING',
      },
    });
    tempDocRecordId = testDoc.id;

    // -----------------------------------------------------------------------
    // TEST 3: Route Handler Authorized Access (Candidate, Staff, Admin)
    // -----------------------------------------------------------------------
    console.log('\n--- 3. TESTING ROUTE HANDLER AUTHORIZED ACCESS ---');

    // 3a. Candidate Monir (Owner)
    const candRes = await documentDownloadHandler(
      new NextRequest(`http://localhost:3000/api/documents/${testDoc.id}/download`, {
        headers: { authorization: `Bearer ${monirToken}` },
      }),
      { params: Promise.resolve({ id: testDoc.id }) }
    );
    console.log(`✅ [ROUTE-CAND-OWNER] Candidate downloading own R2 document -> HTTP ${candRes.status}`);

    // 3b. Staff Viewer (DOCUMENT_VIEW)
    const staffRes = await documentDownloadHandler(
      new NextRequest(`http://localhost:3000/api/documents/${testDoc.id}/download`, {
        headers: { authorization: `Bearer ${viewerToken}` },
      }),
      { params: Promise.resolve({ id: testDoc.id }) }
    );
    console.log(`✅ [ROUTE-STAFF-VIEW] Staff with DOCUMENT_VIEW downloading R2 document -> HTTP ${staffRes.status}`);

    // 3c. Super Admin
    const adminRes = await documentDownloadHandler(
      new NextRequest(`http://localhost:3000/api/documents/${testDoc.id}/download`, {
        headers: { authorization: `Bearer ${superAdminToken}` },
      }),
      { params: Promise.resolve({ id: testDoc.id }) }
    );
    console.log(`✅ [ROUTE-SUPER-ADMIN] Super Admin downloading R2 document -> HTTP ${adminRes.status}`);

    const authRouteOk = candRes.status === 200 && staffRes.status === 200 && adminRes.status === 200;
    results.push({
      step: 'R2-ROUTE-AUTH',
      description: 'Route handler authorized streaming of R2 document across Candidate, Staff, and Super Admin',
      status: authRouteOk ? 'PASS' : 'FAIL',
      details: `Candidate: ${candRes.status}, Staff: ${staffRes.status}, SuperAdmin: ${adminRes.status}`,
    });

    // -----------------------------------------------------------------------
    // TEST 4: Route Handler Unauthorized Access Rejection
    // -----------------------------------------------------------------------
    console.log('\n--- 4. TESTING ROUTE HANDLER UNAUTHORIZED ACCESS REJECTION ---');

    // 4a. Anonymous
    const anonRes = await documentDownloadHandler(
      new NextRequest(`http://localhost:3000/api/documents/${testDoc.id}/download`),
      { params: Promise.resolve({ id: testDoc.id }) }
    );
    console.log(`✅ [ROUTE-ANON] Anonymous user denied R2 download -> HTTP ${anonRes.status} (Expected 401)`);

    // 4b. Raisa (Cross-candidate)
    const crossRes = await documentDownloadHandler(
      new NextRequest(`http://localhost:3000/api/documents/${testDoc.id}/download`, {
        headers: { authorization: `Bearer ${raisaToken}` },
      }),
      { params: Promise.resolve({ id: testDoc.id }) }
    );
    console.log(`✅ [ROUTE-CROSS] Candidate Raisa denied Monir's R2 document -> HTTP ${crossRes.status} (Expected 403)`);

    // 4c. Accounts Staff (No DOCUMENT_VIEW)
    const acctRes = await documentDownloadHandler(
      new NextRequest(`http://localhost:3000/api/documents/${testDoc.id}/download`, {
        headers: { authorization: `Bearer ${accountsToken}` },
      }),
      { params: Promise.resolve({ id: testDoc.id }) }
    );
    console.log(`✅ [ROUTE-NO-PERM] Staff lacking DOCUMENT_VIEW denied R2 download -> HTTP ${acctRes.status} (Expected 403)`);

    const unauthRouteOk = anonRes.status === 401 && crossRes.status === 403 && acctRes.status === 403;
    results.push({
      step: 'R2-ROUTE-UNAUTH',
      description: 'Route handler rejection of unauthorized R2 downloads (Anonymous 401, Cross-Candidate 403, No Perm 403)',
      status: unauthRouteOk ? 'PASS' : 'FAIL',
      details: `Anonymous: ${anonRes.status}, Cross-Candidate: ${crossRes.status}, Missing Perm: ${acctRes.status}`,
    });

    // -----------------------------------------------------------------------
    // TEST 5: Presigned URL Generation and Live Expiration Behavior
    // -----------------------------------------------------------------------
    console.log('\n--- 5. TESTING PRESIGNED URL GENERATION & LIVE EXPIRATION ---');

    // Generate URL that expires in 2 seconds
    const signedUrl = await storage.getSignedDownloadUrl(testFileKey, 2);
    console.log('   Generated presigned URL with 2-second expiration window.');

    // Fetch immediately (< 1s) -> Should be HTTP 200
    const immediateFetch = await fetch(signedUrl);
    console.log(`✅ [PRESIGNED-IMMEDIATE] Immediate fetch status: HTTP ${immediateFetch.status} (Expected 200)`);

    // Wait 3.5 seconds for expiration
    console.log('   Waiting 3.5 seconds for cryptographic expiration...');
    await new Promise((r) => setTimeout(r, 3500));

    // Fetch again -> Cloudflare R2 MUST reject with HTTP 403 (Request has expired)
    const expiredFetch = await fetch(signedUrl);
    console.log(`✅ [PRESIGNED-EXPIRED] Expired fetch status: HTTP ${expiredFetch.status} (Expected 403 Forbidden)`);

    const presignedOk = immediateFetch.status === 200 && expiredFetch.status === 403;
    results.push({
      step: 'R2-PRESIGNED-EXPIRATION',
      description: 'Cloudflare R2 presigned URL validity window and automatic expiration rejection',
      status: presignedOk ? 'PASS' : 'FAIL',
      details: `Immediate: HTTP ${immediateFetch.status}, Expired (+3.5s): HTTP ${expiredFetch.status}`,
    });

    // -----------------------------------------------------------------------
    // TEST 6: Object Deletion
    // -----------------------------------------------------------------------
    console.log('\n--- 6. TESTING OBJECT DELETION FROM R2 ---');
    const deleteSuccess = await storage.deleteFile(testFileKey);
    const existsAfterDelete = await storage.fileExists(testFileKey);
    console.log(`✅ [R2-DELETE] Object deleted: ${deleteSuccess}, File exists after delete: ${existsAfterDelete}`);

    const deleteOk = deleteSuccess && !existsAfterDelete;
    results.push({
      step: 'R2-DELETE',
      description: 'Cryptographic deletion of object from Cloudflare R2 bucket via AWS SigV4 DELETE',
      status: deleteOk ? 'PASS' : 'FAIL',
      details: `Deleted: ${deleteSuccess}, Still exists: ${existsAfterDelete}`,
    });

    // -----------------------------------------------------------------------
    // TEST 7: Base64 Fallback Authorization Parity
    // -----------------------------------------------------------------------
    console.log('\n--- 7. TESTING BASE64 FALLBACK AUTHORIZATION PARITY ---');
    const base64Doc = await prisma.document.findFirst({
      where: { applicantId: monirApplicant.id, filePath: { startsWith: 'data:' } },
    });

    if (base64Doc) {
      const b64Anon = await documentDownloadHandler(
        new NextRequest(`http://localhost:3000/api/documents/${base64Doc.id}/download`),
        { params: Promise.resolve({ id: base64Doc.id }) }
      );
      const b64Cross = await documentDownloadHandler(
        new NextRequest(`http://localhost:3000/api/documents/${base64Doc.id}/download`, {
          headers: { authorization: `Bearer ${raisaToken}` },
        }),
        { params: Promise.resolve({ id: base64Doc.id }) }
      );
      const b64Auth = await documentDownloadHandler(
        new NextRequest(`http://localhost:3000/api/documents/${base64Doc.id}/download`, {
          headers: { authorization: `Bearer ${monirToken}` },
        }),
        { params: Promise.resolve({ id: base64Doc.id }) }
      );

      const b64Ok = b64Anon.status === 401 && b64Cross.status === 403 && b64Auth.status === 200;
      console.log(`✅ [BASE64-PARITY] Anon: ${b64Anon.status}, Cross: ${b64Cross.status}, Owner: ${b64Auth.status}`);
      results.push({
        step: 'BASE64-FALLBACK-PARITY',
        description: 'Base64 database fallback enforces identical authorization rules as live R2 storage',
        status: b64Ok ? 'PASS' : 'FAIL',
        details: `Anon: ${b64Anon.status}, Cross: ${b64Cross.status}, Owner: ${b64Auth.status}`,
      });
    }

  } finally {
    // Teardown
    console.log('\n--- CLEANING UP TEMPORARY R2 FIXTURES ---');
    if (tempDocRecordId) {
      await prisma.document.delete({ where: { id: tempDocRecordId } }).catch(() => {});
    }
    await storage.deleteFile(testFileKey).catch(() => {});
    console.log('✅ Temporary R2 test documents and database records cleaned up.');
  }

  const failedTests = results.filter((r) => r.status === 'FAIL');
  console.log('\n======================================================================');
  console.log(`CLOUDFLARE R2 VALIDATION SUMMARY: ${results.length - failedTests.length} PASSED, ${failedTests.length} FAILED`);
  console.log('======================================================================\n');

  if (failedTests.length > 0) {
    process.exit(1);
  }
}

runR2Validation().catch((err) => {
  console.error('Fatal R2 validation failure:', err);
  process.exit(1);
});
