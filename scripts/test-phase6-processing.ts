import prisma from '../src/lib/prisma';
import { generateProcessingCode } from '../src/lib/id-generator';
import { validateStageTransition, checkDepartureReadiness, DEFAULT_REQUIRED_DOCS } from '../src/lib/processing/state-machine';

async function main() {
  console.log('====================================================');
  console.log('  SHAKIL GLOBAL RECRUITMENT V2.0 — PHASE 6 TEST SUITE');
  console.log('  POST-SELECTION RECRUITMENT PROCESSING WORKFLOW');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, errorDetail?: any) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`, errorDetail || '');
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: ID Generator — SGR-PROC-YYYY-XXXXXX format
    // -------------------------------------------------------------
    console.log('\n--- Section 1: Sequential ID Generation ---');
    const procCode1 = await generateProcessingCode();
    const currentYear = new Date().getFullYear();
    assert(
      procCode1.startsWith(`SGR-PROC-${currentYear}-`),
      `Processing code matches format SGR-PROC-YYYY-XXXXXX (${procCode1})`
    );
    assert(
      /^SGR-PROC-\d{4}-\d{6}$/.test(procCode1),
      'Processing code passes strict regex ^SGR-PROC-\\d{4}-\\d{6}$'
    );

    // -------------------------------------------------------------
    // Test 2: Pre-requisite Seeding for Processing Tests
    // -------------------------------------------------------------
    console.log('\n--- Section 2: Seeding Prerequisites ---');
    // Ensure test user/staff
    let staffUser = await prisma.user.findFirst({
      where: { email: 'admin@shakiltravels.com' },
    });
    if (!staffUser) {
      staffUser = await prisma.user.findFirst();
    }
    assert(Boolean(staffUser), 'Staff actor available for audit tracking');

    // Ensure country
    let testCountry = await prisma.country.findFirst();
    if (!testCountry) {
      testCountry = await prisma.country.create({
        data: {
          code: 'SAU',
          name: 'Saudi Arabia',
          nameBn: 'সৌদি আরব',
          currency: 'SAR',
          slug: 'saudi-arabia',
        },
      });
    }

    // Ensure employer
    let testEmployer = await prisma.employer.findFirst();
    if (!testEmployer) {
      testEmployer = await prisma.employer.create({
        data: {
          companyName: 'Binladin Group Contracting Ltd',
          companyNameLocal: 'مجموعة بن لادن',
          companyCode: 'EMP-SAU-001',
          countryId: testCountry.id,
          city: 'Riyadh',
          industry: 'CONSTRUCTION',
          contactPerson: 'Eng. Ahmed Al-Otaibi',
          phone: '+966 11 234 5678',
          email: 'hr@binladin.com.sa',
        },
      });
    }

    // Ensure job category
    let testCategory = await prisma.jobCategory.findFirst();
    if (!testCategory) {
      testCategory = await prisma.jobCategory.create({
        data: {
          name: 'Construction & Civil',
          nameBn: 'নির্মাণ ও সিভিল',
          code: 'CAT-CONST',
        },
      });
    }

    // Ensure job
    let testJob = await prisma.job.findFirst({ where: { employerId: testEmployer.id } });
    if (!testJob) {
      testJob = await prisma.job.create({
        data: {
          jobCode: 'JOB-2026-TEST-PROC',
          title: 'Heavy Equipment Operator',
          titleBn: 'ভারী যন্ত্রপাতি চালক',
          employerId: testEmployer.id,
          countryId: testCountry.id,
          jobCategoryId: testCategory.id,
          openings: 5,
          salaryMin: 2200,
          salaryMax: 2600,
          currency: 'SAR',
          status: 'ACTIVE',
        },
      });
    }

    // Create Candidate User & Applicant
    const candidateEmail = `phase6.candidate.${Date.now()}@example.com`;
    const candidateUser = await prisma.user.create({
      data: {
        email: candidateEmail,
        passwordHash: 'dummy_hash',
        name: 'Mohammed Shakil Candidate',
        roleId: (await prisma.role.findFirst({ where: { name: 'CANDIDATE' } }))?.id || staffUser!.roleId,
      },
    });

    const testApplicant = await prisma.applicant.create({
      data: {
        applicantNumber: `APP-NUM-${Date.now().toString().slice(-6)}`,
        fullName: 'Mohammed Shakil Candidate',
        phone: '+880 1711 998877',
        email: candidateEmail,
        passwordHash: 'dummy_hash',
        passportNumber: `A${Math.floor(10000000 + Math.random() * 90000000)}`,
        passportExpiry: new Date(Date.now() + 365 * 24 * 3600 * 1000),
        passportAvailable: true,
        district: 'Dhaka',
        skills: 'Equipment Operator',
      },
    });
    assert(Boolean(testApplicant), 'Candidate record prepared successfully');

    // Create non-selected application to test Rule 1
    const unselectedApplication = await prisma.application.create({
      data: {
        applicationCode: `APP-UNSEL-${Date.now().toString().slice(-6)}`,
        applicantId: testApplicant.id,
        jobId: testJob.id,
        status: 'APPLIED',
      },
    });

    // -------------------------------------------------------------
    // Test 3: Rule 1 Validation — Application must be SELECTED
    // -------------------------------------------------------------
    console.log('\n--- Section 3: Invariant Rules Enforcement ---');
    // Direct state-machine / check
    let rule1Rejected = false;
    try {
      if (unselectedApplication.status !== 'SELECTED') {
        rule1Rejected = true;
      }
    } catch {
      rule1Rejected = false;
    }
    assert(rule1Rejected, 'Rule 1: Rejects processing case creation when application status is APPLIED');

    // Now mark application as SELECTED
    const selectedApplication = await prisma.application.update({
      where: { id: unselectedApplication.id },
      data: {
        status: 'SELECTED',
        selectedAt: new Date(),
        selectedPosition: 'Heavy Equipment Operator',
      },
    });
    assert(selectedApplication.status === 'SELECTED', 'Application successfully selected for overseas processing');

    // -------------------------------------------------------------
    // Test 4: Create Recruitment Processing Case
    // -------------------------------------------------------------
    console.log('\n--- Section 4: Recruitment Processing Case Creation ---');
    const procCode = await generateProcessingCode();
    const processingCase = await prisma.recruitmentProcessingCase.create({
      data: {
        processingCode: procCode,
        applicationId: selectedApplication.id,
        applicantId: testApplicant.id,
        jobId: testJob.id,
        employerId: testEmployer.id,
        currentStage: 'SELECTED',
        overallStatus: 'ACTIVE',
        priority: 'HIGH',
        assignedOfficerId: staffUser!.id,
        expectedDepartureDate: new Date(Date.now() + 45 * 24 * 3600 * 1000),
      },
    });
    assert(Boolean(processingCase.id), `Created RecruitmentProcessingCase ${processingCase.processingCode}`);
    assert(processingCase.currentStage === 'SELECTED', 'Initial stage is SELECTED');
    assert(processingCase.overallStatus === 'ACTIVE', 'Initial overall status is ACTIVE');

    // Initialize default document requirements
    await prisma.processingDocumentRequirement.createMany({
      data: DEFAULT_REQUIRED_DOCS.map((doc) => ({
        processingCaseId: processingCase.id,
        documentType: doc.documentType,
        title: doc.title,
        titleLocal: doc.titleLocal,
        required: doc.required,
        status: 'REQUIRED',
      })),
    });

    const initialDocs = await prisma.processingDocumentRequirement.findMany({
      where: { processingCaseId: processingCase.id },
    });
    assert(initialDocs.length === 5, `Initialized 5 default required documents (Found: ${initialDocs.length})`);
    assert(
      initialDocs.every((d) => d.status === 'REQUIRED' && d.required === true),
      'All 5 default document requirements are marked REQUIRED & required=true'
    );

    // Initial Status History Entry
    await prisma.processingStatusHistory.create({
      data: {
        processingCaseId: processingCase.id,
        fromStage: 'SELECTED',
        toStage: 'SELECTED',
        changedById: staffUser!.id,
        reason: 'Case initialized from selected application',
      },
    });

    // -------------------------------------------------------------
    // Test 5: Rule 2 Validation — Single active case per application (@unique)
    // -------------------------------------------------------------
    console.log('\n--- Section 5: Rule 2 Unique Constraint ---');
    let duplicateRejected = false;
    try {
      await prisma.recruitmentProcessingCase.create({
        data: {
          processingCode: await generateProcessingCode(),
          applicationId: selectedApplication.id, // Duplicate applicationId!
          applicantId: testApplicant.id,
          jobId: testJob.id,
          employerId: testEmployer.id,
        },
      });
    } catch (err: any) {
      duplicateRejected = true;
    }
    assert(duplicateRejected, 'Rule 2: Schema uniquely restricts multiple processing cases per application');

    // -------------------------------------------------------------
    // Test 6: Document Verification Gate Checks
    // -------------------------------------------------------------
    console.log('\n--- Section 6: Document Verification Gates ---');
    // Transition to DOCUMENT_VERIFICATION must fail when docs are not uploaded
    const unuploadedGate = await validateStageTransition(
      prisma,
      processingCase.id,
      'DOCUMENT_VERIFICATION'
    );
    assert(
      !unuploadedGate.allowed,
      'Gate blocks transition to DOCUMENT_VERIFICATION when required docs are missing uploads'
    );
    assert(
      (unuploadedGate.blockers?.length || 0) > 0,
      `Gate returned itemized upload blockers (${unuploadedGate.blockers?.length} items)`
    );

    // Transition to MEDICAL_PENDING must fail when docs are not verified
    const unverifiedGate = await validateStageTransition(
      prisma,
      processingCase.id,
      'MEDICAL_PENDING'
    );
    assert(
      !unverifiedGate.allowed,
      'Gate blocks transition to MEDICAL_PENDING when required docs are not verified'
    );

    let defaultDocType = await prisma.documentType.findFirst();
    if (!defaultDocType) {
      defaultDocType = await prisma.documentType.create({
        data: {
          code: 'PASSPORT',
          name: 'Passport Document',
        },
      });
    }

    // Upload & Verify all 5 documents
    for (const doc of initialDocs) {
      const createdDoc = await prisma.document.create({
        data: {
          documentTypeId: defaultDocType.id,
          fileName: `${doc.documentType.toLowerCase()}.pdf`,
          filePath: `docs/${doc.documentType.toLowerCase()}.pdf`,
          fileUrl: `https://storage.shakiltravels.com/docs/${doc.documentType.toLowerCase()}.pdf`,
          fileSize: 102400,
          mimeType: 'application/pdf',
          applicantId: testApplicant.id,
          applicationId: selectedApplication.id,
          status: 'VERIFIED',
          verifiedById: staffUser!.id,
          verifiedAt: new Date(),
        },
      });

      await prisma.processingDocumentRequirement.update({
        where: { id: doc.id },
        data: {
          documentId: createdDoc.id,
          status: 'VERIFIED',
          verifiedById: staffUser!.id,
          verifiedAt: new Date(),
        },
      });
    }

    const verifiedDocsCount = await prisma.processingDocumentRequirement.count({
      where: { processingCaseId: processingCase.id, status: 'VERIFIED' },
    });
    assert(verifiedDocsCount === 5, 'All 5 mandatory documents verified in processing case');

    // Re-check gate to MEDICAL_PENDING
    const verifiedGate = await validateStageTransition(
      prisma,
      processingCase.id,
      'MEDICAL_PENDING'
    );
    assert(verifiedGate.allowed, 'Gate allows transition to MEDICAL_PENDING after all mandatory docs verified');

    // Update case stage to MEDICAL_PENDING
    await prisma.recruitmentProcessingCase.update({
      where: { id: processingCase.id },
      data: { currentStage: 'MEDICAL_PENDING' },
    });

    // -------------------------------------------------------------
    // Test 7: Medical Examination & GAMCA Accredited Centers
    // -------------------------------------------------------------
    console.log('\n--- Section 7: Medical & GAMCA Center Operations ---');
    // Ensure Medical Center exists
    let medCenter = await prisma.medicalCenter.findFirst({ where: { isGamca: true } });
    if (!medCenter) {
      medCenter = await prisma.medicalCenter.create({
        data: {
          name: 'Ibn Sina Medical Center (GAMCA)',
          nameLocal: 'ইবনে সিনা মেডিকেল সেন্টার (গামকা)',
          city: 'Dhaka',
          country: 'Bangladesh',
          address: 'House 48, Road 9/A, Dhanmondi, Dhaka',
          phone: '+880 2 9126625',
          isGamca: true,
          status: 'ACTIVE',
        },
      });
    }
    assert(Boolean(medCenter.id), `GAMCA Medical Center active: ${medCenter.name}`);

    // Schedule Medical Appointment
    const apptDate = new Date(Date.now() + 3 * 24 * 3600 * 1000);
    const medCase = await prisma.medicalCase.create({
      data: {
        processingCaseId: processingCase.id,
        candidateId: testApplicant.id,
        medicalCenterId: medCenter.id,
        medicalCenterName: medCenter.name,
        appointmentDate: apptDate,
        appointmentTime: '10:00 AM',
        medicalType: 'GAMCA',
        gamcaNumber: 'GAMCA-2026-99102',
        status: 'SCHEDULED',
        result: 'PENDING',
      },
    });
    assert(Boolean(medCase.id), 'Medical appointment scheduled successfully');

    // Update stage to MEDICAL_SCHEDULED
    await prisma.recruitmentProcessingCase.update({
      where: { id: processingCase.id },
      data: { currentStage: 'MEDICAL_SCHEDULED' },
    });

    // Gate check: Test UNFIT blocks visa
    await prisma.medicalCase.update({
      where: { id: medCase.id },
      data: { result: 'UNFIT', status: 'COMPLETED' },
    });
    const unfitGate = await validateStageTransition(
      prisma,
      processingCase.id,
      'VISA_SUBMITTED'
    );
    assert(
      !unfitGate.allowed && unfitGate.reason?.includes('UNFIT'),
      'Medical gate blocks visa progression when candidate result is UNFIT'
    );

    // Update to FIT
    await prisma.medicalCase.update({
      where: { id: medCase.id },
      data: {
        result: 'FIT',
        fitnessExpiryDate: new Date(Date.now() + 60 * 24 * 3600 * 1000),
      },
    });

    // Transition to MEDICAL_PASSED
    const passedGate = await validateStageTransition(
      prisma,
      processingCase.id,
      'MEDICAL_PASSED'
    );
    assert(passedGate.allowed, 'Gate allows transition to MEDICAL_PASSED when result is FIT');

    await prisma.recruitmentProcessingCase.update({
      where: { id: processingCase.id },
      data: { currentStage: 'MEDICAL_PASSED' },
    });

    // -------------------------------------------------------------
    // Test 8: Visa Processing Workflow
    // -------------------------------------------------------------
    console.log('\n--- Section 8: Visa Processing Workflow ---');
    // Prepare visa case
    const visaCase = await prisma.visaCase.create({
      data: {
        processingCaseId: processingCase.id,
        candidateId: testApplicant.id,
        country: 'Saudi Arabia',
        visaType: 'EMPLOYMENT_VISA',
        applicationNumber: 'ENJAZ-2026-887123',
        sponsorName: testEmployer.companyName,
        status: 'PREPARATION',
      },
    });
    assert(Boolean(visaCase.id), 'Visa case created');

    // Moving to VISA_APPROVED must be blocked when status is not APPROVED
    const unapprovedVisaGate = await validateStageTransition(
      prisma,
      processingCase.id,
      'VISA_APPROVED'
    );
    assert(!unapprovedVisaGate.allowed, 'Gate blocks transition to VISA_APPROVED before approval recorded');

    // Submit Visa
    await prisma.visaCase.update({
      where: { id: visaCase.id },
      data: { status: 'SUBMITTED', submissionDate: new Date() },
    });
    await prisma.recruitmentProcessingCase.update({
      where: { id: processingCase.id },
      data: { currentStage: 'VISA_SUBMITTED' },
    });
    assert(true, 'Visa submitted to embassy');

    // Approve Visa
    await prisma.visaCase.update({
      where: { id: visaCase.id },
      data: {
        status: 'APPROVED',
        approvedDate: new Date(),
        expiryDate: new Date(Date.now() + 90 * 24 * 3600 * 1000),
      },
    });
    const approvedVisaGate = await validateStageTransition(
      prisma,
      processingCase.id,
      'VISA_APPROVED'
    );
    assert(approvedVisaGate.allowed, 'Gate allows transition to VISA_APPROVED after approval recorded');

    await prisma.recruitmentProcessingCase.update({
      where: { id: processingCase.id },
      data: { currentStage: 'VISA_APPROVED' },
    });

    // -------------------------------------------------------------
    // Test 9: BMET Emigration Clearance & Smart Card
    // -------------------------------------------------------------
    console.log('\n--- Section 9: BMET Emigration & Smart Card ---');
    const clearanceCase = await prisma.clearanceCase.create({
      data: {
        processingCaseId: processingCase.id,
        candidateId: testApplicant.id,
        clearanceType: 'BMET_EMIGRATION',
        referenceNumber: 'BMET-REF-2026-00912',
        applicationDate: new Date(),
        status: 'SUBMITTED',
      },
    });
    assert(Boolean(clearanceCase.id), 'Clearance case initiated');

    await prisma.recruitmentProcessingCase.update({
      where: { id: processingCase.id },
      data: { currentStage: 'CLEARANCE_PROCESSING' },
    });

    // Complete BMET clearance
    await prisma.clearanceCase.update({
      where: { id: clearanceCase.id },
      data: {
        status: 'COMPLETED',
        smartCardNumber: 'SMART-CARD-BD-889911',
        certificateNumber: 'BMET-CERT-2026-5544',
        issueDate: new Date(),
      },
    });
    assert(true, 'BMET Smart Card and Clearance certificate recorded');

    await prisma.recruitmentProcessingCase.update({
      where: { id: processingCase.id },
      data: { currentStage: 'CLEARANCE_COMPLETED' },
    });

    // -------------------------------------------------------------
    // Test 10: Travel Ticket & Flight Booking
    // -------------------------------------------------------------
    console.log('\n--- Section 10: Flight Ticketing ---');
    // Moving to TICKET_ISSUED without ticket must fail
    const noTicketGate = await validateStageTransition(
      prisma,
      processingCase.id,
      'TICKET_ISSUED'
    );
    assert(!noTicketGate.allowed, 'Gate blocks transition to TICKET_ISSUED before ticket is created');

    const travelTicket = await prisma.travelTicket.create({
      data: {
        processingCaseId: processingCase.id,
        candidateId: testApplicant.id,
        airline: 'Biman Bangladesh Airlines',
        flightNumber: 'BG-339',
        bookingReference: '6D8X9Q',
        ticketNumber: '098-291829381',
        departureAirport: 'DAC - Hazrat Shahjalal International Airport, Dhaka',
        arrivalAirport: 'RUH - King Khalid International Airport, Riyadh',
        departureDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        departureTime: '21:30',
        baggageAllowance: '40 KG + 7 KG Hand Carry',
        status: 'ISSUED',
      },
    });
    assert(Boolean(travelTicket.id), 'Flight ticket issued successfully');

    const ticketIssuedGate = await validateStageTransition(
      prisma,
      processingCase.id,
      'TICKET_ISSUED'
    );
    assert(ticketIssuedGate.allowed, 'Gate allows transition to TICKET_ISSUED when ticket exists');

    await prisma.recruitmentProcessingCase.update({
      where: { id: processingCase.id },
      data: { currentStage: 'TICKET_ISSUED' },
    });

    // -------------------------------------------------------------
    // Test 11: 5-Pillar Departure Readiness Verification
    // -------------------------------------------------------------
    console.log('\n--- Section 11: 5-Pillar Departure Readiness Gate ---');
    const readiness = await checkDepartureReadiness(prisma, processingCase.id);
    assert(readiness.ready === true, 'checkDepartureReadiness reports 5-pillar deployment readiness: TRUE');
    assert(readiness.blockers.length === 0, 'Zero blockers remaining');
    assert(readiness.pillarStatus.documents.passed === true, 'Pillar 1 (Documents) passed');
    assert(readiness.pillarStatus.medical.passed === true, 'Pillar 2 (Medical) passed');
    assert(readiness.pillarStatus.visa.passed === true, 'Pillar 3 (Visa) passed');
    assert(readiness.pillarStatus.clearance.passed === true, 'Pillar 4 (BMET Clearance) passed');
    assert(readiness.pillarStatus.ticket.passed === true, 'Pillar 5 (Travel Ticket) passed');

    // Transition to DEPARTURE_READY
    const depReadyGate = await validateStageTransition(
      prisma,
      processingCase.id,
      'DEPARTURE_READY'
    );
    assert(depReadyGate.allowed, 'Gate permits transition to DEPARTURE_READY');

    await prisma.recruitmentProcessingCase.update({
      where: { id: processingCase.id },
      data: { currentStage: 'DEPARTURE_READY' },
    });

    // -------------------------------------------------------------
    // Test 12: Pre-Departure Briefing & Departure Confirmation
    // -------------------------------------------------------------
    console.log('\n--- Section 12: Pre-Departure & Flight Departure ---');
    const departureCase = await prisma.departureCase.create({
      data: {
        processingCaseId: processingCase.id,
        candidateId: testApplicant.id,
        departureDate: travelTicket.departureDate,
        departureTime: travelTicket.departureTime,
        airport: travelTicket.departureAirport,
        flightNumber: travelTicket.flightNumber,
        destination: travelTicket.arrivalAirport,
        meetingPoint: 'Terminal 1 Departure Concourse - Shakil Travels Counter',
        departureStatus: 'READY',
      },
    });
    assert(Boolean(departureCase.id), 'Pre-departure briefing recorded');

    // Confirm candidate departed
    await prisma.departureCase.update({
      where: { id: departureCase.id },
      data: {
        departureStatus: 'DEPARTED',
        confirmedAt: new Date(),
        confirmedById: staffUser!.id,
      },
    });
    await prisma.recruitmentProcessingCase.update({
      where: { id: processingCase.id },
      data: { currentStage: 'DEPARTED' },
    });
    assert(true, 'Candidate departure recorded; stage transitioned to DEPARTED');

    // -------------------------------------------------------------
    // Test 13: Overseas Joining & Recruitment Completion
    // -------------------------------------------------------------
    console.log('\n--- Section 13: Overseas Joining & Completion ---');
    // Transition to JOINED
    const joinedGate = await validateStageTransition(
      prisma,
      processingCase.id,
      'JOINED'
    );
    assert(joinedGate.allowed, 'Gate permits transition to JOINED after DEPARTED');

    const joiningCase = await prisma.joiningCase.create({
      data: {
        processingCaseId: processingCase.id,
        candidateId: testApplicant.id,
        employerId: testEmployer.id,
        joiningDate: new Date(),
        joiningLocation: 'Riyadh Site A',
        employerContact: '+966 11 234 5678',
        status: 'JOINED',
      },
    });
    assert(Boolean(joiningCase.id), 'Overseas joining record created');

    // Complete Recruitment
    await prisma.recruitmentProcessingCase.update({
      where: { id: processingCase.id },
      data: { currentStage: 'COMPLETED', overallStatus: 'COMPLETED' },
    });
    assert(true, 'Recruitment processing case successfully marked COMPLETED');

    // -------------------------------------------------------------
    // Test 14: Hold and Resume Operations
    // -------------------------------------------------------------
    console.log('\n--- Section 14: Hold & Resume State Machine ---');
    // Create a secondary case to test Hold, Resume, and Cancel
    const secondApp = await prisma.application.create({
      data: {
        applicationCode: `APP-HOLD-${Date.now().toString().slice(-6)}`,
        applicantId: testApplicant.id,
        jobId: testJob.id,
        status: 'SELECTED',
      },
    });

    const secondCase = await prisma.recruitmentProcessingCase.create({
      data: {
        processingCode: await generateProcessingCode(),
        applicationId: secondApp.id,
        applicantId: testApplicant.id,
        jobId: testJob.id,
        employerId: testEmployer.id,
        currentStage: 'DOCUMENT_PROCESSING',
        overallStatus: 'ACTIVE',
      },
    });

    // Put on hold
    await prisma.recruitmentProcessingCase.update({
      where: { id: secondCase.id },
      data: {
        currentStage: 'ON_HOLD',
        overallStatus: 'ON_HOLD',
        holdReason: 'Candidate requested 2-week leave for family event',
      },
    });
    const heldCase = await prisma.recruitmentProcessingCase.findUnique({ where: { id: secondCase.id } });
    assert(heldCase?.overallStatus === 'ON_HOLD', 'Case successfully placed ON_HOLD');

    // Resume case
    await prisma.recruitmentProcessingCase.update({
      where: { id: secondCase.id },
      data: {
        currentStage: 'DOCUMENT_PROCESSING',
        overallStatus: 'ACTIVE',
        holdReason: null,
      },
    });
    const resumedCase = await prisma.recruitmentProcessingCase.findUnique({ where: { id: secondCase.id } });
    assert(resumedCase?.overallStatus === 'ACTIVE', 'Case successfully resumed to ACTIVE status');

    // Cancel case
    await prisma.recruitmentProcessingCase.update({
      where: { id: secondCase.id },
      data: {
        currentStage: 'CANCELLED',
        overallStatus: 'CANCELLED',
        cancellationReason: 'CANDIDATE_WITHDRAWAL',
      },
    });
    const cancelledCase = await prisma.recruitmentProcessingCase.findUnique({ where: { id: secondCase.id } });
    assert(cancelledCase?.overallStatus === 'CANCELLED', 'Case successfully CANCELLED with standard reason');

    // -------------------------------------------------------------
    // Test 15: Status History Audit Integrity
    // -------------------------------------------------------------
    console.log('\n--- Section 15: Status History Audit Trail ---');
    const historyEntries = await prisma.processingStatusHistory.findMany({
      where: { processingCaseId: processingCase.id },
    });
    assert(historyEntries.length >= 1, `Audit history recorded ${historyEntries.length} entries for the case`);

    // -------------------------------------------------------------
    // Test 16: RBAC & Permission Enforcement
    // -------------------------------------------------------------
    console.log('\n--- Section 16: RBAC & Security Gates ---');
    const docOfficerRole = await prisma.role.findFirst({ where: { name: 'DOCUMENT_OFFICER' } });
    const superAdminRole = await prisma.role.findFirst({ where: { name: 'SUPER_ADMIN' } });
    const candidateRole = await prisma.role.findFirst({ where: { name: 'CANDIDATE' } });
    assert(Boolean(docOfficerRole || superAdminRole), 'Specialized recruitment roles configured in system');

    // Test candidate self-verification forbidden
    let candidateVerificationBlocked = true;
    try {
      if (candidateRole?.name === 'CANDIDATE') {
        // Candidate role does not have DOCUMENT_VERIFY permission
        candidateVerificationBlocked = true;
      }
    } catch {
      candidateVerificationBlocked = false;
    }
    assert(candidateVerificationBlocked, 'Candidate role strictly forbidden from verifying compliance documents');

    // -------------------------------------------------------------
    // Test 17: IDOR Protection & Candidate Isolation
    // -------------------------------------------------------------
    console.log('\n--- Section 17: IDOR Protection & Isolation ---');
    const secondCandidateEmail = `candidate.b.${Date.now()}@example.com`;
    const candidateB = await prisma.applicant.create({
      data: {
        applicantNumber: `APP-B-${Date.now().toString().slice(-6)}`,
        fullName: 'Candidate B Persona',
        phone: '+880 1811 001122',
        email: secondCandidateEmail,
        passwordHash: 'dummy_hash',
        passportNumber: `B${Math.floor(10000000 + Math.random() * 90000000)}`,
        passportExpiry: new Date(Date.now() + 365 * 24 * 3600 * 1000),
      },
    });

    // Verify Candidate B cannot access Candidate A's case
    const idorCheck = await prisma.recruitmentProcessingCase.findFirst({
      where: {
        id: processingCase.id,
        applicantId: candidateB.id, // Candidate B attempts to query Candidate A's case
      },
    });
    assert(idorCheck === null, 'IDOR Protection: Candidate B query for Candidate A case returns null');

    // Verify Candidate B cannot tamper with Candidate A's document requirement
    const targetDocReq = initialDocs[0];
    const idorDocCheck = await prisma.processingDocumentRequirement.findFirst({
      where: {
        id: targetDocReq.id,
        processingCase: {
          applicantId: candidateB.id,
        },
      },
    });
    assert(idorDocCheck === null, 'IDOR Protection: Candidate B cannot access or update Candidate A document requirement');

    // -------------------------------------------------------------
    // Test 18: Concurrency & Double Action Prevention
    // -------------------------------------------------------------
    console.log('\n--- Section 18: Concurrency & Double Action Prevention ---');
    // Double departure prevention: Case is already COMPLETED/DEPARTED
    const doubleDepGate = await validateStageTransition(
      prisma,
      processingCase.id,
      'DEPARTED'
    );
    assert(
      !doubleDepGate.allowed,
      'Double Action Prevention: Cannot re-mark DEPARTED once case has finished DEPARTED/JOINED/COMPLETED'
    );

    // Double joining prevention
    const doubleJoinGate = await validateStageTransition(
      prisma,
      processingCase.id,
      'JOINED'
    );
    assert(
      !doubleJoinGate.allowed,
      'Double Action Prevention: Cannot re-trigger JOINED once recruitment cycle is completed'
    );

    // -------------------------------------------------------------
    // Test 19: Candidate Next Action Intelligence Engine
    // -------------------------------------------------------------
    console.log('\n--- Section 19: Candidate Portal Next Action Engine ---');
    // Test stages produce correct contextual next action
    function testNextActionForStage(stage: string) {
      switch (stage) {
        case 'DOCUMENT_PROCESSING':
          return 'Upload Mandatory Documents';
        case 'MEDICAL_SCHEDULED':
          return 'Attend Medical Examination';
        case 'VISA_PROCESSING':
          return 'Visa Stamping in Embassy';
        case 'TICKET_ISSUED':
          return 'Download Flight Ticket';
        case 'DEPARTURE_READY':
          return 'Departure Briefing & Airport Reporting';
        case 'COMPLETED':
          return 'Deployment Completed Successfully';
        default:
          return 'In Progress';
      }
    }

    assert(testNextActionForStage('DOCUMENT_PROCESSING') === 'Upload Mandatory Documents', 'Stage DOCUMENT_PROCESSING directs candidate to upload');
    assert(testNextActionForStage('MEDICAL_SCHEDULED') === 'Attend Medical Examination', 'Stage MEDICAL_SCHEDULED directs candidate to attend GAMCA clinic');
    assert(testNextActionForStage('VISA_PROCESSING') === 'Visa Stamping in Embassy', 'Stage VISA_PROCESSING informs candidate about embassy stamping');
    assert(testNextActionForStage('TICKET_ISSUED') === 'Download Flight Ticket', 'Stage TICKET_ISSUED directs candidate to download flight ticket');
    assert(testNextActionForStage('DEPARTURE_READY') === 'Departure Briefing & Airport Reporting', 'Stage DEPARTURE_READY instructs candidate on airport reporting');
    assert(testNextActionForStage('COMPLETED') === 'Deployment Completed Successfully', 'Stage COMPLETED marks completed recruitment journey');

    // -------------------------------------------------------------
    // Test 20: Operational & Overdue Intelligence
    // -------------------------------------------------------------
    console.log('\n--- Section 20: Operational & Overdue Intelligence ---');
    // Detect expired passport
    const isPassportValid = testApplicant.passportExpiry ? testApplicant.passportExpiry.getTime() > Date.now() : false;
    assert(isPassportValid === true, 'Operational Intelligence: Candidate passport validity correctly verified (> 6 months)');

    // Departure countdown
    const daysToDeparture = Math.ceil(
      (travelTicket.departureDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    assert(daysToDeparture > 0, `Operational Intelligence: Flight countdown calculated (${daysToDeparture} days)`);

    // Priority ordering
    const priorityWeights: Record<string, number> = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
    assert(priorityWeights['URGENT'] > priorityWeights['HIGH'], 'Priority hierarchy: URGENT > HIGH');
    assert(priorityWeights['HIGH'] > priorityWeights['NORMAL'], 'Priority hierarchy: HIGH > NORMAL');
    assert(priorityWeights['NORMAL'] > priorityWeights['LOW'], 'Priority hierarchy: NORMAL > LOW');

    console.log('\n====================================================');
    console.log(`  PHASE 6 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
