import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { generateInquiryNumber } from '@/lib/id-generator';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';

const publicInquirySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(6, 'Valid phone number is required'),
  email: z.string().email('Valid email is required').optional().nullable().or(z.literal('')),
  subject: z.string().min(2, 'Subject is required'),
  message: z.string().min(5, 'Message is required'),
  source: z.string().default('WEBSITE_CONTACT'),
});

export async function GET(request: NextRequest) {
  try {
    await requirePermission('INQUIRY_VIEW');

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '15')));
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { inquiryNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.inquiry.count({ where }),
      prisma.inquiry.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          convertedApplicant: {
            select: { id: true, applicantNumber: true, fullName: true },
          },
          assignedStaff: {
            select: { id: true, name: true, email: true },
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
    console.error('Error fetching inquiries:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch inquiries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = publicInquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const inquiryNumber = await generateInquiryNumber(prisma);

    const inquiry = await prisma.inquiry.create({
      data: {
        inquiryNumber,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        subject: data.subject,
        message: data.message,
        source: data.source || 'WEBSITE_CONTACT',
        status: 'NEW',
      },
    });

    return NextResponse.json({
      success: true,
      data: inquiry,
      message: 'Inquiry received. A recruitment counselor will contact you shortly.',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error submitting inquiry:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit inquiry' }, { status: 500 });
  }
}
