import { PrismaClient, Prisma } from '@prisma/client';
import { validateProductionConfig, getSanitizedConfig } from '../src/lib/config/env';
import { sendEmail } from '../src/lib/comms/email';
import { sendSMS } from '../src/lib/comms/sms';
import { sendWhatsApp } from '../src/lib/comms/whatsapp';
import { dispatchCommunication } from '../src/lib/comms/dispatcher';
import { recordPayment } from '../src/lib/accounting/payment';
import { sanitizeData } from '../src/lib/utils';
import { sanitizeFileName, assertApplicantOwnership } from '../src/lib/security';
import { generateFormattedId, generateApplicantNumber } from '../src/lib/id-generator';
import { validateDocumentFile, createStorageProvider } from '../src/lib/storage';

const prisma = new PrismaClient();

async function main() {
  console.log('================================================================');
  console.log('SHAKIL GLOBAL RECRUITMENT — PRODUCTION READINESS VERIFICATION');
  console.log('Environment, Security, Comms, Payments & Storage Suite');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // 1. Production Configuration & Environment Validation
  // --------------------------------------------------------------------------
  console.log('\n[1] Testing Production Environment Configuration Validator...');
  
  // Test with simulated production environment
  const origEnv = process.env.NODE_ENV;
  try {
    (process.env as any).NODE_ENV = 'production';
    const prodVal = validateProductionConfig();
    assert(prodVal.environment === 'production', 'Validator correctly detects production mode');
    assert(Array.isArray(prodVal.missingRequired), 'Missing required list is an array');

    const sanitized = getSanitizedConfig();
    assert(typeof sanitized.databaseConfigured === 'boolean', 'Database status masked as boolean');
    assert(typeof sanitized.authSecretConfigured === 'boolean', 'Auth secret masked as boolean');
    assert(!JSON.stringify(sanitized).includes('postgres:'), 'Sanitized config never contains database passwords');
  } finally {
    (process.env as any).NODE_ENV = origEnv;
  }

  // --------------------------------------------------------------------------
  // 2. Email Service: Production Blockers vs Development Mock
  // --------------------------------------------------------------------------
  console.log('\n[2] Testing Email Service Production Guard...');
  
  try {
    (process.env as any).NODE_ENV = 'production';
    (process.env as any).EMAIL_PROVIDER = 'MOCK';
    
    const prodMockRes = await sendEmail({
      to: 'candidate@shakilglobal.com',
      subject: 'Application Status Notification',
      html: '<p>Your application is under review.</p>',
    });
    assert(
      !prodMockRes.success && prodMockRes.error?.includes('cannot be MOCK in production'),
      'Production blocks MOCK email provider and returns clear configuration error'
    );
  } finally {
    (process.env as any).NODE_ENV = origEnv;
    delete (process.env as any).EMAIL_PROVIDER;
  }

  // Dev mock email test across application scenarios
  const emailScenarios = [
    { type: 'Application Notification', subject: 'Application SGR-APP-2026-000001 Received' },
    { type: 'Interview Schedule Notification', subject: 'Interview Scheduled with Employer' },
    { type: 'Payment Receipt Notification', subject: 'Payment Received — Receipt #SGR-RCP-2026-000001' },
    { type: 'Invoice Issued Notification', subject: 'Invoice #SGR-INV-2026-000001 Issued' },
    { type: 'Visa Status Update', subject: 'Visa Stamping Approved' },
    { type: 'Password Reset', subject: 'Reset Your Applicant Portal Password' },
  ];

  for (const sc of emailScenarios) {
    const res = await sendEmail({
      to: 'candidate@test.com',
      subject: sc.subject,
      html: `<p>${sc.type} content</p>`,
    });
    assert(res.success && !!res.messageId, `Email delivered for ${sc.type}`);
  }

  // --------------------------------------------------------------------------
  // 3. SMS Service: Production Guard & Reminder Scenarios
  // --------------------------------------------------------------------------
  console.log('\n[3] Testing SMS Service Production Guard...');
  
  try {
    (process.env as any).NODE_ENV = 'production';
    (process.env as any).SMS_PROVIDER = 'MOCK';
    
    const prodSmsRes = await sendSMS({
      to: '+8801700000000',
      text: 'Reminder: Interview tomorrow at 10:00 AM.',
    });
    assert(
      !prodSmsRes.success && prodSmsRes.error?.includes('cannot be MOCK in production'),
      'Production blocks MOCK SMS provider and returns clear configuration error'
    );
  } finally {
    (process.env as any).NODE_ENV = origEnv;
    delete (process.env as any).SMS_PROVIDER;
  }

  const smsScenarios = [
    { name: 'Interview Reminder', text: 'Reminder: Interview scheduled for tomorrow at 10:00 AM at Shakil Global.' },
    { name: 'Payment Reminder', text: 'Reminder: Invoice SGR-INV-2026-000001 has an outstanding balance due.' },
    { name: 'Application Status Notification', text: 'Congratulations! Your application has been shortlisted.' },
    { name: 'Visa Notification', text: 'Your overseas visa application has been approved by the embassy.' },
  ];

  for (const sms of smsScenarios) {
    const res = await sendSMS({ to: '+8801700000000', text: sms.text });
    assert(res.success && !!res.messageId, `SMS delivered for ${sms.name}`);
  }

  // --------------------------------------------------------------------------
  // 4. WhatsApp Service: Official API Guard & Failure Handling
  // --------------------------------------------------------------------------
  console.log('\n[4] Testing WhatsApp Official API Guard...');
  
  try {
    (process.env as any).NODE_ENV = 'production';
    (process.env as any).WHATSAPP_PROVIDER = 'MOCK';
    
    const prodWaRes = await sendWhatsApp({
      to: '+8801700000000',
      text: 'Your document verification is complete.',
    });
    assert(
      !prodWaRes.success && prodWaRes.error?.includes('cannot be MOCK in production'),
      'Production blocks MOCK WhatsApp provider and returns clear configuration error'
    );
  } finally {
    (process.env as any).NODE_ENV = origEnv;
    delete (process.env as any).WHATSAPP_PROVIDER;
  }

  const devWaRes = await sendWhatsApp({
    to: '+8801700000000',
    text: 'Your document verification is complete.',
  });
  assert(devWaRes.success && !!devWaRes.messageId, 'WhatsApp dev service operates cleanly in test mode');

  // --------------------------------------------------------------------------
  // 5. Payment Architecture: Concurrency, Overpayment & Idempotency
  // --------------------------------------------------------------------------
  console.log('\n[5] Testing Payment Idempotency & Database Integrity...');
  
  const adminUser = await prisma.user.findFirst({ where: { email: 'admin@shakilglobal.com' } });
  assert(!!adminUser, 'Admin user available for payment recording');

  const applicant = await prisma.applicant.findFirst();
  assert(!!applicant, 'Test applicant available');

  const testInvNumber = await generateFormattedId(prisma, 'invoice');
  const testInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: testInvNumber,
      applicantId: applicant!.id,
      subtotal: new Prisma.Decimal('20000.00'),
      totalAmount: new Prisma.Decimal('20000.00'),
      dueAmount: new Prisma.Decimal('20000.00'),
      paidAmount: new Prisma.Decimal('0.00'),
      status: 'ISSUED',
    },
  });

  const idempotentTxnId = `IDEMP-TXN-${Date.now()}`;

  // Initial Payment
  const pay1 = await recordPayment(prisma, {
    invoiceId: testInvoice.id,
    amount: 10000.00,
    paymentMethod: 'BANK_TRANSFER',
    transactionId: idempotentTxnId,
    receivedById: adminUser?.id,
  });
  assert(!!pay1.id, `First payment recorded (${pay1.paymentNumber})`);

  // Replay exact same transactionId (Idempotent replay)
  const pay2 = await recordPayment(prisma, {
    invoiceId: testInvoice.id,
    amount: 10000.00,
    paymentMethod: 'BANK_TRANSFER',
    transactionId: idempotentTxnId,
    receivedById: adminUser?.id,
  });
  assert(pay2.id === pay1.id, 'Idempotent replay returns existing payment without double charging');

  const invAfterReplay = await prisma.invoice.findUnique({ where: { id: testInvoice.id } });
  assert(
    invAfterReplay?.paidAmount.equals(new Prisma.Decimal('10000.00')),
    'Invoice paidAmount remains 10,000.00 after idempotent retry'
  );
  assert(
    invAfterReplay?.dueAmount.equals(new Prisma.Decimal('10000.00')),
    'Invoice dueAmount remains 10,000.00 after idempotent retry'
  );

  // --------------------------------------------------------------------------
  // 6. Private File Storage, Path Sanitization & Cross-Candidate Defense
  // --------------------------------------------------------------------------
  console.log('\n[6] Testing Private Document Storage & IDOR Defense...');

  const safeFileName = sanitizeFileName('../../../secrets/credentials.key');
  assert(!safeFileName.includes('..'), 'Directory traversal path successfully stripped');
  assert(!safeFileName.includes('/'), 'Directory slashes normalized and sanitized');

  let idorCaught = false;
  try {
    assertApplicantOwnership('applicant-uuid-A', 'applicant-uuid-B');
  } catch (err: any) {
    if (err.name === 'AuthorizationError') {
      idorCaught = true;
    }
  }
  assert(idorCaught, 'Strict server-side applicant ownership check blocks unauthorized access');

  // File size and MIME type validation
  const validDoc = validateDocumentFile(1024 * 500, 'application/pdf');
  assert(validDoc.valid, 'Valid 500KB PDF passes document validation');

  const validJpg = validateDocumentFile(1024 * 1024 * 2, 'image/jpeg');
  assert(validJpg.valid, 'Valid 2MB JPEG passes document validation');

  const oversizeDoc = validateDocumentFile(15 * 1024 * 1024, 'application/pdf');
  assert(!oversizeDoc.valid && !!oversizeDoc.error?.includes('10MB limit'), 'Oversize 15MB file rejected by validation');

  const invalidMime = validateDocumentFile(1024 * 100, 'application/x-msdownload');
  assert(!invalidMime.valid && !!invalidMime.error?.includes('Disallowed file format'), 'Disallowed MIME type (.exe) rejected by validation');

  // Storage provider factory validation in production mode
  try {
    (process.env as any).NODE_ENV = 'production';
    (process.env as any).STORAGE_PROVIDER = 'LOCAL';
    delete (process.env as any).STORAGE_ALLOW_LOCAL_IN_PRODUCTION;
    let threw = false;
    try {
      createStorageProvider();
    } catch (e: any) {
      threw = e.message.includes('Local disk storage cannot be used as primary production storage');
    }
    assert(threw, 'Production blocks unapproved local disk storage without explicit override');
  } finally {
    (process.env as any).NODE_ENV = origEnv;
    delete (process.env as any).STORAGE_PROVIDER;
  }

  // --------------------------------------------------------------------------
  // 7. Production Logging & Data Redaction
  // --------------------------------------------------------------------------
  console.log('\n[7] Testing Production Logging & Secret Redaction...');

  const sensitivePayload = {
    username: 'admin@shakilglobal.com',
    password: 'SuperSecretPassword123',
    jwtToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    apiKey: 'live_api_key_998877',
    cvv: '123',
    cardNumber: '4111222233334444',
    privateUrl: '/uploads/private/passport_scan.pdf',
    status: 'ACTIVE',
  };

  const sanitizedLog = sanitizeData(sensitivePayload);
  assert(sanitizedLog.password === '[REDACTED]', 'Passwords redacted in logs');
  assert(sanitizedLog.jwtToken === '[REDACTED]', 'JWT tokens redacted in logs');
  assert(sanitizedLog.apiKey === '[REDACTED]', 'API keys redacted in logs');
  assert(sanitizedLog.cvv === '[REDACTED]', 'CVV redacted in logs');
  assert(sanitizedLog.cardNumber === '[REDACTED]', 'Card numbers redacted in logs');
  assert(sanitizedLog.privateUrl === '[REDACTED]', 'Private document URLs redacted in logs');
  assert(sanitizedLog.status === 'ACTIVE', 'Non-sensitive operational fields preserved');

  // ==========================================================================
  // Summary
  // ==========================================================================
  console.log('\n================================================================');
  console.log(`PRODUCTION READINESS SUITE SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('Test execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
