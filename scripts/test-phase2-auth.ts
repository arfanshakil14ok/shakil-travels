import { createPortalToken, verifyPortalToken } from '../src/lib/portal-auth';
import { createSessionToken, verifySessionToken } from '../src/lib/auth';

async function testPhase2Auth() {
  console.log('====================================================');
  console.log('🧪 TESTING PHASE 2 BACKEND DUAL AUTHENTICATION TOKENS');
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
    // 1. Candidate Token Generation & Verification
    console.log('👉 1. Testing Candidate JWT Token Generation & Verification');
    const candPayload = {
      applicantId: 'applicant-uuid-001',
      applicantNumber: 'SGR-2026-000001',
      phone: '01913681771',
      email: 'candidate@shakiltravels.com',
      fullName: 'Md. Shakil Ahmed',
    };

    const candToken = await createPortalToken(candPayload);
    assert(typeof candToken === 'string' && candToken.length > 50, 'Candidate token successfully created');

    const verifiedCand = await verifyPortalToken(candToken);
    assert(!!verifiedCand, 'Candidate token verified with PORTAL_JWT_SECRET');
    assert(verifiedCand?.applicantNumber === 'SGR-2026-000001', 'Candidate applicant number preserved in token');
    assert(verifiedCand?.phone === '01913681771', 'Candidate phone preserved in token');

    // 2. Staff / Admin Token Generation & Verification
    console.log('\n👉 2. Testing Staff / Admin JWT Token Generation & Verification');
    const staffPayload = {
      userId: 'user-staff-uuid-002',
      email: 'staff@shakilglobal.com',
      role: 'RECRUITMENT_STAFF',
    };

    const staffToken = await createSessionToken(staffPayload);
    assert(typeof staffToken === 'string' && staffToken.length > 50, 'Staff token successfully created');

    const verifiedStaff = await verifySessionToken(staffToken);
    assert(!!verifiedStaff, 'Staff token verified with JWT_SECRET');
    assert(verifiedStaff?.email === 'staff@shakilglobal.com', 'Staff email preserved in token');
    assert(verifiedStaff?.role === 'RECRUITMENT_STAFF', 'Staff role preserved in token');

    // 3. Cryptographic Token Isolation Test
    console.log('\n👉 3. Testing Token Isolation (Candidate token must NOT authenticate staff & vice versa)');
    const crossCheckStaff = await verifySessionToken(candToken);
    assert(crossCheckStaff === null, 'Candidate token is REJECTED by Staff JWT verifier (Different secret/audience)');

    const crossCheckCand = await verifyPortalToken(staffToken);
    assert(crossCheckCand === null, 'Staff token is REJECTED by Candidate JWT verifier');

    console.log(`\n====================================================`);
    console.log(`PHASE 2 AUTH VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
    console.log(`====================================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  }
}

testPhase2Auth();
