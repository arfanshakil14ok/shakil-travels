import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';

const verifySchema = z.object({
  verificationStatus: z.enum(['VERIFIED', 'REJECTED', 'PENDING', 'UNVERIFIED']),
  verificationNotes: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED']).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(['SUPER_ADMIN', 'ADMIN', 'RECRUITMENT_MANAGER']);
    const { id } = await params;
    const body = await request.json();

    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { verificationStatus, verificationNotes, status } = parsed.data;

    const employer = await prisma.employer.findFirst({
      where: { OR: [{ id }, { employerCode: id }] },
    });

    if (!employer) {
      return NextResponse.json({ success: false, error: 'Employer not found' }, { status: 404 });
    }

    const updated = await prisma.employer.update({
      where: { id: employer.id },
      data: {
        verificationStatus,
        verificationNotes: verificationNotes !== undefined ? verificationNotes : employer.verificationNotes,
        status: status || (verificationStatus === 'REJECTED' ? 'SUSPENDED' : employer.status),
        verifiedById: currentUser.id,
        verifiedAt: new Date(),
      },
      include: {
        country: true,
        contacts: true,
        documents: true,
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: verificationStatus === 'VERIFIED' ? 'EMPLOYER_VERIFIED' : 'EMPLOYER_REJECTED',
      entity: 'Employer',
      entityId: employer.id,
      oldValue: {
        verificationStatus: employer.verificationStatus,
        status: employer.status,
      },
      newValue: {
        verificationStatus: updated.verificationStatus,
        status: updated.status,
        verificationNotes,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Employer successfully updated to ${verificationStatus}`,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error verifying employer:', error);
    return NextResponse.json({ success: false, error: 'Failed to verify employer' }, { status: 500 });
  }
}
