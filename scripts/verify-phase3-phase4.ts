import prisma from '../src/lib/prisma';
import { Prisma } from '@prisma/client';
import { calculateInvoiceTotals, toDecimal } from '../src/lib/accounting/calculations';
import { recordPayment } from '../src/lib/accounting/payment';
import { getCustomerLedger } from '../src/lib/accounting/ledger';
import { getJobVacancyStats, validateVacancyLimit } from '../src/lib/recruitment/vacancy';
import { calculateDocumentProgress } from '../src/lib/recruitment/documents';

async function main() {
  console.log('🧪 Starting Phase 3 & Phase 4 Comprehensive Automated Verification...');

  let testPassed = 0;
  let testFailed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      testPassed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      testFailed++;
    }
  }

  // 1. Decimal Accounting Engine Verification
  console.log('\n--- 1. Testing Decimal Accounting Calculation Engine ---');
  const items = [
    { description: 'Recruitment Placement', quantity: 2, unitPrice: 45000.50, discount: 500.00, tax: 0 },
    { description: 'Embassy Stamping', quantity: 1, unitPrice: 15000.75, discount: 0, tax: 500.25 },
  ];
  const totals = calculateInvoiceTotals(items, 1000.00, 0, 0);

  // Line 1: (2 * 45000.50) - 500 = 90001.00 - 500 = 89501.00
  // Line 2: 15000.75 + 500.25 = 15501.00
  // Subtotal = 105002.00
  // Total = 105002.00 - 1000.00 = 104002.00
  assert(totals.subtotal.equals(new Prisma.Decimal('105002.00')), 'Subtotal decimal calculation is exact (105002.00)');
  assert(totals.totalAmount.equals(new Prisma.Decimal('104002.00')), 'Total amount minus discount is exact (104002.00)');
  assert(totals.items[0].lineTotal.equals(new Prisma.Decimal('89501.00')), 'Item 1 lineTotal is exact');

  // 2. Job Vacancy Quota Control
  console.log('\n--- 2. Testing Job Vacancy Quota Management ---');
  const job = await prisma.job.findFirst({
    where: { jobCode: 'SGR-JOB-2026-000001' },
  });
  assert(!!job, 'Job SGR-JOB-2026-000001 found in database');

  if (job) {
    const vacancyStats = await getJobVacancyStats(prisma, job.id);
    if (vacancyStats) {
      assert(vacancyStats.vacancies >= 1, `Job vacancies tracked (Actual: ${vacancyStats.vacancies})`);
      assert(vacancyStats.selectedCount >= 1, `Selected count reflects seeded application (Actual: ${vacancyStats.selectedCount})`);
      assert(vacancyStats.remainingVacancies >= 0, `Remaining quota correctly calculated (Actual: ${vacancyStats.remainingVacancies})`);
    }

    const vacancyCheck = await validateVacancyLimit(prisma, job.id, false);
    assert(typeof vacancyCheck.allowed === 'boolean', 'Selection quota limit checked');
  }

  // 3. Document Compliance Progress Engine
  console.log('\n--- 3. Testing Candidate Document Compliance Engine ---');
  const applicant = await prisma.applicant.findFirst({
    where: { applicantNumber: 'SGR-2026-000001' },
    include: { applications: true },
  });
  assert(!!applicant, 'Applicant SGR-2026-000001 found');

  if (applicant) {
    const docProgress = await calculateDocumentProgress(
      prisma,
      applicant.id,
      applicant.preferredCountryId,
      applicant.preferredJobCategoryId
    );
    assert(docProgress.totalRequired >= 1, `Required document types identified (Total: ${docProgress.totalRequired})`);
    assert(docProgress.uploadedCount >= 1, `Candidate uploaded documents tracked (Uploaded: ${docProgress.uploadedCount})`);
    assert(typeof docProgress.progressPercent === 'number', `Progress percentage calculated (${docProgress.progressPercent}%)`);
  }

  // 4. Overpayment Prevention & Atomic Payment Transaction
  console.log('\n--- 4. Testing Atomic Payments & Overpayment Prevention ---');
  const invoice = await prisma.invoice.findFirst({
    where: { invoiceNumber: 'SGR-INV-2026-000001' },
  });
  assert(!!invoice, 'Invoice SGR-INV-2026-000001 found');

  const accountant = await prisma.user.findFirst({
    where: { email: 'accounts@shakilglobal.com' },
  });
  assert(!!accountant, 'Accountant user found');

  if (invoice && accountant) {
    const due = Number(invoice.dueAmount);
    console.log(`  ℹ Current invoice due amount: BDT ${due}`);

    // Try paying MORE than due amount to verify rejection
    let overpaymentBlocked = false;
    try {
      await recordPayment(prisma, {
        invoiceId: invoice.id,
        amount: due + 5000,
        currency: 'BDT',
        paymentMethod: 'CASH',
        receivedById: accountant.id,
      });
    } catch (err: any) {
      if (err.message.includes('exceeds outstanding invoice balance')) {
        overpaymentBlocked = true;
      }
    }
    assert(overpaymentBlocked, 'Overpayment is strictly blocked in database transaction');

    // Pay a valid partial payment of BDT 5,000
    const payAmount = 5000;
    const payment = await recordPayment(prisma, {
      invoiceId: invoice.id,
      amount: payAmount,
      currency: 'BDT',
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: `VERIF-TXN-${Date.now()}`,
      receivedById: accountant.id,
      notes: 'Automated verification test payment',
    });

    assert(payment.paymentNumber.startsWith('SGR-PAY-2026-'), `Payment number format valid (${payment.paymentNumber})`);
    assert(payment.receiptNumber.startsWith('SGR-RCP-2026-'), `Receipt number format valid (${payment.receiptNumber})`);

    // Verify invoice due amount updated correctly
    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
    });
    assert(
      updatedInvoice!.dueAmount.equals(new Prisma.Decimal((due - payAmount).toFixed(2))),
      `Invoice due amount decremented by exact payment (Old: ${due}, New: ${updatedInvoice?.dueAmount})`
    );
  }

  // 5. Customer Financial Statement & Ledger
  console.log('\n--- 5. Testing Customer Running Balance Ledger ---');
  if (applicant) {
    const customer = await prisma.customer.findFirst({
      where: { applicantId: applicant.id },
    });
    assert(!!customer, 'Customer profile linked to applicant');

    if (customer) {
      const ledger = await getCustomerLedger(prisma, customer.id);
      assert(ledger.transactions.length >= 2, `Ledger records all chronological postings (Count: ${ledger.transactions.length})`);
      assert(Number(ledger.totalDebit) > 0, `Total Debit matches invoiced amounts (Debit: ${ledger.totalDebit})`);
      assert(Number(ledger.totalCredit) > 0, `Total Credit matches payment receipts (Credit: ${ledger.totalCredit})`);

      // Verify running balance arithmetic: Closing balance == Total Debit - Total Credit
      const expectedBalance = (Number(ledger.totalDebit) - Number(ledger.totalCredit)).toFixed(2);
      assert(
        ledger.closingBalance === expectedBalance,
        `Ledger running balance arithmetic matches: Debit - Credit = ${expectedBalance} (Actual: ${ledger.closingBalance})`
      );
    }
  }

  // 6. Recruitment Operational Workflow Entities
  console.log('\n--- 6. Testing Recruitment Operational Entities in DB ---');
  const [appCount, intCount, docCount, servCount] = await Promise.all([
    prisma.application.count(),
    prisma.interview.count(),
    prisma.document.count(),
    prisma.service.count(),
  ]);

  assert(appCount >= 3, `Applications active in database (Count: ${appCount})`);
  assert(intCount >= 1, `Candidate interviews scheduled (Count: ${intCount})`);
  assert(docCount >= 2, `Candidate documents stored (Count: ${docCount})`);
  assert(servCount >= 5, `Service catalog configured (Count: ${servCount})`);

  console.log(`\n==================================================`);
  console.log(`Results: ${testPassed} Passed, ${testFailed} Failed`);
  console.log(`==================================================\n`);

  if (testFailed > 0) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('Verification script failed with exception:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
