import prisma from '../src/lib/prisma';
import { createPortalToken } from '../src/lib/portal-auth';
import { hashPassword } from '../src/lib/auth';

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

async function runV2Suite() {
  console.log('\n======================================================================');
  console.log('🌟 SHAKIL GLOBAL RECRUITMENT V2.0 — COMPREHENSIVE SYSTEM VERIFICATION');
  console.log('======================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // Phase 0: Staff / Admin Authentication
    // -------------------------------------------------------------------------
    console.log('👉 MODULE 0: Staff / Admin Authentication');
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@shakilglobal.com',
        password: 'Admin@SGR2026!',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    const adminRawCookie = adminLoginRes.headers.get('set-cookie') || '';
    const adminCookie = adminRawCookie.split(';')[0];

    assert(
      adminLoginRes.status === 200 && adminLoginData.success,
      'Staff ERP Authentication Successful',
      `Admin logged in: ${adminLoginData.data?.user?.email}`
    );

    // -------------------------------------------------------------------------
    // Phase 1: Unskilled Candidate Smart Registration & Profile Initialization
    // -------------------------------------------------------------------------
    console.log('\n👉 MODULE 1: Unskilled Smart Candidate Registration');
    const timestamp = Date.now();
    const unskilledPhone = `017${Math.floor(10000000 + Math.random() * 90000000)}`;
    const unskilledEmail = `unskilled.test.${timestamp}@shakilglobal.com`;

    const regRes = await fetch(`${BASE_URL}/api/portal/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Md. Dulal Hossain (V2 Test Candidate)',
        phone: unskilledPhone,
        email: unskilledEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        candidateType: 'UNSKILLED',
      }),
    });

    const regData = await regRes.json();
    assert(
      regRes.status === 201 && regData.success,
      'Unskilled Smart Registration Succeeds',
      `Applicant: ${regData.data?.applicant?.applicantNumber}`
    );

    const applicantId = regData.data?.applicant?.id;
    const applicantRecord = await prisma.applicant.findUnique({
      where: { id: applicantId },
      include: { profile: true, customer: true },
    });

    assert(
      applicantRecord?.candidateType === 'UNSKILLED',
      'PostgreSQL Candidate Record strictly reflects candidateType=UNSKILLED',
      `Type in DB: ${applicantRecord?.candidateType}`
    );

    assert(
      !!applicantRecord?.customer,
      'Unified Customer ERP Record Created for Unskilled Candidate',
      `Customer ID: ${applicantRecord?.customer?.id}`
    );

    // Create a candidate portal token
    const portalToken = await createPortalToken({
      applicantId: applicantRecord!.id,
      applicantNumber: applicantRecord!.applicantNumber,
      phone: applicantRecord!.phone,
      email: applicantRecord!.email,
      fullName: applicantRecord!.fullName,
    });
    const portalCookie = `sgr_portal_session=${portalToken}`;

    // -------------------------------------------------------------------------
    // Phase 2: Training Courses, Categories & Centers Discovery
    // -------------------------------------------------------------------------
    console.log('\n👉 MODULE 2: Skill Training Ecosystem & Course Discovery');
    const coursesRes = await fetch(`${BASE_URL}/api/training/courses`);
    const coursesData = await coursesRes.json();
    const coursesList = coursesData.data?.courses || [];
    const categoriesList = coursesData.data?.categories || [];

    assert(
      coursesRes.status === 200 && coursesData.success,
      'Public Training Courses API Accessible',
      `Returned ${coursesList.length} courses across ${categoriesList.length} categories`
    );

    const testCourse = coursesList[0];
    assert(
      !!testCourse && testCourse.batches?.length > 0,
      'Active Training Course Found with Upcoming Batches',
      `Course: ${testCourse?.title}, Batches: ${testCourse?.batches?.length}`
    );

    const targetBatch = testCourse?.batches?.[0];

    const centersRes = await fetch(`${BASE_URL}/api/training/centers`);
    const centersData = await centersRes.json();
    assert(
      centersRes.status === 200 && centersData.success && centersData.data?.length > 0,
      'Accredited Training Centers Directory Accessible',
      `Found ${centersData.data?.length} accredited training centers`
    );

    // -------------------------------------------------------------------------
    // Phase 3: Training Application & Candidate Portal Tracking
    // -------------------------------------------------------------------------
    console.log('\n👉 MODULE 3: Training Application & Portal Enrollment Tracking');
    const applyRes = await fetch(`${BASE_URL}/api/portal/training/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: portalCookie,
      },
      body: JSON.stringify({
        courseId: testCourse.id,
        batchId: targetBatch.id,
        centerId: targetBatch.centerId,
        trainingTrack: 'TECHNICAL',
        notes: 'Seeking technical pipe welding training for Gulf employment.',
      }),
    });

    const applyData = await applyRes.json();
    assert(
      (applyRes.status === 200 || applyRes.status === 201) && applyData.success,
      'Candidate Successfully Applies for Training Batch',
      `Application Code: ${applyData.data?.applicationCode}, Status: ${applyData.data?.status}`
    );

    // Query candidate portal my-trainings
    const myTrainingsRes = await fetch(`${BASE_URL}/api/portal/training/my-trainings`, {
      headers: { Cookie: portalCookie },
    });
    const myTrainingsData = await myTrainingsRes.json();
    assert(
      myTrainingsRes.status === 200 && myTrainingsData.success,
      'Candidate Portal Retrieves My Trainings Dashboard',
      `Applications: ${myTrainingsData.data?.applications?.length}, Batches: ${myTrainingsData.data?.enrollments?.length}`
    );

    // -------------------------------------------------------------------------
    // Phase 4: Atomic Training-to-Recruitment Bridge Execution
    // -------------------------------------------------------------------------
    console.log('\n👉 MODULE 4: Atomic Training-to-Recruitment Bridge Execution');
    const bridgeRes = await fetch(`${BASE_URL}/api/training/complete-bridge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        applicantId: applicantRecord!.id,
        courseId: testCourse.id,
        batchId: targetBatch.id,
        centerId: targetBatch.centerId,
        theoryScore: 92,
        practicalScore: 95,
        totalScore: 94,
        grade: 'A+',
        remarks: 'Outstanding practical pipe welding mastery.',
      }),
    });

    const bridgeData = await bridgeRes.json();
    assert(
      (bridgeRes.status === 200 || bridgeRes.status === 201) && bridgeData.success,
      'Training-to-Recruitment Bridge Successfully Certified Candidate',
      `Certificate Number: ${bridgeData.data?.certificate?.certificateNumber}, Grade: ${bridgeData.data?.certificate?.grade}`
    );

    // Verify upgrade in database: candidateType must now be 'SKILLED'
    const upgradedApplicant = await prisma.applicant.findUnique({
      where: { id: applicantRecord!.id },
      include: {
        candidateSkills: true,
        trainingCertificates: true,
      },
    });

    assert(
      upgradedApplicant?.candidateType === 'SKILLED',
      'CandidateType Atomically Promoted from UNSKILLED to SKILLED',
      `Upgraded Status in DB: ${upgradedApplicant?.candidateType}`
    );

    assert(
      upgradedApplicant?.candidateSkills?.length! > 0,
      'Verified CandidateSkill Automatically Registered from Completed Course',
      `Skill: ${upgradedApplicant?.candidateSkills[0]?.skillName}, Level: ${upgradedApplicant?.candidateSkills[0]?.proficiencyLevel}, Verified: ${upgradedApplicant?.candidateSkills[0]?.isVerified}`
    );

    assert(
      Array.isArray(bridgeData.data?.recommendedJobs),
      'Bridge Returned Matching Job Recommendations for Newly Certified Candidate',
      `Found ${bridgeData.data?.recommendedJobs?.length} matching jobs`
    );

    // -------------------------------------------------------------------------
    // Phase 5: Public Certificate Verification Endpoint
    // -------------------------------------------------------------------------
    console.log('\n👉 MODULE 5: Public Certificate Verification (RL-1892)');
    const certNumber = bridgeData.data?.certificate?.certificateNumber;
    const verifyRes = await fetch(`${BASE_URL}/api/certificates/verify/${certNumber}`);
    const verifyData = await verifyRes.json();

    assert(
      verifyRes.status === 200 && verifyData.success,
      'Public Certificate Verification Endpoint Validates Authentic Certificate',
      `Verified Certificate: ${verifyData.data?.certificateNumber}, Student: ${verifyData.data?.candidateName}`
    );

    assert(
      verifyData.data?.agencyLicense === 'RL-1892',
      'Verification Output Confirms Official Agency License RL-1892',
      `License: ${verifyData.data?.agencyLicense}, Agency: ${verifyData.data?.issuingAgency}`
    );

    // Check invalid certificate verification
    const invalidVerifyRes = await fetch(`${BASE_URL}/api/certificates/verify/INVALID-NONEXISTENT-999`);
    assert(
      invalidVerifyRes.status === 404,
      'Public Certificate Verification Rejects Fake/Nonexistent Certificate (404)',
      `Status: ${invalidVerifyRes.status}`
    );

    // -------------------------------------------------------------------------
    // Phase 6: Post-Selection Medical Processing (GAMCA)
    // -------------------------------------------------------------------------
    console.log('\n👉 MODULE 6: Post-Selection Medical & GAMCA Operations');
    // Find or create an application for this applicant to link post-selection operations
    const activeJob = await prisma.job.findFirst({
      where: { status: 'PUBLISHED' },
    });

    let application = await prisma.application.create({
      data: {
        applicationCode: `SGR-APP-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        applicantId: applicantRecord!.id,
        jobId: activeJob!.id,
        status: 'SELECTED',
        currentStage: 'MEDICAL_PROCESSING',
      },
    });

    // Staff creates medical record
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@shakilglobal.com' },
    });

    const medicalRecord = await prisma.medicalRecord.create({
      data: {
        applicationId: application.id,
        applicantId: applicantRecord!.id,
        medicalCenterName: 'Al-Farabi Medical & Diagnostic Center (GAMCA Approved)',
        appointmentDate: new Date(Date.now() + 86400000),
        examinationDate: new Date(),
        result: 'SCHEDULED',
        gamcaNumber: `GAMCA-GCC-${timestamp}`,
        reviewedById: adminUser?.id,
        remarks: 'Blood sample & Chest X-ray collected.',
      },
    });

    assert(
      !!medicalRecord.id,
      'GAMCA Medical Examination Scheduled & Persisted',
      `Center: ${medicalRecord.medicalCenterName}, GAMCA Slip: ${medicalRecord.gamcaNumber}`
    );

    // Update medical to PASSED
    const updatedMed = await prisma.medicalRecord.update({
      where: { id: medicalRecord.id },
      data: {
        result: 'PASSED',
        fitnessExpiryDate: new Date(Date.now() + 90 * 86400000),
        remarks: 'Fit for overseas employment in GCC countries.',
      },
    });

    assert(
      updatedMed.result === 'PASSED',
      'Clinical Medical Fitness Successfully Certified as PASSED',
      `Result: ${updatedMed.result}, Fitness Expiry: ${updatedMed.fitnessExpiryDate?.toISOString().substring(0, 10)}`
    );

    // -------------------------------------------------------------------------
    // Phase 7: BMET Emigration Clearance & Smart Card
    // -------------------------------------------------------------------------
    console.log('\n👉 MODULE 7: BMET Emigration Clearance & Smart Card Issuance');
    const clearanceRecord = await prisma.clearanceRecord.create({
      data: {
        applicationId: application.id,
        applicantId: applicantRecord!.id,
        clearanceType: 'BMET_EMIGRATION',
        submissionDate: new Date(),
        status: 'SUBMITTED',
        reviewedById: adminUser?.id,
        remarks: 'Submitted to BMET online portal with employer visa copy.',
      },
    });

    assert(
      !!clearanceRecord.id,
      'BMET Emigration Clearance File Created',
      `Clearance Type: ${clearanceRecord.clearanceType}, Status: ${clearanceRecord.status}`
    );

    // Approve & issue BMET Smart Card
    const approvedClearance = await prisma.clearanceRecord.update({
      where: { id: clearanceRecord.id },
      data: {
        status: 'APPROVED',
        approvalDate: new Date(),
        smartCardNumber: `BMET-SC-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        certificateNumber: `BMET-CERT-${timestamp}`,
        remarks: 'Smart Emigration Card printed and ready for airport clearance.',
      },
    });

    assert(
      approvedClearance.status === 'APPROVED' && !!approvedClearance.smartCardNumber,
      'BMET Emigration Clearance APPROVED and Smart Card Issued',
      `Smart Card Number: ${approvedClearance.smartCardNumber}, Approval Date: ${approvedClearance.approvalDate?.toISOString().substring(0, 10)}`
    );

    // -------------------------------------------------------------------------
    // Phase 8: Flight Booking, PNR & Airport Dispatch
    // -------------------------------------------------------------------------
    console.log('\n👉 MODULE 8: Flight Booking & Airport Dispatch Operations');
    const departureRecord = await prisma.departureRecord.create({
      data: {
        applicationId: application.id,
        applicantId: applicantRecord!.id,
        airline: 'Biman Bangladesh Airlines',
        flightNumber: 'BG-045',
        ticketNumber: `098-${timestamp.toString().substring(3)}`,
        departureDate: new Date(Date.now() + 7 * 86400000),
        departureAirport: 'DAC - Hazrat Shahjalal International Airport, Dhaka',
        destinationAirport: 'RUH - King Khalid International Airport, Riyadh',
        pnrNumber: '7X9K2L',
        status: 'SCHEDULED',
        reportingInstructions: 'Report to Terminal 1 at 18:00 hrs with original passport, BMET Smart Card, and GAMCA fitness slip.',
        managedById: adminUser?.id,
      },
    });

    assert(
      !!departureRecord.id && departureRecord.status === 'SCHEDULED',
      'Flight Ticket & Departure Dispatch Scheduled',
      `Airline: ${departureRecord.airline}, Flight: ${departureRecord.flightNumber}, PNR: ${departureRecord.pnrNumber}`
    );

    // Verify candidate portal sees all post-selection records
    const portalVisaRes = await fetch(`${BASE_URL}/api/portal/visa`, {
      headers: { Cookie: portalCookie },
    });
    const portalVisaData = await portalVisaRes.json();

    assert(
      portalVisaRes.status === 200 && portalVisaData.success,
      'Candidate Portal /api/portal/visa Loads Post-Selection Operations',
      `Medical Records: ${portalVisaData.medicalRecords?.length}, Clearances: ${portalVisaData.clearanceRecords?.length}, Flights: ${portalVisaData.departureRecords?.length}`
    );

    assert(
      portalVisaData.medicalRecords?.[0]?.gamcaNumber === updatedMed.gamcaNumber,
      'Candidate Accurately Receives GAMCA Medical Record in Portal',
      `GAMCA Number: ${portalVisaData.medicalRecords?.[0]?.gamcaNumber}`
    );

    assert(
      portalVisaData.clearanceRecords?.[0]?.smartCardNumber === approvedClearance.smartCardNumber,
      'Candidate Accurately Receives BMET Smart Card in Portal',
      `Smart Card Number: ${portalVisaData.clearanceRecords?.[0]?.smartCardNumber}`
    );

    assert(
      portalVisaData.departureRecords?.[0]?.pnrNumber === departureRecord.pnrNumber,
      'Candidate Accurately Receives Flight Ticket & PNR in Portal',
      `PNR: ${portalVisaData.departureRecords?.[0]?.pnrNumber}, Flight: ${portalVisaData.departureRecords?.[0]?.flightNumber}`
    );

    // -------------------------------------------------------------------------
    // Phase 9: Candidate Support Helpdesk & Bidirectional Messaging
    // -------------------------------------------------------------------------
    console.log('\n👉 MODULE 9: Candidate Support Desk & Bidirectional Ticketing');
    // Candidate creates ticket
    const ticketRes = await fetch(`${BASE_URL}/api/support/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: portalCookie,
      },
      body: JSON.stringify({
        subject: 'Airport briefing timing query',
        category: 'VISA',
        priority: 'HIGH',
        message: 'Could you please confirm whether I need to bring 4 or 6 passport size photos at airport reporting?',
      }),
    });

    const ticketData = await ticketRes.json();
    assert(
      ticketRes.status === 200 && ticketData.success,
      'Candidate Successfully Opens Official Support Ticket',
      `Ticket: ${ticketData.data?.ticketNumber}, Subject: ${ticketData.data?.subject}`
    );

    const ticketId = ticketData.data?.id;

    // Staff responds to ticket
    const staffReplyRes = await fetch(`${BASE_URL}/api/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        message: 'Please bring 6 passport-size photographs with white background, along with your original BMET Smart Card.',
      }),
    });

    const staffReplyData = await staffReplyRes.json();
    assert(
      staffReplyRes.status === 200 && staffReplyData.success,
      'Staff Officer Successfully Posts Official Response to Ticket',
      `Sender Type: ${staffReplyData.data?.senderType}`
    );

    // Candidate adds follow-up message
    const candidateFollowUpRes = await fetch(`${BASE_URL}/api/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: portalCookie,
      },
      body: JSON.stringify({
        message: 'Understood. Thank you very much for the clarification!',
      }),
    });

    const candidateFollowUpData = await candidateFollowUpRes.json();
    assert(
      candidateFollowUpRes.status === 200 && candidateFollowUpData.success,
      'Candidate Successfully Replies in Conversation Thread',
      `Sender: ${candidateFollowUpData.data?.senderType}`
    );

    // Fetch full ticket details
    const getTicketRes = await fetch(`${BASE_URL}/api/support/tickets/${ticketId}`, {
      headers: { Cookie: portalCookie },
    });
    const getTicketData = await getTicketRes.json();

    assert(
      getTicketRes.status === 200 && getTicketData.data?.messages?.length >= 3,
      'Ticket Message History Complete with 3 Bidirectional Messages',
      `Total Messages: ${getTicketData.data?.messages?.length}`
    );

    // Staff resolves ticket
    const resolveRes = await fetch(`${BASE_URL}/api/support/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ status: 'RESOLVED' }),
    });
    const resolveData = await resolveRes.json();

    assert(
      resolveRes.status === 200 && resolveData.data?.status === 'RESOLVED',
      'Support Ticket Status Successfully Updated to RESOLVED',
      `Resolved Status: ${resolveData.data?.status}`
    );

  } catch (error: any) {
    console.error('Fatal test error:', error);
    failedTests++;
  }

  console.log('\n======================================================================');
  console.log(`📊 V2 SUITE RESULTS: ${passedTests} PASSED | ${failedTests} FAILED (TOTAL: ${totalTests})`);
  console.log('======================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runV2Suite().then(() => {
  prisma.$disconnect();
});
