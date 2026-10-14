import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';
import { calculateMatch } from '@/lib/matching';
import { storage } from '@/lib/storage';
import { parseBase64Photo } from '@/lib/validations/photo';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const applicant = await requireApplicantAuth();
    const { id: jobId } = await params;

    // 1. Fetch job with country and employer
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        country: {
          select: { id: true, name: true, code: true, flag: true, slug: true },
        },
        jobCategory: {
          select: { id: true, name: true, slug: true },
        },
        employer: {
          select: { id: true, companyName: true, verificationStatus: true },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job position not found' }, { status: 404 });
    }

    // 2. Fetch full applicant with profile and documents
    const fullApplicant = await prisma.applicant.findUnique({
      where: { id: applicant.id },
      include: {
        profile: true,
        candidateEducation: true,
        candidateExperience: true,
        documents: {
          include: {
            documentType: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    if (!fullApplicant) {
      return NextResponse.json({ success: false, error: 'Applicant record not found' }, { status: 404 });
    }

    // 3. Check for existing application for this job
    const existingApplication = await prisma.application.findFirst({
      where: {
        applicantId: applicant.id,
        jobId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        documents: true,
      },
    });

    // 4. Calculate total submitted applications count (excluding drafts, rejected, cancelled, withdrawn)
    const activeSubmittedCount = await prisma.application.count({
      where: {
        applicantId: applicant.id,
        status: { notIn: ['DRAFT', 'REJECTED', 'WITHDRAWN', 'CANCELLED'] },
      },
    });

    const isExistingSubmitted =
      existingApplication &&
      !['DRAFT', 'REJECTED', 'WITHDRAWN', 'CANCELLED'].includes(existingApplication.status);

    const draftSnapshot = existingApplication?.eligibilitySnapshot as any;

    return NextResponse.json({
      success: true,
      data: {
        job: {
          ...job,
          salaryMin: job.salaryMin ? Number(job.salaryMin) : null,
          salaryMax: job.salaryMax ? Number(job.salaryMax) : null,
        },
        applicant: fullApplicant,
        quota: {
          currentCount: activeSubmittedCount,
          maxLimit: 3,
          isLimitReached: activeSubmittedCount >= 3,
        },
        existingApplication: existingApplication
          ? {
              id: existingApplication.id,
              applicationCode: existingApplication.applicationCode,
              status: existingApplication.status,
              isSubmitted: isExistingSubmitted,
              draftStep: draftSnapshot?.currentStep || 1,
              draftAnswers: draftSnapshot?.eligibilityAnswers || {},
              completedSteps: draftSnapshot?.completedSteps || [],
            }
          : null,
      },
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Wizard draft GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load wizard data' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const applicant = await requireApplicantAuth();
    const { id: jobId } = await params;

    const body = await request.json();
    const {
      currentStep,
      completedSteps,
      profileData,
      eligibilityAnswers,
      documentIds,
    } = body;

    // 1. Verify Job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    // 2. Persist profile updates if profileData is supplied
    if (profileData) {
      const applicantUpdate: any = {};
      if (profileData.fullName !== undefined) applicantUpdate.fullName = profileData.fullName;
      if (profileData.phone !== undefined) applicantUpdate.phone = profileData.phone;
      if (profileData.email !== undefined) applicantUpdate.email = profileData.email;
      if (profileData.gender !== undefined) applicantUpdate.gender = profileData.gender;
      if (profileData.dateOfBirth) {
        applicantUpdate.dateOfBirth = new Date(profileData.dateOfBirth);
      }
      if (profileData.district !== undefined) applicantUpdate.district = profileData.district;
      if (profileData.upazila !== undefined) applicantUpdate.upazila = profileData.upazila;
      if (profileData.address !== undefined) applicantUpdate.address = profileData.address;
      if (profileData.passportAvailable !== undefined) {
        applicantUpdate.passportAvailable = Boolean(profileData.passportAvailable);
      }
      if (profileData.passportNumber !== undefined) {
        applicantUpdate.passportNumber = profileData.passportNumber;
      }
      if (profileData.passportExpiry) {
        applicantUpdate.passportExpiry = new Date(profileData.passportExpiry);
      }
      if (profileData.education !== undefined) applicantUpdate.education = profileData.education;
      if (profileData.profession !== undefined) applicantUpdate.profession = profileData.profession;
      if (profileData.yearsOfExperience !== undefined) {
        applicantUpdate.yearsOfExperience = Number(profileData.yearsOfExperience) || 0;
      }
      if (profileData.skills !== undefined) applicantUpdate.skills = profileData.skills;
      if (profileData.languages !== undefined) applicantUpdate.languages = profileData.languages;
      if (profileData.profilePhoto && typeof profileData.profilePhoto === 'string' && profileData.profilePhoto.trim().length > 0) {
        if (profileData.profilePhoto.startsWith('data:')) {
          try {
            const parsed = parseBase64Photo(profileData.profilePhoto);
            if (parsed) {
              const ext = parsed.mimeType === 'image/png' ? '.png' : parsed.mimeType === 'image/webp' ? '.webp' : '.jpg';
              const r2Key = `photos/applicant_${applicant.id}${ext}`;
              const r2JpgKey = `photos/applicant_${applicant.id}.jpg`;
              
              await storage.saveFile(r2Key, parsed.buffer, {
                originalName: `applicant_${applicant.id}${ext}`,
                mimeType: parsed.mimeType,
                size: parsed.buffer.length,
                uploadedAt: new Date(),
                applicantId: applicant.id,
                documentType: 'PROFILE_PHOTO',
              });

              if (r2Key !== r2JpgKey) {
                await storage.saveFile(r2JpgKey, parsed.buffer, {
                  originalName: `applicant_${applicant.id}.jpg`,
                  mimeType: parsed.mimeType,
                  size: parsed.buffer.length,
                  uploadedAt: new Date(),
                  applicantId: applicant.id,
                  documentType: 'PROFILE_PHOTO',
                });
              }

              // Also backup to local disk
              try {
                const publicUploadsDir = path.resolve(process.cwd(), 'public/uploads/photos');
                if (!fs.existsSync(publicUploadsDir)) {
                  fs.mkdirSync(publicUploadsDir, { recursive: true });
                }
                await fs.promises.writeFile(path.join(publicUploadsDir, `applicant_${applicant.id}.jpg`), parsed.buffer);
              } catch (fsErr) {}

              // Backup in documents table
              try {
                const photoDocType = await prisma.documentType.findFirst({ where: { code: 'PHOTO' } });
                if (photoDocType) {
                  const existingDoc = await prisma.document.findFirst({
                    where: { applicantId: applicant.id, documentTypeId: photoDocType.id },
                  });
                  if (existingDoc) {
                    await prisma.document.update({
                      where: { id: existingDoc.id },
                      data: { filePath: r2Key, fileSize: parsed.buffer.length, mimeType: parsed.mimeType, status: 'VERIFIED' },
                    });
                  } else {
                    await prisma.document.create({
                      data: {
                        applicantId: applicant.id,
                        documentTypeId: photoDocType.id,
                        fileName: `profile_photo_${applicant.id}${ext}`,
                        filePath: r2Key,
                        fileSize: parsed.buffer.length,
                        mimeType: parsed.mimeType,
                        status: 'VERIFIED',
                      },
                    });
                  }
                }
              } catch (docErr) {}

              applicantUpdate.profilePhoto = `/api/portal/photo/${applicant.id}`;
            }
          } catch (storageErr) {
            console.warn('Storage save failed in wizard draft:', storageErr);
            applicantUpdate.profilePhoto = profileData.profilePhoto;
          }
        } else {
          applicantUpdate.profilePhoto = profileData.profilePhoto;
        }
      }

      await prisma.applicant.update({
        where: { id: applicant.id },
        data: applicantUpdate,
      });

      // Update ApplicantProfile table as well
      await prisma.applicantProfile.upsert({
        where: { applicantId: applicant.id },
        update: {
          emergencyContact: profileData.emergencyContact || undefined,
          permanentAddress: profileData.permanentAddress || undefined,
          currentAddress: profileData.address || undefined,
          education: profileData.education || undefined,
          experienceYears: Number(profileData.yearsOfExperience) || 0,
          skills: profileData.skills || undefined,
        },
        create: {
          applicantId: applicant.id,
          emergencyContact: profileData.emergencyContact || null,
          permanentAddress: profileData.permanentAddress || null,
          currentAddress: profileData.address || null,
          education: profileData.education || null,
          experienceYears: Number(profileData.yearsOfExperience) || 0,
          skills: profileData.skills || null,
        },
      });
    }

    // 3. Upsert draft application state
    const existingDraft = await prisma.application.findFirst({
      where: {
        applicantId: applicant.id,
        jobId,
        status: 'DRAFT',
      },
    });

    const snapshotPayload = {
      currentStep: currentStep || 1,
      completedSteps: completedSteps || [],
      eligibilityAnswers: eligibilityAnswers || {},
      lastSavedAt: new Date().toISOString(),
    };

    let draftApp;
    if (existingDraft) {
      draftApp = await prisma.application.update({
        where: { id: existingDraft.id },
        data: {
          eligibilitySnapshot: snapshotPayload,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new draft with pseudo-code
      const draftCode = `DRAFT-${Date.now().toString().slice(-6)}`;
      draftApp = await prisma.application.create({
        data: {
          applicationCode: draftCode,
          applicationNumber: draftCode,
          applicantId: applicant.id,
          jobId,
          employerId: job.employerId || null,
          countryId: job.countryId || null,
          currentStage: 'DRAFT',
          status: 'DRAFT',
          source: 'WIZARD_DRAFT',
          priority: 'LOW',
          eligibilitySnapshot: snapshotPayload,
        },
      });
    }

    // 4. Link documents if specified
    if (Array.isArray(documentIds) && documentIds.length > 0 && draftApp) {
      await prisma.document.updateMany({
        where: {
          id: { in: documentIds },
          applicantId: applicant.id,
        },
        data: {
          applicationId: draftApp.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        draftId: draftApp.id,
        currentStep: snapshotPayload.currentStep,
        completedSteps: snapshotPayload.completedSteps,
        lastSavedAt: snapshotPayload.lastSavedAt,
      },
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Wizard draft POST error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to save draft progress' }, { status: 500 });
  }
}
