import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { z } from 'zod';

const templateSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  code: z.string().min(2, 'Code is required').toUpperCase(),
  channel: z.enum(['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP']),
  subject: z.string().optional().nullable(),
  content: z.string().min(1, 'Content is required'),
  variables: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    await requirePermission('COMMUNICATION_TEMPLATE_MANAGE');

    const searchParams = request.nextUrl.searchParams;
    const channel = searchParams.get('channel');

    const where: any = {};
    if (channel && channel !== 'ALL') {
      where.channel = channel;
    }

    const templates = await prisma.communicationTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: templates });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching templates:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission('COMMUNICATION_TEMPLATE_MANAGE');

    const body = await request.json();
    const parsed = templateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const existing = await prisma.communicationTemplate.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Template with code "${data.code}" already exists` },
        { status: 409 }
      );
    }

    const template = await prisma.communicationTemplate.create({
      data: {
        name: data.name,
        code: data.code,
        channel: data.channel,
        subject: data.subject || null,
        content: data.content,
        variables: data.variables || null,
        isActive: data.isActive,
      },
    });

    return NextResponse.json({ success: true, data: template }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error creating template:', error);
    return NextResponse.json({ success: false, error: 'Failed to create template' }, { status: 500 });
  }
}
