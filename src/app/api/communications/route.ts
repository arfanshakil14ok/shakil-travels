import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { dispatchCommunication } from '@/lib/comms/dispatcher';
import { z } from 'zod';

const sendMessageSchema = z.object({
  applicantId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  recipientEmail: z.string().email().optional().nullable(),
  recipientPhone: z.string().optional().nullable(),
  channel: z.enum(['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP']),
  templateCode: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  message: z.string().min(1, 'Message content is required'),
  variables: z.record(z.string()).optional(),
  link: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    await requirePermission('COMMUNICATION_VIEW');

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const channel = searchParams.get('channel') || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (channel && channel !== 'ALL') where.channel = channel;
    if (status && status !== 'ALL') where.status = status;
    if (search) {
      where.OR = [
        { recipient: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.communicationLog.count({ where }),
      prisma.communicationLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          applicant: {
            select: { id: true, applicantNumber: true, fullName: true, phone: true, email: true },
          },
          customer: {
            select: { id: true, name: true, phone: true, email: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error listing communications:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch communication logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission('COMMUNICATION_SEND');

    const body = await request.json();
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const result = await dispatchCommunication(prisma, {
      applicantId: data.applicantId || undefined,
      customerId: data.customerId || undefined,
      recipientEmail: data.recipientEmail || undefined,
      recipientPhone: data.recipientPhone || undefined,
      channel: data.channel,
      templateCode: data.templateCode || undefined,
      subject: data.subject || undefined,
      message: data.message,
      variables: data.variables,
      link: data.link || undefined,
    });

    if (!result.success && !result.logId) {
      return NextResponse.json({ success: false, error: result.error || 'Failed to dispatch message' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Communication dispatched via ${data.channel}`,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error sending communication:', error);
    return NextResponse.json({ success: false, error: 'Failed to send communication' }, { status: 500 });
  }
}
