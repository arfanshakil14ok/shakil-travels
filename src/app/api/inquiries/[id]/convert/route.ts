import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { generateApplicantNumber } from '@/lib/id-generator';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';

const convertSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().min(6).optional(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  district: z.string().optional().nullable(),
  preferredCountryId: z.string().optional().nullable(),
  preferredJobCategoryId: z.string().optional().nullable(),
  skills: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission('INQUIRY_MANAGE');
    const { id } = await params;

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: { convertedApplicant: true },
    });

    if (!inquiry) {
      return NextResponse.json({ success: false, error: 'Inquiry not found' }, { status: 404 });
    }

    if (inquiry.convertedApplicantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'This inquiry has already been converted to an applicant',
          data: inquiry.convertedApplicant,
        },
        { status: 400 }
      );
    }

    let bodyData: any = {};
    try {
      bodyData = await request.json();
    } catch {
      // Empty body is allowed, defaults to inquiry data
    }
    const parsed = convertSchema.safeParse(bodyData);
    const overrides = parsed.success ? parsed.data : {};

    const fullName = overrides.fullName || inquiry.name;
    const phone = overrides.phone || inquiry.phone;
    const email = overrides.email !== undefined ? overrides.email : inquiry.email;

    // Check if applicant already exists with this phone
    let applicant = await prisma.applicant.findFirst({
      where: { phone },
    });

    let isNewApplicant = false;

    if (!applicant) {
      // Create new applicant
      const applicantNumber = await generateApplicantNumber(prisma);
      applicant = await prisma.applicant.create({
        data: {
          applicantNumber,
          fullName,
          phone,
          email: email || null,
          district: overrides.district || null,
          skills: overrides.skills || null,
          preferredCountryId: overrides.preferredCountryId || null,
          preferredJobCategoryId: overrides.preferredJobCategoryId || null,
          source: inquiry.source || 'INQUIRY',
          status: 'NEW',
          assignedStaffId: user.id,
        },
      });
      isNewApplicant = true;

      // Also create associated Customer record for financial accounting
      await prisma.customer.create({
        data: {
          customerType: 'APPLICANT',
          name: fullName,
          phone,
          email: email || null,
          applicantId: applicant.id,
        },
      });
    }

    // Update inquiry status and link
    const updatedInquiry = await prisma.inquiry.update({
      where: { id },
      data: {
        status: 'CONVERTED',
        convertedApplicantId: applicant.id,
        notes: overrides.notes
          ? `${inquiry.notes || ''}\n${new Date().toISOString()}: Converted to applicant ${applicant.applicantNumber}. Note: ${overrides.notes}`.trim()
          : `${inquiry.notes || ''}\n${new Date().toISOString()}: Converted to applicant ${applicant.applicantNumber}`.trim(),
      },
      include: {
        convertedApplicant: true,
      },
    });

    await createAuditLog({
      action: 'UPDATE',
      entity: 'Inquiry',
      entityId: id,
      newValue: {
        inquiryNumber: inquiry.inquiryNumber,
        action: 'CONVERT_TO_APPLICANT',
        applicantId: applicant.id,
        applicantNumber: applicant.applicantNumber,
        isNewApplicant,
      },
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: isNewApplicant
        ? `Lead successfully converted to new applicant ${applicant.applicantNumber}`
        : `Lead successfully linked to existing applicant ${applicant.applicantNumber}`,
      data: {
        inquiry: updatedInquiry,
        applicant,
        isNewApplicant,
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error converting inquiry:', error);
    return NextResponse.json({ success: false, error: 'Failed to convert inquiry' }, { status: 500 });
  }
}
