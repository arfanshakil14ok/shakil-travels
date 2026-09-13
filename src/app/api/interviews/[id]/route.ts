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
    if (body.outcome || body.result || body.scorecard || body.score !== undefined || body.feedback) {
      const outcome = body.result || body.outcome;
      const normalizedResult = outcome === 'PASSED' ? 'PASS' : outcome === 'FAILED' ? 'FAIL' : outcome || 'PENDING';

      // Compute average score from scorecard if provided
      let calculatedScore = body.score !== undefined ? body.score : existing.score;
      if (body.scorecard && typeof body.scorecard === 'object') {
        const scores = Object.values(body.scorecard).filter((v) => typeof v === 'number') as number[];
        if (scores.length > 0) {
          calculatedScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10);
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.interview.update({
          where: { id },
          data: {
            score: calculatedScore,
            scorecard: body.scorecard !== undefined ? body.scorecard : existing.scorecard,
            candidateNotes: body.candidateNotes !== undefined ? body.candidateNotes : existing.candidateNotes,
            feedback: body.feedback || existing.feedback,
            notes: body.notes !== undefined ? body.notes : existing.notes,
            result: normalizedResult,
            status: normalizedResult === 'NO_SHOW' || normalizedResult === 'DID_NOT_ATTEND' ? 'NO_SHOW' : 'COMPLETED',
          },
        });

        // If application linked, update interviewedAt and application status
        if (existing.applicationId) {
          const app = await tx.application.findUnique({
            where: { id: existing.applicationId },
          });

          if (app && app.status !== 'SELECTED' && app.status !== 'REJECTED' && app.status !== 'WITHDRAWN') {
            const newStage = normalizedResult === 'PASS' ? 'INTERVIEWED' : 'INTERVIEWED';
            await tx.application.update({
              where: { id: app.id },
              data: {
                currentStage: newStage,
                status: newStage,
                interviewedAt: new Date(),
              },
            });

            await tx.applicationStatusHistory.create({
              data: {
                applicationId: app.id,
                fromStage: app.status,
                toStage: newStage,
                fromStatus: app.status,
                toStatus: newStage,
                changedById: currentUser.id,
                changedByRole: (currentUser as any).role?.name || 'STAFF',
                notes: `Interview evaluated: result = ${normalizedResult}, score = ${calculatedScore || 'N/A'}/100. Feedback: ${body.feedback || 'None'}`,
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
          result: normalizedResult,
          score: calculatedScore,
          applicant: existing.applicant?.fullName,
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
        candidateNotes: body.candidateNotes !== undefined ? body.candidateNotes : existing.candidateNotes,
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
