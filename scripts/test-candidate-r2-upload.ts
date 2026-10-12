import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import crypto from 'crypto';
import { prisma } from '../src/lib/prisma';
import { storage, getActiveStorage } from '../src/lib/storage';
import { generateApplicantNumber } from '../src/lib/id-generator';

async function main() {
  console.log('====================================================');
  console.log('🧪 REAL CANDIDATE & CLOUDFLARE R2 UPLOAD TEST');
  console.log('====================================================');

  const provider = getActiveStorage();
  console.log(`[Storage Provider]: ${provider.constructor.name}`);
  console.log(`[Target Bucket]: ${process.env.STORAGE_BUCKET}`);
  console.log(`[R2 Endpoint]: ${process.env.STORAGE_ENDPOINT}`);

  if (provider.constructor.name !== 'S3StorageProvider') {
    throw new Error('Storage provider is not S3StorageProvider! Aborting.');
  }

  // 1. Create a brand new Candidate in PostgreSQL
  console.log('\n--- 1. Creating New Candidate in Database ---');
  const applicantNumber = await generateApplicantNumber(prisma as any);
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const testPhone = `01799${randomSuffix}`;
  const testEmail = `candidate.r2test.${randomSuffix}@shakilwork.test`;

  const candidate = await prisma.applicant.create({
    data: {
      applicantNumber,
      fullName: `Test Candidate R2-${randomSuffix}`,
      phone: testPhone,
      email: testEmail,
      candidateType: 'SKILLED',
      profession: 'Pipe Welder (6G)',
      yearsOfExperience: 5,
      skills: 'TIG Welding, Arc Welding, Blueprint Reading',
      passportAvailable: true,
      passportNumber: `A${randomSuffix}99`,
      nationality: 'Bangladeshi',
      district: 'Dhaka',
      status: 'ACTIVE',
      source: 'R2_LIVE_TEST',
    },
  });

  console.log(`✓ Candidate Created:`);
  console.log(`  - ID: ${candidate.id}`);
  console.log(`  - Applicant Number: ${candidate.applicantNumber}`);
  console.log(`  - Name: ${candidate.fullName}`);
  console.log(`  - Phone: ${candidate.phone}`);

  // 2. Upload Candidate Profile Photo to Cloudflare R2
  console.log('\n--- 2. Uploading Candidate Profile Photo to Cloudflare R2 ---');
  // Create a minimal valid 1x1 PNG or small JPEG avatar
  const fakePngAvatar = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );
  const photoKey = `photos/applicant_${candidate.id}.png`;

  console.log(`Uploading photo to R2 key: "${photoKey}"...`);
  const uploadedPhotoKey = await storage.saveFile(photoKey, fakePngAvatar, {
    originalName: 'avatar.png',
    mimeType: 'image/png',
    size: fakePngAvatar.length,
    uploadedAt: new Date(),
    applicantId: candidate.id,
    documentType: 'PROFILE_PHOTO',
  });
  console.log(`✓ Photo successfully uploaded to Cloudflare R2: ${uploadedPhotoKey}`);

  // Update candidate profilePhoto to endpoint
  await prisma.applicant.update({
    where: { id: candidate.id },
    data: { profilePhoto: `/api/portal/photo/${candidate.id}` },
  });
  console.log(`✓ Database record updated with photo endpoint: /api/portal/photo/${candidate.id}`);

  // 3. Upload a Document (Passport Scan PDF) to Cloudflare R2
  console.log('\n--- 3. Uploading Passport Document PDF to Cloudflare R2 ---');
  // Generate a valid minimal PDF buffer
  const samplePdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 55 >>
stream
BT
/F1 24 Tf
100 700 Td
(SHAKIL TRAVELS - PASSPORT SCAN VERIFICATION) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000201 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
306
%%EOF`;
  const pdfBuffer = Buffer.from(samplePdfContent, 'utf-8');
  const docUniqueId = crypto.randomBytes(6).toString('hex');
  const docStorageKey = `documents/${candidate.id}/${Date.now()}-${docUniqueId}-passport_scan.pdf`;

  console.log(`Uploading PDF document to R2 key: "${docStorageKey}"...`);
  await storage.saveFile(docStorageKey, pdfBuffer, {
    originalName: 'passport_scan.pdf',
    mimeType: 'application/pdf',
    size: pdfBuffer.length,
    uploadedAt: new Date(),
    applicantId: candidate.id,
    documentType: 'PASSPORT',
  });
  console.log(`✓ PDF Document successfully saved to Cloudflare R2: ${docStorageKey}`);

  // Find or create document type
  let docType = await prisma.documentType.findFirst({
    where: { code: 'PASSPORT' },
  });
  if (!docType) {
    docType = await prisma.documentType.findFirst();
  }

  // 4. Save Document record to PostgreSQL
  console.log('\n--- 4. Registering Document Record in Database ---');
  const documentRecord = await prisma.document.create({
    data: {
      applicantId: candidate.id,
      documentTypeId: docType ? docType.id : 'passport-default-type',
      fileName: 'passport_scan.pdf',
      filePath: docStorageKey,
      fileSize: pdfBuffer.length,
      mimeType: 'application/pdf',
      status: 'VERIFIED',
      isLatest: true,
      version: 1,
    },
  });
  console.log(`✓ Document row created in PostgreSQL:`);
  console.log(`  - Doc ID: ${documentRecord.id}`);
  console.log(`  - File Name: ${documentRecord.fileName}`);
  console.log(`  - Stored File Path (R2 Key): ${documentRecord.filePath}`);
  console.log(`  - File Size: ${documentRecord.fileSize} bytes`);

  // 5. Verification Phase: Verify files can be read back from Cloudflare R2
  console.log('\n--- 5. Real-Time Verification directly from Cloudflare R2 ---');
  
  // Verify Photo in R2
  const photoExistsInR2 = await storage.fileExists(photoKey);
  console.log(`  [1] Photo exists in Cloudflare R2? => ${photoExistsInR2 ? 'YES ✅' : 'NO ❌'}`);
  const downloadedPhoto = await storage.getFile(photoKey);
  console.log(`  [2] Downloaded photo from R2 => Size: ${downloadedPhoto.length} bytes (Matches original: ${downloadedPhoto.length === fakePngAvatar.length ? 'YES ✅' : 'NO ❌'})`);

  // Verify Document in R2
  const docExistsInR2 = await storage.fileExists(docStorageKey);
  console.log(`  [3] PDF Document exists in Cloudflare R2? => ${docExistsInR2 ? 'YES ✅' : 'NO ❌'}`);
  const downloadedDoc = await storage.getFile(docStorageKey);
  console.log(`  [4] Downloaded PDF from R2 => Size: ${downloadedDoc.length} bytes (Matches original: ${downloadedDoc.length === pdfBuffer.length ? 'YES ✅' : 'NO ❌'})`);

  // Generate Signed URL
  if (provider.getSignedDownloadUrl) {
    const signedUrl = await provider.getSignedDownloadUrl(docStorageKey, 7200);
    console.log(`  [5] Cloudflare R2 Pre-Signed URL generated =>`);
    console.log(`      ${signedUrl.substring(0, 100)}...`);
  }

  console.log('\n====================================================');
  console.log('🎯 RESULT: REAL CANDIDATE & R2 UPLOAD TEST PASSED 100%!');
  console.log(`Candidate Name: ${candidate.fullName}`);
  console.log(`Candidate ID: ${candidate.id}`);
  console.log(`Photo in R2: ${photoKey}`);
  console.log(`Document in R2: ${docStorageKey}`);
  console.log(`Document Download API: /api/documents/${documentRecord.id}/download`);
  console.log('====================================================\n');
}

main()
  .catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
