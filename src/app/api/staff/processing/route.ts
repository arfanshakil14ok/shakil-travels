import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { generateProcessingCode } from '@/lib/id-generator';
import { createProcessingCaseSchema } from '@/lib/validations/processing';
import { DEFAULT_REQUIRED_DOCS } from '@/lib/processing/state-machine';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const stage = searchParams.get('stage')?.trim();
    const overallStatus = searchParams.get('overallStatus')?.trim();
    const priority = searchParams.get('priority')?.trim();
    const countryId = searchParams.get('countryId')?.trim();
    const employerId = searchParams.get('employerId')?.trim();
    const assignedOfficerId = searchParams.get('assignedOfficerId')?.trim();
    const queue = searchParams.get('queue')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const where: any = {};

    if (stage && stage !== 'ALL') {
      where.currentStage = stage;
    }

    if (overallStatus && overallStatus !== 'ALL') {
      where.overallStatus = overallStatus;
    }

    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }

    if (countryId && countryId !== 'ALL') {
      where.job = { ...where.job, countryId };
    }

    if (employerId && employerId !== 'ALL') {
      where.employerId = employerId;
    }

    if (assignedOfficerId) {
      if (assignedOfficerId === 'me') {
        where.assignedOfficerId = currentUser.id;
      } else if (assignedOfficerId !== 'ALL') {
        where.assignedOfficerId = assignedOfficerId;
      }
    }

    // Specialized work queues
    if (queue === 'document_officer') {
      where.currentStage = { in: ['DOCUMENT_PROCESSING', 'DOCUMENT_VERIFICATION'] };
    } else if (queue === 'medical') {
      where.currentStage = { in: ['MEDICAL_PENDING', 'MEDICAL_SCHEDULED', 'MEDICAL_COMPLETED'] };
    } else if (queue === 'visa') {
      where.currentStage = { in: ['VISA_PREPARATION', 'VISA_SUBMITTED', 'VISA_PROCESSING'] };
    } else if (queue === 'clearance') {
      where.currentStage = { in: ['CLEARANCE_PENDING', 'CLEARANCE_PROCESSING'] };
    } else if (queue === 'travel') {
      where.currentStage = { in: ['TICKET_PENDING', 'TICKET_ISSUED', 'DEPARTURE_READY'] };
    }

    if (search) {
      where.OR = [
        { processingCode: { contains: search, mode: 'insensitive' } },
        { application: { applicationCode: { contains: search, mode: 'insensitive' } } },
        { applicant: { fullName: { contains: search, mode: 'insensitive' } } },
        { applicant: { applicantNumber: { contains: search, mode: 'insensitive' } } },
        { applicant: { phone: { contains: search } } },
        { applicant: { passportNumber: { contains: search, mode: 'insensitive' } } },
        { job: { title: { contains: search, mode: 'insensitive' } } },
        { employer: { companyName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total, stageCounts, overallStatusCounts] = await Promise.all([
      prisma.recruitmentProcessingCase.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          applicant: {
            select: {
              id: true,
              applicantNumber: true,
              fullName: true,
              phone: true,
              passportNumber: true,
              passportExpiry: true,
              profilePhoto: true,
              skills: true,
            },
          },
          job: {
            select: {
              id: true,
              jobCode: true,
              title: true,
              titleLocal: true,
              country: { select: { id: true, name: true, flag: true, code: true } },
            },
          },
          employer: {
            select: {
              id: true,
              employerCode: true,
              companyName: true,
              verificationStatus: true,
            },
          },
          application: {
            select: {
              id: true,
              applicationCode: true,
              selectedAt: true,
              selectedPosition: true,
            },
          },
          assignedOfficer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          travelTicket: {
            select: {
              id: true,
              airline: true,
              flightNumber: true,
              departureDate: true,
              status: true,
            },
          },
          medicalCase: {
            select: {
              id: true,
              status: true,
              result: true,
              appointmentDate: true,
            },
          },
          visaCase: {
            select: {
              id: true,
              status: true,
              approvedDate: true,
              expiryDate: true,
            },
          },
          clearanceCase: {
            select: {
              id: true,
              status: true,
              smartCardNumber: true,
            },
          },
          documentRequirements: {
            select: {
              id: true,
              required: true,
              status: true,
            },
          },
        },
      }),
      prisma.recruitmentProcessingCase.count({ where }),
      prisma.recruitmentProcessingCase.groupBy({
        by: ['currentStage'],
        _count: { _all: true },
      }),
      prisma.recruitmentProcessingCase.groupBy({
        by: ['overallStatus'],
        _count: { _all: true },
      }),
    ]);

    const pipelineCounts: Record<string, number> = {
      TOTAL: total,
      SELECTED: 0,
      DOCUMENT_PROCESSING: 0,
      DOCUMENT_VERIFICATION: 0,
      MEDICAL_PENDING: 0,
      MEDICAL_SCHEDULED: 0,
      MEDICAL_PASSED: 0,
      MEDICAL_FAILED: 0,
      VISA_PREPARATION: 0,
      VISA_SUBMITTED: 0,
      VISA_PROCESSING: 0,
      VISA_APPROVED: 0,
      VISA_REJECTED: 0,
      CLEARANCE_PENDING: 0,
      CLEARANCE_PROCESSING: 0,
      CLEARANCE_COMPLETED: 0,
      TICKET_PENDING: 0,
      TICKET_ISSUED: 0,
      DEPARTURE_READY: 0,
      DEPARTED: 0,
      JOINED: 0,
      COMPLETED: 0,
      ON_HOLD: 0,
      CANCELLED: 0,
    };

    stageCounts.forEach((sc) => {
      pipelineCounts[sc.currentStage] = sc._count._all;
    });

    overallStatusCounts.forEach((oc) => {
      if (oc.overallStatus === 'ON_HOLD') pipelineCounts.ON_HOLD = oc._count._all;
      if (oc.overallStatus === 'CANCELLED') pipelineCounts.CANCELLED = oc._count._all;
    });

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      pipelineCounts,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching processing cases:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch processing cases' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();

    const parsed = createProcessingCaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { applicationId, assignedOfficerId, priority, expectedDepartureDate, internalNotes } = parsed.data;

    // 1. Fetch and validate application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        applicant: true,
        job: true,
        processingCase: true,
      },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    // Rule 1: Only SELECTED applications can create a processing case
    if (application.status !== 'SELECTED') {
      return NextResponse.json(
        {
          success: false,
          error: `Application must be in SELECTED status before starting post-selection processing. Current status: ${application.status}. / শুধুমাত্র নির্বাচিত (SELECTED) আবেদনের জন্য প্রসেসিং শুরু করা যাবে।`,
        },
        { status: 400 }
      );
    }

    // Rule 2: One selected application cannot have multiple active processing cases
    if (application.processingCase) {
      return NextResponse.json(
        {
          success: false,
          error: `Processing case already exists for this selected application (${application.processingCase.processingCode}). / এই আবেদনের জন্য ইতোমধ্যেই প্রসেসিং কেস বিদ্যমান রয়েছে।`,
          processingCode: application.processingCase.processingCode,
          processingCaseId: application.processingCase.id,
        },
        { status: 409 }
      );
    }

    // Generate sequential year-aware processing code: SGR-PROC-YYYY-XXXXXX
    const processingCode = await generateProcessingCode(prisma);

    // Atomically create processing case + initial documents + initial status history
    const processingCase = await prisma.$transaction(async (tx) => {
      const createdCase = await tx.recruitmentProcessingCase.create({
        data: {
          processingCode,
          applicationId: application.id,
          applicantId: application.applicantId,
          jobId: application.jobId,
          employerId: application.employerId,
          currentStage: 'SELECTED',
          overallStatus: 'ACTIVE',
          assignedOfficerId: assignedOfficerId || currentUser.id,
          priority: priority || 'NORMAL',
          expectedDepartureDate: expectedDepartureDate ? new Date(expectedDepartureDate) : null,
          internalNotes: internalNotes || null,
          statusHistory: {
            create: {
              fromStage: null,
              toStage: 'SELECTED',
              changedById: currentUser.id,
              changedByRole: currentUser.role.name,
              reason: 'Initial case creation',
              notes: 'Recruitment processing case initiated from selected candidate application',
            },
          },
          documentRequirements: {
            create: DEFAULT_REQUIRED_DOCS.map((doc) => ({
              documentType: doc.documentType,
              title: doc.title,
              titleLocal: doc.titleLocal,
              required: doc.required,
              status: 'REQUIRED',
            })),
          },
        },
        include: {
          applicant: true,
          job: true,
          employer: true,
          assignedOfficer: true,
          documentRequirements: true,
          statusHistory: true,
        },
      });

      return createdCase;
    });

    // Audit log
    await createAuditLog({
      actorId: currentUser.id,
      actorType: 'STAFF',
      action: 'CREATE',
      entity: 'RECRUITMENT_PROCESSING_CASE',
      entityId: processingCase.id,
      description: `Started overseas recruitment processing case ${processingCase.processingCode} for ${application.applicant.fullName} (${application.applicationCode || application.id})`,
      metadata: {
        processingCode: processingCase.processingCode,
        applicationId: application.id,
        jobId: application.jobId,
        candidateId: application.applicantId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Processing case ${processingCase.processingCode} created successfully`,
        data: processingCase,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error creating processing case:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create processing case' },
      { status: 500 }
    );
  }
}
