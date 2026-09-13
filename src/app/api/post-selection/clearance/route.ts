import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getCurrentApplicant } from '@/lib/portal-auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const applicationId = searchParams.get('applicationId');
    const applicantId = searchParams.get('applicantId');
    const status = searchParams.get('status');
    const clearanceType = searchParams.get('clearanceType');
    const search = searchParams.get('search')?.trim();

    // Check staff auth first
    const staffUser = await getCurrentUser();
    let candidateApplicant = null;
    if (!staffUser) {
      candidateApplicant = await getCurrentApplicant();
      if (!candidateApplicant) {
        return NextResponse.json({ success: false, error: 'Unauthorized: Please log in' }, { status: 401 });
      }
    }

    const where: any = {};

    if (candidateApplicant) {
      where.applicantId = candidateApplicant.id;
    } else {
      if (applicantId && applicantId !== 'ALL') where.applicantId = applicantId;
      if (applicationId && applicationId !== 'ALL') where.applicationId = applicationId;
      if (status && status !== 'ALL') where.status = status;
      if (clearanceType && clearanceType !== 'ALL') where.clearanceType = clearanceType;

      if (search) {
        where.OR = [
          { applicant: { fullName: { contains: search, mode: 'insensitive' } } },
          { applicant: { applicantNumber: { contains: search, mode: 'insensitive' } } },
          { application: { applicationCode: { contains: search, mode: 'insensitive' } } },
          { smartCardNumber: { contains: search, mode: 'insensitive' } },
          { certificateNumber: { contains: search, mode: 'insensitive' } },
        ];
      }
    }

    const records = await prisma.clearanceRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        applicant: {
          select: {
            id: true,
            fullName: true,
            applicantNumber: true,
            phone: true,
            passportNumber: true,
            profilePhoto: true,
          },
        },
        application: {
          select: {
            id: true,
            applicationCode: true,
            status: true,
            currentStage: true,
            job: {
              select: {
                id: true,
                title: true,
                jobCode: true,
                country: { select: { name: true, code: true, flag: true } },
              },
            },
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    console.error('Error fetching clearance records:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clearance records' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const staffUser = await getCurrentUser();
    if (!staffUser) {
      return NextResponse.json({ success: false, error: 'Staff authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      applicationId,
      applicantId: providedApplicantId,
      clearanceType = 'BMET_EMIGRATION',
      submissionDate,
      approvalDate,
      smartCardNumber,
      certificateNumber,
      status = 'NOT_STARTED',
      remarks,
    } = body;

    if (!applicationId) {
      return NextResponse.json({ success: false, error: 'Application ID is required' }, { status: 400 });
    }

    let applicantId = providedApplicantId;
    if (!applicantId) {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        select: { applicantId: true },
      });
      if (!application) {
        return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
      }
      applicantId = application.applicantId;
    }

    const record = await prisma.clearanceRecord.upsert({
      where: { applicationId },
      create: {
        applicationId,
        applicantId,
        clearanceType,
        submissionDate: submissionDate ? new Date(submissionDate) : null,
        approvalDate: approvalDate ? new Date(approvalDate) : null,
        smartCardNumber,
        certificateNumber,
        status,
        reviewedById: staffUser.id,
        remarks,
      },
      update: {
        clearanceType,
        submissionDate: submissionDate ? new Date(submissionDate) : null,
        approvalDate: approvalDate ? new Date(approvalDate) : null,
        smartCardNumber: smartCardNumber !== undefined ? smartCardNumber : undefined,
        certificateNumber: certificateNumber !== undefined ? certificateNumber : undefined,
        status,
        reviewedById: staffUser.id,
        remarks: remarks !== undefined ? remarks : undefined,
      },
      include: {
        applicant: { select: { fullName: true, applicantNumber: true } },
        application: { select: { applicationCode: true } },
      },
    });

    await createAuditLog({
      action: 'CLEARANCE_RECORD_SAVED',
      entity: 'ClearanceRecord',
      entityId: record.id,
      metadata: {
        applicationId,
        applicantId,
        status,
        clearanceType,
        smartCardNumber,
      },
      userId: staffUser.id,
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    console.error('Error saving clearance record:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save clearance record' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const staffUser = await getCurrentUser();
    if (!staffUser) {
      return NextResponse.json({ success: false, error: 'Staff authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Clearance Record ID is required' }, { status: 400 });
    }

    const dataToUpdate: any = {
      reviewedById: staffUser.id,
    };

    if (updates.clearanceType !== undefined) dataToUpdate.clearanceType = updates.clearanceType;
    if (updates.submissionDate !== undefined) {
      dataToUpdate.submissionDate = updates.submissionDate ? new Date(updates.submissionDate) : null;
    }
    if (updates.approvalDate !== undefined) {
      dataToUpdate.approvalDate = updates.approvalDate ? new Date(updates.approvalDate) : null;
    }
    if (updates.smartCardNumber !== undefined) dataToUpdate.smartCardNumber = updates.smartCardNumber;
    if (updates.certificateNumber !== undefined) dataToUpdate.certificateNumber = updates.certificateNumber;
    if (updates.status !== undefined) dataToUpdate.status = updates.status;
    if (updates.remarks !== undefined) dataToUpdate.remarks = updates.remarks;

    const record = await prisma.clearanceRecord.update({
      where: { id },
      data: dataToUpdate,
      include: {
        applicant: { select: { fullName: true, applicantNumber: true } },
        application: { select: { applicationCode: true } },
      },
    });

    await createAuditLog({
      action: 'CLEARANCE_RECORD_UPDATED',
      entity: 'ClearanceRecord',
      entityId: record.id,
      metadata: { updates, status: record.status },
      userId: staffUser.id,
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    console.error('Error updating clearance record:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update clearance record' },
      { status: 500 }
    );
  }
}
