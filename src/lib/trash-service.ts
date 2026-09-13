import prisma from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

export interface TrashItem {
  id: string;
  type: 'Applicant' | 'Job' | 'Employer' | 'Invoice' | 'Document';
  title: string;
  identifier: string;
  deletedAt: string;
  deletedBy: string;
  details?: Record<string, any>;
}

export interface TrashFilters {
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class TrashService {
  /**
   * Soft-delete an entity by archiving it and registering in AuditLog
   */
  static async softDelete(
    type: 'Applicant' | 'Job' | 'Employer' | 'Invoice' | 'Document',
    id: string,
    deletedBy: { id: string; name: string; email?: string }
  ) {
    return await prisma.$transaction(async (tx) => {
      let recordTitle = id;
      let recordCode = id;
      let originalData: any = {};

      switch (type) {
        case 'Applicant': {
          const applicant = await tx.applicant.findUnique({ where: { id } });
          if (!applicant) throw new Error(`Applicant ${id} not found`);

          recordTitle = applicant.fullName;
          recordCode = applicant.applicantNumber;
          originalData = {
            status: applicant.status,
            isActive: applicant.isActive,
            photo: applicant.profilePhoto,
          };

          await tx.applicant.update({
            where: { id },
            data: {
              status: 'ARCHIVED',
              isActive: false,
            },
          });
          break;
        }

        case 'Job': {
          const job = await tx.job.findUnique({ where: { id } });
          if (!job) throw new Error(`Job ${id} not found`);

          recordTitle = job.title;
          recordCode = job.jobCode;
          originalData = {
            status: job.status,
            featured: job.featured,
          };

          await tx.job.update({
            where: { id },
            data: {
              status: 'ARCHIVED',
              featured: false,
            },
          });
          break;
        }

        case 'Employer': {
          const employer = await tx.employer.findUnique({ where: { id } });
          if (!employer) throw new Error(`Employer ${id} not found`);

          recordTitle = employer.companyName;
          recordCode = employer.employerCode || id;
          originalData = {
            status: employer.status,
          };

          await tx.employer.update({
            where: { id },
            data: {
              status: 'ARCHIVED',
            },
          });
          break;
        }

        case 'Invoice': {
          const invoice = await tx.invoice.findUnique({ where: { id } });
          if (!invoice) throw new Error(`Invoice ${id} not found`);

          recordTitle = `Invoice #${invoice.invoiceNumber}`;
          recordCode = invoice.invoiceNumber;
          originalData = {
            status: invoice.status,
          };

          await tx.invoice.update({
            where: { id },
            data: {
              status: 'CANCELLED',
            },
          });
          break;
        }

        case 'Document': {
          const document = await tx.document.findUnique({ where: { id } });
          if (!document) throw new Error(`Document ${id} not found`);

          recordTitle = document.fileName;
          recordCode = document.id;
          originalData = {
            status: document.status,
            isLatest: document.isLatest,
          };

          await tx.document.update({
            where: { id },
            data: {
              status: 'REJECTED',
              isLatest: false,
            },
          });
          break;
        }

        default:
          throw new Error(`Unsupported trash entity type: ${type}`);
      }

      // Log in AuditLog
      const auditLog = await tx.auditLog.create({
        data: {
          userId: deletedBy.id,
          actorUserId: deletedBy.id,
          action: 'TRASH_ITEM',
          entity: type,
          entityId: id,
          description: `Soft-deleted ${type} ${recordTitle} (${recordCode}) by ${deletedBy.name}`,
          metadata: JSON.stringify({
            title: recordTitle,
            identifier: recordCode,
            originalData,
            deletedBy: deletedBy.name,
            deletedAt: new Date().toISOString(),
          }),
        },
      });

      return {
        success: true,
        type,
        id,
        title: recordTitle,
        auditLogId: auditLog.id,
      };
    });
  }

  /**
   * List all items in trash with optional type filtering and search
   */
  static async listTrash(filters: TrashFilters = {}) {
    const { type, search, page = 1, limit = 50 } = filters;

    const trashItems: TrashItem[] = [];

    // 1. Check Applicants
    if (!type || type === 'Applicant' || type === 'ALL') {
      const applicants = await prisma.applicant.findMany({
        where: {
          OR: [{ status: 'ARCHIVED' }, { isActive: false }],
          ...(search
            ? {
                OR: [
                  { fullName: { contains: search, mode: 'insensitive' } },
                  { applicantNumber: { contains: search, mode: 'insensitive' } },
                  { phone: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      });

      for (const app of applicants) {
        trashItems.push({
          id: app.id,
          type: 'Applicant',
          title: app.fullName,
          identifier: app.applicantNumber,
          deletedAt: app.updatedAt.toISOString(),
          deletedBy: 'Admin / System',
          details: {
            phone: app.phone,
            email: app.email,
            status: app.status,
            photo: app.profilePhoto,
          },
        });
      }
    }

    // 2. Check Jobs
    if (!type || type === 'Job' || type === 'ALL') {
      const jobs = await prisma.job.findMany({
        where: {
          status: 'ARCHIVED',
          ...(search
            ? {
                OR: [
                  { title: { contains: search, mode: 'insensitive' } },
                  { jobCode: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      });

      for (const job of jobs) {
        trashItems.push({
          id: job.id,
          type: 'Job',
          title: job.title,
          identifier: job.jobCode,
          deletedAt: job.updatedAt.toISOString(),
          deletedBy: 'Admin / System',
          details: {
            status: job.status,
          },
        });
      }
    }

    // 3. Check Employers
    if (!type || type === 'Employer' || type === 'ALL') {
      const employers = await prisma.employer.findMany({
        where: {
          status: 'ARCHIVED',
          ...(search
            ? {
                companyName: { contains: search, mode: 'insensitive' },
              }
            : {}),
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      });

      for (const emp of employers) {
        trashItems.push({
          id: emp.id,
          type: 'Employer',
          title: emp.companyName,
          identifier: emp.employerCode || emp.id,
          deletedAt: emp.updatedAt.toISOString(),
          deletedBy: 'Admin / System',
          details: {
            status: emp.status,
          },
        });
      }
    }

    // 4. Check Invoices
    if (!type || type === 'Invoice' || type === 'ALL') {
      const invoices = await prisma.invoice.findMany({
        where: {
          status: 'CANCELLED',
          ...(search
            ? {
                invoiceNumber: { contains: search, mode: 'insensitive' },
              }
            : {}),
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      });

      for (const inv of invoices) {
        trashItems.push({
          id: inv.id,
          type: 'Invoice',
          title: `Invoice #${inv.invoiceNumber}`,
          identifier: inv.invoiceNumber,
          deletedAt: inv.updatedAt.toISOString(),
          deletedBy: 'Admin / System',
          details: {
            status: inv.status,
            totalAmount: Number(inv.totalAmount),
          },
        });
      }
    }

    // 5. Check Documents
    if (!type || type === 'Document' || type === 'ALL') {
      const documents = await prisma.document.findMany({
        where: {
          status: 'REJECTED',
          isLatest: false,
          ...(search
            ? {
                fileName: { contains: search, mode: 'insensitive' },
              }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      for (const doc of documents) {
        trashItems.push({
          id: doc.id,
          type: 'Document',
          title: doc.fileName,
          identifier: doc.id,
          deletedAt: doc.createdAt.toISOString(),
          deletedBy: 'Admin / System',
          details: {
            filePath: doc.filePath,
            fileSize: doc.fileSize,
          },
        });
      }
    }

    // Sort all by deletedAt desc
    trashItems.sort(
      (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
    );

    const startIndex = (page - 1) * limit;
    const paginatedItems = trashItems.slice(startIndex, startIndex + limit);

    return {
      items: paginatedItems,
      total: trashItems.length,
      page,
      limit,
      totalPages: Math.ceil(trashItems.length / limit) || 1,
    };
  }

  /**
   * Restore an entity back to active status
   */
  static async restore(
    type: 'Applicant' | 'Job' | 'Employer' | 'Invoice' | 'Document',
    id: string,
    restoredBy: { id: string; name: string }
  ) {
    return await prisma.$transaction(async (tx) => {
      let recordTitle = id;
      let recordCode = id;

      switch (type) {
        case 'Applicant': {
          const applicant = await tx.applicant.findUnique({ where: { id } });
          if (!applicant) throw new Error(`Applicant ${id} not found`);

          recordTitle = applicant.fullName;
          recordCode = applicant.applicantNumber;

          await tx.applicant.update({
            where: { id },
            data: {
              status: 'ACTIVE',
              isActive: true,
            },
          });
          break;
        }

        case 'Job': {
          const job = await tx.job.findUnique({ where: { id } });
          if (!job) throw new Error(`Job ${id} not found`);

          recordTitle = job.title;
          recordCode = job.jobCode;

          await tx.job.update({
            where: { id },
            data: {
              status: 'APPROVED',
            },
          });
          break;
        }

        case 'Employer': {
          const employer = await tx.employer.findUnique({ where: { id } });
          if (!employer) throw new Error(`Employer ${id} not found`);

          recordTitle = employer.companyName;
          recordCode = employer.employerCode || id;

          await tx.employer.update({
            where: { id },
            data: {
              status: 'ACTIVE',
            },
          });
          break;
        }

        case 'Invoice': {
          const invoice = await tx.invoice.findUnique({ where: { id } });
          if (!invoice) throw new Error(`Invoice ${id} not found`);

          recordTitle = `Invoice #${invoice.invoiceNumber}`;
          recordCode = invoice.invoiceNumber;

          await tx.invoice.update({
            where: { id },
            data: {
              status: 'ISSUED',
            },
          });
          break;
        }

        case 'Document': {
          const document = await tx.document.findUnique({ where: { id } });
          if (!document) throw new Error(`Document ${id} not found`);

          recordTitle = document.fileName;
          recordCode = document.id;

          await tx.document.update({
            where: { id },
            data: {
              status: 'UPLOADED',
              isLatest: true,
            },
          });
          break;
        }

        default:
          throw new Error(`Unsupported restore type: ${type}`);
      }

      await tx.auditLog.create({
        data: {
          userId: restoredBy.id,
          actorUserId: restoredBy.id,
          action: 'RESTORE_ITEM',
          entity: type,
          entityId: id,
          description: `Restored ${type} ${recordTitle} (${recordCode}) by ${restoredBy.name}`,
          metadata: JSON.stringify({
            title: recordTitle,
            identifier: recordCode,
            restoredBy: restoredBy.name,
            restoredAt: new Date().toISOString(),
          }),
        },
      });

      return {
        success: true,
        type,
        id,
        title: recordTitle,
      };
    });
  }

  /**
   * Permanently delete an entity and clean up files
   */
  static async permanentDelete(
    type: 'Applicant' | 'Job' | 'Employer' | 'Invoice' | 'Document',
    id: string,
    deletedBy: { id: string; name: string }
  ) {
    let filesToDelete: string[] = [];
    let recordTitle = id;
    let recordCode = id;

    await prisma.$transaction(async (tx) => {
      switch (type) {
        case 'Applicant': {
          const applicant = await tx.applicant.findUnique({
            where: { id },
            include: { documents: true },
          });
          if (!applicant) throw new Error(`Applicant ${id} not found`);

          recordTitle = applicant.fullName;
          recordCode = applicant.applicantNumber;

          if (applicant.profilePhoto) {
            filesToDelete.push(applicant.profilePhoto);
          }

          for (const doc of applicant.documents) {
            if (doc.filePath) filesToDelete.push(doc.filePath);
          }

          // Clean relations
          await tx.applicantProfile.deleteMany({ where: { applicantId: id } });
          await tx.applicantNote.deleteMany({ where: { applicantId: id } });
          await tx.candidateSkill.deleteMany({ where: { applicantId: id } });
          await tx.candidateLanguage.deleteMany({ where: { applicantId: id } });
          await tx.candidateEducation.deleteMany({ where: { applicantId: id } });
          await tx.candidateExperience.deleteMany({ where: { applicantId: id } });
          await tx.trainingApplication.deleteMany({ where: { applicantId: id } });
          await tx.trainingEnrollment.deleteMany({ where: { applicantId: id } });
          await tx.trainingCertificate.deleteMany({ where: { applicantId: id } });
          await tx.medicalRecord.deleteMany({ where: { applicantId: id } });
          await tx.clearanceRecord.deleteMany({ where: { applicantId: id } });
          await tx.departureRecord.deleteMany({ where: { applicantId: id } });
          await tx.visaApplication.deleteMany({ where: { applicantId: id } });
          await tx.communicationLog.deleteMany({ where: { applicantId: id } });
          await tx.supportTicket.deleteMany({ where: { applicantId: id } });
          await tx.notification.deleteMany({ where: { applicantId: id } });
          await tx.document.deleteMany({ where: { applicantId: id } });
          await tx.applicationScreening.deleteMany({
            where: { application: { applicantId: id } },
          });
          await tx.applicationStatusHistory.deleteMany({
            where: { application: { applicantId: id } },
          });
          await tx.interview.deleteMany({
            where: { applicantId: id },
          });
          await tx.application.deleteMany({ where: { applicantId: id } });
          await tx.receipt.deleteMany({ where: { applicantId: id } });
          await tx.refund.deleteMany({ where: { applicantId: id } });
          await tx.financialAdjustment.deleteMany({ where: { applicantId: id } });
          await tx.candidateLedgerEntry.deleteMany({ where: { applicantId: id } });
          await tx.paymentPlan.deleteMany({ where: { applicantId: id } });
          await tx.recruitmentCost.deleteMany({ where: { applicantId: id } });
          await tx.payment.deleteMany({ where: { applicantId: id } });
          await tx.invoiceItem.deleteMany({
            where: { invoice: { applicantId: id } },
          });
          await tx.invoice.deleteMany({ where: { applicantId: id } });
          await tx.customer.deleteMany({ where: { applicantId: id } });

          await tx.applicant.delete({ where: { id } });
          break;
        }

        case 'Job': {
          const job = await tx.job.findUnique({ where: { id } });
          if (!job) throw new Error(`Job ${id} not found`);

          recordTitle = job.title;
          recordCode = job.jobCode;

          await tx.applicationScreening.deleteMany({
            where: { application: { jobId: id } },
          });
          await tx.applicationStatusHistory.deleteMany({
            where: { application: { jobId: id } },
          });
          await tx.interview.deleteMany({ where: { jobId: id } });
          await tx.application.deleteMany({ where: { jobId: id } });
          await tx.invoiceItem.deleteMany({
            where: { invoice: { jobId: id } },
          });
          await tx.invoice.deleteMany({ where: { jobId: id } });
          await tx.recruitmentCost.deleteMany({ where: { jobId: id } });

          await tx.job.delete({ where: { id } });
          break;
        }

        case 'Employer': {
          const emp = await tx.employer.findUnique({
            where: { id },
            include: { documents: true },
          });
          if (!emp) throw new Error(`Employer ${id} not found`);

          recordTitle = emp.companyName;
          recordCode = emp.employerCode || id;

          for (const doc of emp.documents) {
            if (doc.fileUrl) filesToDelete.push(doc.fileUrl);
          }

          await tx.employerContact.deleteMany({ where: { employerId: id } });
          await tx.employerDocument.deleteMany({ where: { employerId: id } });
          await tx.customer.deleteMany({ where: { employerId: id } });
          await tx.employer.delete({ where: { id } });
          break;
        }

        case 'Invoice': {
          const invoice = await tx.invoice.findUnique({ where: { id } });
          if (!invoice) throw new Error(`Invoice ${id} not found`);

          recordTitle = `Invoice #${invoice.invoiceNumber}`;
          recordCode = invoice.invoiceNumber;

          await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
          await tx.payment.deleteMany({ where: { invoiceId: id } });
          await tx.invoice.delete({ where: { id } });
          break;
        }

        case 'Document': {
          const doc = await tx.document.findUnique({ where: { id } });
          if (!doc) throw new Error(`Document ${id} not found`);

          recordTitle = doc.fileName;
          recordCode = doc.id;
          if (doc.filePath) filesToDelete.push(doc.filePath);

          await tx.document.delete({ where: { id } });
          break;
        }

        default:
          throw new Error(`Unsupported delete entity type: ${type}`);
      }

      await tx.auditLog.create({
        data: {
          userId: deletedBy.id,
          actorUserId: deletedBy.id,
          action: 'PERMANENT_DELETE_ITEM',
          entity: type,
          entityId: id,
          description: `Permanently deleted ${type} ${recordTitle} (${recordCode}) by ${deletedBy.name}`,
          metadata: JSON.stringify({
            title: recordTitle,
            identifier: recordCode,
            deletedBy: deletedBy.name,
            deletedAt: new Date().toISOString(),
          }),
        },
      });
    });

    // Safely delete associated files from disk asynchronously
    for (const filePath of filesToDelete) {
      try {
        const fullPath = filePath.startsWith('/')
          ? path.join(process.cwd(), 'public', filePath)
          : filePath;
        await fs.unlink(fullPath);
      } catch (err) {
        // Ignore file missing errors
      }
    }

    return {
      success: true,
      type,
      id,
      title: recordTitle,
    };
  }

  /**
   * Bulk restore items
   */
  static async bulkRestore(
    items: Array<{ type: 'Applicant' | 'Job' | 'Employer' | 'Invoice' | 'Document'; id: string }>,
    restoredBy: { id: string; name: string }
  ) {
    const results = [];
    for (const item of items) {
      try {
        const res = await this.restore(item.type, item.id, restoredBy);
        results.push({ ...res, success: true });
      } catch (err: any) {
        results.push({ id: item.id, type: item.type, success: false, error: err.message });
      }
    }
    return results;
  }

  /**
   * Bulk permanent delete items
   */
  static async bulkPermanentDelete(
    items: Array<{ type: 'Applicant' | 'Job' | 'Employer' | 'Invoice' | 'Document'; id: string }>,
    deletedBy: { id: string; name: string }
  ) {
    const results = [];
    for (const item of items) {
      try {
        const res = await this.permanentDelete(item.type, item.id, deletedBy);
        results.push({ ...res, success: true });
      } catch (err: any) {
        results.push({ id: item.id, type: item.type, success: false, error: err.message });
      }
    }
    return results;
  }
}
