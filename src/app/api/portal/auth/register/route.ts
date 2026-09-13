import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import prisma from '@/lib/prisma';
import { generateApplicantNumber } from '@/lib/id-generator';
import {
  hashApplicantPassword,
  createPortalToken,
  setPortalCookie,
  attachPortalCookie,
  calculateProfileCompletion,
} from '@/lib/portal-auth';
import { createAuditLog } from '@/lib/audit';
import { validateProfilePhoto, parseBase64Photo } from '@/lib/validations/photo';
import { storage } from '@/lib/storage';
import { z } from 'zod';

const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().trim().min(6, 'Valid phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().optional(),
  passwordConfirmation: z.string().optional(),
  email: z.string().trim().email('Valid email is required').optional().or(z.literal('')),
  candidateType: z.enum(['SKILLED', 'UNSKILLED']).default('SKILLED'),
  profilePhoto: z.string().min(1, 'Profile Photo is required.'),
  district: z.string().optional().nullable(),
  preferredCountryId: z.string().optional().nullable(),
  preferredJobCategoryId: z.string().optional().nullable(),
  agreeTerms: z.boolean().optional(),
}).refine(
  (data) => {
    const confirmation = data.confirmPassword || data.passwordConfirmation;
    return !confirmation || data.password === confirmation;
  },
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: issue?.message || 'Profile Photo is required.',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Strict profile photo validation
    const parsedPhoto = parseBase64Photo(data.profilePhoto);
    if (!parsedPhoto) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid profile photo data format. Please upload a valid image file.',
        },
        { status: 400 }
      );
    }

    const photoValidation = validateProfilePhoto(parsedPhoto.buffer, 'profile_photo.jpg', parsedPhoto.mimeType);
    if (!photoValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: photoValidation.error || 'Profile photo validation failed.',
        },
        { status: 400 }
      );
    }

    const phone = data.phone;
    const email = data.email ? data.email.toLowerCase() : null;

    // Check if an applicant already exists with this phone or email
    const existingApplicant = await prisma.applicant.findFirst({
      where: {
        OR: [
          { phone },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (existingApplicant && existingApplicant.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'An account with this phone or email already exists. Please log in.',
          errorBn: 'এই ফোন নম্বর অথবা ইমেইল দিয়ে আগেই অ্যাকাউন্ট তৈরি করা হয়েছে। অনুগ্রহ করে সাইন ইন করুন।',
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashApplicantPassword(data.password);

    // Save photo file to disk / storage
    const ext = photoValidation.extension || '.jpg';
    const tempFileName = `reg_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`;
    
    // Save to public uploads
    const publicUploadsDir = path.resolve(process.cwd(), 'public/uploads/photos');
    if (!fs.existsSync(publicUploadsDir)) {
      fs.mkdirSync(publicUploadsDir, { recursive: true });
    }
    await fs.promises.writeFile(path.join(publicUploadsDir, tempFileName), parsedPhoto.buffer);
    const photoUrl = `/uploads/photos/${tempFileName}`;

    // Transactional creation of Applicant, Profile, and Customer
    const applicant = await prisma.$transaction(async (tx) => {
      let candidate;

      if (existingApplicant) {
        // Applicant was entered previously by staff/inquiry, now initializing portal access
        candidate = await tx.applicant.update({
          where: { id: existingApplicant.id },
          data: {
            fullName: data.fullName,
            passwordHash,
            isActive: true,
            email,
            profilePhoto: photoUrl,
            candidateType: data.candidateType || existingApplicant.candidateType || 'SKILLED',
            district: data.district || existingApplicant.district,
            preferredCountryId: data.preferredCountryId || existingApplicant.preferredCountryId,
            preferredJobCategoryId: data.preferredJobCategoryId || existingApplicant.preferredJobCategoryId,
          },
        });
      } else {
        // New candidate registration
        const applicantNumber = await generateApplicantNumber(tx as any);
        candidate = await tx.applicant.create({
          data: {
            applicantNumber,
            fullName: data.fullName,
            phone,
            email,
            passwordHash,
            profilePhoto: photoUrl,
            candidateType: data.candidateType || 'SKILLED',
            isActive: true,
            source: 'PORTAL_REGISTRATION',
            status: 'NEW',
            district: data.district || null,
            preferredCountryId: data.preferredCountryId || null,
            preferredJobCategoryId: data.preferredJobCategoryId || null,
          },
        });
      }

      // Initialize or link ApplicantProfile
      await tx.applicantProfile.upsert({
        where: { applicantId: candidate.id },
        create: {
          applicantId: candidate.id,
          skills: null,
          experienceYears: 0,
          education: null,
          notes: 'Auto-initialized during portal registration with mandatory profile photo',
        },
        update: {},
      });

      // Ensure Customer record exists for accounting and invoice reconciliation
      await tx.customer.upsert({
        where: { applicantId: candidate.id },
        create: {
          customerType: 'APPLICANT',
          name: candidate.fullName,
          phone: candidate.phone,
          email: candidate.email,
          applicantId: candidate.id,
        },
        update: {
          name: candidate.fullName,
          phone: candidate.phone,
          email: candidate.email,
        },
      });

      // Welcome notification in candidate inbox
      await tx.notification.create({
        data: {
          applicantId: candidate.id,
          type: 'WELCOME',
          title: 'স্বাগতম - শাকিল গ্লোবাল ম্যানপাওয়ার',
          message: `শাকিল গ্লোবাল ম্যানপাওয়ার ক্যান্ডিডেট পোর্টালে আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। আপনার আইডি: ${candidate.applicantNumber}।`,
          link: '/portal/profile',
        },
      });

      return candidate;
    });

    // Also persist in storage
    await storage.saveFile(`photos/applicant_${applicant.id}${ext}`, parsedPhoto.buffer, {
      originalName: 'profile_photo.jpg',
      mimeType: photoValidation.mimeType || 'image/jpeg',
      size: parsedPhoto.buffer.length,
      uploadedAt: new Date(),
      applicantId: applicant.id,
      documentType: 'PROFILE_PHOTO',
    }).catch(() => {});

    // Record registration in unified AuditLog
    await createAuditLog({
      applicantId: applicant.id,
      actorType: 'APPLICANT',
      action: 'APPLICANT_REGISTERED',
      entity: 'APPLICANT',
      entityId: applicant.id,
      description: `Candidate self-registered on portal with mandatory profile photo: ${applicant.fullName} (${applicant.applicantNumber})`,
      newValue: {
        applicantNumber: applicant.applicantNumber,
        phone: applicant.phone,
        email: applicant.email,
        profilePhoto: photoUrl,
        source: 'PORTAL_REGISTRATION',
      },
    });

    // Generate JWT token for session
    const token = await createPortalToken({
      applicantId: applicant.id,
      applicantNumber: applicant.applicantNumber,
      phone: applicant.phone,
      email: applicant.email,
      fullName: applicant.fullName,
    });

    await setPortalCookie(token);

    const completion = calculateProfileCompletion(applicant);

    const response = NextResponse.json(
      {
        success: true,
        message: 'Account registered successfully with profile photo',
        data: {
          applicant: {
            id: applicant.id,
            applicantNumber: applicant.applicantNumber,
            fullName: applicant.fullName,
            phone: applicant.phone,
            email: applicant.email,
            profilePhoto: applicant.profilePhoto,
            profileCompletion: completion.percentage,
          },
        },
      },
      { status: 201 }
    );

    return attachPortalCookie(response, token);
  } catch (error: any) {
    console.error('Portal registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again later.' },
      { status: 500 }
    );
  }
}
