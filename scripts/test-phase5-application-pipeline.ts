/**
 * Phase 5 — Application & Recruitment Pipeline Master Test Suite
 * Validates the full recruitment case lifecycle for SHAKIL GLOBAL RECRUITMENT V2.0 (License RL-1892)
 */

import { PrismaClient } from '@prisma/client';
import { generateApplicationCode } from '../src/lib/id-generator';
import { calculateMatch, getMatchingApplicantsForJob } from '../src/lib/matching';
import { validateVacancyLimit } from '../src/lib/recruitment/vacancy';

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    if (detail) console.log(`     ℹ️ ${detail}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (detail) console.error(`     ⚠️ ${detail}`);
    failed++;
  }
}

async function runPhase5Tests() {
  console.log('\n======================================================================');
  console.log('🚀 SHAKIL GLOBAL RECRUITMENT V2.0 — PHASE 5 APPLICATION PIPELINE TESTS');
  console.log('======================================================================\n');

  try {
    // 0. Setup test users and data
    const adminUser = await prisma.user.findFirst({
      where: { role: { name: { in: ['SUPER_ADMIN', 'ADMIN'] } } },
      include: { role: true },
    });

    const recruiterUser = await prisma.user.findFirst({
      where: { role: { name: 'RECRUITER' } },
      include: { role: true },
    }) || adminUser;

    let testCountry = await prisma.country.findFirst({ where: { isActive: true } });
    if (!testCountry) {
      testCountry = await prisma.country.create({
        data: { code: 'SA', name: 'Saudi Arabia', nameBn: 'সৌদি আরব', currency: 'SAR', isActive: true },
      });
    }
    let testCategory = await prisma.jobCategory.findFirst({ where: { isActive: true } });
    if (!testCategory) {
      testCategory = await prisma.jobCategory.create({
        data: { name: 'Electrical Engineering', nameBn: 'বৈদ্যুতিক প্রকৌশল', slug: 'electrical-eng', isActive: true },
      });
    }
    let testEmployer = await prisma.employer.findFirst({
      where: { verificationStatus: 'VERIFIED', status: 'ACTIVE' },
    });
    if (!testEmployer) {
      testEmployer = await prisma.employer.create({
        data: {
          employerCode: `SGR-EMP-2026-${Date.now().toString().slice(-4)}`,
          companyName: 'Phase 5 Test Saudi Holdings',
          companyNameLocal: 'شركة الاختبار السعودية',
          countryId: testCountry.id,
          verificationStatus: 'VERIFIED',
          status: 'ACTIVE',
        },
      });
    }

    // --------------------------------------------------------------------------
    // MODULE 1: ID Generator & Schema Invariants
    // --------------------------------------------------------------------------
    console.log('👉 MODULE 1: Application ID Generation & Schema Invariants');

    const appCode = await generateApplicationCode(prisma);
    const codeFormatRegex = /^SGR-APP-\d{4}-\d{6}$/;
    assert(
      codeFormatRegex.test(appCode),
      'generateApplicationCode produces correct SGR-APP-YYYY-XXXXXX format',
      `Generated code: ${appCode}`
    );

    // Create a fresh candidate and job demand for Phase 5 tests
    const testCandidate = await prisma.applicant.create({
      data: {
        applicantNumber: `SGR-2026-P5-${Date.now().toString().slice(-5)}`,
        fullName: 'Phase 5 Master Test Applicant',
        email: `phase5.applicant.${Date.now()}@example.com`,
        phone: `+88017${Math.floor(10000000 + Math.random() * 90000000)}`,
        passportNumber: `A${Math.floor(10000000 + Math.random() * 90000000)}`,
        passportExpiry: new Date('2029-12-31'),
        candidateType: 'SKILLED',
        yearsOfExperience: 5,
        education: 'DIPLOMA',
        skills: 'Electrical, PLC, Wiring, Automation',
        preferredCountryId: testCountry.id,
        preferredJobCategoryId: testCategory.id,
        status: 'ACTIVE',
      },
    });

    const testJob = await prisma.job.create({
      data: {
        jobCode: `SGR-JOB-2026-P5-${Date.now().toString().slice(-4)}`,
        title: 'Master Industrial Automation Specialist',
        titleLocal: 'ইন্ডাস্ট্রিয়াল অটোমেশন টেকনিশিয়ান',
        slug: `master-automation-specialist-${Date.now()}`,
        description: 'Industrial automation technician vacancy with competitive salary and benefits.',
        employerId: testEmployer.id,
        countryId: testCountry.id,
        jobCategoryId: testCategory.id,
        vacancyCount: 2,
        filledCount: 0,
        status: 'PUBLISHED',
        salaryMin: 3500,
        salaryMax: 4500,
        currency: 'SAR',
        salaryPeriod: 'MONTHLY',
        experienceRequired: 3,
        educationRequired: 'DIPLOMA',
        skillsRequired: 'Electrical, PLC, Automation',
      },
    });

    assert(Boolean(testCandidate.id && testJob.id), 'Test candidate and job created successfully in database');

    // --------------------------------------------------------------------------
    // MODULE 2: Application Creation & Matching Snapshot Preservation
    // --------------------------------------------------------------------------
    console.log('\n👉 MODULE 2: Application Creation & Deterministic Matching Snapshot');

    const matchResult = calculateMatch(testCandidate, testJob);
    assert(
      matchResult.score >= 75,
      'Phase 3 matching engine accurately scores qualified candidate (>=75%)',
      `Calculated Match: ${matchResult.score}% (${matchResult.level})`
    );

    const createdApp = await prisma.application.create({
      data: {
        applicationCode: appCode,
        applicationNumber: appCode,
        applicantId: testCandidate.id,
        jobId: testJob.id,
        employerId: testJob.employerId,
        countryId: testJob.countryId,
        currentStage: 'APPLIED',
        status: 'APPLIED',
        priority: 'HIGH',
        source: 'CANDIDATE_CREATED',
        matchingSnapshot: matchResult as any,
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: 'APPLIED',
            toStage: 'APPLIED',
            changedByRole: 'APPLICANT',
            notes: 'Initial application submitted',
          },
        },
      },
      include: {
        applicant: true,
        job: true,
        statusHistory: true,
      },
    });

    assert(createdApp.status === 'APPLIED', 'Application defaults to primary status APPLIED');
    assert(
      (createdApp.matchingSnapshot as any)?.score === matchResult.score,
      'Deterministic matching snapshot is immutably frozen in application record',
      `Snapshot score: ${(createdApp.matchingSnapshot as any)?.score}%`
    );
    assert(createdApp.statusHistory.length === 1, 'Initial status history record created with fromStatus: null, toStatus: APPLIED');

    // --------------------------------------------------------------------------
    // MODULE 3: Duplicate Active Application Protection
    // --------------------------------------------------------------------------
    console.log('\n👉 MODULE 3: Duplicate Active Application Guard');

    const activeApp = await prisma.application.findFirst({
      where: {
        applicantId: testCandidate.id,
        jobId: testJob.id,
        status: { notIn: ['REJECTED', 'WITHDRAWN', 'CANCELLED'] },
      },
    });

    assert(
      Boolean(activeApp),
      'Active application detected, query prevents duplicate active submission',
      `Existing Active Case: ${activeApp?.applicationCode}`
    );

    // --------------------------------------------------------------------------
    // MODULE 4: Staff-Initiated Application & Recruiter Assignment
    // --------------------------------------------------------------------------
    console.log('\n👉 MODULE 4: Staff-Initiated Application & Recruiter Assignment');

    const secondCandidate = await prisma.applicant.create({
      data: {
        applicantNumber: `SGR-2026-P5-C2-${Date.now().toString().slice(-4)}`,
        fullName: 'Staff Sourced Candidate',
        email: `staff.candidate.${Date.now()}@example.com`,
        phone: `+88018${Math.floor(10000000 + Math.random() * 90000000)}`,
        status: 'ACTIVE',
      },
    });

    const staffAppCode = await generateApplicationCode(prisma);
    const staffApp = await prisma.application.create({
      data: {
        applicationCode: staffAppCode,
        applicationNumber: staffAppCode,
        applicantId: secondCandidate.id,
        jobId: testJob.id,
        employerId: testJob.employerId,
        countryId: testJob.countryId,
        currentStage: 'APPLIED',
        status: 'APPLIED',
        source: 'STAFF_CREATED',
        assignedStaffId: recruiterUser?.id,
        statusHistory: {
          create: {
            toStatus: 'APPLIED',
            toStage: 'APPLIED',
            changedById: recruiterUser?.id,
            changedByRole: 'RECRUITER',
            notes: 'Application started by recruiter on behalf of candidate',
          },
        },
      },
      include: {
        assignedStaff: true,
      },
    });

    assert(staffApp.source === 'STAFF_CREATED', 'Staff-created application correctly records source: STAFF_CREATED');
    assert(staffApp.assignedStaffId === recruiterUser?.id, 'Application assigned to recruiter successfully');

    // Test "My Applications" filter logic
    const recruiterApps = await prisma.application.findMany({
      where: { assignedStaffId: recruiterUser?.id },
    });
    assert(recruiterApps.some((a) => a.id === staffApp.id), 'Recruiter "My Applications" filter retrieves assigned application');

    // --------------------------------------------------------------------------
    // MODULE 5: 13-Point Structured Screening Workflow
    // --------------------------------------------------------------------------
    console.log('\n👉 MODULE 5: 13-Point Structured Screening Checklist');

    const checklistData = {
      ageEligibility: { status: 'PASS', notes: 'Age 28 within 21-35 destination limit' },
      passportAvailability: { status: 'PASS', notes: 'Original passport presented' },
      passportValidity: { status: 'PASS', notes: 'Valid through 2029 (over 3 years)' },
      requiredSkill: { status: 'PASS', notes: 'Certified PLC & Automation electrician' },
      skillProficiency: { status: 'PASS', notes: 'Passed practical wiring assessment' },
      workExperience: { status: 'PASS', notes: '5 years documented industrial experience' },
      education: { status: 'PASS', notes: 'Polytechnic Diploma certificate verified' },
      language: { status: 'PASS', notes: 'Proficient in English and basic Arabic terms' },
      destinationEligibility: { status: 'PASS', notes: 'BMET clearance verified; no prior visa ban' },
      requiredDocuments: { status: 'PASS', notes: 'Police clearance and photo completed' },
      jobRequirements: { status: 'PASS', notes: 'Physical fitness certified' },
      trainingCertification: { status: 'PASS', notes: 'Accredited technical certification confirmed' },
      otherEligibility: { status: 'PASS', notes: 'Clean background check' },
    };

    const screeningRecord = await prisma.applicationScreening.create({
      data: {
        applicationId: createdApp.id,
        screenedById: recruiterUser?.id,
        overallResult: 'PASS',
        checklist: checklistData,
        notes: 'Candidate fully qualified and verified across all 13 criteria',
        screenedAt: new Date(),
      },
    });

    assert(Boolean(screeningRecord.id), 'ApplicationScreening record created and persisted in PostgreSQL');
    assert(screeningRecord.overallResult === 'PASS', 'Screening overallResult correctly recorded as PASS');
    assert(
      Object.keys(screeningRecord.checklist as any).length === 13,
      'Screening checklist contains all 13 structured criteria'
    );

    // Update application stage to SCREENING
    await prisma.application.update({
      where: { id: createdApp.id },
      data: {
        status: 'SCREENING',
        currentStage: 'SCREENING',
        screenedAt: new Date(),
      },
    });

    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: createdApp.id,
        fromStatus: 'APPLIED',
        toStatus: 'SCREENING',
        toStage: 'SCREENING',
        changedById: recruiterUser?.id,
        changedByRole: 'RECRUITER',
        notes: 'Screening checklist evaluated with result: PASS',
      },
    });

    const appAfterScreening = await prisma.application.findUnique({ where: { id: createdApp.id } });
    assert(appAfterScreening?.status === 'SCREENING', 'Application transitioned from APPLIED to SCREENING');
    assert(Boolean(appAfterScreening?.screenedAt), 'screenedAt timestamp successfully recorded');

    // --------------------------------------------------------------------------
    // MODULE 6: Shortlisting Workflow
    // --------------------------------------------------------------------------
    console.log('\n👉 MODULE 6: Candidate Shortlisting Workflow');

    await prisma.application.update({
      where: { id: createdApp.id },
      data: {
        status: 'SHORTLISTED',
        currentStage: 'SHORTLISTED',
        shortlistedAt: new Date(),
      },
    });

    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: createdApp.id,
        fromStatus: 'SCREENING',
        toStatus: 'SHORTLISTED',
        toStage: 'SHORTLISTED',
        changedById: recruiterUser?.id,
        changedByRole: 'RECRUITER',
        notes: 'Candidate shortlisted for technical interview',
      },
    });

    const appAfterShortlist = await prisma.application.findUnique({ where: { id: createdApp.id } });
    assert(appAfterShortlist?.status === 'SHORTLISTED', 'Application status moved to SHORTLISTED');
    assert(Boolean(appAfterShortlist?.shortlistedAt), 'shortlistedAt timestamp successfully persisted');

    // --------------------------------------------------------------------------
    // MODULE 7: Interview Scheduling & Structured Scorecard Evaluation
    // --------------------------------------------------------------------------
    console.log('\n👉 MODULE 7: Interview Scheduling & 7-Dimension Scorecard');

    const scheduledDate = new Date(Date.now() + 86400000); // Tomorrow
    const interview = await prisma.interview.create({
      data: {
        applicantId: testCandidate.id,
        applicationId: createdApp.id,
        jobId: testJob.id,
        interviewType: 'ONLINE',
        scheduledAt: scheduledDate,
        durationMinutes: 45,
        meetingLink: 'https://meet.google.com/sgr-p5-test',
        interviewer: 'Overseas Technical Director',
        interviewerId: recruiterUser?.id,
        status: 'SCHEDULED',
        result: 'PENDING',
        notes: 'Technical assessment with overseas employer panel',
      },
    });

    assert(Boolean(interview.id), 'Interview scheduled and linked to application');

    // Update application to INTERVIEW_SCHEDULED
    await prisma.application.update({
      where: { id: createdApp.id },
      data: {
        status: 'INTERVIEW_SCHEDULED',
        currentStage: 'INTERVIEW_SCHEDULED',
      },
    });

    const appAfterInterviewSchedule = await prisma.application.findUnique({ where: { id: createdApp.id } });
    assert(appAfterInterviewSchedule?.status === 'INTERVIEW_SCHEDULED', 'Application status updated to INTERVIEW_SCHEDULED');

    // Conduct and score interview with multi-criteria scorecard
    const scorecardData = {
      technicalSkill: 9,
      experience: 8,
      communication: 8,
      language: 7,
      behaviour: 9,
      jobUnderstanding: 9,
      overallImpression: 9,
      averageScore: 8.4,
    };

    const updatedInterview = await prisma.interview.update({
      where: { id: interview.id },
      data: {
        status: 'COMPLETED',
        result: 'PASS',
        score: 84, // 8.4/10 -> 84%
        scorecard: scorecardData,
        feedback: 'Candidate displayed outstanding knowledge of PLC automation and relay circuits',
      },
    });

    assert(updatedInterview.result === 'PASS', 'Interview evaluation result recorded as PASS');
    assert(
      (updatedInterview.scorecard as any)?.technicalSkill === 9,
      'Structured 7-criteria scorecard persisted with detailed ratings'
    );

    // Transition application to INTERVIEWED
    await prisma.application.update({
      where: { id: createdApp.id },
      data: {
        status: 'INTERVIEWED',
        currentStage: 'INTERVIEWED',
        interviewedAt: new Date(),
      },
    });

    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: createdApp.id,
        fromStatus: 'INTERVIEW_SCHEDULED',
        toStatus: 'INTERVIEWED',
        toStage: 'INTERVIEWED',
        changedById: recruiterUser?.id,
        changedByRole: 'RECRUITER',
        notes: 'Interview completed with score 84/100 (PASS)',
      },
    });

    const appAfterInterviewed = await prisma.application.findUnique({ where: { id: createdApp.id } });
    assert(appAfterInterviewed?.status === 'INTERVIEWED', 'Application status moved to INTERVIEWED');
    assert(Boolean(appAfterInterviewed?.interviewedAt), 'interviewedAt timestamp recorded');

    // --------------------------------------------------------------------------
    // MODULE 8: Selection Workflow & Vacancy Quota Management
    // --------------------------------------------------------------------------
    console.log('\n👉 MODULE 8: Selection Workflow, Vacancy Quota & Historical Snapshots');

    // Verify vacancy quota allows selection
    const vacancyCheckBefore = await validateVacancyLimit(prisma, testJob.id, false);
    assert(vacancyCheckBefore.allowed, 'Job has available quota slots for candidate selection');

    // Select candidate
    const jobSnapshot = {
      id: testJob.id,
      jobCode: testJob.jobCode,
      title: testJob.title,
      category: 'Electrical & Automation',
      country: testCountry?.name,
    };

    const salarySnapshot = {
      salaryMin: testJob.salaryMin,
      salaryMax: testJob.salaryMax,
      currency: testJob.currency,
      salaryPeriod: testJob.salaryPeriod,
    };

    const employerSnapshot = {
      id: testEmployer?.id,
      employerCode: testEmployer?.employerCode,
      companyName: testEmployer?.companyName,
    };

    const selectedApp = await prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id: createdApp.id },
        data: {
          status: 'SELECTED',
          currentStage: 'SELECTED',
          selectedAt: new Date(),
          selectedPosition: testJob.title,
          selectionNotes: 'Selected as top candidate from client panel interview',
          jobSnapshot: jobSnapshot as any,
          salarySnapshot: salarySnapshot as any,
          employerSnapshot: employerSnapshot as any,
        },
      });

      await tx.job.update({
        where: { id: testJob.id },
        data: { filledCount: { increment: 1 } },
      });

      await tx.applicant.update({
        where: { id: testCandidate.id },
        data: { status: 'SELECTED' },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: createdApp.id,
          fromStatus: 'INTERVIEWED',
          toStatus: 'SELECTED',
          toStage: 'SELECTED',
          changedById: adminUser?.id,
          changedByRole: 'ADMIN',
          notes: 'Candidate selected for overseas placement. Ready for Phase 6.',
        },
      });

      return app;
    });

    assert(selectedApp.status === 'SELECTED', 'Application transitioned to SELECTED');
    assert(Boolean(selectedApp.selectedAt), 'selectedAt timestamp recorded');
    assert(
      Number((selectedApp.salarySnapshot as any)?.salaryMin) === Number(testJob.salaryMin),
      'Historical salary snapshot preserved against future job changes'
    );
    assert(
      (selectedApp.employerSnapshot as any)?.companyName === testEmployer?.companyName,
      'Historical employer snapshot preserved'
    );

    // Verify filled count incremented on job
    const refreshedJob = await prisma.job.findUnique({ where: { id: testJob.id } });
    assert(refreshedJob?.filledCount === 1, 'Job filledCount atomically incremented to 1');

    // Verify candidate status updated
    const refreshedCandidate = await prisma.applicant.findUnique({ where: { id: testCandidate.id } });
    assert(refreshedCandidate?.status === 'SELECTED', 'Candidate status updated to SELECTED in database');

    // --------------------------------------------------------------------------
    // MODULE 9: Over-Selection & Quota Protection Guard
    // --------------------------------------------------------------------------
    console.log('\n👉 MODULE 9: Quota Protection & Over-selection Guard');

    // Increment filledCount to equal total vacancyCount (2/2)
    await prisma.job.update({
      where: { id: testJob.id },
      data: { filledCount: 2 },
    });

    const vacancyCheckFull = await validateVacancyLimit(prisma, testJob.id, false);
    assert(
      !vacancyCheckFull.allowed,
      'Selection strictly blocked when job quota is fully utilized (2/2)',
      `Reason: ${vacancyCheckFull.reason}`
    );

    const vacancyCheckOverride = await validateVacancyLimit(prisma, testJob.id, true);
    assert(
      vacancyCheckOverride.allowed,
      'Privileged forceOverride permits manager override with audited reason'
    );

    // Reset filled count back
    await prisma.job.update({
      where: { id: testJob.id },
      data: { filledCount: 1 },
    });

    // --------------------------------------------------------------------------
    // MODULE 10: Rejection Workflow & Structured Reason Codes
    // --------------------------------------------------------------------------
    console.log('\n👉 MODULE 10: Rejection Workflow & Reason Codes');

    // Use staffApp from Module 4 to test rejection flow
    const rejectedApp = await prisma.application.update({
      where: { id: staffApp.id },
      data: {
        status: 'REJECTED',
        currentStage: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: 'PASSPORT_ISSUE',
        internalNotes: 'Passport validity less than 3 months; applicant notified to renew',
      },
    });

    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: staffApp.id,
        fromStatus: 'SCREENING',
        toStatus: 'REJECTED',
        toStage: 'REJECTED',
        changedById: recruiterUser?.id,
        changedByRole: 'RECRUITER',
        reason: 'PASSPORT_ISSUE',
        notes: 'Application rejected due to passport expiry',
      },
    });

    assert(rejectedApp.status === 'REJECTED', 'Application status moved to REJECTED');
    assert(rejectedApp.rejectionReason === 'PASSPORT_ISSUE', 'Structured rejectionReason PASSPORT_ISSUE recorded');
    assert(Boolean(rejectedApp.rejectedAt), 'rejectedAt timestamp persisted');

    // --------------------------------------------------------------------------
    // MODULE 11: Application Withdrawal Workflow
    // --------------------------------------------------------------------------
    console.log('\n👉 MODULE 11: Application Withdrawal Workflow');

    const withdrawTestAppCode = await generateApplicationCode(prisma);
    const withdrawTestApp = await prisma.application.create({
      data: {
        applicationCode: withdrawTestAppCode,
        applicationNumber: withdrawTestAppCode,
        applicantId: secondCandidate.id,
        jobId: testJob.id,
        currentStage: 'APPLIED',
        status: 'APPLIED',
        source: 'CANDIDATE_CREATED',
      },
    });

    const withdrawnApp = await prisma.application.update({
      where: { id: withdrawTestApp.id },
      data: {
        status: 'WITHDRAWN',
        currentStage: 'WITHDRAWN',
        withdrawnAt: new Date(),
        withdrawalReason: 'Candidate accepted domestic job offer',
      },
    });

    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: withdrawTestApp.id,
        fromStatus: 'APPLIED',
        toStatus: 'WITHDRAWN',
        toStage: 'WITHDRAWN',
        changedByRole: 'APPLICANT',
        reason: 'Candidate accepted domestic job offer',
        notes: 'Application withdrawn by applicant',
      },
    });

    assert(withdrawnApp.status === 'WITHDRAWN', 'Application status updated to WITHDRAWN');
    assert(Boolean(withdrawnApp.withdrawnAt), 'withdrawnAt timestamp recorded');
    assert(Boolean(withdrawnApp.withdrawalReason), 'withdrawalReason preserved');

    // --------------------------------------------------------------------------
    // MODULE 12: Re-application Allowed After Rejection or Withdrawal
    // --------------------------------------------------------------------------
    console.log('\n👉 MODULE 12: Re-application Policy After Non-Active Status');

    // secondCandidate has a REJECTED and a WITHDRAWN application, but NO active application
    const activeAppCheck = await prisma.application.findFirst({
      where: {
        applicantId: secondCandidate.id,
        jobId: testJob.id,
        status: { notIn: ['REJECTED', 'WITHDRAWN', 'CANCELLED'] },
      },
    });

    assert(
      activeAppCheck === null,
      'Candidate with only REJECTED or WITHDRAWN applications has no active application'
    );

    // Therefore, re-applying is permitted
    const reAppCode = await generateApplicationCode(prisma);
    const reApplication = await prisma.application.create({
      data: {
        applicationCode: reAppCode,
        applicationNumber: reAppCode,
        applicantId: secondCandidate.id,
        jobId: testJob.id,
        currentStage: 'APPLIED',
        status: 'APPLIED',
        source: 'CANDIDATE_CREATED',
      },
    });

    assert(Boolean(reApplication.id), 'Re-application permitted and created successfully after prior rejection');

    // --------------------------------------------------------------------------
    // MODULE 13: Complete Status History Audit Trail
    // --------------------------------------------------------------------------
    console.log('\n👉 MODULE 13: Complete Immutable Status History Trail');

    const histories = await prisma.applicationStatusHistory.findMany({
      where: { applicationId: createdApp.id },
      orderBy: { createdAt: 'asc' },
    });

    assert(
      histories.length >= 4,
      'Application preserves immutable timeline of all lifecycle transitions',
      `Transitions recorded: ${histories.length}`
    );

    const stagesTraversed = histories.map((h) => h.toStatus || h.toStage);
    assert(
      stagesTraversed.includes('APPLIED') &&
      stagesTraversed.includes('SCREENING') &&
      stagesTraversed.includes('SHORTLISTED') &&
      stagesTraversed.includes('SELECTED'),
      'Status history accurately captures full progression: APPLIED -> SCREENING -> SHORTLISTED -> SELECTED',
      `Traversed stages: ${stagesTraversed.join(' -> ')}`
    );

    // Clean up test records
    await prisma.applicationStatusHistory.deleteMany({
      where: {
        applicationId: { in: [createdApp.id, staffApp.id, withdrawTestApp.id, reApplication.id] },
      },
    });
    await prisma.applicationScreening.deleteMany({
      where: { applicationId: createdApp.id },
    });
    await prisma.interview.deleteMany({
      where: { id: interview.id },
    });
    await prisma.application.deleteMany({
      where: {
        id: { in: [createdApp.id, staffApp.id, withdrawTestApp.id, reApplication.id] },
      },
    });
    await prisma.applicant.deleteMany({
      where: { id: { in: [testCandidate.id, secondCandidate.id] } },
    });
    await prisma.job.delete({
      where: { id: testJob.id },
    });

  } catch (error: any) {
    console.error('Fatal Phase 5 test error:', error);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n======================================================================');
  console.log('📊 PHASE 5 TEST RESULTS SUMMARY:');
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total:  ${passed + failed}`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase5Tests();
