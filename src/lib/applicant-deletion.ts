import prisma from '@/lib/prisma';
import { storage } from '@/lib/storage';
import { createAuditLog } from '@/lib/audit';

export interface PurgeApplicantResult {
  success: boolean;
  applicantId: string;
  applicantNumber: string;
  fullName: string;
  filesDeleted: number;
  message: string;
}

/**
 * Permanently and cleanly purge an applicant from the database and Cloudflare R2 storage.
 * Deletes all linked records in correct cascade dependency order to avoid foreign key errors (P2003).
 */
export async function purgeApplicant(
  idOrNumber: string,
  actor: { id: string; name?: string; role?: any }
): Promise<PurgeApplicantResult> {
  const existing = await prisma.applicant.findFirst({
    where: {
      OR: [{ id: idOrNumber }, { applicantNumber: idOrNumber }],
    },
    include: {
      documents: { select: { id: true, filePath: true } },
      applications: {
        select: {
          id: true,
          jobId: true,
          status: true,
          currentStage: true,
          processingCase: { select: { id: true } },
          visaApplications: { select: { id: true } },
        },
      },
    },
  });

  if (!existing) {
    throw new Error(`Applicant not found with identifier: ${idOrNumber}`);
  }

  const applicantId = existing.id;
  let filesDeleted = 0;

  // 1. Delete physical files from Cloudflare R2 / Storage
  if (existing.profilePhoto) {
    try {
      await storage.deleteFile(existing.profilePhoto);
      filesDeleted++;
    } catch (err) {
      console.warn(`Failed to delete profile photo ${existing.profilePhoto}:`, err);
    }
  }

  for (const doc of existing.documents) {
    if (doc.filePath) {
      try {
        await storage.deleteFile(doc.filePath);
        filesDeleted++;
      } catch (err) {
        console.warn(`Failed to delete document file ${doc.filePath}:`, err);
      }
    }
  }

  // 2. Perform atomic database cascade purge in dependency order
  await prisma.$transaction(async (tx) => {
    // Collect all processingCaseIds
    const processingCases = await tx.recruitmentProcessingCase.findMany({
      where: {
        OR: [
          { applicantId },
          { applicationId: { in: existing.applications.map((a) => a.id) } },
        ],
      },
      select: { id: true },
    });
    const pcIds = Array.from(
      new Set([
        ...processingCases.map((p) => p.id),
        ...(existing.applications.map((a) => a.processingCase?.id).filter(Boolean) as string[]),
      ])
    );

    // Delete post-selection processing case child tables
    if (pcIds.length > 0) {
      await tx.medicalCase.deleteMany({ where: { processingCaseId: { in: pcIds } } });
      await tx.visaCase.deleteMany({ where: { processingCaseId: { in: pcIds } } });
      await tx.clearanceCase.deleteMany({ where: { processingCaseId: { in: pcIds } } });
      await tx.travelTicket.deleteMany({ where: { processingCaseId: { in: pcIds } } });
      await tx.departureCase.deleteMany({ where: { processingCaseId: { in: pcIds } } });
      await tx.joiningCase.deleteMany({ where: { processingCaseId: { in: pcIds } } });
      await tx.processingStatusHistory.deleteMany({ where: { processingCaseId: { in: pcIds } } });
      await tx.processingDocumentRequirement.deleteMany({ where: { processingCaseId: { in: pcIds } } });
    }

    // Direct candidate-level post selection cases
    await tx.medicalCase.deleteMany({ where: { candidateId: applicantId } });
    await tx.visaCase.deleteMany({ where: { candidateId: applicantId } });
    await tx.clearanceCase.deleteMany({ where: { candidateId: applicantId } });
    await tx.travelTicket.deleteMany({ where: { candidateId: applicantId } });
    await tx.departureCase.deleteMany({ where: { candidateId: applicantId } });
    await tx.joiningCase.deleteMany({ where: { candidateId: applicantId } });

    // Collect all visa applications
    const visaApps = await tx.visaApplication.findMany({
      where: {
        OR: [
          { applicantId },
          { applicationId: { in: existing.applications.map((a) => a.id) } },
        ],
      },
      select: { id: true },
    });
    const visaIds = visaApps.map((v) => v.id);

    if (visaIds.length > 0) {
      await tx.visaAppointment.deleteMany({ where: { visaApplicationId: { in: visaIds } } });
      await tx.visaStatusHistory.deleteMany({ where: { visaApplicationId: { in: visaIds } } });
      await tx.visaApplication.deleteMany({ where: { id: { in: visaIds } } });
    }

    // Delete processing cases
    if (pcIds.length > 0) {
      await tx.recruitmentProcessingCase.deleteMany({ where: { id: { in: pcIds } } });
    }

    // Delete application-level records
    const appIds = existing.applications.map((a) => a.id);
    if (appIds.length > 0) {
      await tx.medicalRecord.deleteMany({ where: { applicationId: { in: appIds } } });
      await tx.clearanceRecord.deleteMany({ where: { applicationId: { in: appIds } } });
      await tx.departureRecord.deleteMany({ where: { applicationId: { in: appIds } } });
      await tx.interview.deleteMany({ where: { applicationId: { in: appIds } } });
      await tx.applicationScreening.deleteMany({ where: { applicationId: { in: appIds } } });
      await tx.applicationStatusHistory.deleteMany({ where: { applicationId: { in: appIds } } });
    }

    // Candidate-level records
    await tx.medicalRecord.deleteMany({ where: { applicantId } });
    await tx.clearanceRecord.deleteMany({ where: { applicantId } });
    await tx.departureRecord.deleteMany({ where: { applicantId } });
    await tx.interview.deleteMany({ where: { applicantId } });

    // Decrement filledCount on Jobs if any application was SELECTED
    for (const app of existing.applications) {
      if (app.status === 'SELECTED' || app.currentStage === 'SELECTED') {
        const job = await tx.job.findUnique({ where: { id: app.jobId } });
        if (job && job.filledCount > 0) {
          await tx.job.update({
            where: { id: app.jobId },
            data: { filledCount: { decrement: 1 } },
          });
        }
      }
    }

    // Delete applications
    await tx.application.deleteMany({ where: { applicantId } });

    // Training records
    await tx.trainingAttendance.deleteMany({ where: { enrollment: { applicantId } } });
    await tx.trainingProgress.deleteMany({ where: { enrollment: { applicantId } } });
    await tx.trainingAssessment.deleteMany({ where: { enrollment: { applicantId } } });
    await tx.trainingCertificate.deleteMany({ where: { applicantId } });
    await tx.trainingEnrollment.deleteMany({ where: { applicantId } });
    await tx.trainingApplication.deleteMany({ where: { applicantId } });

    // Documents & requirements
    await tx.processingDocumentRequirement.deleteMany({ where: { document: { applicantId } } });
    await tx.document.deleteMany({ where: { applicantId } });

    // Qualifications & skills
    await tx.candidateSkill.deleteMany({ where: { applicantId } });
    await tx.candidateLanguage.deleteMany({ where: { applicantId } });
    await tx.candidateEducation.deleteMany({ where: { applicantId } });
    await tx.candidateExperience.deleteMany({ where: { applicantId } });

    // Tickets & messages
    await tx.ticketMessage.deleteMany({ where: { ticket: { applicantId } } });
    await tx.supportTicket.deleteMany({ where: { applicantId } });

    // Financial records
    await tx.installment.deleteMany({ where: { paymentPlan: { applicantId } } });
    await tx.paymentPlan.deleteMany({ where: { applicantId } });
    await tx.candidateLedgerEntry.deleteMany({ where: { applicantId } });
    await tx.financialAdjustment.deleteMany({ where: { applicantId } });
    await tx.refund.deleteMany({ where: { applicantId } });
    await tx.receipt.deleteMany({ where: { applicantId } });
    await tx.payment.deleteMany({ where: { applicantId } });
    await tx.invoiceItem.deleteMany({ where: { invoice: { applicantId } } });
    await tx.invoice.deleteMany({ where: { applicantId } });
    await tx.recruitmentCost.deleteMany({ where: { applicantId } });
    await tx.financialTransaction.deleteMany({ where: { applicantId } });

    // Notifications, logs & inquiries
    await tx.notification.deleteMany({ where: { applicantId } });
    await tx.auditLog.deleteMany({ where: { applicantId } });
    await tx.communicationLog.deleteMany({ where: { applicantId } });
    await tx.inquiry.updateMany({
      where: { convertedApplicantId: applicantId },
      data: { convertedApplicantId: null },
    });

    // Customer record, profile & notes
    await tx.customer.deleteMany({ where: { applicantId } });
    await tx.applicantNote.deleteMany({ where: { applicantId } });
    await tx.applicantProfile.deleteMany({ where: { applicantId } });

    // Finally delete the applicant record
    await tx.applicant.delete({ where: { id: applicantId } });
  });

  await createAuditLog({
    userId: actor.id,
    action: 'APPLICANT_DELETE',
    entity: 'Applicant',
    entityId: applicantId,
    description: `Completely purged candidate ${existing.fullName} (${existing.applicantNumber}) and ${filesDeleted} files/all records from system`,
    oldValue: {
      id: applicantId,
      fullName: existing.fullName,
      applicantNumber: existing.applicantNumber,
      phone: existing.phone,
    },
  });

  return {
    success: true,
    applicantId,
    applicantNumber: existing.applicantNumber,
    fullName: existing.fullName,
    filesDeleted,
    message: `প্রার্থী ${existing.fullName} (${existing.applicantNumber}) এবং তার সকল ফাইল ও ডাটা সম্পূর্ণ সিস্টেম থেকে সফলভাবে ডিলিট করা হয়েছে। / Candidate and all associated data purged successfully.`,
  };
}
