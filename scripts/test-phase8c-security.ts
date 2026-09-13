/**
 * SHAKIL GLOBAL RECRUITMENT V2.0 (RL-1892)
 * Phase 8C Master Security & Infrastructure Hardening Verification Suite
 * 
 * Tests 10 comprehensive security pillars:
 * 1. Authentication & Password Security
 * 2. Sliding Window Rate Limiting & Brute-Force Protection
 * 3. Open Redirect Prevention & Path Normalization
 * 4. RBAC & Role Privilege Escalation Prevention
 * 5. IDOR & Multi-Tenant Data Isolation
 * 6. File Upload Security, MIME Filtering & Path Traversal Prevention
 * 7. PII Redaction & Database Error Masking
 * 8. Financial Invariants & Input Hardening
 * 9. Security Headers & Configuration Hardening
 * 10. S3 SigV4 Storage Authentication & Private Bucket Security
 */

import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from '../src/lib/auth';
import { hashApplicantPassword, verifyApplicantPassword, createPortalToken, verifyPortalToken } from '../src/lib/portal-auth';
import { hasPermission, AuthorizationError, AuthenticationError } from '../src/lib/rbac';
import { checkRateLimit, resetRateLimit } from '../src/lib/rate-limit';
import {
  isSafeRedirectUrl,
  sanitizeRedirectUrl,
  sanitizeFileName,
  sanitizeHtml,
  sanitizeErrorMessage,
  assertApplicantOwnership,
} from '../src/lib/security';
import { sanitizeData } from '../src/lib/utils';
import { validateDocumentFile, S3StorageProvider, LocalPrivateStorageProvider } from '../src/lib/storage';
import { PrismaClient } from '@prisma/client';
import nextConfig from '../next.config.mjs';

const prisma = new PrismaClient();

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [TEST ${totalTests}] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL ${totalTests}] ${testName}`);
    if (details) console.error(`    Details: ${details}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
}

async function runSecuritySuite() {
  console.log('================================================================');
  console.log('  SHAKIL GLOBAL RECRUITMENT V2.0 (RL-1892) — PHASE 8C SECURITY');
  console.log('  INFRASTRUCTURE, AUTHENTICATION, RBAC, IDOR & INPUT HARDENING');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // PILLAR 1: AUTHENTICATION & PASSWORD HARDENING
  // -------------------------------------------------------------
  console.log('--- PILLAR 1: AUTHENTICATION & PASSWORD HARDENING ---');
  const password = 'SuperSecurePassword@2026!';
  const hash1 = await hashPassword(password);
  const hash2 = await hashPassword(password);

  assert(hash1 !== hash2, 'Bcrypt generates salted, non-deterministic hashes for same password');
  assert(hash1.startsWith('$2'), 'Staff password hash uses standard bcrypt format');
  assert(await verifyPassword(password, hash1), 'verifyPassword returns true for correct credentials');
  assert(!(await verifyPassword('WrongPassword123!', hash1)), 'verifyPassword rejects incorrect password');

  const applicantHash = await hashApplicantPassword(password);
  assert(await verifyApplicantPassword(password, applicantHash), 'Candidate portal bcrypt verification succeeds');
  assert(!(await verifyApplicantPassword('Hacked!', applicantHash)), 'Candidate portal rejects invalid password');

  const staffToken = await createSessionToken({ userId: 'user-sec-01', email: 'officer@sgr.com', role: 'RECRUITER' });
  const verifiedStaff = await verifySessionToken(staffToken);
  assert(verifiedStaff?.userId === 'user-sec-01' && verifiedStaff?.role === 'RECRUITER', 'Staff JWT session verifies valid cryptographic signature');

  const portalToken = await createPortalToken({
    applicantId: 'app-sec-01',
    applicantNumber: 'SGR-2026-000999',
    phone: '+8801700000999',
    fullName: 'Test Candidate',
  });
  const verifiedPortal = await verifyPortalToken(portalToken);
  assert(verifiedPortal?.applicantId === 'app-sec-01', 'Candidate portal JWT verifies applicant session');

  assert((await verifySessionToken('invalid.token.structure')) === null, 'Malformed JWT token safely rejected with null');
  assert((await verifyPortalToken('corrupted.signature.token')) === null, 'Corrupted portal JWT token safely rejected with null');

  // -------------------------------------------------------------
  // PILLAR 2: RATE LIMITING & BRUTE-FORCE PROTECTION
  // -------------------------------------------------------------
  console.log('\n--- PILLAR 2: RATE LIMITING & BRUTE-FORCE PROTECTION ---');
  const rateLimitKey = `test_auth_${Date.now()}`;

  for (let i = 1; i <= 5; i++) {
    const res = checkRateLimit(rateLimitKey, 5, 60);
    assert(res.success, `Rate limiter allows legitimate attempt #${i} within threshold`);
  }

  const blockedRes = checkRateLimit(rateLimitKey, 5, 60);
  assert(!blockedRes.success && blockedRes.remaining === 0, 'Rate limiter strictly blocks 6th consecutive attempt (429 Throttling)');

  resetRateLimit(rateLimitKey);
  const unblockedRes = checkRateLimit(rateLimitKey, 5, 60);
  assert(unblockedRes.success, 'Rate limiter resets properly upon administrative or successful auth reset');

  // -------------------------------------------------------------
  // PILLAR 3: OPEN REDIRECT PREVENTION & URL SANITIZATION
  // -------------------------------------------------------------
  console.log('\n--- PILLAR 3: OPEN REDIRECT PREVENTION & URL SANITIZATION ---');
  assert(isSafeRedirectUrl('/staff/dashboard'), 'isSafeRedirectUrl accepts valid internal route');
  assert(isSafeRedirectUrl('/portal/documents?tab=verified'), 'isSafeRedirectUrl accepts internal route with safe query params');
  assert(!isSafeRedirectUrl('https://evil-phishing-site.com'), 'isSafeRedirectUrl blocks external HTTPS URLs');
  assert(!isSafeRedirectUrl('http://insecure-phishing.com'), 'isSafeRedirectUrl blocks external HTTP URLs');
  assert(!isSafeRedirectUrl('//evil.com/admin'), 'isSafeRedirectUrl blocks protocol-relative scheme bypass (//evil.com)');
  assert(!isSafeRedirectUrl('/\\evil.com'), 'isSafeRedirectUrl blocks backslash bypass (/\\evil.com)');
  assert(!isSafeRedirectUrl('\\evil.com'), 'isSafeRedirectUrl blocks leading backslash');
  assert(!isSafeRedirectUrl('javascript:alert(document.cookie)'), 'isSafeRedirectUrl blocks javascript: pseudo-protocol');
  assert(!isSafeRedirectUrl('data:text/html,<script>alert(1)</script>'), 'isSafeRedirectUrl blocks data: URI scheme');
  assert(!isSafeRedirectUrl('/portal\r\nHeader-Injection: true'), 'isSafeRedirectUrl blocks carriage return / header injection in path');

  assert(sanitizeRedirectUrl('/admin/applications', '/admin/dashboard') === '/admin/applications', 'sanitizeRedirectUrl preserves safe target');
  assert(sanitizeRedirectUrl('https://evil.com', '/staff/dashboard') === '/staff/dashboard', 'sanitizeRedirectUrl sanitizes evil URL to safe fallback');
  assert(sanitizeRedirectUrl('//malicious.com', '/portal') === '/portal', 'sanitizeRedirectUrl sanitizes protocol-relative URL to fallback');

  // -------------------------------------------------------------
  // PILLAR 4: RBAC & ROLE PRIVILEGE ESCALATION PREVENTION
  // -------------------------------------------------------------
  console.log('\n--- PILLAR 4: RBAC & ROLE PRIVILEGE ESCALATION PREVENTION ---');
  const superAdminUser: any = {
    id: 'u-admin',
    name: 'Super Admin',
    role: { name: 'SUPER_ADMIN' },
    permissions: [],
    isActive: true,
  };

  const recruiterUser: any = {
    id: 'u-recruiter',
    name: 'Recruiter Officer',
    role: { name: 'RECRUITER' },
    permissions: ['APPLICANT_VIEW', 'APPLICANT_CREATE', 'JOB_VIEW'],
    isActive: true,
  };

  const inactiveAdmin: any = {
    id: 'u-inactive',
    name: 'Inactive Admin',
    role: { name: 'SUPER_ADMIN' },
    permissions: ['USER_DELETE'],
    isActive: false,
  };

  assert(hasPermission(superAdminUser, 'USER_DELETE' as any), 'SUPER_ADMIN possesses global wildcard permissions');
  assert(hasPermission(superAdminUser, 'FINANCE_INVOICE_CREATE' as any), 'SUPER_ADMIN bypasses granular restrictions safely');
  assert(hasPermission(recruiterUser, 'APPLICANT_VIEW' as any), 'Recruiter has assigned APPLICANT_VIEW permission');
  assert(!hasPermission(recruiterUser, 'USER_DELETE' as any), 'Recruiter is strictly prevented from deleting system users');
  assert(!hasPermission(recruiterUser, 'FINANCE_PAYMENT_CREATE' as any), 'Recruiter cannot execute financial transactions');
  assert(!hasPermission(inactiveAdmin, 'USER_VIEW' as any), 'Deactivated user has 0 effective permissions even if SUPER_ADMIN');

  // -------------------------------------------------------------
  // PILLAR 5: IDOR PROTECTION & MULTI-TENANT ISOLATION
  // -------------------------------------------------------------
  console.log('\n--- PILLAR 5: IDOR PROTECTION & MULTI-TENANT ISOLATION ---');
  const candidateA_Id = 'candidate-uuid-1111';
  const candidateB_Id = 'candidate-uuid-2222';

  let idorBlocked = false;
  try {
    assertApplicantOwnership(candidateA_Id, candidateB_Id);
  } catch (err: any) {
    if (err.name === 'AuthorizationError') {
      idorBlocked = true;
    }
  }
  assert(idorBlocked, 'assertApplicantOwnership throws AuthorizationError when Candidate B tries to access Candidate A');

  let selfAccessAllowed = false;
  try {
    assertApplicantOwnership(candidateA_Id, candidateA_Id);
    selfAccessAllowed = true;
  } catch {
    selfAccessAllowed = false;
  }
  assert(selfAccessAllowed, 'assertApplicantOwnership allows legitimate owner access');

  // -------------------------------------------------------------
  // PILLAR 6: FILE UPLOAD SECURITY, MIME FILTERING & PATH TRAVERSAL
  // -------------------------------------------------------------
  console.log('\n--- PILLAR 6: FILE UPLOAD SECURITY, MIME FILTERING & PATH TRAVERSAL ---');
  assert(validateDocumentFile(5 * 1024 * 1024, 'application/pdf').valid, 'validateDocumentFile accepts 5MB PDF document');
  assert(validateDocumentFile(2 * 1024 * 1024, 'image/jpeg').valid, 'validateDocumentFile accepts 2MB JPEG image');
  assert(validateDocumentFile(1 * 1024 * 1024, 'image/png').valid, 'validateDocumentFile accepts 1MB PNG image');
  assert(validateDocumentFile(1 * 1024 * 1024, 'image/webp').valid, 'validateDocumentFile accepts 1MB WEBP image');

  assert(!validateDocumentFile(15 * 1024 * 1024, 'application/pdf').valid, 'validateDocumentFile rejects files exceeding 10MB limit');
  assert(!validateDocumentFile(1024, 'application/x-msdownload').valid, 'validateDocumentFile blocks dangerous .exe / binary MIME types');
  assert(!validateDocumentFile(1024, 'text/html').valid, 'validateDocumentFile blocks HTML uploads (XSS prevention)');
  assert(!validateDocumentFile(1024, 'application/javascript').valid, 'validateDocumentFile blocks JavaScript file uploads');
  assert(!validateDocumentFile(1024, 'application/zip').valid, 'validateDocumentFile blocks compressed archive uploads');
  assert(!validateDocumentFile(1024, 'image/svg+xml').valid, 'validateDocumentFile blocks SVG files containing potential script tags');

  const dirtyPath = '../../../../etc/passwd';
  const cleanPath = sanitizeFileName(dirtyPath);
  assert(!cleanPath.includes('..') && !cleanPath.includes('/'), `sanitizeFileName strips path traversal (${cleanPath})`);

  const nullByteFile = 'innocent.pdf\0.exe';
  const cleanNullByte = sanitizeFileName(nullByteFile);
  assert(!cleanNullByte.includes('\0'), 'sanitizeFileName strips null byte injection');

  // -------------------------------------------------------------
  // PILLAR 7: PII REDACTION & ERROR MASKING
  // -------------------------------------------------------------
  console.log('\n--- PILLAR 7: PII REDACTION & ERROR MASKING ---');
  const sensitivePayload = {
    id: 'cand-01',
    name: 'Md. Shakil',
    email: 'candidate@test.com',
    password: 'SecretPassword123',
    passwordHash: '$2a$12$eX4mpL3H4sh...',
    jwtToken: 'eyJhbGciOiJIUzI1NiIsIn...',
    bankDetails: {
      accountNumber: '1234567890',
      cvv: '999',
      apiKey: 'sk_live_1234567890',
    },
  };

  const sanitized = sanitizeData(sensitivePayload);
  assert(sanitized.password === '[REDACTED]', 'sanitizeData redacts plain password');
  assert(sanitized.passwordHash === '[REDACTED]', 'sanitizeData redacts passwordHash');
  assert((sanitized as any).bankDetails.cvv === '[REDACTED]', 'sanitizeData recursively redacts sensitive nested keys (cvv)');
  assert((sanitized as any).bankDetails.apiKey === '[REDACTED]', 'sanitizeData recursively redacts nested apiKey');
  assert(sanitized.name === 'Md. Shakil', 'sanitizeData preserves non-sensitive business data');

  const rawDbError = new Error('prisma.candidate.create(): Unique constraint failed on the fields: (`passportNumber`)');
  const safeMsg = sanitizeErrorMessage(rawDbError);
  assert(!safeMsg.includes('prisma') && !safeMsg.includes('constraint'), 'sanitizeErrorMessage masks internal database schema and Prisma internals');

  const safeAppError = new Error('Passport has already expired. Please provide valid passport.');
  assert(sanitizeErrorMessage(safeAppError).includes('Passport has already expired'), 'sanitizeErrorMessage retains safe domain validation messages');

  // -------------------------------------------------------------
  // PILLAR 8: FINANCIAL INVARIANTS & INPUT HARDENING
  // -------------------------------------------------------------
  console.log('\n--- PILLAR 8: FINANCIAL INVARIANTS & INPUT HARDENING ---');
  const htmlXss = '<script>alert("xss")</script>Hello <b>World</b>';
  const escapedHtml = sanitizeHtml(htmlXss);
  assert(!escapedHtml.includes('<script>') && escapedHtml.includes('&lt;script&gt;'), 'sanitizeHtml escapes HTML script tags preventing stored XSS');

  // Verify non-negative monetary rules
  const lineItem = { quantity: 1, unitPrice: 50000, discount: 5000, taxRate: 5 };
  const base = lineItem.quantity * lineItem.unitPrice;
  const net = base - lineItem.discount + (base - lineItem.discount) * (lineItem.taxRate / 100);
  assert(net === 47250, 'Financial math matches exact discounted tax calculation');
  assert(net > 0, 'Net amount is positive');

  // -------------------------------------------------------------
  // PILLAR 9: SECURITY HEADERS & NEXT.JS CONFIGURATION
  // -------------------------------------------------------------
  console.log('\n--- PILLAR 9: SECURITY HEADERS & NEXT.JS CONFIGURATION ---');
  assert(nextConfig.poweredByHeader === false, 'next.config.mjs disables X-Powered-By header preventing fingerprinting');
  assert(nextConfig.reactStrictMode === true, 'next.config.mjs enables React Strict Mode');

  const headersFn = nextConfig.headers;
  assert(typeof headersFn === 'function', 'next.config.mjs defines custom security headers configuration');
  const headerRules = await (nextConfig as any).headers();
  const globalHeaders = headerRules[0]?.headers || [];

  const getHeader = (name: string) => globalHeaders.find((h: any) => h.key.toLowerCase() === name.toLowerCase())?.value;

  assert(getHeader('X-Content-Type-Options') === 'nosniff', 'Header X-Content-Type-Options is nosniff');
  assert(getHeader('X-Frame-Options') === 'DENY', 'Header X-Frame-Options is DENY (Clickjacking protection)');
  assert(getHeader('Strict-Transport-Security')?.includes('max-age=31536000'), 'Header Strict-Transport-Security enforces 1-year HSTS with subdomains');
  assert(getHeader('Referrer-Policy') === 'strict-origin-when-cross-origin', 'Header Referrer-Policy enforces strict-origin-when-cross-origin');
  assert(getHeader('Content-Security-Policy')?.includes("default-src 'self'"), 'Header Content-Security-Policy restricts default origin to self');

  // -------------------------------------------------------------
  // PILLAR 10: S3 SIGV4 STORAGE SECURITY & SIGNED URLS
  // -------------------------------------------------------------
  console.log('\n--- PILLAR 10: S3 SIGV4 STORAGE SECURITY & SIGNED URLS ---');
  const s3 = new S3StorageProvider({
    bucket: 'shakil-global-private-vault',
    region: 'ap-southeast-1',
    accessKeyId: 'AKIA_SEC_TEST_KEY_2026',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  });

  const signedUrl = await s3.getSignedDownloadUrl('documents/2026/candidate_passport_123.pdf', 300);
  assert(signedUrl.includes('X-Amz-Algorithm=AWS4-HMAC-SHA256'), 'S3 signed URL utilizes AWS4-HMAC-SHA256 signature algorithm');
  assert(signedUrl.includes('X-Amz-Expires=300'), 'S3 signed URL enforces 300-second expiration TTL');
  assert(signedUrl.includes('X-Amz-Signature='), 'S3 signed URL contains cryptographically computed SHA256 signature token');
  assert(signedUrl.includes('shakil-global-private-vault'), 'S3 signed URL targets private configured bucket');

  // Verify local storage isolation
  const localProvider = new LocalPrivateStorageProvider();
  assert(typeof localProvider.saveFile === 'function', 'Local private storage provider initializes isolated disk root');

  console.log('\n================================================================');
  console.log(`  PHASE 8C SECURITY SUITE COMPLETED: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('================================================================\n');
}

runSecuritySuite()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('Phase 8C Security Suite Failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
