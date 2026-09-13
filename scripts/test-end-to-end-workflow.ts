/**
 * Complete End-to-End Recruitment ERP Workflow Automated Integration Test
 * Project: SHAKIL GLOBAL MANPOWER
 * License: RL-1892
 */

import prisma from '../src/lib/prisma';
import { Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`  ✅ PASS: ${testName}`);
    if (detail) console.log(`     ℹ️ ${detail}`);
  } else {
    failedCount++;
    console.error(`  ❌ FAIL: ${testName}`);
    if (detail) console.error(`     ⚠️ ${detail}`);
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runEndToEndWorkflowAudit() {
  console.log('======================================================================');
  console.log('🚀 SHAKIL GLOBAL MANPOWER — END-TO-END RECRUITMENT ERP WORKFLOW AUDIT');
  console.log('======================================================================\n');

  const timestamp = Date.now();
  const testPhone = `017${String(timestamp).slice(-8)}`;
  const testEmail = `workflow.candidate.${timestamp}@shakilglobal-test.com`;
  const testPassword = 'Password123!';
  const candidateName = `Al-Amin Workflow Candidate ${timestamp.toString().slice(-4)}`;

  let candidateCookie = '';
  let applicantId = '';
  let applicantNumber = '';
  let customerId = '';
  let adminCookie = '';
  let doc1Id = '';
  let doc2Id = '';
  let testJobId = '';
  let applicationId = '';
  let applicationCode = '';
  let invoiceId = '';
  let invoiceNumber = '';
  let paymentId = '';

  try {
    // -------------------------------------------------------------
    // PHASE 1: ADMIN AUTHENTICATION
    // -------------------------------------------------------------
    console.log('👉 PHASE 1: Admin Authentication');
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
    adminCookie = adminRawCookie.split(';')[0];
    assert(adminLoginRes.status === 200 && adminLoginData.success, 'Admin Login', `Logged in as: ${adminLoginData.data?.user?.email || 'admin'}`);

    // Ensure a published test job exists
    const job = await prisma.job.findFirst({
      where: { status: 'PUBLISHED' },
      include: { country: true, jobCategory: true, employer: true },
    });
    if (!job) {
      throw new Error('No published job found in database for testing');
    }
    testJobId = job.id;
    console.log(`     ℹ️ Target Test Vacancy: ${job.title} (${job.country.name})`);

    // Ensure document type exists
    const docType = await prisma.documentType.findFirst({ where: { isActive: true } });
    if (!docType) throw new Error('No active document type in database');

    // -------------------------------------------------------------
    // PHASE 2: USER REGISTRATION & UNIFIED SINGLE RECORD
    // -------------------------------------------------------------
    console.log('\n👉 PHASE 2: Candidate Registration & Unified Database Record');
    const registerRes = await fetch(`${BASE_URL}/api/portal/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: candidateName,
        phone: testPhone,
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        district: 'Netrokona',
      }),
    });
    const registerData = await registerRes.json();
    const registerRawCookie = registerRes.headers.get('set-cookie') || '';
    candidateCookie = registerRawCookie.split(';')[0];

    assert(registerRes.status === 201 && registerData.success, 'Candidate Registration', `Applicant Number: ${registerData.data?.applicant?.applicantNumber}`);
    applicantId = registerData.data?.applicant?.id;
    applicantNumber = registerData.data?.applicant?.applicantNumber;

    // Verify Unified Database Record: Applicant, ApplicantProfile, and Customer
    const applicantDb = await prisma.applicant.findUnique({
      where: { id: applicantId },
      include: { profile: true, customer: true, portalNotifications: true },
    });
    assert(!!applicantDb, 'Applicant Record Created in PostgreSQL', `ID: ${applicantDb?.id}`);
    assert(!!applicantDb?.profile, 'ApplicantProfile Initialized', `Linked applicantId: ${applicantDb?.profile?.applicantId}`);
    assert(!!applicantDb?.customer, 'Single Customer Record Created & Linked', `Customer ID: ${applicantDb?.customer?.id} (Type: ${applicantDb?.customer?.customerType})`);
    customerId = applicantDb?.customer?.id || '';

    // Verify Welcome Notification & Registration Audit Log
    const welcomeNotif = applicantDb?.portalNotifications.find((n) => n.type === 'WELCOME');
    assert(!!welcomeNotif, 'Welcome Notification Created in Candidate Inbox', `Title: ${welcomeNotif?.title}`);

    const regAuditLog = await prisma.auditLog.findFirst({
      where: { applicantId, action: 'APPLICANT_REGISTERED' },
    });
    assert(!!regAuditLog, 'Registration Event Audited in Unified Activity Trail', `Actor: ${regAuditLog?.actorType}`);

    // -------------------------------------------------------------
    // PHASE 3: CANDIDATE LOGIN & PROFILE UPDATE
    // -------------------------------------------------------------
    console.log('\n👉 PHASE 3: Candidate Login & Profile Updates');
    const loginRes = await fetch(`${BASE_URL}/api/portal/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testPhone,
        password: testPassword,
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.success, 'Candidate Portal Login', `User: ${loginData.data?.applicant?.fullName}`);

    // Update candidate profile
    const profileRes = await fetch(`${BASE_URL}/api/portal/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: candidateCookie,
      },
      body: JSON.stringify({
        education: 'HSC Passed',
        profession: 'Electrician',
        yearsOfExperience: 3,
        skills: 'Electrical Wiring, Conduit Installation, Blueprint Reading',
        languages: 'Bengali, English, Hindi',
        passportAvailable: true,
        passportNumber: `A${String(timestamp).slice(-7)}`,
        passportExpiry: new Date(Date.now() + 730 * 86400000).toISOString(),
      }),
    });
    const profileData = await profileRes.json();
    assert(profileRes.status === 200 && profileData.success, 'Profile Updated with Trade Skills & Passport', `Completion: ${profileData.data?.completion?.percentage}%`);

    // -------------------------------------------------------------
    // PHASE 4: ADMIN SEARCH & 360 CANDIDATE VIEW
    // -------------------------------------------------------------
    console.log('\n👉 PHASE 4: Admin Panel Search & 360 Candidate ERP View');
    const searchRes = await fetch(`${BASE_URL}/api/applicants?search=${encodeURIComponent(testPhone)}`, {
      headers: { Cookie: adminCookie },
    });
    const searchData = await searchRes.json();
    const foundApplicant = searchData.data?.items?.find((a: any) => a.id === applicantId);
    assert(!!foundApplicant, 'Admin Search Finds Newly Registered Candidate', `Found: ${foundApplicant?.fullName}`);

    const detailRes = await fetch(`${BASE_URL}/api/applicants/${applicantId}`, {
      headers: { Cookie: adminCookie },
    });
    const detailData = await detailRes.json();
    assert(detailRes.status === 200 && detailData.success, 'Admin 360 Detail API Returns Candidate Profile', `Profession: ${detailData.data?.profession}`);

    // -------------------------------------------------------------
    // PHASE 5: DOCUMENT UPLOAD & ADMIN VERIFICATION / REJECTION
    // -------------------------------------------------------------
    console.log('\n👉 PHASE 5: Document Upload, Verification & Rejection Workflow');
    // Upload Document 1 (Passport Scan)
    const formData1 = new FormData();
    const samplePdfContent = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000117 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n180\n%%EOF';
    const blob1 = new Blob([samplePdfContent], { type: 'application/pdf' });
    formData1.append('file', blob1, 'passport_scan.pdf');
    formData1.append('documentTypeId', docType.id);

    const docUploadRes1 = await fetch(`${BASE_URL}/api/portal/documents`, {
      method: 'POST',
      headers: { Cookie: candidateCookie },
      body: formData1,
    });
    const docUploadData1 = await docUploadRes1.json();
    assert(docUploadRes1.status === 201 && docUploadData1.success, 'Document 1 Uploaded Securely', `ID: ${docUploadData1.data?.id}`);
    doc1Id = docUploadData1.data?.id;

    // Upload Document 2 (Medical Certificate)
    const formData2 = new FormData();
    formData2.append('file', blob1, 'medical_report.pdf');
    formData2.append('documentTypeId', docType.id);
    const docUploadRes2 = await fetch(`${BASE_URL}/api/portal/documents`, {
      method: 'POST',
      headers: { Cookie: candidateCookie },
      body: formData2,
    });
    const docUploadData2 = await docUploadRes2.json();
    assert(docUploadRes2.status === 201 && docUploadData2.success, 'Document 2 Uploaded Securely', `ID: ${docUploadData2.data?.id}`);
    doc2Id = docUploadData2.data?.id;

    // Admin verifies Document 1
    const verifyRes = await fetch(`${BASE_URL}/api/documents/${doc1Id}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ status: 'VERIFIED' }),
    });
    const verifyData = await verifyRes.json();
    assert(verifyRes.status === 200 && verifyData.data?.status === 'VERIFIED', 'Admin Verifies Document 1', 'Status: VERIFIED');

    // Admin rejects Document 2 with feedback reason
    const rejectRes = await fetch(`${BASE_URL}/api/documents/${doc2Id}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        status: 'REJECTED',
        rejectionReason: 'The medical report signature is illegible. Please re-upload clear copy.',
      }),
    });
    const rejectData = await rejectRes.json();
    assert(rejectRes.status === 200 && rejectData.data?.status === 'REJECTED', 'Admin Rejects Document 2 with Feedback Reason', `Reason: ${rejectData.data?.rejectionReason}`);

    // Verify candidate portal sees updated document statuses & notifications
    const portalDocsRes = await fetch(`${BASE_URL}/api/portal/documents`, {
      headers: { Cookie: candidateCookie },
    });
    const portalDocsData = await portalDocsRes.json();
    const pDoc1 = portalDocsData.data?.documents?.find((d: any) => d.id === doc1Id);
    const pDoc2 = portalDocsData.data?.documents?.find((d: any) => d.id === doc2Id);
    assert(pDoc1?.status === 'VERIFIED', 'Candidate Portal Reflects Document 1 as VERIFIED', `Document: ${pDoc1?.fileName}`);
    assert(pDoc2?.status === 'REJECTED' && !!pDoc2?.rejectionReason, 'Candidate Portal Reflects Document 2 as REJECTED with Reason', `Feedback: ${pDoc2?.rejectionReason}`);

    // Check candidate notifications for document actions
    const candidateNotifs = await prisma.notification.findMany({
      where: { applicantId },
      orderBy: { createdAt: 'desc' },
    });
    const docVerNotif = candidateNotifs.find((n) => n.type === 'DOCUMENT_VERIFIED');
    const docRejNotif = candidateNotifs.find((n) => n.type === 'DOCUMENT_REJECTED');
    assert(!!docVerNotif, 'Candidate Notified of Document Verification', `Title: ${docVerNotif?.title}`);
    assert(!!docRejNotif, 'Candidate Notified of Document Rejection with Details', `Message: ${docRejNotif?.message}`);

    // -------------------------------------------------------------
    // PHASE 6: ADMIN ASSIGNS JOB & CANDIDATE SEES APPLICATION
    // -------------------------------------------------------------
    console.log('\n👉 PHASE 6: Admin Job Assignment & Processing Pipeline');
    const appCreateRes = await fetch(`${BASE_URL}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        applicantId,
        jobId: testJobId,
        priority: 'HIGH',
        appliedStage: 'SUBMITTED',
        notes: 'Assigned by recruitment officer for urgent deployment',
      }),
    });
    const appCreateData = await appCreateRes.json();
    assert(appCreateRes.status === 201 && appCreateData.success, 'Admin Initiates Application for Candidate', `Application Code: ${appCreateData.data?.applicationNumber}`);
    applicationId = appCreateData.data?.id;
    applicationCode = appCreateData.data?.applicationNumber;

    // Verify candidate portal sees the application
    const portalAppRes = await fetch(`${BASE_URL}/api/portal/applications`, {
      headers: { Cookie: candidateCookie },
    });
    const portalAppData = await portalAppRes.json();
    const apps = Array.isArray(portalAppData.data) ? portalAppData.data : (portalAppData.data?.applications || []);
    const portalApp = apps.find((a: any) => a.id === applicationId);
    assert(!!portalApp, 'Candidate Portal Lists Newly Assigned Application', `Job: ${portalApp?.job?.title}`);

    // -------------------------------------------------------------
    // PHASE 7: RECRUITMENT STATUS PROGRESSION & AUDIT
    // -------------------------------------------------------------
    console.log('\n👉 PHASE 7: Multi-Stage Status Transitions & Timeline');
    const stages = ['UNDER_REVIEW', 'DOCUMENT_VERIFICATION', 'SELECTED', 'VISA_PROCESSING'];
    for (const st of stages) {
      const stRes = await fetch(`${BASE_URL}/api/applications/${applicationId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          toStatus: st,
          notes: `Moved to ${st} stage during automated recruitment pipeline`,
          forceOverride: true,
        }),
      });
      const stData = await stRes.json();
      assert(stRes.status === 200 && stData.data?.status === st, `Application Progressed to Stage: ${st}`, `Current: ${stData.data?.status}`);
    }

    // Schedule an Interview
    const interviewDate = new Date(Date.now() + 3 * 86400000).toISOString();
    const interviewRes = await fetch(`${BASE_URL}/api/interviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        applicantId,
        applicationId,
        jobId: testJobId,
        interviewType: 'VIDEO',
        scheduledDate: interviewDate,
        scheduledAt: interviewDate,
        durationMinutes: 45,
        interviewer: 'Overseas Principal HR',
        notes: 'Technical trade test & oral interview via Zoom',
      }),
    });
    const interviewData = await interviewRes.json();
    assert(interviewRes.status === 201 && interviewData.success, 'Admin Schedules Video Interview', `Interview ID: ${interviewData.data?.id}`);

    // Candidate checks portal interviews
    const portalIntRes = await fetch(`${BASE_URL}/api/portal/interviews`, {
      headers: { Cookie: candidateCookie },
    });
    const portalIntData = await portalIntRes.json();
    const ints = Array.isArray(portalIntData.data) ? portalIntData.data : (portalIntData.data?.interviews || []);
    assert(ints.length > 0, 'Candidate Portal Displays Scheduled Interview', `Type: ${ints[0]?.interviewType}`);

    // -------------------------------------------------------------
    // PHASE 8: FINANCIAL INVOICE ISSUANCE
    // -------------------------------------------------------------
    console.log('\n👉 PHASE 8: Admin Issues Invoice & Candidate Sees in Portal');
    const invoiceRes = await fetch(`${BASE_URL}/api/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        applicantId,
        customerId,
        applicationId,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
        items: [
          {
            description: 'BMET Smart Card, Medical & Visa Stamping Service',
            quantity: 1,
            unitPrice: 150000,
          },
          {
            description: 'Overseas Pre-departure Training & Orientation',
            quantity: 1,
            unitPrice: 15000,
          },
        ],
        notes: 'First installment payable within 14 calendar days.',
      }),
    });
    const invoiceData = await invoiceRes.json();
    assert(invoiceRes.status === 201 && invoiceData.success, 'Admin Issues Invoice with Line Items', `Invoice: ${invoiceData.data?.invoiceNumber} (Total: BDT ${invoiceData.data?.totalAmount})`);
    invoiceId = invoiceData.data?.id;
    invoiceNumber = invoiceData.data?.invoiceNumber;

    // Candidate Portal Invoices Check
    const portalInvRes = await fetch(`${BASE_URL}/api/portal/invoices`, {
      headers: { Cookie: candidateCookie },
    });
    const portalInvData = await portalInvRes.json();
    const portalInvoice = portalInvData.data?.invoices?.find((i: any) => i.id === invoiceId);
    assert(!!portalInvoice, 'Invoice Automatically Visible in Candidate Portal', `Found Invoice: ${portalInvoice?.invoiceNumber}`);
    assert(Number(portalInvoice?.totalAmount) === 165000, 'Total Invoiced Matches Decimal Line Items (BDT 165,000)', `Total: ${portalInvoice?.totalAmount}`);
    assert(Number(portalInvoice?.dueAmount) === 165000, 'Initial Due Amount is Exact Total (BDT 165,000)', `Due: ${portalInvoice?.dueAmount}`);

    // -------------------------------------------------------------
    // PHASE 9: PAYMENT PROCESSING & DECIMAL RECONCILIATION
    // -------------------------------------------------------------
    console.log('\n👉 PHASE 9: Concurrency-Safe Payment Processing & Due Calculation');
    // Partial payment: 100,000 BDT
    const paymentRes1 = await fetch(`${BASE_URL}/api/invoices/${invoiceId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        amount: 100000,
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: 'TXN-BANK-998811',
        notes: 'Advance installment deposited via Islami Bank',
      }),
    });
    const paymentData1 = await paymentRes1.json();
    assert(paymentRes1.status === 201 && paymentData1.success, 'Partial Payment (100,000 BDT) Recorded', `Payment: ${paymentData1.data?.paymentNumber}, Receipt: ${paymentData1.data?.receiptNumber}`);
    paymentId = paymentData1.data?.id;

    // Verify invoice balances in DB
    const invAfterPayment1 = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    assert(invAfterPayment1?.status === 'PARTIALLY_PAID', 'Invoice Status Transitions to PARTIALLY_PAID', `Status: ${invAfterPayment1?.status}`);
    assert(Number(invAfterPayment1?.paidAmount) === 100000, 'Paid Amount Equals 100,000.00', `Paid: ${invAfterPayment1?.paidAmount}`);
    assert(Number(invAfterPayment1?.dueAmount) === 65000, 'Remaining Due Exactly Equals 65,000.00 (165000 - 100000)', `Due: ${invAfterPayment1?.dueAmount}`);

    // Candidate checks portal payments & invoice reflection
    const portalPaymentsRes = await fetch(`${BASE_URL}/api/portal/payments`, {
      headers: { Cookie: candidateCookie },
    });
    const portalPaymentsData = await portalPaymentsRes.json();
    const paymentsList = Array.isArray(portalPaymentsData.data) ? portalPaymentsData.data : (portalPaymentsData.data?.payments || []);
    const portalPaymentItem = paymentsList.find((p: any) => p.id === paymentId);
    assert(!!portalPaymentItem, 'Payment Receipt Appears in Candidate Portal', `Receipt: ${portalPaymentItem?.receiptNumber}`);

    // Final balance payment: 65,000 BDT
    const paymentRes2 = await fetch(`${BASE_URL}/api/invoices/${invoiceId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        amount: 65000,
        paymentMethod: 'CASH',
        referenceNumber: 'CASH-COUNTER-001',
        notes: 'Final settlement at Netrokona office counter',
      }),
    });
    const paymentData2 = await paymentRes2.json();
    assert(paymentRes2.status === 201 && paymentData2.success, 'Final Payment (65,000 BDT) Recorded', `Receipt: ${paymentData2.data?.receiptNumber}`);

    const invAfterPayment2 = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    assert(invAfterPayment2?.status === 'PAID', 'Invoice Status Transitions to PAID', `Status: ${invAfterPayment2?.status}`);
    assert(Number(invAfterPayment2?.dueAmount) === 0, 'Remaining Due Balance is Exactly 0.00', `Due: ${invAfterPayment2?.dueAmount}`);

    // -------------------------------------------------------------
    // PHASE 10: PUBLIC QR CODE VERIFICATION
    // -------------------------------------------------------------
    console.log('\n👉 PHASE 10: Public QR Code & RL-1892 Invoice Verification');
    const qrVerifyRes = await fetch(`${BASE_URL}/api/invoices/verify/${invoiceNumber}`);
    const qrVerifyData = await qrVerifyRes.json();
    assert(qrVerifyRes.status === 200 && qrVerifyData.success, 'Public QR Verification API Confirms Invoice', `Invoice Number: ${qrVerifyData.data?.invoiceNumber}`);
    assert(qrVerifyData.data?.status === 'PAID', 'Public QR Verification Shows Authenticated PAID Status', `Status: ${qrVerifyData.data?.status}`);
    const license = qrVerifyData.data?.agencyLicense || qrVerifyData.data?.organization?.licenseNumber;
    assert(license === 'RL-1892', 'Official License Number RL-1892 Verified on Public Invoice', `License: ${license}`);

    // -------------------------------------------------------------
    // PHASE 11: UNIFIED AUDIT TIMELINE & ERP OBSERVABILITY
    // -------------------------------------------------------------
    console.log('\n👉 PHASE 11: Complete Activity Timeline & ERP Observability');
    const auditRes = await fetch(`${BASE_URL}/api/audit-logs?applicantId=${applicantId}&pageSize=50`, {
      headers: { Cookie: adminCookie },
    });
    const auditData = await auditRes.json();
    const logs = auditData.data?.logs || [];
    assert(logs.length >= 7, `Comprehensive Activity Timeline Contains ${logs.length} Unified Events`, 'Audit trail actively tracking all lifecycle actions');

    const actions = logs.map((l: any) => l.action);
    assert(actions.includes('APPLICANT_REGISTERED'), 'Timeline includes APPLICANT_REGISTERED event');
    assert(actions.includes('DOCUMENT_VERIFY'), 'Timeline includes DOCUMENT_VERIFY event');
    assert(actions.includes('DOCUMENT_REJECT'), 'Timeline includes DOCUMENT_REJECT event');
    assert(actions.includes('APPLICATION_CREATE'), 'Timeline includes APPLICATION_CREATE event');
    assert(actions.includes('APPLICATION_STATUS_CHANGE'), 'Timeline includes APPLICATION_STATUS_CHANGE event');
    assert(actions.includes('INVOICE_CREATE'), 'Timeline includes INVOICE_CREATE event');
    assert(actions.includes('PAYMENT_CREATE'), 'Timeline includes PAYMENT_CREATE event');

    // -------------------------------------------------------------
    // PHASE 12: IDOR DATA ISOLATION & SECURITY GUARDRAILS
    // -------------------------------------------------------------
    console.log('\n👉 PHASE 12: Security Architecture & IDOR Prevention');
    // Register another candidate B
    const candidateBRes = await fetch(`${BASE_URL}/api/portal/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Second Candidate Security Probe',
        phone: `018${String(timestamp).slice(-8)}`,
        email: `candidate.b.${timestamp}@test.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }),
    });
    const candidateBData = await candidateBRes.json();
    const candidateBRawCookie = candidateBRes.headers.get('set-cookie') || '';
    const candidateBCookie = candidateBRawCookie.split(';')[0];

    // Candidate B attempts to access Candidate A document directly
    const idorDocRes = await fetch(`${BASE_URL}/api/portal/documents/${doc1Id}`, {
      headers: { Cookie: candidateBCookie },
    });
    assert(idorDocRes.status === 403, 'Candidate B Forbidden (403) from Accessing Candidate A Document', `Status: ${idorDocRes.status}`);

    // Candidate B queries invoices -> Candidate A invoice must NOT appear
    const candidateBInvRes = await fetch(`${BASE_URL}/api/portal/invoices`, {
      headers: { Cookie: candidateBCookie },
    });
    const candidateBInvData = await candidateBInvRes.json();
    const leakedInvoice = candidateBInvData.data?.invoices?.find((i: any) => i.id === invoiceId);
    assert(!leakedInvoice, 'Candidate B Portal Strictly Isolated from Candidate A Invoices', 'Zero invoice data leakage across applicant boundaries');

  } catch (err: any) {
    console.error('Fatal error during integration test:', err);
    failedCount++;
  }

  console.log('\n======================================================================');
  console.log(`📊 END-TO-END WORKFLOW RESULTS: ${passedCount} PASSED | ${failedCount} FAILED`);
  console.log('======================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runEndToEndWorkflowAudit();
