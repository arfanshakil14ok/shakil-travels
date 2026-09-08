import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { z } from 'zod';

const updateTemplateSchema = z.object({
  name: z.string().min(2).optional(),
  channel: z.enum(['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP']).optional(),
  subject: z.string().optional().nullable(),
  content: z.string().min(1).optional(),
  variables: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('COMMUNICATION_TEMPLATE_MANAGE');
    const { id } = await params;

    const template = await prisma.communicationTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: template });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch template' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('COMMUNICATION_TEMPLATE_MANAGE');
    const { id } = await params;

    const existing = await prisma.communicationTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.communicationTemplate.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error updating template:', error);
    return NextResponse.json({ success: false, error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('COMMUNICATION_TEMPLATE_MANAGE');
    const { id } = await params;

    const existing = await prisma.communicationTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    await prisma.communicationTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Template deleted successfully' });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error deleting template:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete template' }, { status: 500 });
  }
}
