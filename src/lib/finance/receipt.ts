import { PrismaClient, Prisma } from '@prisma/client';
import { generateReceiptNumber } from '@/lib/id-generator';
import { createAuditLog } from '@/lib/audit';

export function convertAmountToWords(
  amount: number | Prisma.Decimal,
  currency: string = 'BDT'
): { english: string; bangla: string; bengali: string } {
  const num = typeof amount === 'number' ? amount : Number(amount);
  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n === 0) return 'Zero';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  }

  const bnDigits: { [key: string]: string } = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯',
  };

  const bnNumbers: { [key: number]: string } = {
    0: 'শূন্য', 1: 'এক', 2: 'দুই', 3: 'তিন', 4: 'চার', 5: 'পাঁচ', 6: 'ছয়', 7: 'সাত', 8: 'আট', 9: 'নয়',
    10: 'দশ', 11: 'এগারো', 12: 'বারো', 13: 'তেরো', 14: 'চৌদ্দ', 15: 'পনেরো', 16: 'ষোলো', 17: 'সতেরো',
    18: 'আঠারো', 19: 'উনিশ', 20: 'বিশ', 25: 'পঁচিশ', 30: 'ত্রিশ', 40: 'চল্লিশ', 50: 'পঞ্চাশ',
    60: 'ষাট', 70: 'সত্তর', 80: 'আশি', 90: 'নব্বই', 100: 'এক শত',
  };

  function inBengaliWords(n: number): string {
    if (n === 0) return 'শূন্য';
    if (bnNumbers[n]) return bnNumbers[n];
    if (n < 100) {
      const rem = n % 10;
      const dec = Math.floor(n / 10) * 10;
      return `${bnNumbers[dec] || ''} ${bnNumbers[rem] || ''}`.trim();
    }
    if (n < 1000) {
      const hundred = Math.floor(n / 100);
      const rem = n % 100;
      return `${bnNumbers[hundred] || hundred} শত ${rem > 0 ? inBengaliWords(rem) : ''}`.trim();
    }
    if (n < 100000) {
      const thousand = Math.floor(n / 1000);
      const rem = n % 1000;
      return `${inBengaliWords(thousand)} হাজার ${rem > 0 ? inBengaliWords(rem) : ''}`.trim();
    }
    if (n < 10000000) {
      const lakh = Math.floor(n / 100000);
      const rem = n % 100000;
      return `${inBengaliWords(lakh)} লক্ষ ${rem > 0 ? inBengaliWords(rem) : ''}`.trim();
    }
    const crore = Math.floor(n / 10000000);
    const rem = n % 10000000;
    return `${inBengaliWords(crore)} কোটি ${rem > 0 ? inBengaliWords(rem) : ''}`.trim();
  }

  const currUnit = currency === 'BDT' ? 'Taka' : currency === 'USD' ? 'US Dollar' : currency;
  const enWords = integerPart === 0 && decimalPart === 0
    ? `Zero ${currUnit} Only`
    : `${inWords(integerPart)} ${currUnit}${decimalPart > 0 ? ' and ' + inWords(decimalPart) + ' Cents' : ''} Only`;

  const bnUnit = currency === 'BDT' ? 'টাকা' : currency;
  const bnWords = `${inBengaliWords(integerPart)} ${bnUnit} মাত্র`;

  return {
    english: enWords,
    bangla: bnWords,
    bengali: bnWords,
  };
}

export async function createReceiptForPayment(
  prisma: PrismaClient | Prisma.TransactionClient,
  arg2: string | {
    paymentId: string;
    issuedById?: string | null;
    notes?: string | null;
  },
  arg3?: string | null,
  arg4?: string | null
) {
  const paymentId = typeof arg2 === 'object' ? arg2.paymentId : arg2;
  const issuedById = typeof arg2 === 'object' ? (arg2.issuedById || null) : (arg3 || null);
  const notes = typeof arg2 === 'object' ? (arg2.notes || null) : (arg4 || null);

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: true,
      applicant: true,
    },
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  if (payment.status !== 'CONFIRMED' && payment.status !== 'COMPLETED') {
    throw new Error(`Cannot issue a receipt for payment in status ${payment.status}. Payment must be CONFIRMED or COMPLETED.`);
  }

  // Check if receipt already exists
  const existing = await (prisma as any).receipt.findFirst({
    where: { paymentId: payment.id },
  });

  if (existing) {
    return existing;
  }

  const receiptNumber = payment.receiptNumber || (await generateReceiptNumber(prisma as any));

  const receipt = await (prisma as any).receipt.create({
    data: {
      receiptNumber,
      paymentId: payment.id,
      invoiceId: payment.invoiceId,
      applicantId: payment.applicantId || payment.invoice.applicantId || null,
      applicationId: payment.applicationId || payment.invoice.applicationId || null,
      amount: payment.amount,
      currency: payment.currency,
      receiptDate: new Date(),
      issuedById: issuedById || null,
      notes: notes || null,
    },
    include: {
      payment: true,
      invoice: true,
      applicant: true,
      issuedBy: { select: { id: true, name: true, email: true } },
    },
  });

  // Ensure payment.receiptNumber is synced
  if (!payment.receiptNumber) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { receiptNumber },
    });
  }

  await createAuditLog({
    actorUserId: issuedById || null,
    action: 'CREATE',
    entity: 'RECEIPT',
    entityId: receipt.id,
    applicantId: receipt.applicantId,
    description: `Issued official receipt ${receipt.receiptNumber} for payment ${payment.paymentNumber} (${receipt.currency} ${receipt.amount})`,
    newValue: {
      receiptNumber: receipt.receiptNumber,
      paymentNumber: payment.paymentNumber,
      amount: receipt.amount.toString(),
    },
  });

  return receipt;
}
