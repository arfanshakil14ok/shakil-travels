import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { applicantNoteSchema } from '@/lib/validations/applicant';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('APPLICANT_VIEW');
    const { id } = await params;

    const notes = await prisma.applicantNote.findMany({
      where: { applicantId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: notes });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Failed to retrieve notes' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('APPLICANT_EDIT');
    const { id } = await params;
    const body = await request.json();

    const parsed = applicantNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const applicant = await prisma.applicant.findUnique({
      where: { id },
      select: { id: true, applicantNumber: true, fullName: true },
    });

    if (!applicant) {
      return NextResponse.json({ success: false, error: 'Applicant not found' }, { status: 404 });
    }

    const note = await prisma.applicantNote.create({
      data: {
        applicantId: id,
        createdById: currentUser.id,
        note: parsed.data.note,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'APPLICANT_NOTE_ADD',
      entity: 'ApplicantNote',
      entityId: note.id,
      newValue: { applicantId: id, applicantNumber: applicant.applicantNumber },
    });

    return NextResponse.json({ success: true, data: note }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error adding note:', error);
    return NextResponse.json({ success: false, error: 'Failed to create note' }, { status: 500 });
  }
}
