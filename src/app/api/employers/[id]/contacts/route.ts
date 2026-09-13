import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { employerContactSchema } from '@/lib/validations/employer';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('EMPLOYER_VIEW');
    const { id } = await params;

    const employer = await prisma.employer.findFirst({
      where: { OR: [{ id }, { employerCode: id }] },
    });

    if (!employer) {
      return NextResponse.json({ success: false, error: 'Employer not found' }, { status: 404 });
    }

    const contacts = await prisma.employerContact.findMany({
      where: { employerId: employer.id },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ success: true, data: contacts });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('EMPLOYER_EDIT');
    const { id } = await params;
    const body = await request.json();

    const employer = await prisma.employer.findFirst({
      where: { OR: [{ id }, { employerCode: id }] },
    });

    if (!employer) {
      return NextResponse.json({ success: false, error: 'Employer not found' }, { status: 404 });
    }

    const parsed = employerContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const contactData = parsed.data;

    const existingCount = await prisma.employerContact.count({
      where: { employerId: employer.id },
    });

    // If first contact or requested isPrimary, make it primary
    const shouldBePrimary = contactData.isPrimary || existingCount === 0;

    const contact = await prisma.$transaction(async (tx) => {
      if (shouldBePrimary) {
        await tx.employerContact.updateMany({
          where: { employerId: employer.id },
          data: { isPrimary: false },
        });
      }

      return tx.employerContact.create({
        data: {
          employerId: employer.id,
          name: contactData.name,
          designation: contactData.designation || null,
          email: contactData.email || null,
          phone: contactData.phone || null,
          isPrimary: shouldBePrimary,
        },
      });
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'EMPLOYER_CONTACT_CREATE',
      entity: 'EmployerContact',
      entityId: contact.id,
      newValue: contact,
    });

    return NextResponse.json({ success: true, data: contact }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error adding contact:', error);
    return NextResponse.json({ success: false, error: 'Failed to add contact' }, { status: 500 });
  }
}

const updateContactSchema = employerContactSchema.partial().extend({
  contactId: z.string().min(1, 'contactId is required'),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('EMPLOYER_EDIT');
    const { id } = await params;
    const body = await request.json();

    const employer = await prisma.employer.findFirst({
      where: { OR: [{ id }, { employerCode: id }] },
    });

    if (!employer) {
      return NextResponse.json({ success: false, error: 'Employer not found' }, { status: 404 });
    }

    const parsed = updateContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { contactId, ...data } = parsed.data;

    const existing = await prisma.employerContact.findFirst({
      where: { id: contactId, employerId: employer.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (data.isPrimary) {
        await tx.employerContact.updateMany({
          where: { employerId: employer.id, id: { not: contactId } },
          data: { isPrimary: false },
        });
      }

      return tx.employerContact.update({
        where: { id: contactId },
        data: {
          name: data.name !== undefined ? data.name : undefined,
          designation: data.designation !== undefined ? data.designation : undefined,
          email: data.email !== undefined ? data.email : undefined,
          phone: data.phone !== undefined ? data.phone : undefined,
          isPrimary: data.isPrimary !== undefined ? data.isPrimary : undefined,
        },
      });
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error updating contact:', error);
    return NextResponse.json({ success: false, error: 'Failed to update contact' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('EMPLOYER_EDIT');
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const contactId = searchParams.get('contactId');

    if (!contactId) {
      return NextResponse.json({ success: false, error: 'contactId is required' }, { status: 400 });
    }

    const employer = await prisma.employer.findFirst({
      where: { OR: [{ id }, { employerCode: id }] },
    });

    if (!employer) {
      return NextResponse.json({ success: false, error: 'Employer not found' }, { status: 404 });
    }

    const existing = await prisma.employerContact.findFirst({
      where: { id: contactId, employerId: employer.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
    }

    await prisma.employerContact.delete({
      where: { id: contactId },
    });

    // If the deleted contact was primary, make the first remaining contact primary if one exists
    if (existing.isPrimary) {
      const nextContact = await prisma.employerContact.findFirst({
        where: { employerId: employer.id },
        orderBy: { createdAt: 'asc' },
      });
      if (nextContact) {
        await prisma.employerContact.update({
          where: { id: nextContact.id },
          data: { isPrimary: true },
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error deleting contact:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete contact' }, { status: 500 });
  }
}
