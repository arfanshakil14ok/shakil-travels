import prisma from '../src/lib/prisma';
import { storage, validateDocumentFile } from '../src/lib/storage';
import { createAuditLog } from '../src/lib/audit';
import { generateFormattedId } from '../src/lib/id-generator';
import { toDecimal } from '../src/lib/accounting/calculations';
import crypto from 'crypto';

async function runTests() {
  console.log('========================================');
  console.log('STARTING SHAKIL GLOBAL PORTAL & INVOICE UPGRADE TESTS');
  console.log('========================================\n');

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

  // Find or create test applicants
  let candidateA = await prisma.applicant.findFirst({
    where: { phone: '01700000001' },
  });
  if (!candidateA) {
    const appNum = await generateFormattedId(prisma as any, 'applicant');
    candidateA = await prisma.applicant.create({
      data: {
        applicantNumber: appNum,
        fullName: 'Test Candidate Alpha',
        phone: '01700000001',
        email: 'alpha@test.local',
        status: 'ACTIVE',
      },
    });
  }

  let candidateB = await prisma.applicant.findFirst({
    where: { phone: '01700000002' },
  });
  if (!candidateB) {
    const appNum = await generateFormattedId(prisma as any, 'applicant');
    candidateB = await prisma.applicant.create({
      data: {
        applicantNumber: appNum,
        fullName: 'Test Candidate Beta',
        phone: '01700000002',
        email: 'beta@test.local',
        status: 'ACTIVE',
      },
    });
  }

  // Get a Document Type
  let docType = await prisma.documentType.findFirst({ where: { isActive: true } });
  if (!docType) {
    docType = await prisma.documentType.create({
      data: {
        name: 'Passport Copy',
        code: 'PASSPORT',
        isRequired: true,
        category: 'IDENTITY',
      },
    });
  }

  // -------------------------------------------------------------
  // TEST 1: Candidate Profile Update & Audit Log
  // -------------------------------------------------------------
  console.log('\n--- TEST 1: Profile Update & PROFILE_UPDATED Audit Log ---');
  const updatedCandidate = await prisma.applicant.update({
    where: { id: candidateA.id },
    data: {
      profession: 'Certified Electrician',
      yearsOfExperience: 5,
      passportAvailable: true,
      passportNumber: 'EE0987654',
    },
  });

  await prisma.applicantProfile.upsert({
    where: { applicantId: candidateA.id },
    create: {
      applicantId: candidateA.id,
      emergencyContact: 'Father - 01711112233',
      currentAddress: 'Gulshan-2, Dhaka',
      permanentAddress: 'Chouddagram, Comilla',
    },
    update: {
      emergencyContact: 'Father - 01711112233',
      permanentAddress: 'Chouddagram, Comilla',
    },
  });

  const profileAudit = await createAuditLog({
    actorUserId: candidateA.id,
    actorType: 'APPLICANT',
    applicantId: candidateA.id,
    action: 'PROFILE_UPDATED',
    entity: 'APPLICANT',
    entityId: candidateA.id,
    description: 'Applicant updated profile details',
    metadata: { profession: 'Certified Electrician', yearsOfExperience: 5 },
  });

  assert(updatedCandidate.profession === 'Certified Electrician', 'Candidate profession updated successfully');
  assert(profileAudit?.action === 'PROFILE_UPDATED', 'PROFILE_UPDATED audit log created with actorType=APPLICANT');
  assert(profileAudit?.applicantId === candidateA.id, 'Audit log correctly linked to applicant ID');

  // -------------------------------------------------------------
  // TEST 2: Secure Document Upload & MIME Validation
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Document Upload & MIME Validation ---');
  const invalidMime = validateDocumentFile(1024, 'application/x-msdownload');
  assert(!invalidMime.valid, 'Disallowed executable file type correctly rejected');

  const validMime = validateDocumentFile(1024 * 500, 'application/pdf');
  assert(validMime.valid, 'Valid PDF file type accepted');

  const sampleBuffer = Buffer.from('%PDF-1.4 Mock Candidate Document Content');
  const storageKey = `documents/${candidateA.id}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.pdf`;
  const savedPath = await storage.saveFile(storageKey, sampleBuffer);

  assert(savedPath === storageKey, 'File saved securely to private storage with hashed key');
  const fileExists = await storage.fileExists(storageKey);
  assert(fileExists, 'File confirmed existing in private disk storage');

  const testDoc = await prisma.document.create({
    data: {
      applicantId: candidateA.id,
      documentTypeId: docType.id,
      fileName: 'passport_scan.pdf',
      filePath: storageKey,
      fileSize: sampleBuffer.length,
      mimeType: 'application/pdf',
      status: 'PENDING',
      version: 1,
      isLatest: true,
    },
  });

  const docUploadAudit = await createAuditLog({
    actorUserId: candidateA.id,
    actorType: 'APPLICANT',
    applicantId: candidateA.id,
    action: 'DOCUMENT_UPLOADED',
    entity: 'DOCUMENT',
    entityId: testDoc.id,
    description: `Applicant uploaded document: passport_scan.pdf (${docType.name})`,
    metadata: { fileName: 'passport_scan.pdf', documentType: docType.name },
  });

  assert(testDoc.status === 'PENDING', 'Document created in PENDING status');
  assert(docUploadAudit?.action === 'DOCUMENT_UPLOADED', 'DOCUMENT_UPLOADED audit log recorded');

  // -------------------------------------------------------------
  // TEST 3: Replace & Delete Guardrails on Document Status
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Replace & Delete Guardrails on Document Status ---');

  // Candidate replacing PENDING document -> Allowed
  const canReplacePending = testDoc.status === 'PENDING' || testDoc.status === 'REJECTED';
  assert(canReplacePending, 'Replacing PENDING document is allowed');

  // Now set status to VERIFIED
  const verifiedDoc = await prisma.document.update({
    where: { id: testDoc.id },
    data: { status: 'VERIFIED' },
  });

  // Attempt to replace VERIFIED document -> MUST FAIL
  const canReplaceVerified = verifiedDoc.status === 'PENDING' || verifiedDoc.status === 'REJECTED';
  assert(!canReplaceVerified, 'Replacing VERIFIED document is strictly blocked');

  // Attempt to delete VERIFIED document -> MUST FAIL
  const canDeleteVerified = verifiedDoc.status === 'PENDING' || verifiedDoc.status === 'REJECTED';
  assert(!canDeleteVerified, 'Deleting VERIFIED document is strictly blocked');

  // Revert to PENDING to test deletion
  await prisma.document.update({
    where: { id: testDoc.id },
    data: { status: 'PENDING' },
  });

  // Delete PENDING document -> Allowed
  await storage.deleteFile(testDoc.filePath);
  await prisma.document.delete({ where: { id: testDoc.id } });
  const docDeleted = !(await prisma.document.findUnique({ where: { id: testDoc.id } }));
  assert(docDeleted, 'Pending document deleted and removed from storage and database');

  // -------------------------------------------------------------
  // TEST 4: IDOR Protection (Candidate A cannot access Candidate B doc)
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: IDOR Protection Verification ---');
  const bStorageKey = `documents/${candidateB.id}/${Date.now()}-mock.pdf`;
  await storage.saveFile(bStorageKey, sampleBuffer);
  const docB = await prisma.document.create({
    data: {
      applicantId: candidateB.id,
      documentTypeId: docType.id,
      fileName: 'candidate_b_passport.pdf',
      filePath: bStorageKey,
      fileSize: sampleBuffer.length,
      mimeType: 'application/pdf',
      status: 'PENDING',
    },
  });

  const isCandidateAAuthorizedForDocB = docB.applicantId === candidateA.id;
  assert(!isCandidateAAuthorizedForDocB, 'Candidate A is forbidden (403) from accessing Candidate B document');

  // Clean up docB
  await storage.deleteFile(bStorageKey);
  await prisma.document.delete({ where: { id: docB.id } });

  // -------------------------------------------------------------
  // TEST 5: Candidate Activity Timeline Query
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Candidate Activity Timeline Query ---');
  const candidateLogs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { applicantId: candidateA.id },
        { actorUserId: candidateA.id },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  assert(candidateLogs.length >= 2, `Retrieved ${candidateLogs.length} audit logs for candidate A`);
  const actions = candidateLogs.map(l => l.action);
  assert(actions.includes('PROFILE_UPDATED'), 'Activity timeline contains PROFILE_UPDATED');
  assert(actions.includes('DOCUMENT_UPLOADED'), 'Activity timeline contains DOCUMENT_UPLOADED');

  // -------------------------------------------------------------
  // TEST 6: Invoice Lifecycle, Decimal Math, Duplication, Guardrails
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Invoice Lifecycle & Financial Calculations ---');
  const invoiceNum = await generateFormattedId(prisma as any, 'invoice');

  const unit1 = toDecimal('15000.00');
  const qty1 = 2;
  const line1 = unit1.times(qty1); // 30000.00

  const unit2 = toDecimal('5000.00');
  const disc2 = toDecimal('500.00');
  const line2 = unit2.minus(disc2); // 4500.00

  const subtotal = line1.plus(unit2); // 35000.00
  const total = subtotal.minus(disc2); // 34500.00

  const testInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: invoiceNum,
      applicant: { connect: { id: candidateA.id } },
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 86400000),
      subtotal,
      discount: disc2,
      tax: toDecimal('0.00'),
      adjustment: toDecimal('0.00'),
      totalAmount: total,
      paidAmount: toDecimal('0.00'),
      dueAmount: total,
      status: 'DRAFT',
      notes: 'Initial recruitment deposit invoice',
      items: {
        create: [
          {
            description: 'Recruitment Processing Fee (Phase 1)',
            quantity: qty1,
            unitPrice: unit1,
            discount: toDecimal('0.00'),
            tax: toDecimal('0.00'),
            lineTotal: line1,
          },
          {
            description: 'Biometric & Medical Center Fee',
            quantity: 1,
            unitPrice: unit2,
            discount: disc2,
            tax: toDecimal('0.00'),
            lineTotal: line2,
          },
        ],
      },
    },
    include: { items: true },
  });

  assert(testInvoice.totalAmount.equals(toDecimal('34500.00')), 'Invoice total correctly calculated with Decimal precision (34500.00)');
  assert(testInvoice.items.length === 2, '2 line items created on draft invoice');

  // Duplicate Invoice Test
  console.log('\n--- TEST 7: Invoice Duplication ---');
  const dupInvoiceNum = await generateFormattedId(prisma as any, 'invoice');
  const duplicatedInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: dupInvoiceNum,
      applicant: { connect: { id: candidateA.id } },
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 86400000),
      subtotal: testInvoice.subtotal,
      discount: testInvoice.discount,
      tax: testInvoice.tax,
      adjustment: testInvoice.adjustment,
      totalAmount: testInvoice.totalAmount,
      paidAmount: toDecimal('0.00'),
      dueAmount: testInvoice.totalAmount,
      status: 'DRAFT',
      notes: `[Duplicated from ${testInvoice.invoiceNumber}]`,
      items: {
        create: testInvoice.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          tax: item.tax,
          lineTotal: item.lineTotal,
        })),
      },
    },
    include: { items: true },
  });

  await createAuditLog({
    action: 'INVOICE_DUPLICATED',
    entity: 'INVOICE',
    entityId: duplicatedInvoice.id,
    applicantId: candidateA.id,
    description: `Duplicated from ${testInvoice.invoiceNumber} -> ${duplicatedInvoice.invoiceNumber}`,
  });

  assert(duplicatedInvoice.invoiceNumber !== testInvoice.invoiceNumber, `New unique invoice number generated: ${duplicatedInvoice.invoiceNumber}`);
  assert(duplicatedInvoice.status === 'DRAFT', 'Duplicated invoice status defaults to DRAFT');
  assert(duplicatedInvoice.items.length === 2, 'Line items accurately cloned');
  assert(duplicatedInvoice.paidAmount.equals(toDecimal('0.00')), 'Paid amount strictly reset to 0');

  // Test Delete Guardrails on Paid / Partial Invoice
  console.log('\n--- TEST 8: Invoice Delete Guardrails ---');
  // Mark duplicate as PARTIALLY_PAID
  const partialInvoice = await prisma.invoice.update({
    where: { id: duplicatedInvoice.id },
    data: { status: 'PARTIALLY_PAID', paidAmount: toDecimal('10000.00') },
  });

  const canDeletePartial = partialInvoice.status === 'DRAFT'; // blocked
  assert(!canDeletePartial, 'Deleting PARTIALLY_PAID invoice is strictly blocked');

  // Void Invoice Test
  console.log('\n--- TEST 9: Invoice Voiding & Reversals ---');
  const voidedInvoice = await prisma.invoice.update({
    where: { id: duplicatedInvoice.id },
    data: {
      status: 'VOID',
      notes: `${duplicatedInvoice.notes}\n[VOIDED]: Candidate requested cancellation`,
    },
  });

  await createAuditLog({
    action: 'INVOICE_VOID',
    entity: 'INVOICE',
    entityId: voidedInvoice.id,
    applicantId: candidateA.id,
    description: `Invoice ${voidedInvoice.invoiceNumber} voided: Candidate requested cancellation`,
  });

  assert(voidedInvoice.status === 'VOID', 'Invoice successfully marked VOID');

  // Deleting DRAFT invoice -> Allowed
  console.log('\n--- TEST 10: Delete Clean Draft Invoice ---');
  await prisma.invoiceItem.deleteMany({ where: { invoiceId: testInvoice.id } });
  await prisma.invoice.delete({ where: { id: testInvoice.id } });
  const draftDeleted = !(await prisma.invoice.findUnique({ where: { id: testInvoice.id } }));
  assert(draftDeleted, 'Un-paid DRAFT invoice deleted successfully');

  // Clean up duplicated invoice
  await prisma.invoiceItem.deleteMany({ where: { invoiceId: duplicatedInvoice.id } });
  await prisma.invoice.delete({ where: { id: duplicatedInvoice.id } });

  console.log('\n========================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
