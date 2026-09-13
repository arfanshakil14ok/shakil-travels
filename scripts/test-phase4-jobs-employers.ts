import prisma from '../src/lib/prisma';
import { generateEmployerCode, generateJobCode } from '../src/lib/id-generator';
import { calculateMatch, getMatchingJobsForApplicant, getMatchingApplicantsForJob } from '../src/lib/matching';
import { getJobVacancyStats, validateVacancyLimit } from '../src/lib/recruitment/vacancy';
import { createSessionToken } from '../src/lib/auth';
import { createPortalToken } from '../src/lib/portal-auth';

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

async function runPhase4Suite() {
  console.log('\n======================================================================');
  console.log('🚀 SHAKIL GLOBAL RECRUITMENT V2.0 — PHASE 4 JOB & EMPLOYER TEST SUITE');
  console.log('======================================================================\n');

  try {
    // 0. Setup test users and tokens
    const superAdmin = await prisma.user.findFirst({
      where: { role: { name: 'SUPER_ADMIN' } },
      include: { role: true },
    });
    const recruiter = await prisma.user.findFirst({
      where: { role: { name: 'RECRUITER' } },
      include: { role: true },
    });
    const candidateUser = await prisma.user.findFirst({
      where: { role: { name: 'CANDIDATE' } },
      include: { role: true },
    });

    const candidateApplicant = await prisma.applicant.findFirst({
      where: candidateUser?.email ? { email: candidateUser.email } : { candidateType: 'SKILLED' },
    });

    const adminToken = superAdmin
      ? await createSessionToken({ userId: superAdmin.id, email: superAdmin.email, role: superAdmin.role.name })
      : '';
    const recruiterToken = recruiter
      ? await createSessionToken({ userId: recruiter.id, email: recruiter.email, role: recruiter.role.name })
      : '';
    const candidateUserToken = candidateUser
      ? await createSessionToken({ userId: candidateUser.id, email: candidateUser.email, role: candidateUser.role.name })
      : '';
    const candidateToken = candidateApplicant
      ? await createPortalToken({
          applicantId: candidateApplicant.id,
          applicantNumber: candidateApplicant.applicantNumber,
          email: candidateApplicant.email || '',
          fullName: candidateApplicant.fullName,
          phone: candidateApplicant.phone,
        })
      : '';

    const testCountry = await prisma.country.findFirst({ where: { isActive: true } });
    const testCategory = await prisma.jobCategory.findFirst({ where: { isActive: true } });

    // -------------------------------------------------------------------------
    // MODULE 1: Employer Lifecycle, Multi-Contact Model & Verification
    // -------------------------------------------------------------------------
    console.log('👉 MODULE 1: Employer Lifecycle, Multi-Contact Model & Verification');

    // 1.1 Employer Code Generation
    const empCode = await generateEmployerCode(prisma);
    assert(
      /^SGR-EMP-2026-\d{6}$/.test(empCode),
      'generateEmployerCode produces correct SGR-EMP-2026-XXXXXX format',
      `Generated: ${empCode}`
    );

    // 1.2 Create Employer via API
    const testCompanyName = `Al-Salam Engineering Test ${Date.now()}`;
    const createEmpRes = await fetch(`${BASE_URL}/api/employers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_session=${adminToken}`,
      },
      body: JSON.stringify({
        companyName: testCompanyName,
        companyNameLocal: 'شركة السلام للهندسة',
        countryId: testCountry?.id,
        city: 'Riyadh',
        industry: 'Electro-Mechanical Construction',
        contactPerson: 'Engr. Tariq Al-Otaibi',
        email: `contact-${Date.now()}@alsalam.com`,
        phone: '+966501234567',
        address: 'King Fahd Road, Riyadh, KSA',
        website: 'https://alsalam-test.com',
      }),
    });
    const createEmpData = await createEmpRes.json();
    assert(
      createEmpRes.status === 201 && createEmpData.success && createEmpData.data.employerCode,
      'POST /api/employers successfully creates employer with human-readable code',
      `Code: ${createEmpData.data?.employerCode}, Verification: ${createEmpData.data?.verificationStatus}`
    );

    const testEmployerId = createEmpData.data?.id;
    const testEmployerCode = createEmpData.data?.employerCode;

    // 1.3 Duplicate Employer Detection
    const dupEmpRes = await fetch(`${BASE_URL}/api/employers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_session=${adminToken}`,
      },
      body: JSON.stringify({
        companyName: testCompanyName,
        countryId: testCountry?.id,
        email: createEmpData.data?.email,
      }),
    });
    assert(
      dupEmpRes.status === 409,
      'Duplicate employer creation is strictly blocked with 409 Conflict',
      `Status: ${dupEmpRes.status}`
    );

    // 1.4 Initial Verification Status is PENDING
    assert(
      createEmpData.data.verificationStatus === 'PENDING',
      'Newly registered employer defaults to PENDING verification status',
      `Status: ${createEmpData.data.verificationStatus}`
    );

    // 1.5 Multi-Contact Management: Add Primary Contact
    const addContactRes1 = await fetch(`${BASE_URL}/api/employers/${testEmployerId}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_session=${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Ahmed Mansoor',
        designation: 'HR General Manager',
        email: 'ahmed@alsalam.com',
        phone: '+966509988776',
        isPrimary: true,
      }),
    });
    const addContactData1 = await addContactRes1.json();
    assert(
      addContactRes1.status === 201 && addContactData1.data.isPrimary === true,
      'Adding primary contact succeeds and marks isPrimary: true',
      `Contact: ${addContactData1.data?.name}`
    );

    // 1.6 Multi-Contact: Add Secondary Contact as new Primary (resets previous)
    const addContactRes2 = await fetch(`${BASE_URL}/api/employers/${testEmployerId}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_session=${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Fatima Al-Sayed',
        designation: 'Overseas Talent Acquisition',
        email: 'fatima@alsalam.com',
        phone: '+966501122334',
        isPrimary: true,
      }),
    });
    const addContactData2 = await addContactRes2.json();

    const contactsListRes = await fetch(`${BASE_URL}/api/employers/${testEmployerId}/contacts`, {
      headers: { Cookie: `sgr_session=${adminToken}` },
    });
    const contactsListData = await contactsListRes.json();
    const primaryContacts = contactsListData.data.filter((c: any) => c.isPrimary);

    assert(
      contactsListData.data.length >= 2 && primaryContacts.length === 1 && primaryContacts[0].name === 'Fatima Al-Sayed',
      'Adding new primary contact enforces single primary contact invariant',
      `Total contacts: ${contactsListData.data.length}, Single primary: ${primaryContacts[0]?.name}`
    );

    // 1.7 Compliance Document Vault: Upload Document
    const uploadDocRes = await fetch(`${BASE_URL}/api/employers/${testEmployerId}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_session=${adminToken}`,
      },
      body: JSON.stringify({
        documentType: 'DEMAND_LETTER',
        title: '2026 Riyadh Metro Electrical Demand Letter',
        fileUrl: 'https://storage.shakilglobal.com/docs/demand-alsalam-2026.pdf',
        verificationStatus: 'STAFF_ONLY',
      }),
    });
    const uploadDocData = await uploadDocRes.json();
    assert(
      uploadDocRes.status === 201 && uploadDocData.data.documentType === 'DEMAND_LETTER',
      'Compliance document upload persists to employer private vault',
      `Document: ${uploadDocData.data?.title}`
    );

    // 1.8 Employer Verification Workflow: Approve (VERIFIED)
    const verifyRes = await fetch(`${BASE_URL}/api/employers/${testEmployerId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_session=${adminToken}`,
      },
      body: JSON.stringify({
        verificationStatus: 'VERIFIED',
        verificationNotes: 'Commercial Registration and Chamber of Commerce attested demand validated.',
      }),
    });
    const verifyData = await verifyRes.json();
    assert(
      verifyRes.status === 200 && verifyData.data.verificationStatus === 'VERIFIED' && verifyData.data.verifiedById,
      'Employer verification workflow transitions to VERIFIED with audit timestamps',
      `VerifiedBy: ${verifyData.data?.verifiedById}, VerifiedAt: ${verifyData.data?.verifiedAt}`
    );

    // 1.9 Fetch Employer 360° by EmployerCode
    const fetchEmp360Res = await fetch(`${BASE_URL}/api/employers/${testEmployerCode}`, {
      headers: { Cookie: `sgr_session=${adminToken}` },
    });
    const fetchEmp360Data = await fetchEmp360Res.json();
    assert(
      fetchEmp360Res.status === 200 &&
        fetchEmp360Data.data.employerCode === testEmployerCode &&
        fetchEmp360Data.data.metrics !== undefined,
      'GET /api/employers/[employerCode] returns 360° profile with contacts, documents & metrics',
      `Total jobs: ${fetchEmp360Data.data.metrics?.totalJobs}, Contacts: ${fetchEmp360Data.data.contacts?.length}`
    );

    // -------------------------------------------------------------------------
    // MODULE 2: Job Demand Creation, Publishing Invariant & Status Machine
    // -------------------------------------------------------------------------
    console.log('\n👉 MODULE 2: Job Demand Creation, Publishing Invariant & Status Machine');

    // 2.1 Job Code Generation
    const jCode = await generateJobCode(prisma);
    assert(
      /^SGR-JOB-2026-\d{6}$/.test(jCode),
      'generateJobCode produces correct SGR-JOB-2026-XXXXXX format',
      `Generated: ${jCode}`
    );

    // 2.2 Create Unverified Employer to test Invariant Guard
    const unverifiedEmp = await prisma.employer.create({
      data: {
        companyName: `Unverified Co ${Date.now()}`,
        countryId: testCountry?.id,
        verificationStatus: 'PENDING',
        status: 'ACTIVE',
      },
    });

    // 2.3 Publishing Invariant: Cannot publish job with unverified employer
    const blockPublishRes = await fetch(`${BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_session=${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Blocked Electrician Posting',
        countryId: testCountry?.id,
        jobCategoryId: testCategory?.id,
        employerId: unverifiedEmp.id,
        description: 'Test electrical work with unverified employer.',
        vacancyCount: 5,
        status: 'PUBLISHED', // Attempting direct publish
      }),
    });
    const blockPublishData = await blockPublishRes.json();
    assert(
      blockPublishRes.status === 400 && blockPublishData.error?.includes('verified'),
      'CRITICAL INVARIANT: Cannot publish job vacancy from unverified employer',
      `Error response: ${blockPublishData.error}`
    );

    // 2.4 Create Valid Job in DRAFT with Verified Employer
    const createJobRes = await fetch(`${BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_session=${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Master Electrician & Cable Jointer',
        titleLocal: 'মাস্টার ইলেকট্রিশিয়ান ও কেবল জয়েন্টার',
        countryId: testCountry?.id,
        city: 'Riyadh Industrial City',
        jobCategoryId: testCategory?.id,
        employerId: testEmployerId,
        description: 'High voltage electrical cable installation, conduit bending, and transformer testing.',
        descriptionLocal: 'হাই ভোল্টেজ কেবল ইনস্টলেশন এবং ট্রান্সফরমার টেস্টিং কাজ।',
        salaryMin: 2200,
        salaryMax: 2800,
        currency: 'SAR',
        salaryPeriod: 'MONTHLY',
        experienceRequired: 3,
        educationRequired: 'SECONDARY',
        ageMin: 21,
        ageMax: 45,
        skillsRequired: 'Cable jointer, 3-Phase wiring, High voltage termination, Blueprint reading',
        languageRequirements: 'Basic English, Bangla',
        vacancyCount: 10,
        filledCount: 0,
        accommodation: true,
        food: true,
        transportation: true,
        medical: true,
        airTicket: true,
        workingHours: '8 Hours/Day, 6 Days/Week',
        contractDuration: '2 Years Renewable',
        status: 'DRAFT',
      }),
    });
    const createJobData = await createJobRes.json();
    assert(
      createJobRes.status === 201 && createJobData.success && createJobData.data.jobCode,
      'POST /api/jobs creates job with human-readable code and structured trade attributes',
      `JobCode: ${createJobData.data?.jobCode}, Status: ${createJobData.data?.status}`
    );

    const testJobId = createJobData.data?.id;
    const testJobCode = createJobData.data?.jobCode;
    const testJobSlug = createJobData.data?.slug;

    // 2.5 Job Lifecycle: SUBMIT (DRAFT -> PENDING_APPROVAL)
    const submitJobRes = await fetch(`${BASE_URL}/api/jobs/${testJobId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_session=${adminToken}`,
      },
      body: JSON.stringify({
        action: 'SUBMIT',
        notes: 'Recruiter finalized demand specifications from employer attested visa slip.',
      }),
    });
    const submitJobData = await submitJobRes.json();
    assert(
      submitJobRes.status === 200 && submitJobData.data.status === 'PENDING_APPROVAL',
      'Job status transition SUBMIT moves job to PENDING_APPROVAL',
      `Status: ${submitJobData.data?.status}`
    );

    // 2.6 Job Lifecycle: APPROVE (PENDING_APPROVAL -> APPROVED)
    const approveJobRes = await fetch(`${BASE_URL}/api/jobs/${testJobId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_session=${adminToken}`,
      },
      body: JSON.stringify({
        action: 'APPROVE',
        notes: 'Recruitment Manager approved terms, quota, and compensation scale.',
      }),
    });
    const approveJobData = await approveJobRes.json();
    assert(
      approveJobRes.status === 200 &&
        approveJobData.data.status === 'APPROVED' &&
        approveJobData.data.approvedById,
      'Job status transition APPROVE sets approved status and timestamp',
      `Status: ${approveJobData.data?.status}, ApprovedById: ${approveJobData.data?.approvedById}`
    );

    // 2.7 Job Lifecycle: PUBLISH (APPROVED -> PUBLISHED)
    const publishJobRes = await fetch(`${BASE_URL}/api/jobs/${testJobId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_session=${adminToken}`,
      },
      body: JSON.stringify({
        action: 'PUBLISH',
        notes: 'Launched to public recruitment marketplace.',
      }),
    });
    const publishJobData = await publishJobRes.json();
    assert(
      publishJobRes.status === 200 &&
        publishJobData.data.status === 'PUBLISHED' &&
        publishJobData.data.publishedById,
      'Job status transition PUBLISH activates job on public marketplace with verified employer',
      `Status: ${publishJobData.data?.status}, PublishedAt: ${publishJobData.data?.publishedAt}`
    );

    // 2.8 Job Lifecycle: PAUSE & RESUME
    const pauseJobRes = await fetch(`${BASE_URL}/api/jobs/${testJobId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_session=${adminToken}`,
      },
      body: JSON.stringify({ action: 'PAUSE', notes: 'Temporary pause during interview cohort.' }),
    });
    const pauseJobData = await pauseJobRes.json();
    assert(
      pauseJobRes.status === 200 && pauseJobData.data.status === 'PAUSED',
      'Job status transition PAUSE pauses publishing',
      `Status: ${pauseJobData.data?.status}`
    );

    const resumeJobRes = await fetch(`${BASE_URL}/api/jobs/${testJobId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_session=${adminToken}`,
      },
      body: JSON.stringify({ action: 'RESUME', notes: 'Resumed demand publishing.' }),
    });
    const resumeJobData = await resumeJobRes.json();
    assert(
      resumeJobRes.status === 200 && resumeJobData.data.status === 'PUBLISHED',
      'Job status transition RESUME restores PUBLISHED status',
      `Status: ${resumeJobData.data?.status}`
    );

    // -------------------------------------------------------------------------
    // MODULE 3: Live Vacancy Quota Management & Over-selection Guard
    // -------------------------------------------------------------------------
    console.log('\n👉 MODULE 3: Live Vacancy Quota Management & Over-selection Guard');

    // 3.1 Live Vacancy Stats Calculation
    const vacancyStats = await getJobVacancyStats(prisma, testJobId);
    assert(
      vacancyStats !== null &&
        vacancyStats.vacancies === 10 &&
        vacancyStats.remainingVacancies === 10 &&
        vacancyStats.isFull === false,
      'getJobVacancyStats accurately computes remainingVacancies (total - filled)',
      `Vacancies: ${vacancyStats?.vacancies}, Remaining: ${vacancyStats?.remainingVacancies}`
    );

    // 3.2 Vacancy Limit Validation
    const limitCheck = await validateVacancyLimit(prisma, testJobId, false);
    assert(
      limitCheck.allowed === true,
      'validateVacancyLimit permits candidate selection when vacancies remain',
      `Allowed: ${limitCheck.allowed}`
    );

    // 3.3 Over-selection guard simulation
    const fullJob = await prisma.job.create({
      data: {
        jobCode: await generateJobCode(prisma),
        title: 'Filled Driver Job',
        slug: `filled-driver-${Date.now()}`,
        countryId: testCountry!.id,
        jobCategoryId: testCategory!.id,
        employerId: testEmployerId,
        description: 'Testing quota full',
        vacancyCount: 1,
        filledCount: 1,
        status: 'PUBLISHED',
      },
    });

    if (candidateApplicant) {
      const mockApp = await prisma.application.create({
        data: {
          applicationCode: `SGR-APP-TEST-${Date.now().toString().slice(-6)}`,
          applicantId: candidateApplicant.id,
          jobId: fullJob.id,
          status: 'SELECTED',
        },
      });

      const fullLimitCheck = await validateVacancyLimit(prisma, fullJob.id, false);
      assert(
        fullLimitCheck.allowed === false && fullLimitCheck.stats?.isFull === true,
        'validateVacancyLimit strictly blocks selection when quota is full',
        `Reason: ${fullLimitCheck.reason}`
      );

      await prisma.application.delete({ where: { id: mockApp.id } });
    }
    await prisma.job.delete({ where: { id: fullJob.id } });

    // -------------------------------------------------------------------------
    // MODULE 4: Public Marketplace Sanitization & DTO Security
    // -------------------------------------------------------------------------
    console.log('\n👉 MODULE 4: Public Marketplace Sanitization & DTO Security');

    // 4.1 Public GET /api/jobs only returns PUBLISHED jobs
    const publicJobsRes = await fetch(`${BASE_URL}/api/jobs`);
    const publicJobsData = await publicJobsRes.json();
    const allPublished = publicJobsData.data.items.every((j: any) => j.status === 'PUBLISHED');
    assert(
      publicJobsRes.status === 200 && publicJobsData.success && allPublished,
      'Public GET /api/jobs strictly returns only PUBLISHED vacancies',
      `Returned count: ${publicJobsData.data.items.length}`
    );

    // 4.2 Public GET /api/jobs only includes VERIFIED employers
    const allVerifiedEmployers = publicJobsData.data.items.every(
      (j: any) => !j.employer || j.employer.verificationStatus === 'VERIFIED'
    );
    assert(
      allVerifiedEmployers,
      'Public GET /api/jobs strictly excludes jobs from unverified employers',
      `All employers verified: ${allVerifiedEmployers}`
    );

    // 4.3 Public Job DTO Sanitization: Internal reviewNotes and createdBy hidden
    const samplePublicJob = publicJobsData.data.items[0];
    assert(
      samplePublicJob && samplePublicJob.reviewNotes === undefined && samplePublicJob.createdBy === undefined,
      'Public Job DTO strips internal staff reviewNotes and createdBy fields',
      'Internal fields successfully hidden'
    );

    // 4.4 Public Job Detail by Slug
    const publicJobDetailRes = await fetch(`${BASE_URL}/api/jobs/${testJobSlug}`);
    const publicJobDetailData = await publicJobDetailRes.json();
    assert(
      publicJobDetailRes.status === 200 &&
        publicJobDetailData.data.jobCode === testJobCode &&
        publicJobDetailData.data.remainingVacancies === 10,
      'Public GET /api/jobs/[slug] resolves job and calculates remainingVacancies',
      `JobCode: ${publicJobDetailData.data?.jobCode}, Remaining: ${publicJobDetailData.data?.remainingVacancies}`
    );

    // 4.5 Public Job Detail by JobCode
    const publicJobByCodeRes = await fetch(`${BASE_URL}/api/jobs/${testJobCode}`);
    const publicJobByCodeData = await publicJobByCodeRes.json();
    assert(
      publicJobByCodeRes.status === 200 && publicJobByCodeData.data.id === testJobId,
      'Public GET /api/jobs/[jobCode] resolves job via human-readable ID',
      `Resolved ID: ${publicJobByCodeData.data?.id}`
    );

    // 4.6 Filtering by Country
    const filteredByCountryRes = await fetch(`${BASE_URL}/api/jobs?countryId=${testCountry?.id}`);
    const filteredByCountryData = await filteredByCountryRes.json();
    const allMatchingCountry = filteredByCountryData.data.items.every(
      (j: any) => j.countryId === testCountry?.id
    );
    assert(
      filteredByCountryData.data.items.length > 0 && allMatchingCountry,
      'Public GET /api/jobs filters correctly by destination country',
      `Count: ${filteredByCountryData.data.items.length}`
    );

    // -------------------------------------------------------------------------
    // MODULE 5: Matching Engine Integration & Candidate Portal
    // -------------------------------------------------------------------------
    console.log('\n👉 MODULE 5: Matching Engine Integration & Candidate Portal');

    if (candidateApplicant) {
      await prisma.applicant.update({
        where: { id: candidateApplicant.id },
        data: {
          preferredCountryId: testCountry?.id,
          preferredJobCategoryId: testCategory?.id,
          yearsOfExperience: 4,
          skills: 'Cable jointer, 3-Phase wiring, High voltage termination, Electrical safety',
          languages: 'Bangla, Basic English',
          education: 'SECONDARY',
        },
      });

      // 5.1 Calculate Candidate Job Match
      const testJobRecord = await prisma.job.findUnique({ where: { id: testJobId } });
      const updatedCand = await prisma.applicant.findUnique({ where: { id: candidateApplicant.id } });
      const matchResult = calculateMatch(updatedCand!, testJobRecord!);

      assert(
        matchResult.score >= 80 && matchResult.level === 'EXCELLENT',
        'calculateMatch produces high score (>=80%) for candidate matching trade, country, and skills',
        `Score: ${matchResult.score}%, Level: ${matchResult.level}`
      );

      // 5.2 Breakdown Criteria Verification
      const countryCrit = matchResult.criteria.find((c) => c.factor === 'Preferred Country');
      const categoryCrit = matchResult.criteria.find((c) => c.factor === 'Job Category');
      const skillsCrit = matchResult.criteria.find((c) => c.factor === 'Skills & Competencies');

      assert(
        countryCrit?.matched === true && categoryCrit?.matched === true && skillsCrit?.matched === true,
        'calculateMatch accurately scores individual criteria breakdown',
        `Country: ${countryCrit?.score}/25, Category: ${categoryCrit?.score}/25, Skills: ${skillsCrit?.score}/15`
      );

      // 5.3 Candidate Logged In Job Detail View attaches candidateMatch & hasApplied
      const candJobDetailRes = await fetch(`${BASE_URL}/api/jobs/${testJobId}`, {
        headers: { Cookie: `sgr_portal_session=${candidateToken}` },
      });
      const candJobDetailData = await candJobDetailRes.json();
      assert(
        candJobDetailRes.status === 200 &&
          candJobDetailData.data.candidateMatch !== null &&
          candJobDetailData.data.candidateMatch.score >= 80 &&
          candJobDetailData.data.hasApplied === false,
        'GET /api/jobs/[id] attaches candidateMatch score and hasApplied flag for logged-in candidates',
        `Score: ${candJobDetailData.data.candidateMatch?.score}%, Applied: ${candJobDetailData.data.hasApplied}`
      );

      // 5.4 Candidate Portal Recommended Jobs Endpoint (via candidate token)
      const recJobsRes = await fetch(`${BASE_URL}/api/portal/jobs/recommended`, {
        headers: { Cookie: `sgr_portal_session=${candidateToken}` },
      });
      const recJobsData = await recJobsRes.json();
      assert(
        recJobsRes.status === 200 &&
          recJobsData.success &&
          Array.isArray(recJobsData.data) &&
          recJobsData.data.length > 0,
        'GET /api/portal/jobs/recommended returns top matching jobs for candidate profile',
        `Recommendations count: ${recJobsData.data?.length}`
      );

      // 5.5 Recommendations only include published jobs from verified employers
      const recsVerified = recJobsData.data.every(
        (item: any) =>
          item.job.status === 'PUBLISHED' &&
          item.job.employer?.verificationStatus === 'VERIFIED'
      );
      assert(
        recsVerified,
        'Portal recommendations strictly enforce published status and verified employer requirement',
        `Verified: ${recsVerified}`
      );

      // 5.6 Staff Job Detail View attaches matchingCandidates preview
      const staffJobDetailRes = await fetch(`${BASE_URL}/api/jobs/${testJobId}`, {
        headers: { Cookie: `sgr_session=${adminToken}` },
      });
      const staffJobDetailData = await staffJobDetailRes.json();
      assert(
        staffJobDetailRes.status === 200 &&
          Array.isArray(staffJobDetailData.data.matchingCandidates) &&
          staffJobDetailData.data.matchingCandidates.length > 0,
        'Staff GET /api/jobs/[id] attaches matchingCandidates applicant preview pool',
        `Matching candidates count: ${staffJobDetailData.data.matchingCandidates?.length}`
      );
    }

    // -------------------------------------------------------------------------
    // MODULE 6: Role-Based Access Control & Invariant Security
    // -------------------------------------------------------------------------
    console.log('\n👉 MODULE 6: Role-Based Access Control & Invariant Security');

    // 6.1 Candidate cannot create jobs
    const candCreateJobRes = await fetch(`${BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_session=${candidateUserToken}`,
      },
      body: JSON.stringify({ title: 'Hacked Job' }),
    });
    assert(
      candCreateJobRes.status === 403,
      'Candidates are strictly blocked from POST /api/jobs with 403 Forbidden',
      `Status: ${candCreateJobRes.status}`
    );

    // 6.2 Candidate cannot create employers
    const candCreateEmpRes = await fetch(`${BASE_URL}/api/employers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_session=${candidateUserToken}`,
      },
      body: JSON.stringify({ companyName: 'Hacked Employer' }),
    });
    assert(
      candCreateEmpRes.status === 403,
      'Candidates are strictly blocked from POST /api/employers with 403 Forbidden',
      `Status: ${candCreateEmpRes.status}`
    );

    // 6.3 Audit logs generated for Employer & Job actions
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: ['EMPLOYER_CREATE', 'EMPLOYER_VERIFIED', 'JOB_CREATE', 'JOB_STATUS_CHANGE'],
        },
      },
      take: 10,
    });
    assert(
      auditLogs.length > 0,
      'Audit log trail records EMPLOYER_CREATE, EMPLOYER_VERIFIED, and JOB actions',
      `Found ${auditLogs.length} recent audit logs`
    );

    // 6.4 Non-manager staff forbidden from verifying employers
    const recruiterVerifyRes = await fetch(`${BASE_URL}/api/employers/${testEmployerId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_session=${recruiterToken}`,
      },
      body: JSON.stringify({ verificationStatus: 'VERIFIED' }),
    });
    assert(
      recruiterVerifyRes.status === 403,
      'Recruiter role without manager privilege is blocked from verifying employers (403)',
      `Status: ${recruiterVerifyRes.status}`
    );

    // 6.5 Update Employer Details via PUT
    const updateEmpRes = await fetch(`${BASE_URL}/api/employers/${testEmployerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_session=${adminToken}`,
      },
      body: JSON.stringify({
        city: 'Jeddah Coastal Hub',
        industry: 'Heavy Infrastructure & Power Plants',
      }),
    });
    const updateEmpData = await updateEmpRes.json();
    assert(
      updateEmpRes.status === 200 && updateEmpData.data.city === 'Jeddah Coastal Hub',
      'PUT /api/employers/[id] updates employer details and preserves invariants',
      `Updated city: ${updateEmpData.data?.city}`
    );

    // 6.6 Delete Employer Contact
    const contactToDelete = contactsListData.data.find((c: any) => !c.isPrimary);
    if (contactToDelete) {
      const delContactRes = await fetch(
        `${BASE_URL}/api/employers/${testEmployerId}/contacts?contactId=${contactToDelete.id}`,
        {
          method: 'DELETE',
          headers: { Cookie: `sgr_session=${adminToken}` },
        }
      );
      assert(
        delContactRes.status === 200,
        'DELETE /api/employers/[id]/contacts successfully removes contact',
        `Deleted Contact ID: ${contactToDelete.id}`
      );
    }

    // 6.7 Delete Employer Document
    if (uploadDocData.data?.id) {
      const delDocRes = await fetch(
        `${BASE_URL}/api/employers/${testEmployerId}/documents?documentId=${uploadDocData.data.id}`,
        {
          method: 'DELETE',
          headers: { Cookie: `sgr_session=${adminToken}` },
        }
      );
      assert(
        delDocRes.status === 200,
        'DELETE /api/employers/[id]/documents successfully removes compliance document',
        `Deleted Doc ID: ${uploadDocData.data.id}`
      );
    }

    // 6.8 Update Job Details via PUT
    const updateJobRes = await fetch(`${BASE_URL}/api/jobs/${testJobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_session=${adminToken}`,
      },
      body: JSON.stringify({
        salaryMax: 3000,
        workingHours: '8 Hours / 5 Days + Overtime',
      }),
    });
    const updateJobData = await updateJobRes.json();
    assert(
      updateJobRes.status === 200 && Number(updateJobData.data.salaryMax) === 3000,
      'PUT /api/jobs/[id] updates job compensation and working hours',
      `New salaryMax: ${updateJobData.data?.salaryMax}`
    );

    // 6.9 Job Lifecycle: CLOSE
    const closeJobRes = await fetch(`${BASE_URL}/api/jobs/${testJobId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sgr_session=${adminToken}`,
      },
      body: JSON.stringify({ action: 'CLOSE', notes: 'Quota successfully filled / demand expired.' }),
    });
    const closeJobData = await closeJobRes.json();
    assert(
      closeJobRes.status === 200 && closeJobData.data.status === 'CLOSED',
      'Job status transition CLOSE moves job to CLOSED',
      `Status: ${closeJobData.data?.status}`
    );

    // 6.10 Clean up unverified mock employer
    await prisma.employer.delete({ where: { id: unverifiedEmp.id } });

    console.log('\n======================================================================');
    console.log(`📊 PHASE 4 TEST SUMMARY:`);
    console.log(`   Total Tests:  ${totalTests}`);
    console.log(`   Passed Tests: ${passedTests}`);
    console.log(`   Failed Tests: ${failedTests}`);
    console.log('======================================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test suite failed with unexpected exception:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase4Suite();
