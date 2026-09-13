import { PrismaClient } from '@prisma/client';
import defaultPrisma from './prisma';

export type IdType =
  | 'applicant'
  | 'application'
  | 'processing'
  | 'invoice'
  | 'job'
  | 'employer'
  | 'customer'
  | 'payment'
  | 'receipt'
  | 'refund'
  | 'adjustment'
  | 'cost'
  | 'payment_plan'
  | 'visa'
  | 'inquiry'
  | 'training_app'
  | 'enrollment'
  | 'certificate'
  | 'ticket';

/**
 * Generates sequential business identification codes based on current calendar year
 * Formats:
 *  - Applicant: SGR-2026-000001
 *  - Job: SGR-JOB-2026-000001
 *  - Employer: SGR-EMP-2026-000001
 *  - Customer: SGR-CUST-2026-000001
 *  - Application: SGR-APP-2026-000001
 *  - Processing: SGR-PROC-2026-000001
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
    case 'processing':
      prefixKey = 'system.prefix_processing';
      defaultPrefix = 'SGR-PROC';
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
    case 'adjustment':
      prefixKey = 'system.prefix_adjustment';
      defaultPrefix = 'SGR-ADJ';
      break;
    case 'cost':
      prefixKey = 'system.prefix_cost';
      defaultPrefix = 'SGR-COST';
      break;
    case 'payment_plan':
      prefixKey = 'system.prefix_payment_plan';
      defaultPrefix = 'SGR-PLAN';
      break;
    case 'visa':
      prefixKey = 'system.prefix_visa';
      defaultPrefix = 'SGR-VISA';
      break;
    case 'inquiry':
      prefixKey = 'system.prefix_inquiry';
      defaultPrefix = 'SGR-INQ';
      break;
    case 'training_app':
      prefixKey = 'system.prefix_training_app';
      defaultPrefix = 'SGR-TRN-APP';
      break;
    case 'enrollment':
      prefixKey = 'system.prefix_enrollment';
      defaultPrefix = 'SGR-ENR';
      break;
    case 'certificate':
      prefixKey = 'system.prefix_certificate';
      defaultPrefix = 'SGR-CERT';
      break;
    case 'ticket':
      prefixKey = 'system.prefix_ticket';
      defaultPrefix = 'SGR-TCK';
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
  } else if (type === 'processing') {
    count = await prisma.recruitmentProcessingCase.count({
      where: {
        processingCode: {
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
  } else if (type === 'adjustment') {
    count = await prisma.financialAdjustment.count({
      where: {
        adjustmentNumber: {
          startsWith: yearPattern,
        },
      },
    });
  } else if (type === 'cost') {
    count = await prisma.recruitmentCost.count({
      where: {
        costNumber: {
          startsWith: yearPattern,
        },
      },
    });
  } else if (type === 'payment_plan') {
    count = await prisma.paymentPlan.count({
      where: {
        planNumber: {
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
  } else if (type === 'training_app') {
    count = await (prisma as any).trainingApplication.count({
      where: {
        applicationCode: {
          startsWith: yearPattern,
        },
      },
    });
  } else if (type === 'employer') {
    count = await prisma.employer.count({
      where: {
        employerCode: {
          startsWith: yearPattern,
        },
      },
    });
  } else if (type === 'enrollment') {
    count = await (prisma as any).trainingEnrollment.count({
      where: {
        enrollmentNumber: {
          startsWith: yearPattern,
        },
      },
    });
  } else if (type === 'certificate') {
    count = await (prisma as any).trainingCertificate.count({
      where: {
        certificateNumber: {
          startsWith: yearPattern,
        },
      },
    });
  } else if (type === 'ticket') {
    count = await (prisma as any).supportTicket.count({
      where: {
        ticketNumber: {
          startsWith: yearPattern,
        },
      },
    });
  }

  const nextSequence = count + 1;
  const paddedSequence = String(nextSequence).padStart(6, '0');

  return `${yearPattern}${paddedSequence}`;
}

export async function generateJobCode(
  prisma: PrismaClient,
  overrideYear?: number
): Promise<string> {
  return generateFormattedId(prisma, 'job', overrideYear);
}

export async function generateApplicationCode(
  prisma: PrismaClient,
  overrideYear?: number
): Promise<string> {
  return generateFormattedId(prisma, 'application', overrideYear);
}

export async function generateProcessingCode(
  prisma?: PrismaClient,
  overrideYear?: number
): Promise<string> {
  return generateFormattedId(prisma || defaultPrisma, 'processing', overrideYear);
}

export async function generateEmployerCode(
  prisma: PrismaClient,
  overrideYear?: number
): Promise<string> {
  return generateFormattedId(prisma, 'employer', overrideYear);
}

export async function generateTrainingApplicationCode(prisma: PrismaClient): Promise<string> {
  return generateFormattedId(prisma, 'training_app');
}

export async function generateEnrollmentNumber(prisma: PrismaClient): Promise<string> {
  return generateFormattedId(prisma, 'enrollment');
}

export async function generateCertificateNumber(prisma: PrismaClient): Promise<string> {
  return generateFormattedId(prisma, 'certificate');
}

export async function generateTicketNumber(prisma: PrismaClient): Promise<string> {
  return generateFormattedId(prisma, 'ticket');
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

export async function generateInvoiceNumber(
  prisma?: PrismaClient,
  overrideYear?: number
): Promise<string> {
  return generateFormattedId(prisma || defaultPrisma, 'invoice', overrideYear);
}

export async function generatePaymentNumber(
  prisma?: PrismaClient,
  overrideYear?: number
): Promise<string> {
  return generateFormattedId(prisma || defaultPrisma, 'payment', overrideYear);
}

export async function generateReceiptNumber(
  prisma?: PrismaClient,
  overrideYear?: number
): Promise<string> {
  return generateFormattedId(prisma || defaultPrisma, 'receipt', overrideYear);
}

export async function generateRefundNumber(
  prisma?: PrismaClient,
  overrideYear?: number
): Promise<string> {
  return generateFormattedId(prisma || defaultPrisma, 'refund', overrideYear);
}

export async function generateAdjustmentNumber(
  prisma?: PrismaClient,
  overrideYear?: number
): Promise<string> {
  return generateFormattedId(prisma || defaultPrisma, 'adjustment', overrideYear);
}

export async function generateCostNumber(
  prisma?: PrismaClient,
  overrideYear?: number
): Promise<string> {
  return generateFormattedId(prisma || defaultPrisma, 'cost', overrideYear);
}

export async function generatePaymentPlanNumber(
  prisma?: PrismaClient,
  overrideYear?: number
): Promise<string> {
  return generateFormattedId(prisma || defaultPrisma, 'payment_plan', overrideYear);
}

