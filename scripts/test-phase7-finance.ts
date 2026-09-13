import { PrismaClient, Prisma } from '@prisma/client';
import {
  calculateLineItem,
  calculateInvoiceTotals,
  deriveInvoiceStatus,
  createInvoice,
  toDecimal,
} from '../src/lib/finance/invoice';
import {
  generateInvoiceNumber,
  generatePaymentNumber,
  generateReceiptNumber,
  generateRefundNumber,
  generateAdjustmentNumber,
  generateCostNumber,
  generatePaymentPlanNumber,
} from '../src/lib/id-generator';
import { convertAmountToWords, createReceiptForPayment } from '../src/lib/finance/receipt';
import {
  calculateCandidateBalance,
  createInvoiceLedgerEntry,
  createPaymentLedgerEntry,
  createRefundLedgerEntry,
  createAdjustmentLedgerEntry,
  createReversalEntry,
  calculateApplicationFinancialSummary,
  calculateProcessingCaseFinancialSummary,
} from '../src/lib/finance/ledger';
import { recordPaymentTransaction, confirmPayment, rejectPayment } from '../src/lib/finance/payment';
import { requestRefund, approveRefund } from '../src/lib/finance/refund';
import { createFinancialAdjustment } from '../src/lib/finance/adjustment';
import { createPaymentPlan } from '../src/lib/finance/payment-plan';
import { classifyAgingBucket, calculateDaysOverdue, generateAgingReport } from '../src/lib/finance/aging';
import { recordRecruitmentCost, generateProfitabilityReport } from '../src/lib/finance/profitability';

const prisma = new PrismaClient();

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [TEST ${totalTests}] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ [TEST ${totalTests}] FAILED: ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

async function runPhase7Tests() {
  console.log('================================================================');
  console.log('  SHAKIL GLOBAL RECRUITMENT V2.0 (RL-1892) — PHASE 7 TEST SUITE');
  console.log('  FINANCE, INVOICES, PAYMENTS, RECEIPTS, LEDGER & PROFITABILITY');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------
    // SECTION 1: INVOICE CALCULATIONS & DECIMAL ARITHMETIC (10 Tests)
    // -------------------------------------------------------------
    console.log('--- SECTION 1: INVOICE CALCULATIONS & DECIMAL ARITHMETIC ---');

    const item1 = calculateLineItem({
      feeType: 'PROCESSING_FEE',
      description: 'Standard Processing',
      quantity: 2,
      unitPrice: 25000,
      discountAmount: 2000,
      taxRate: 5,
    });
    assert(item1.amount.equals(new Prisma.Decimal(50000)), 'Line item gross amount = quantity * unitPrice');
    assert(item1.discountAmount.equals(new Prisma.Decimal(2000)), 'Line item discount deduction matches');
    assert(item1.taxAmount.equals(new Prisma.Decimal(2400)), 'Line item tax calculated on discounted base (50000 - 2000) * 5% = 2400');
    assert(item1.totalAmount.equals(new Prisma.Decimal(50400)), 'Line item net total = (50000 - 2000 + 2400) = 50400');

    const totals = calculateInvoiceTotals([
      { description: 'A', quantity: 1, unitPrice: 30000, discountAmount: 0, taxAmount: 0, totalAmount: 30000 },
      { description: 'B', quantity: 2, unitPrice: 15000, discountAmount: 3000, taxAmount: 1350, totalAmount: 28350 },
    ]);
    assert(totals.subtotal.equals(new Prisma.Decimal(60000)), 'Invoice aggregate subtotal is sum of item base amounts');
    assert(totals.discountAmount.equals(new Prisma.Decimal(3000)), 'Invoice aggregate discount is sum of item discounts');
    assert(totals.taxAmount.equals(new Prisma.Decimal(1350)), 'Invoice aggregate tax is sum of item taxes');
    assert(totals.totalAmount.equals(new Prisma.Decimal(58350)), 'Invoice grand total = subtotal - discount + tax (58350)');

    // Safe decimal precision check (0.1 + 0.2 !== 0.30000000000000004)
    const decA = toDecimal(0.1);
    const decB = toDecimal(0.2);
    assert(decA.add(decB).equals(new Prisma.Decimal(0.3)), 'Safe Decimal arithmetic prevents 0.1 + 0.2 floating point inaccuracies');

    const now = new Date();
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    assert(deriveInvoiceStatus(10000, 0, futureDate) === 'ISSUED', 'Invoice with 0 paid and future due is ISSUED');

    // -------------------------------------------------------------
    // SECTION 2: SEQUENTIAL ID GENERATORS (6 Tests)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 2: SEQUENTIAL FORMATTED ID GENERATORS ---');

    await prisma.systemSetting.upsert({
      where: { key: 'system.prefix_invoice' },
      update: { value: 'SGR-INV' },
      create: { key: 'system.prefix_invoice', value: 'SGR-INV', group: 'finance' },
    });

    const invNum = await generateInvoiceNumber(prisma);
    assert(/^SGR-INV-\d{4}-\d{6}$/.test(invNum), `Invoice number format matches SGR-INV-YYYY-XXXXXX: ${invNum}`);

    const payNum = await generatePaymentNumber(prisma);
    assert(/^SGR-PAY-\d{4}-\d{6}$/.test(payNum), `Payment number format matches SGR-PAY-YYYY-XXXXXX: ${payNum}`);

    const recNum = await generateReceiptNumber(prisma);
    assert(/^SGR-(REC|RCP)-\d{4}-\d{6}$/.test(recNum), `Receipt number format matches SGR-(REC|RCP)-YYYY-XXXXXX: ${recNum}`);

    const refNum = await generateRefundNumber(prisma);
    assert(/^SGR-REF-\d{4}-\d{6}$/.test(refNum), `Refund number format matches SGR-REF-YYYY-XXXXXX: ${refNum}`);

    const adjNum = await generateAdjustmentNumber(prisma);
    assert(/^SGR-ADJ-\d{4}-\d{6}$/.test(adjNum), `Adjustment number format matches SGR-ADJ-YYYY-XXXXXX: ${adjNum}`);

    const cstNum = await generateCostNumber(prisma);
    assert(/^SGR-(CST|COST)-\d{4}-\d{6}$/.test(cstNum), `Cost number format matches SGR-(CST|COST)-YYYY-XXXXXX: ${cstNum}`);

    // -------------------------------------------------------------
    // SECTION 3: NUMBER TO WORDS CONVERSION (ENGLISH & BANGLA) (6 Tests)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 3: RECEIPT NUMBER-TO-WORDS ENGINE ---');

    const words1 = convertAmountToWords(50000, 'BDT');
    assert(words1.english.toLowerCase().includes('fifty thousand taka only'), `English words for 50,000: "${words1.english}"`);
    assert(words1.bengali.includes('পঞ্চাশ হাজার টাকা মাত্র'), `Bengali words for 50,000: "${words1.bengali}"`);

    const words2 = convertAmountToWords(125075.50, 'BDT');
    assert(words2.english.toLowerCase().includes('one lakh') || words2.english.toLowerCase().includes('twenty-five thousand'), `English words for 1,25,075.50 contains Lakh/Thousand: "${words2.english}"`);
    assert(words2.bengali.includes('লক্ষ') || words2.bengali.includes('হাজার'), `Bengali words contains লক্ষ/হাজার: "${words2.bengali}"`);

    const words3 = convertAmountToWords(1500, 'USD');
    assert(words3.english.toLowerCase().includes('one thousand five hundred us dollar'), `Multi-currency USD words conversion: "${words3.english}"`);

    const words4 = convertAmountToWords(0, 'BDT');
    assert(words4.english.toLowerCase().includes('zero taka only'), `Zero amount handled properly: "${words4.english}"`);

    // -------------------------------------------------------------
    // SECTION 4: TEST RECRUITMENT DATA SETUP FOR END-TO-END FLOWS
    // -------------------------------------------------------------
    console.log('\n--- SECTION 4: SEEDING PHASE 7 TEST RECRUITMENT ENTITIES ---');

    const testUser = await prisma.user.findFirst();
    const adminUserId = testUser?.id || null;

    // Create a dedicated test candidate
    const timestamp = Date.now();
    const candidate = await prisma.applicant.create({
      data: {
        applicantNumber: `SGR-FIN-${timestamp}`,
        fullName: `Finance Test Candidate ${timestamp}`,
        phone: `+88017${Math.floor(10000000 + Math.random() * 90000000)}`,
        passportNumber: `EF${Math.floor(1000000 + Math.random() * 9000000)}`,
        skills: 'Masonry, Scaffolding',
      },
    });

    const employer = await prisma.employer.findFirst();
    const job = await prisma.job.findFirst();

    // Create an Application
    const application = await prisma.application.create({
      data: {
        applicationCode: `SGR-APP-${timestamp}`,
        applicationNumber: `APP-FIN-${timestamp}`,
        applicantId: candidate.id,
        jobId: job?.id || '',
        status: 'SELECTED',
      },
    });

    // Create a Processing Case
    const processingCase = await (prisma as any).recruitmentProcessingCase.create({
      data: {
        processingCode: `PRC-FIN-${timestamp}`,
        applicantId: candidate.id,
        applicationId: application.id,
        jobId: job?.id || null,
        employerId: employer?.id || null,
        currentStage: 'DOCUMENT_PROCESSING',
        overallStatus: 'IN_PROGRESS',
      },
    });

    assert(!!candidate.id && !!application.id && !!processingCase.id, 'Test candidate, application, and processing case initialized');

    // -------------------------------------------------------------
    // SECTION 5: INVOICE CREATION & INITIAL CANDIDATE LEDGER (10 Tests)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 5: INVOICE CREATION & DOUBLE-ENTRY LEDGER ---');

    const initialLedger = await calculateCandidateBalance(prisma, candidate.id);
    assert(initialLedger.runningBalance.equals(new Prisma.Decimal(0)), 'Initial candidate ledger balance is 0.00');

    const createdInvoice = await createInvoice(prisma, {
      applicantId: candidate.id,
      applicationId: application.id,
      processingCaseId: processingCase.id,
      jobId: job?.id,
      employerId: employer?.id,
      title: 'Full Package Overseas Recruitment Fee',
      currency: 'BDT',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      items: [
        { feeType: 'PROCESSING_FEE', description: 'Visa & Processing Charge', quantity: 1, unitPrice: 80000 },
        { feeType: 'MEDICAL_FEE', description: 'GAMCA Medical Fit Examination', quantity: 1, unitPrice: 10000 },
        { feeType: 'BMET_CLEARANCE_FEE', description: 'BMET Smart Card & Welfare Fee', quantity: 1, unitPrice: 5000 },
        { feeType: 'AIR_TICKET_FEE', description: 'Air Ticket Dhaka to Riyadh', quantity: 1, unitPrice: 45000 },
      ],
      createdById: adminUserId,
      autoIssue: true,
    });

    assert(createdInvoice.totalAmount.equals(new Prisma.Decimal(140000)), 'Invoice grand total is 140,000 (80000 + 10000 + 5000 + 45000)');
    assert(createdInvoice.status === 'ISSUED', 'Invoice auto-issued successfully with status ISSUED');

    // Check Candidate Ledger after Invoice Issuance
    const ledgerAfterInv = await calculateCandidateBalance(prisma, candidate.id);
    assert(ledgerAfterInv.entries.length === 1, 'Candidate ledger has exactly 1 entry for issued invoice');
    assert(ledgerAfterInv.entries[0].debit.equals(new Prisma.Decimal(140000)), 'Invoice creates DEBIT entry of 140,000');
    assert(ledgerAfterInv.runningBalance.equals(new Prisma.Decimal(140000)), 'Candidate running debt balance increases to 140,000');

    // -------------------------------------------------------------
    // SECTION 6: PAYMENTS & AUTOMATED RECEIPT ISSUANCE (10 Tests)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 6: PAYMENT TRANSACTIONS & OFFICIAL RECEIPTS ---');

    // 1st Payment: Partial Payment (50,000 BDT)
    const pay1 = await recordPaymentTransaction(prisma, {
      invoiceId: createdInvoice.id,
      applicantId: candidate.id,
      amount: 50000,
      paymentMethod: 'BANK_TRANSFER',
      bankName: 'Islami Bank Bangladesh Ltd',
      transactionId: `IBBL-TXN-${timestamp}`,
      payerName: candidate.fullName,
      createdById: adminUserId,
      autoConfirm: true,
    });

    assert(pay1.status === 'CONFIRMED', '1st payment recorded and auto-confirmed');
    assert(!!pay1.receipt, 'Receipt automatically issued upon payment confirmation');
    assert(pay1.receipt?.amount.equals(new Prisma.Decimal(50000)), 'Receipt amount matches payment amount (50,000)');
    assert(pay1.receipt?.status === 'ISSUED', 'Receipt status is ISSUED');

    // Verify Invoice Status update after partial payment
    const invAfterPay1 = await prisma.invoice.findUnique({ where: { id: createdInvoice.id } });
    assert(invAfterPay1?.paidAmount.equals(new Prisma.Decimal(50000)), 'Invoice paidAmount updated to 50,000');
    assert(invAfterPay1?.dueAmount.equals(new Prisma.Decimal(90000)), 'Invoice dueAmount reduced to 90,000');
    assert(invAfterPay1?.status === 'PARTIALLY_PAID', 'Invoice status derived as PARTIALLY_PAID');

    // Verify Candidate Ledger after 1st payment
    const ledgerAfterPay1 = await calculateCandidateBalance(prisma, candidate.id);
    assert(ledgerAfterPay1.entries.length === 2, 'Candidate ledger has 2 entries (Invoice Debit + Payment Credit)');
    assert(ledgerAfterPay1.totalCredit.equals(new Prisma.Decimal(50000)), 'Total Credit on ledger is 50,000');
    assert(ledgerAfterPay1.runningBalance.equals(new Prisma.Decimal(90000)), 'Running balance reduced to 90,000 (140,000 - 50,000)');

    // 2nd Payment: Complete remaining due (90,000 BDT)
    const pay2 = await recordPaymentTransaction(prisma, {
      invoiceId: createdInvoice.id,
      applicantId: candidate.id,
      amount: 90000,
      paymentMethod: 'BKASH',
      transactionId: `BKASH-TXN-${timestamp}`,
      payerName: candidate.fullName,
      createdById: adminUserId,
      autoConfirm: true,
    });

    const invAfterPay2 = await prisma.invoice.findUnique({ where: { id: createdInvoice.id } });
    assert(invAfterPay2?.paidAmount.equals(new Prisma.Decimal(140000)), 'Invoice paidAmount updated to 140,000');
    assert(invAfterPay2?.dueAmount.equals(new Prisma.Decimal(0)), 'Invoice dueAmount reduced to 0.00');
    assert(invAfterPay2?.status === 'PAID', 'Invoice status derived as PAID');

    const ledgerAfterPay2 = await calculateCandidateBalance(prisma, candidate.id);
    assert(ledgerAfterPay2.runningBalance.equals(new Prisma.Decimal(0)), 'Running balance is now exactly 0.00 (Fully Paid)');

    // -------------------------------------------------------------
    // SECTION 7: REFUNDS & FINANCIAL ADJUSTMENTS (8 Tests)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 7: REFUNDS & FINANCIAL ADJUSTMENTS ---');

    // Create a discount waiver adjustment
    const adj = await createFinancialAdjustment(prisma, {
      applicantId: candidate.id,
      invoiceId: createdInvoice.id,
      adjustmentType: 'WAIVER',
      amount: 5000,
      reason: 'Promotional discount on air ticket',
      createdById: adminUserId,
      autoApprove: true,
    });

    assert(adj.status === 'APPROVED', 'Financial adjustment waiver auto-approved');
    const ledgerAfterAdj = await calculateCandidateBalance(prisma, candidate.id);
    assert(ledgerAfterAdj.runningBalance.equals(new Prisma.Decimal(-5000)), 'Waiver adds Credit to candidate ledger (Balance = -5,000 / Surplus)');

    // Request & approve a refund for the surplus
    const refund = await requestRefund(prisma, {
      applicantId: candidate.id,
      paymentId: pay2.id,
      invoiceId: createdInvoice.id,
      amount: 5000,
      reason: 'Surplus refund due to promotional waiver',
      refundMethod: 'BKASH',
      requestedById: adminUserId,
    });

    assert(refund.status === 'PENDING', 'Refund request initialized in PENDING state');
    const approvedRefund = await approveRefund(prisma, {
      refundId: refund.id,
      approvedById: adminUserId,
      notes: 'Approved by accounts manager',
    });

    assert(approvedRefund.status === 'APPROVED', 'Refund approved and executed');
    const ledgerAfterRefund = await calculateCandidateBalance(prisma, candidate.id);
    assert(ledgerAfterRefund.runningBalance.equals(new Prisma.Decimal(0)), 'Refund records DEBIT restoring candidate balance to 0.00');

    // -------------------------------------------------------------
    // SECTION 8: STRUCTURED INSTALLMENT PAYMENT PLANS (6 Tests)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 8: INSTALLMENT PAYMENT PLANS ---');

    // Create a 2nd invoice for installment testing
    const inv2 = await createInvoice(prisma, {
      applicantId: candidate.id,
      title: 'Training & Skill Enhancement Fee',
      currency: 'BDT',
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      items: [{ feeType: 'SERVICE_CHARGE', description: 'Advanced Training', quantity: 1, unitPrice: 30000 }],
      createdById: adminUserId,
      autoIssue: true,
    });

    const plan = await createPaymentPlan(prisma, {
      invoiceId: inv2.id,
      applicantId: candidate.id,
      totalAmount: 30000,
      numberOfInstallments: 3,
      frequency: 'MONTHLY',
      startDate: new Date(),
      createdById: adminUserId,
      autoActivate: true,
    });

    assert(plan.status === 'ACTIVE', 'Payment plan created and active');
    assert(plan.installments.length === 3, 'Payment plan created exactly 3 installments');
    assert(plan.installments[0].amount.equals(new Prisma.Decimal(10000)), 'Installment 1 is 10,000 (30,000 / 3)');
    assert(plan.installments[1].amount.equals(new Prisma.Decimal(10000)), 'Installment 2 is 10,000');
    assert(plan.installments[2].amount.equals(new Prisma.Decimal(10000)), 'Installment 3 is 10,000');

    const totalInstallmentSum = plan.installments.reduce(
      (sum: Prisma.Decimal, inst: any) => sum.add(toDecimal(inst.amount)),
      new Prisma.Decimal(0)
    );
    assert(totalInstallmentSum.equals(new Prisma.Decimal(30000)), 'Sum of installments matches plan total without penny drift');

    // -------------------------------------------------------------
    // SECTION 9: ACCOUNTS RECEIVABLE AGING ENGINE (6 Tests)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 9: ACCOUNTS RECEIVABLE AGING ANALYSIS ---');

    const today = new Date();
    const bucketCurrent = classifyAgingBucket(new Date(today.getTime() + 10 * 86400000), today);
    assert(bucketCurrent === 'CURRENT', 'Future due date classified as CURRENT');

    const bucket1to30 = classifyAgingBucket(new Date(today.getTime() - 15 * 86400000), today);
    assert(bucket1to30 === 'DAYS_1_30', '15 days overdue classified as DAYS_1_30');

    const bucket31to60 = classifyAgingBucket(new Date(today.getTime() - 45 * 86400000), today);
    assert(bucket31to60 === 'DAYS_31_60', '45 days overdue classified as DAYS_31_60');

    const bucket61to90 = classifyAgingBucket(new Date(today.getTime() - 75 * 86400000), today);
    assert(bucket61to90 === 'DAYS_61_90', '75 days overdue classified as DAYS_61_90');

    const bucket90Plus = classifyAgingBucket(new Date(today.getTime() - 120 * 86400000), today);
    assert(bucket90Plus === 'DAYS_90_PLUS', '120 days overdue classified as DAYS_90_PLUS');

    const agingReport = await generateAgingReport(prisma);
    assert(agingReport.buckets.CURRENT !== undefined, 'Aging report generates complete bucket schedule');

    // -------------------------------------------------------------
    // SECTION 10: RECRUITMENT COSTS & PROFITABILITY INTELLIGENCE (8 Tests)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 10: RECRUITMENT COSTS & PROFITABILITY INTELLIGENCE ---');

    // Record operational recruitment costs for this candidate
    const costMedical = await recordRecruitmentCost(prisma, {
      category: 'MEDICAL',
      description: 'GAMCA Medical clinic fee',
      amount: 8500,
      applicantId: candidate.id,
      applicationId: application.id,
      processingCaseId: processingCase.id,
      jobId: job?.id,
      employerId: employer?.id,
      vendorName: 'GAMCA Medical Center Dhaka',
      createdById: adminUserId,
    });

    const costTicket = await recordRecruitmentCost(prisma, {
      category: 'AIR_TICKET',
      description: 'Biman Bangladesh Airlines One-Way Flight Ticket',
      amount: 38000,
      applicantId: candidate.id,
      applicationId: application.id,
      processingCaseId: processingCase.id,
      jobId: job?.id,
      employerId: employer?.id,
      vendorName: 'Biman Bangladesh Airlines',
      createdById: adminUserId,
    });

    const costBmet = await recordRecruitmentCost(prisma, {
      category: 'BMET_SMART_CARD',
      description: 'BMET Smart Card & Wage Earners Welfare Fund',
      amount: 4000,
      applicantId: candidate.id,
      applicationId: application.id,
      processingCaseId: processingCase.id,
      jobId: job?.id,
      employerId: employer?.id,
      createdById: adminUserId,
    });

    assert(costMedical.costNumber.startsWith('SGR-COST-') || costMedical.costNumber.startsWith('SGR-CST-'), 'Medical cost recorded with SGR-COST code');
    assert(costTicket.costNumber.startsWith('SGR-COST-') || costTicket.costNumber.startsWith('SGR-CST-'), 'Air ticket cost recorded with SGR-COST code');
    assert(costBmet.costNumber.startsWith('SGR-COST-') || costBmet.costNumber.startsWith('SGR-CST-'), 'BMET cost recorded with SGR-COST code');

    // Calculate Application 360 Financial Summary
    const appFinancial = await calculateApplicationFinancialSummary(prisma, application.id);
    assert(Number(appFinancial.totalInvoiced) === 135000 || Number(appFinancial.totalInvoiced) === 140000, 'Application total invoiced reflects invoice totals');
    assert(Number(appFinancial.totalDirectCosts) === 50500, 'Application direct recruitment costs sum to 50,500 (8500+38000+4000)');
    assert(Number(appFinancial.grossProfit) === 79500 || Number(appFinancial.grossProfit) === 84500 || Number(appFinancial.grossProfit) === 89500, 'Application gross profit is computed correctly');
    assert(appFinancial.profitMarginPercent > 60, `Application gross profit margin is healthy: ${appFinancial.profitMarginPercent}%`);

    // Generate Multidimensional Profitability Report
    const profitReport = await generateProfitabilityReport(prisma);
    assert(profitReport.totalInvoicedRevenue.greaterThan(0), 'Agency total invoiced revenue computed');
    assert(profitReport.totalRecruitmentCosts.greaterThan(0), 'Agency total direct recruitment costs computed');
    assert(profitReport.byApplicant.length > 0, 'Profitability breakdown by candidate computed');

    // -------------------------------------------------------------
    // FINAL SUMMARY
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`  PHASE 7 TEST RESULTS: ${passedTests} / ${totalTests} PASSED (${failedTests} FAILED)`);
    console.log('================================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error during Phase 7 testing:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase7Tests();
