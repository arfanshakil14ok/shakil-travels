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
    const result = searchParams.get('result');
    const search = searchParams.get('search')?.trim();

    // Check staff auth first
    const staffUser = await getCurrentUser();
    // If not staff, check applicant session
    let candidateApplicant = null;
    if (!staffUser) {
      candidateApplicant = await getCurrentApplicant();
      if (!candidateApplicant) {
        return NextResponse.json({ success: false, error: 'Unauthorized: Please log in' }, { status: 401 });
      }
    }

    const where: any = {};

    if (candidateApplicant) {
      // Candidate can only view their own medical records
      where.applicantId = candidateApplicant.id;
    } else {
      // Staff filters
      if (applicantId && applicantId !== 'ALL') where.applicantId = applicantId;
      if (applicationId && applicationId !== 'ALL') where.applicationId = applicationId;
      if (result && result !== 'ALL') where.result = result;

      if (search) {
        where.OR = [
          { applicant: { fullName: { contains: search, mode: 'insensitive' } } },
          { applicant: { applicantNumber: { contains: search, mode: 'insensitive' } } },
          { application: { applicationCode: { contains: search, mode: 'insensitive' } } },
          { gamcaNumber: { contains: search, mode: 'insensitive' } },
          { medicalCenterName: { contains: search, mode: 'insensitive' } },
        ];
      }
    }

    const records = await prisma.medicalRecord.findMany({
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
    console.error('Error fetching medical records:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch medical records' },
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
      medicalCenterName,
      appointmentDate,
      examinationDate,
      result = 'PENDING',
      reportFilePath,
      reportFileName,
      fitnessExpiryDate,
      gamcaNumber,
      remarks,
    } = body;

    if (!applicationId) {
      return NextResponse.json({ success: false, error: 'Application ID is required' }, { status: 400 });
    }
    if (!medicalCenterName) {
      return NextResponse.json({ success: false, error: 'Medical Center Name is required' }, { status: 400 });
    }

    // Resolve applicant from application if not provided
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

    // Upsert medical record (one record per application)
    const record = await prisma.medicalRecord.upsert({
      where: { applicationId },
      create: {
        applicationId,
        applicantId,
        medicalCenterName,
        appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
        examinationDate: examinationDate ? new Date(examinationDate) : null,
        result,
        reportFilePath,
        reportFileName,
        fitnessExpiryDate: fitnessExpiryDate ? new Date(fitnessExpiryDate) : null,
        gamcaNumber,
        reviewedById: staffUser.id,
        remarks,
      },
      update: {
        medicalCenterName,
        appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
        examinationDate: examinationDate ? new Date(examinationDate) : null,
        result,
        reportFilePath: reportFilePath !== undefined ? reportFilePath : undefined,
        reportFileName: reportFileName !== undefined ? reportFileName : undefined,
        fitnessExpiryDate: fitnessExpiryDate ? new Date(fitnessExpiryDate) : null,
        gamcaNumber: gamcaNumber !== undefined ? gamcaNumber : undefined,
        reviewedById: staffUser.id,
        remarks: remarks !== undefined ? remarks : undefined,
      },
      include: {
        applicant: { select: { fullName: true, applicantNumber: true } },
        application: { select: { applicationCode: true } },
      },
    });

    await createAuditLog({
      action: 'MEDICAL_RECORD_SAVED',
      entity: 'MedicalRecord',
      entityId: record.id,
      metadata: {
        applicationId,
        applicantId,
        result,
        medicalCenterName,
        gamcaNumber,
      },
      userId: staffUser.id,
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    console.error('Error creating/updating medical record:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save medical record' },
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
      return NextResponse.json({ success: false, error: 'Medical Record ID is required' }, { status: 400 });
    }

    const dataToUpdate: any = {
      reviewedById: staffUser.id,
    };

    if (updates.medicalCenterName !== undefined) dataToUpdate.medicalCenterName = updates.medicalCenterName;
    if (updates.appointmentDate !== undefined) {
      dataToUpdate.appointmentDate = updates.appointmentDate ? new Date(updates.appointmentDate) : null;
    }
    if (updates.examinationDate !== undefined) {
      dataToUpdate.examinationDate = updates.examinationDate ? new Date(updates.examinationDate) : null;
    }
    if (updates.result !== undefined) dataToUpdate.result = updates.result;
    if (updates.reportFilePath !== undefined) dataToUpdate.reportFilePath = updates.reportFilePath;
    if (updates.reportFileName !== undefined) dataToUpdate.reportFileName = updates.reportFileName;
    if (updates.fitnessExpiryDate !== undefined) {
      dataToUpdate.fitnessExpiryDate = updates.fitnessExpiryDate ? new Date(updates.fitnessExpiryDate) : null;
    }
    if (updates.gamcaNumber !== undefined) dataToUpdate.gamcaNumber = updates.gamcaNumber;
    if (updates.remarks !== undefined) dataToUpdate.remarks = updates.remarks;

    const record = await prisma.medicalRecord.update({
      where: { id },
      data: dataToUpdate,
      include: {
        applicant: { select: { fullName: true, applicantNumber: true } },
        application: { select: { applicationCode: true } },
      },
    });

    await createAuditLog({
      action: 'MEDICAL_RECORD_UPDATED',
      entity: 'MedicalRecord',
      entityId: record.id,
      metadata: { updates, result: record.result },
      userId: staffUser.id,
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    console.error('Error updating medical record:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update medical record' },
      { status: 500 }
    );
  }
}
