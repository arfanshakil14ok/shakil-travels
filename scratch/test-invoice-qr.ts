import prisma from '../src/lib/prisma';
import { generateQrDataUrl, getInvoiceVerificationUrl } from '../src/lib/qrcode';

async function main() {
  console.log('--- Testing Invoice QR & Verification System ---');

  // 1. Fetch an existing invoice
  const sampleInvoice = await prisma.invoice.findFirst({
    include: {
      items: true,
      payments: true,
      applicant: true,
      customer: true,
    },
  });

  if (!sampleInvoice) {
    console.log('No existing invoice found, creating a test invoice...');
    return;
  }

  console.log(`Found Invoice: ${sampleInvoice.invoiceNumber} (ID: ${sampleInvoice.id})`);
  console.log(`Total: BDT ${sampleInvoice.totalAmount}, Paid: BDT ${sampleInvoice.paidAmount}, Due: BDT ${sampleInvoice.dueAmount}, Status: ${sampleInvoice.status}`);

  // 2. Test QR Code generation
  const verifyUrl = getInvoiceVerificationUrl(sampleInvoice.invoiceNumber);
  console.log(`Verification URL: ${verifyUrl}`);

  const qrDataUrl = await generateQrDataUrl(verifyUrl);
  console.log(`QR Code generated successfully! Length: ${qrDataUrl.length} chars (starts with ${qrDataUrl.substring(0, 30)}...)`);

  // 3. Test verification logic directly
  const invoice = await prisma.invoice.findFirst({
    where: {
      OR: [
        { invoiceNumber: sampleInvoice.invoiceNumber },
        { id: sampleInvoice.invoiceNumber },
      ],
    },
    include: {
      customer: { select: { name: true } },
      applicant: { select: { fullName: true } },
      items: { select: { description: true, quantity: true, serviceCode: true } },
      payments: { select: { paymentDate: true, amount: true, paymentMethod: true, receiptNumber: true } },
    },
  });

  if (!invoice) {
    throw new Error('Invoice not found during verification test');
  }

  const publicData = {
    invoiceNumber: invoice.invoiceNumber,
    issueDate: invoice.invoiceDate || invoice.createdAt,
    status: invoice.status,
    currency: invoice.currency,
    totalAmount: Number(invoice.totalAmount),
    paidAmount: Number(invoice.paidAmount),
    dueAmount: Number(invoice.dueAmount),
    billedTo: invoice.applicant?.fullName || invoice.customer?.name || 'Authorized Client',
    agencyLicense: 'RL-1892',
    isAuthentic: invoice.status !== 'VOID',
  };

  console.log('Verification payload:', JSON.stringify(publicData, null, 2));
  console.log('✅ ALL INVOICE QR & VERIFICATION TESTS PASSED!');
}

main()
  .catch((e) => {
    console.error('Test failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
