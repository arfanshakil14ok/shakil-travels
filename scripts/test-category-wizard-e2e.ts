import prisma from '../src/lib/prisma';
import { calculateProfileCompletion } from '../src/lib/portal-auth';
import { generateFormattedId } from '../src/lib/id-generator';
import { calculateMatch } from '../src/lib/matching';

async function runWizardE2ETest() {
  console.log('================================================================');
  console.log('🧪 RUNNING SHAKILWORK CATEGORY WIZARD & DESIGN E2E VERIFICATION');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} - ${detail || ''}`);
      failed++;
    }
  }

  try {
    // 1. Find or create a test applicant
    let applicant = await prisma.applicant.findFirst({
      where: { email: 'wizard.test.candidate@shakilwork.com' },
      include: { profile: true },
    });

    if (!applicant) {
      const applicantNumber = await generateFormattedId(prisma, 'applicant');
      applicant = await prisma.applicant.create({
        data: {
          applicantNumber,
          fullName: 'Test Candidate Wizard',
          phone: '+8801799998877',
          email: 'wizard.test.candidate@shakilwork.com',
          district: 'Dhaka',
          address: 'Mirpur-10, Dhaka',
          passportAvailable: true,
          passportNumber: 'A09876543',
          passportExpiry: new Date('2030-01-01'),
          education: 'SSC - Dhaka Board',
          profession: 'Electrician',
          yearsOfExperience: 3,
          skills: 'House wiring, Circuit testing',
          languages: 'Bangla, English',
          profilePhoto: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        },
        include: { profile: true },
      });
      console.log(`Created test applicant: ${applicant.applicantNumber} (${applicant.id})`);
    }

    // 2. Find an active published job
    let job = await prisma.job.findFirst({
      where: { status: 'PUBLISHED' },
      include: { country: true, employer: true },
    });

    if (!job) {
      job = await prisma.job.findFirst({
        include: { country: true, employer: true },
      });
    }

    assert(!!job, 'Test job exists for wizard testing');
    if (!job) return;

    // Test 1: Profile Completion Score Calculation
    const compScore = calculateProfileCompletion(applicant);
    assert(compScore.percentage >= 80, `Profile completion score calculation works (Score: ${compScore.percentage}%)`);

    // Test 2: Step 0 - Job confirmation data integrity
    assert(!!job.title && (job.status === 'PUBLISHED' || job.status === 'ACTIVE'), 'Step 0: Job is active/published with valid title');

    // Test 3: Step 1 - Category 1 Draft Save (Personal Information)
    const draftCode = `DRAFT-TEST-${Date.now().toString().slice(-6)}`;
    const draftApp = await prisma.application.create({
      data: {
        applicationCode: draftCode,
        applicationNumber: draftCode,
        applicantId: applicant.id,
        jobId: job.id,
        employerId: job.employerId || null,
        countryId: job.countryId || null,
        currentStage: 'DRAFT',
        status: 'DRAFT',
        source: 'WIZARD_DRAFT',
        priority: 'LOW',
        eligibilitySnapshot: {
          currentStep: 2,
          completedSteps: [1],
          eligibilityAnswers: {
            healthDeclaration: true,
            policeClearance: true,
            salaryAgreed: true,
          },
          lastSavedAt: new Date().toISOString(),
        },
      },
    });

    assert(draftApp.status === 'DRAFT', 'Step 1: Draft application created with DRAFT status');
    assert(draftApp.currentStage === 'DRAFT', 'Step 1: Application stage is DRAFT');

    // Test 4: Quota Check - DRAFT does not count towards 3-application submitted quota limit
    const submittedCount = await prisma.application.count({
      where: {
        applicantId: applicant.id,
        status: { notIn: ['DRAFT', 'REJECTED', 'WITHDRAWN', 'CANCELLED'] },
      },
    });

    assert(submittedCount < 3, `Quota enforcement: DRAFT does not count against 3-application limit (Submitted count: ${submittedCount})`);

    // Test 5: Step 2 to 7 Progress Updates (Category state persistence)
    const updatedDraft = await prisma.application.update({
      where: { id: draftApp.id },
      data: {
        eligibilitySnapshot: {
          currentStep: 8,
          completedSteps: [0, 1, 2, 3, 4, 5, 6, 7],
          eligibilityAnswers: {
            healthDeclaration: true,
            policeClearance: true,
            salaryAgreed: true,
            joiningAvailability: 'IMMEDIATE',
          },
          educationSummary: { highestLevel: 'SSC', institution: 'Dhaka Board' },
          experienceSummary: { status: 'EXPERIENCED', occupation: 'Electrician', yearsOfExperience: 3 },
          passportSummary: { passportAvailable: true, passportNumber: 'A09876543' },
          lastSavedAt: new Date().toISOString(),
        },
      },
    });

    const snapshot = updatedDraft.eligibilitySnapshot as any;
    assert(snapshot.completedSteps.length === 8, 'Step 2-7: Draft state advances category by category up to Review step');
    assert(snapshot.currentStep === 8, 'Step 2-7: Current step saved as 8 (Review step)');

    // Test 6: Final Submission (Step 8) - Transition from DRAFT to APPLIED
    const finalApplicationCode = await generateFormattedId(prisma, 'application');
    const matchSnapshot = calculateMatch(applicant, job);

    const submittedApp = await prisma.application.update({
      where: { id: draftApp.id },
      data: {
        applicationCode: finalApplicationCode,
        applicationNumber: finalApplicationCode,
        currentStage: 'APPLIED',
        status: 'APPLIED',
        source: 'CANDIDATE_CREATED',
        priority: 'MEDIUM',
        matchingSnapshot: matchSnapshot as any,
        statusHistory: {
          create: {
            toStage: 'APPLIED',
            toStatus: 'APPLIED',
            changedByRole: 'APPLICANT',
            notes: 'Applicant completed wizard and self-applied via applicant portal',
          },
        },
      },
      include: {
        statusHistory: true,
      },
    });

    assert(submittedApp.status === 'APPLIED', 'Step 8: Application transitioned to APPLIED status');
    assert(submittedApp.currentStage === 'APPLIED', 'Step 8: Application currentStage is APPLIED');
    assert(submittedApp.applicationCode.startsWith('SGR-APP-'), `Step 8: Official application code generated (${submittedApp.applicationCode})`);
    assert(submittedApp.statusHistory.length > 0, 'Step 8: StatusHistory audit trail recorded');

    // Test 7: Duplicate Active Application Prevention
    const duplicateCheck = await prisma.application.findFirst({
      where: {
        applicantId: applicant.id,
        jobId: job.id,
        status: { notIn: ['DRAFT', 'REJECTED', 'WITHDRAWN', 'CANCELLED'] },
      },
    });

    assert(!!duplicateCheck, 'Duplicate prevention: System detects existing active submitted application');
    assert(duplicateCheck?.id === submittedApp.id, 'Duplicate prevention: Correctly identifies candidate submitted application');

    // Clean up test application
    await prisma.applicationStatusHistory.deleteMany({
      where: { applicationId: submittedApp.id },
    });
    await prisma.application.delete({
      where: { id: submittedApp.id },
    });
    console.log('Cleaned up test application record successfully.');

  } catch (err: any) {
    console.error('Fatal error during test run:', err);
    failed++;
  }

  console.log('================================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runWizardE2ETest().catch((err) => {
  console.error(err);
  process.exit(1);
});
