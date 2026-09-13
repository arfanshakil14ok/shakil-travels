import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';

const statusChangeSchema = z.object({
  action: z.enum(['SUBMIT', 'APPROVE', 'PUBLISH', 'PAUSE', 'RESUME', 'CLOSE', 'REOPEN']),
  notes: z.string().optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const parsed = statusChangeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { action, notes } = parsed.data;

    const job = await prisma.job.findFirst({
      where: { OR: [{ id }, { jobCode: id }, { slug: id }] },
      include: { employer: true },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const userRole = currentUser.role.name;
    const isManagerOrAdmin = ['SUPER_ADMIN', 'ADMIN', 'RECRUITMENT_MANAGER'].includes(userRole);

    let nextStatus = job.status;
    const updateData: any = {};

    if (notes !== undefined) {
      updateData.reviewNotes = notes;
    }

    switch (action) {
      case 'SUBMIT': {
        if (job.status !== 'DRAFT') {
          return NextResponse.json(
            { success: false, error: `Cannot submit a job in ${job.status} status` },
            { status: 400 }
          );
        }
        nextStatus = 'PENDING_APPROVAL';
        break;
      }

      case 'APPROVE': {
        if (!isManagerOrAdmin) {
          return NextResponse.json(
            { success: false, error: 'Only Managers or Admins can approve job postings' },
            { status: 403 }
          );
        }
        if (job.status !== 'PENDING_APPROVAL' && job.status !== 'DRAFT') {
          return NextResponse.json(
            { success: false, error: `Job is not awaiting review (current: ${job.status})` },
            { status: 400 }
          );
        }
        nextStatus = 'APPROVED';
        updateData.approvedAt = new Date();
        updateData.approvedById = currentUser.id;
        break;
      }

      case 'PUBLISH': {
        if (!isManagerOrAdmin) {
          return NextResponse.json(
            { success: false, error: 'Only Managers or Admins can publish job postings' },
            { status: 403 }
          );
        }

        // Check employer requirement and verification
        if (!job.employerId || !job.employer) {
          return NextResponse.json(
            {
              success: false,
              error: 'An employer must be assigned before publishing a job vacancy. / চাকরি প্রকাশ করার পূর্বে নিয়োগকর্তা নির্বাচন বাধ্যতামূলক।',
            },
            { status: 400 }
          );
        }

        if (job.employer.verificationStatus !== 'VERIFIED' || job.employer.status !== 'ACTIVE') {
          return NextResponse.json(
            {
              success: false,
              error: 'Only verified and active employers can have published job vacancies. Please verify the employer first. / শুধুমাত্র যাচাইকৃত ও সক্রিয় নিয়োগকর্তার চাকরি প্রকাশ করা যাবে।',
            },
            { status: 400 }
          );
        }

        nextStatus = 'PUBLISHED';
        updateData.publishedAt = new Date();
        updateData.publishedById = currentUser.id;
        if (!job.approvedAt) {
          updateData.approvedAt = new Date();
          updateData.approvedById = currentUser.id;
        }
        break;
      }

      case 'PAUSE': {
        if (job.status !== 'PUBLISHED') {
          return NextResponse.json(
            { success: false, error: 'Only published jobs can be paused' },
            { status: 400 }
          );
        }
        nextStatus = 'PAUSED';
        break;
      }

      case 'RESUME': {
        if (job.status !== 'PAUSED') {
          return NextResponse.json(
            { success: false, error: 'Only paused jobs can be resumed' },
            { status: 400 }
          );
        }
        // Invariant check on resume
        if (
          !job.employer ||
          job.employer.verificationStatus !== 'VERIFIED' ||
          job.employer.status !== 'ACTIVE'
        ) {
          return NextResponse.json(
            {
              success: false,
              error: 'Cannot resume job: employer is not verified or active.',
            },
            { status: 400 }
          );
        }
        nextStatus = 'PUBLISHED';
        break;
      }

      case 'CLOSE': {
        nextStatus = 'CLOSED';
        break;
      }

      case 'REOPEN': {
        if (!isManagerOrAdmin) {
          return NextResponse.json(
            { success: false, error: 'Only Managers or Admins can reopen closed jobs' },
            { status: 403 }
          );
        }
        nextStatus = 'DRAFT';
        break;
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    updateData.status = nextStatus;

    const updated = await prisma.job.update({
      where: { id: job.id },
      data: updateData,
      include: {
        country: true,
        jobCategory: true,
        employer: true,
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'JOB_STATUS_CHANGE',
      entity: 'Job',
      entityId: job.id,
      oldValue: { status: job.status },
      newValue: { status: updated.status, action, notes },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Job status transitioned from ${job.status} to ${nextStatus}`,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error changing job status:', error);
    return NextResponse.json({ success: false, error: 'Failed to update job status' }, { status: 500 });
  }
}
