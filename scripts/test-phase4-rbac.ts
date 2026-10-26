import { SignJWT, jwtVerify } from 'jose';
import { hasPermission } from '../src/lib/rbac';
import type { AuthUser, PermissionCode } from '../src/types';

// Read or default secrets
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production-min-32-chars';
const PORTAL_JWT_SECRET = process.env.PORTAL_JWT_SECRET || 'dev-portal-secret-key-min-32-chars-long';

async function runPhase4RBACTests() {
  console.log('====================================================');
  console.log('🧪 TESTING PHASE 4: STAFF & ADMIN RBAC SECURITY');
  console.log('====================================================\n');

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

  // 1. Candidate Token vs Staff Guard Test
  console.log('👉 1. Testing Token Isolation: Candidate Token against Staff Verifier');
  const candidateSecret = new TextEncoder().encode(PORTAL_JWT_SECRET);
  const candidateToken = await new SignJWT({
    applicantId: 'cand_123',
    applicantNumber: 'CAN-0042',
    phone: '+8801700000000',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(candidateSecret);

  let staffVerifierRejectedCandidate = false;
  try {
    const staffSecret = new TextEncoder().encode(JWT_SECRET);
    await jwtVerify(candidateToken, staffSecret);
  } catch (err) {
    staffVerifierRejectedCandidate = true;
  }
  assert(
    staffVerifierRejectedCandidate,
    'Candidate JWT token is strictly REJECTED by Staff verifier (Cryptographic isolation)'
  );

  // 2. Staff Role Permission Evaluation Tests
  console.log('\n👉 2. Testing Staff Role Permission Gates');

  const regularStaff: AuthUser = {
    id: 'staff_1',
    name: 'Processing Officer',
    email: 'officer@shakiltravels.com',
    roleId: 'role_recruiter',
    role: { id: 'role_recruiter', name: 'RECRUITER', description: 'Recruitment Officer' },
    permissions: ['APPLICANT_VIEW', 'APPLICATION_VIEW', 'INTERVIEW_VIEW'] as PermissionCode[],
    isActive: true,
  };

  const documentOfficer: AuthUser = {
    id: 'staff_2',
    name: 'Compliance Officer',
    email: 'docs@shakiltravels.com',
    roleId: 'role_doc_officer',
    role: { id: 'role_doc_officer', name: 'DOCUMENT_OFFICER', description: 'Document Auditor' },
    permissions: ['DOCUMENT_VIEW', 'DOCUMENT_VERIFY', 'DOCUMENT_REJECT'] as PermissionCode[],
    isActive: true,
  };

  const adminUser: AuthUser = {
    id: 'admin_1',
    name: 'Executive Admin',
    email: 'admin@shakiltravels.com',
    roleId: 'role_admin',
    role: { id: 'role_admin', name: 'ADMIN', description: 'Executive Administrator' },
    permissions: ['DASHBOARD_VIEW', 'APPLICANT_VIEW', 'JOB_VIEW', 'AUDIT_VIEW'] as PermissionCode[],
    isActive: true,
  };

  const superAdminUser: AuthUser = {
    id: 'super_admin_1',
    name: 'Super Admin',
    email: 'owner@shakiltravels.com',
    roleId: 'role_super',
    role: { id: 'role_super', name: 'SUPER_ADMIN', description: 'Headquarters Super Admin' },
    permissions: [] as PermissionCode[], // Super Admin bypasses individual permission checks
    isActive: true,
  };

  const deactivatedUser: AuthUser = {
    id: 'staff_inactive',
    name: 'Former Staff',
    email: 'former@shakiltravels.com',
    roleId: 'role_recruiter',
    role: { id: 'role_recruiter', name: 'RECRUITER', description: 'Recruiter' },
    permissions: ['DASHBOARD_VIEW', 'APPLICANT_VIEW'] as PermissionCode[],
    isActive: false,
  };

  // Check Recruiter permissions
  assert(hasPermission(regularStaff, 'APPLICANT_VIEW'), 'Recruiter has APPLICANT_VIEW');
  assert(!hasPermission(regularStaff, 'DOCUMENT_VERIFY'), 'Recruiter is DENIED DOCUMENT_VERIFY');
  assert(!hasPermission(regularStaff, 'SETTINGS_MANAGE'), 'Recruiter is DENIED SETTINGS_MANAGE');

  // Check Document Officer permissions
  assert(hasPermission(documentOfficer, 'DOCUMENT_VERIFY'), 'Document Officer has DOCUMENT_VERIFY');
  assert(!hasPermission(documentOfficer, 'PAYMENT_VIEW'), 'Document Officer is DENIED PAYMENT_VIEW');

  // Check Admin permissions
  assert(hasPermission(adminUser, 'DASHBOARD_VIEW'), 'Admin has DASHBOARD_VIEW');
  assert(hasPermission(adminUser, 'AUDIT_VIEW'), 'Admin has AUDIT_VIEW');

  // Check Super Admin Universal Bypass
  assert(hasPermission(superAdminUser, 'SETTINGS_MANAGE'), 'SUPER_ADMIN automatically passes SETTINGS_MANAGE');
  assert(hasPermission(superAdminUser, 'DOCUMENT_VERIFY'), 'SUPER_ADMIN automatically passes DOCUMENT_VERIFY');
  assert(hasPermission(superAdminUser, 'PAYMENT_VIEW'), 'SUPER_ADMIN automatically passes PAYMENT_VIEW');

  // Check Deactivated Account Guard
  assert(!hasPermission(deactivatedUser, 'DASHBOARD_VIEW'), 'Deactivated user is DENIED all actions despite role permissions');

  console.log('\n====================================================');
  console.log(`PHASE 4 RBAC VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase4RBACTests().catch((err) => {
  console.error('Fatal error during Phase 4 tests:', err);
  process.exit(1);
});
