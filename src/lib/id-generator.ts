import { PrismaClient } from '@prisma/client';

export type IdType =
  | 'applicant'
  | 'application'
  | 'invoice'
  | 'job'
  | 'employer'
  | 'customer'
  | 'payment'
  | 'receipt'
  | 'refund'
  | 'visa'
  | 'inquiry';

/**
 * Generates sequential business identification codes based on current calendar year
 * Formats:
 *  - Applicant: SGR-2026-000001
 *  - Job: SGR-JOB-2026-000001
 *  - Employer: SGR-EMP-2026-000001
 *  - Customer: SGR-CUST-2026-000001
 *  - Application: SGR-APP-2026-000001
 *  - Invoice: SGR-INV-2026-000001
 *  - Payment: SGR-PAY-2026-000001
 *  - Receipt: SGR-RCP-2026-000001
 *  - Refund: SGR-REF-2026-000001
 */
export async function generateFormattedId(
  prisma: PrismaClient,
  type: IdType,
  overrideYear?: number
): Promise<string> {
  const currentYear = overrideYear || new Date().getFullYear();

  let prefixKey = '';
  let defaultPrefix = '';

  switch (type) {
    case 'applicant':
      prefixKey = 'system.prefix_applicant';
      defaultPrefix = 'SGR';
      break;
    case 'job':
      prefixKey = 'system.prefix_job';
      defaultPrefix = 'SGR-JOB';
      break;
    case 'employer':
      prefixKey = 'system.prefix_employer';
      defaultPrefix = 'SGR-EMP';
      break;
    case 'customer':
      prefixKey = 'system.prefix_customer';
      defaultPrefix = 'SGR-CUST';
      break;
    case 'application':
      prefixKey = 'system.prefix_application';
      defaultPrefix = 'SGR-APP';
      break;
    case 'invoice':
      prefixKey = 'system.prefix_invoice';
      defaultPrefix = 'SGR-INV';
      break;
    case 'payment':
      prefixKey = 'system.prefix_payment';
      defaultPrefix = 'SGR-PAY';
      break;
    case 'receipt':
      prefixKey = 'system.prefix_receipt';
      defaultPrefix = 'SGR-RCP';
      break;
    case 'refund':
      prefixKey = 'system.prefix_refund';
      defaultPrefix = 'SGR-REF';
      break;
    case 'visa':
      prefixKey = 'system.prefix_visa';
      defaultPrefix = 'SGR-VISA';
      break;
    case 'inquiry':
      prefixKey = 'system.prefix_inquiry';
      defaultPrefix = 'SGR-INQ';
      break;
  }

  let prefix = defaultPrefix;
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: prefixKey },
    });
    if (setting?.value) {
      prefix = setting.value.trim();
    }
  } catch (err) {
    // Fallback to defaultPrefix if db is not ready
  }

  const yearPattern = `${prefix}-${currentYear}-`;

  let count = 0;
  if (type === 'applicant') {
    count = await prisma.applicant.count({
      where: {
        applicantNumber: {
          startsWith: yearPattern,
        },
      },
    });
  } else if (type === 'job') {
    count = await prisma.job.count({
      where: {
        jobCode: {
          startsWith: yearPattern,
        },
      },
    });
  } else if (type === 'application') {
    count = await prisma.application.count({
      where: {
        applicationCode: {
          startsWith: yearPattern,
        },
      },
    });
  } else if (type === 'invoice') {
    count = await prisma.invoice.count({
      where: {
        invoiceNumber: {
          startsWith: yearPattern,
        },
      },
    });
  } else if (type === 'payment') {
    count = await prisma.payment.count({
      where: {
        paymentNumber: {
          startsWith: yearPattern,
        },
      },
    });
  } else if (type === 'receipt') {
    count = await prisma.payment.count({
      where: {
        receiptNumber: {
          startsWith: yearPattern,
        },
      },
    });
  } else if (type === 'refund') {
    count = await prisma.refund.count({
      where: {
        refundNumber: {
          startsWith: yearPattern,
        },
      },
    });
  } else if (type === 'visa') {
    count = await prisma.visaApplication.count({
      where: {
        visaApplicationNumber: {
          startsWith: yearPattern,
        },
      },
    });
  } else if (type === 'inquiry') {
    count = await prisma.inquiry.count({
      where: {
        inquiryNumber: {
          startsWith: yearPattern,
        },
      },
    });
  }

  const nextSequence = count + 1;
  const paddedSequence = String(nextSequence).padStart(6, '0');

  return `${yearPattern}${paddedSequence}`;
}

export async function generateApplicantNumber(
  prisma: PrismaClient,
  overrideYear?: number
): Promise<string> {
  return generateFormattedId(prisma, 'applicant', overrideYear);
}

export async function generateVisaApplicationNumber(
  prisma: PrismaClient,
  overrideYear?: number
): Promise<string> {
  return generateFormattedId(prisma, 'visa', overrideYear);
}

export async function generateInquiryNumber(
  prisma: PrismaClient,
  overrideYear?: number
): Promise<string> {
  return generateFormattedId(prisma, 'inquiry', overrideYear);
}

