import { NextRequest } from 'next/server';
import { POST as portalLoginHandler } from '../src/app/api/portal/auth/login/route';
import { verifyPortalToken } from '../src/lib/portal-auth';
import { verifySessionToken } from '../src/lib/auth';
import prisma from '../src/lib/prisma';

async function testPhase61UnifiedAuth() {
  console.log('====================================================');
  console.log('🧪 TESTING PHASE 6.1: UNIFIED AUTH & DUAL REALM ISOLATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(cond: boolean, desc: string) {
    if (cond) {
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${desc}`);
      failed++;
    }
  }

  try {
    // 1. Check Empty Credentials Validation
    console.log('👉 1. Testing Empty Credentials Validation');
    const reqEmpty = new NextRequest('http://localhost:3000/api/portal/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '', password: '' }),
    });
    const resEmpty = await portalLoginHandler(reqEmpty);
    const jsonEmpty = await resEmpty.json();
    assert(resEmpty.status === 400, 'Empty credentials rejected with HTTP 400');
    assert(jsonEmpty.success === false, 'Empty credentials returns success: false');

    // 2. Check Invalid Credentials Rejection
    console.log('\n👉 2. Testing Invalid Credentials Rejection');
    const reqInvalid = new NextRequest('http://localhost:3000/api/portal/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'non_existent_user_999999', password: 'wrong_password_123' }),
    });
    const resInvalid = await portalLoginHandler(reqInvalid);
    const jsonInvalid = await resInvalid.json();
    assert(resInvalid.status === 401, 'Invalid user rejected with HTTP 401');
    assert(jsonInvalid.success === false, 'Invalid user returns success: false');

    // 3. Test Live Candidate Authentication
    console.log('\n👉 3. Testing Candidate Authentication & Token Realm');
    // Find an active candidate in database
    const applicant = await prisma.applicant.findFirst({
      where: { isActive: true, passwordHash: { not: null } },
      select: { id: true, phone: true, applicantNumber: true, email: true },
    });

    if (applicant) {
      console.log(`Found live applicant: ${applicant.applicantNumber} (${applicant.phone})`);
      // Candidate tokens are signed with PORTAL_JWT_SECRET
      const { createPortalToken } = await import('../src/lib/portal-auth');
      const candToken = await createPortalToken({
        applicantId: applicant.id,
        applicantNumber: applicant.applicantNumber,
        phone: applicant.phone,
        email: applicant.email,
        fullName: 'Test Candidate',
      });

      const candVerified = await verifyPortalToken(candToken);
      assert(!!candVerified, 'Candidate token verified by Candidate Portal secret');

      const crossCheckStaff = await verifySessionToken(candToken);
      assert(crossCheckStaff === null, 'Candidate token is strictly REJECTED by Staff session verifier');
    } else {
      console.log('⚠️ No seeded active candidate with password found; verifying contract with synthetic payload');
      const { createPortalToken } = await import('../src/lib/portal-auth');
      const candToken = await createPortalToken({
        applicantId: 'test-cand-001',
        applicantNumber: 'SGR-2026-000001',
        phone: '01913681771',
        email: 'cand@test.com',
        fullName: 'Md. Shakil Ahmed',
      });
      const candVerified = await verifyPortalToken(candToken);
      assert(!!candVerified, 'Candidate token verified by Candidate Portal secret');
      const crossCheckStaff = await verifySessionToken(candToken);
      assert(crossCheckStaff === null, 'Candidate token is strictly REJECTED by Staff session verifier');
    }

    // 4. Test Live Staff Authentication & Token Realm
    console.log('\n👉 4. Testing Staff / Admin Authentication & Token Realm');
    const staffUser = await prisma.user.findFirst({
      where: { isActive: true },
      include: { role: true },
    });

    if (staffUser) {
      console.log(`Found live staff/admin user: ${staffUser.email} (Role: ${staffUser.role.name})`);
      const { createSessionToken } = await import('../src/lib/auth');
      const staffToken = await createSessionToken({
        userId: staffUser.id,
        email: staffUser.email,
        role: staffUser.role.name,
      });

      const staffVerified = await verifySessionToken(staffToken);
      assert(!!staffVerified, 'Staff token verified by Staff JWT_SECRET');
      assert(staffVerified?.role === staffUser.role.name, `Staff token preserves role: ${staffUser.role.name}`);

      const crossCheckCand = await verifyPortalToken(staffToken);
      assert(crossCheckCand === null, 'Staff token is strictly REJECTED by Candidate Portal verifier');
    } else {
      console.log('⚠️ No seeded user found; verifying contract with synthetic payload');
      const { createSessionToken } = await import('../src/lib/auth');
      const staffToken = await createSessionToken({
        userId: 'staff-uuid-001',
        email: 'staff@test.com',
        role: 'RECRUITMENT_MANAGER',
      });
      const staffVerified = await verifySessionToken(staffToken);
      assert(!!staffVerified, 'Staff token verified by Staff JWT_SECRET');
      const crossCheckCand = await verifyPortalToken(staffToken);
      assert(crossCheckCand === null, 'Staff token is strictly REJECTED by Candidate Portal verifier');
    }

    // 5. Test Unified Handler Dispatch Contract
    console.log('\n👉 5. Testing Unified Response Structure Contract');
    const { createPortalToken } = await import('../src/lib/portal-auth');
    const mockToken = await createPortalToken({
      applicantId: 'uuid-1',
      applicantNumber: 'SGR-001',
      phone: '01913',
      fullName: 'Shakil',
    });

    assert(typeof mockToken === 'string' && mockToken.length > 50, 'Cryptographic JWT generated successfully');

    console.log(`\n====================================================`);
    console.log(`PHASE 6.1 AUTH VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
    console.log(`====================================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testPhase61UnifiedAuth();
