import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { evaluateInterviewSchema } from '@/lib/validations/interview';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('INTERVIEW_VIEW');
    const { id } = await params;

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        applicant: true,
        application: {
          include: { job: { include: { employer: true, country: true } } },
        },
      },
    });

    if (!interview) {
      return NextResponse.json({ success: false, error: 'Interview not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: interview });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch interview' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('INTERVIEW_EDIT');
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.interview.findUnique({
      where: { id },
      include: { applicant: true, application: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Interview not found' }, { status: 404 });
    }

    // Check if this is an evaluation submission or a rescheduling
    if (body.outcome || body.score !== undefined || body.feedback) {
      const parsed = evaluateInterviewSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const evalData = parsed.data;

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.interview.update({
          where: { id },
          data: {
            score: evalData.score !== undefined ? evalData.score : existing.score,
            feedback: evalData.feedback || existing.feedback,
            result: evalData.outcome,
            status: evalData.outcome === 'DID_NOT_ATTEND' ? 'NO_SHOW' : 'COMPLETED',
          },
        });

        // If application linked and outcome is PASSED, transition application to INTERVIEW_PASSED
        if (existing.applicationId && evalData.outcome === 'PASSED') {
          const app = await tx.application.findUnique({
            where: { id: existing.applicationId },
          });

          if (app && ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW_SCHEDULED'].includes(app.currentStage)) {
            await tx.application.update({
              where: { id: app.id },
              data: { currentStage: 'INTERVIEW_PASSED', status: 'INTERVIEW_PASSED' },
            });

            await tx.applicationStatusHistory.create({
              data: {
                applicationId: app.id,
                fromStage: app.currentStage,
                toStage: 'INTERVIEW_PASSED',
                changedById: currentUser.id,
                notes: `Interview passed with score ${evalData.score || 'N/A'}/100. Feedback: ${evalData.feedback || 'None'}`,
              },
            });
          }
        }

        return updated;
      });

      await createAuditLog({
        userId: currentUser.id,
        action: 'INTERVIEW_EVALUATE',
        entity: 'INTERVIEW',
        entityId: id,
        newValue: {
          outcome: evalData.outcome,
          score: evalData.score,
          applicant: existing.applicant.fullName,
        },
      });

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Interview evaluation recorded successfully',
      });
    }

    // General update/reschedule
    const updated = await prisma.interview.update({
      where: { id },
      data: {
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : (body.scheduledDate ? new Date(body.scheduledDate) : existing.scheduledAt),
        interviewType: body.interviewType || existing.interviewType,
        location: body.location !== undefined ? body.location : existing.location,
        meetingLink: body.meetingLink !== undefined ? body.meetingLink : existing.meetingLink,
        notes: body.notes !== undefined ? body.notes : existing.notes,
        status: body.status || existing.status,
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'INTERVIEW_EDIT',
      entity: 'INTERVIEW',
      entityId: id,
      oldValue: existing,
      newValue: updated,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Interview updated successfully',
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error updating interview:', error);
    return NextResponse.json({ success: false, error: 'Failed to update interview' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requirePermission('INTERVIEW_EDIT');
    const { id } = await params;

    const existing = await prisma.interview.findUnique({
      where: { id },
      include: { applicant: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Interview not found' }, { status: 404 });
    }

    // Mark as CANCELLED instead of hard delete
    const cancelled = await prisma.interview.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'INTERVIEW_CANCEL',
      entity: 'INTERVIEW',
      entityId: id,
      oldValue: { status: existing.status },
      newValue: { status: 'CANCELLED' },
    });

    return NextResponse.json({
      success: true,
      data: cancelled,
      message: 'Interview cancelled successfully',
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Failed to cancel interview' }, { status: 500 });
  }
}
