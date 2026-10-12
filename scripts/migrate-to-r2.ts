import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';
import { storage, getActiveStorage } from '../src/lib/storage';

interface MigrationStats {
  localFilesFound: number;
  localFilesUploaded: number;
  dbDocsProcessed: number;
  dbDocsMigrated: number;
  applicantPhotosProcessed: number;
  applicantPhotosMigrated: number;
  totalBytesUploaded: number;
  errors: string[];
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function parseDataUri(dataUri: string): { buffer: Buffer; mimeType: string } | null {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

function getExtension(mimeType: string, fallbackName?: string): string {
  if (fallbackName && path.extname(fallbackName)) {
    return path.extname(fallbackName);
  }
  switch (mimeType) {
    case 'image/jpeg':
    case 'image/jpg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'application/pdf':
      return '.pdf';
    default:
      return '.bin';
  }
}

async function main() {
  console.log('====================================================');
  console.log('🚀 SHAKILWORK - Cloudflare R2 Complete Migration');
  console.log('====================================================');

  const provider = getActiveStorage();
  console.log(`[Storage] Active Provider: ${provider.constructor.name}`);
  console.log(`[Storage] Bucket: ${process.env.STORAGE_BUCKET}`);
  console.log(`[Storage] Endpoint: ${process.env.STORAGE_ENDPOINT}`);

  if (provider.constructor.name !== 'S3StorageProvider') {
    throw new Error('Active storage provider is not S3StorageProvider! Check .env credentials.');
  }

  const stats: MigrationStats = {
    localFilesFound: 0,
    localFilesUploaded: 0,
    dbDocsProcessed: 0,
    dbDocsMigrated: 0,
    applicantPhotosProcessed: 0,
    applicantPhotosMigrated: 0,
    totalBytesUploaded: 0,
    errors: [],
  };

  // STEP 1: Scan and upload local disk files in uploads/private
  console.log('\n--- STEP 1: Uploading local disk files from uploads/private ---');
  const privateDir = path.resolve(process.cwd(), 'uploads/private');
  const localFiles = getAllFiles(privateDir);
  stats.localFilesFound = localFiles.length;
  console.log(`Found ${localFiles.length} files in ${privateDir}`);

  for (const filePath of localFiles) {
    const relPath = path.relative(privateDir, filePath).replace(/\\/g, '/');
    if (relPath.startsWith('.git') || relPath === '.gitkeep') continue;

    try {
      const exists = await provider.fileExists(relPath);
      if (!exists) {
        const buffer = await fs.promises.readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        let mime = 'application/octet-stream';
        if (ext === '.pdf') mime = 'application/pdf';
        else if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
        else if (ext === '.png') mime = 'image/png';
        else if (ext === '.webp') mime = 'image/webp';

        await provider.saveFile(relPath, buffer, {
          originalName: path.basename(filePath),
          mimeType: mime,
          size: buffer.length,
          uploadedAt: new Date(),
        });
        stats.localFilesUploaded++;
        stats.totalBytesUploaded += buffer.length;
        console.log(`  ✓ Uploaded to R2: ${relPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
      } else {
        console.log(`  - Already in R2: ${relPath}`);
      }
    } catch (err: any) {
      console.error(`  ✗ Error uploading ${relPath}:`, err.message);
      stats.errors.push(`Local file ${relPath}: ${err.message}`);
    }
  }

  // STEP 2: Migrate Documents table
  console.log('\n--- STEP 2: Migrating documents in PostgreSQL ---');
  const documents = await prisma.document.findMany();
  stats.dbDocsProcessed = documents.length;
  console.log(`Found ${documents.length} document records in database.`);

  for (const doc of documents) {
    const rawPath = doc.filePath;
    if (!rawPath) continue;

    // Case 2A: Stored as Base64 Data URI
    if (rawPath.startsWith('data:')) {
      try {
        const parsed = parseDataUri(rawPath);
        if (parsed) {
          const ext = getExtension(parsed.mimeType, doc.fileName);
          const safeName = (doc.fileName || 'document').replace(/[^a-zA-Z0-9._-]/g, '_');
          const r2Key = `documents/${doc.applicantId}/${doc.id.slice(0, 8)}-${safeName}`;

          await provider.saveFile(r2Key, parsed.buffer, {
            originalName: doc.fileName,
            mimeType: parsed.mimeType,
            size: parsed.buffer.length,
            uploadedAt: new Date(),
            applicantId: doc.applicantId,
            documentType: doc.documentTypeId,
          });

          await prisma.document.update({
            where: { id: doc.id },
            data: {
              filePath: r2Key,
              fileSize: parsed.buffer.length,
              mimeType: parsed.mimeType,
            },
          });

          stats.dbDocsMigrated++;
          stats.totalBytesUploaded += parsed.buffer.length;
          console.log(`  ✓ Migrated Base64 doc ${doc.fileName} -> R2 key: ${r2Key} (${(parsed.buffer.length / 1024).toFixed(1)} KB)`);
        }
      } catch (err: any) {
        console.error(`  ✗ Failed migrating doc ${doc.id}:`, err.message);
        stats.errors.push(`Doc ${doc.id}: ${err.message}`);
      }
    } else {
      // Case 2B: Local file path or already R2 key
      // Check if it exists in R2
      try {
        const existsInR2 = await provider.fileExists(rawPath);
        if (existsInR2) {
          console.log(`  - Doc ${doc.fileName} already verified in R2 (${rawPath})`);
        } else {
          // Check local disk candidates
          const candidates = [
            path.resolve(process.cwd(), 'uploads/private', rawPath),
            path.resolve(process.cwd(), rawPath),
            path.resolve(process.cwd(), 'public', rawPath),
          ];
          let foundFile: string | null = null;
          for (const cand of candidates) {
            if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
              foundFile = cand;
              break;
            }
          }

          if (foundFile) {
            const buffer = await fs.promises.readFile(foundFile);
            const r2Key = rawPath.startsWith('uploads/private/')
              ? rawPath.replace('uploads/private/', '')
              : rawPath;

            await provider.saveFile(r2Key, buffer, {
              originalName: doc.fileName,
              mimeType: doc.mimeType || 'application/pdf',
              size: buffer.length,
              uploadedAt: new Date(),
              applicantId: doc.applicantId,
              documentType: doc.documentTypeId,
            });

            await prisma.document.update({
              where: { id: doc.id },
              data: { filePath: r2Key, fileSize: buffer.length },
            });

            stats.dbDocsMigrated++;
            stats.totalBytesUploaded += buffer.length;
            console.log(`  ✓ Uploaded local doc to R2: ${doc.fileName} -> ${r2Key}`);
          } else {
            console.warn(`  ! Could not find local file for doc ${doc.fileName} (Path: ${rawPath})`);
          }
        }
      } catch (err: any) {
        console.error(`  ✗ Error checking doc ${doc.id}:`, err.message);
      }
    }
  }

  // STEP 3: Migrate Applicant Profile Photos
  console.log('\n--- STEP 3: Migrating applicant profile photos in PostgreSQL ---');
  const applicantsWithPhotos = await prisma.applicant.findMany({
    where: { profilePhoto: { not: null } },
    select: { id: true, fullName: true, profilePhoto: true },
  });
  stats.applicantPhotosProcessed = applicantsWithPhotos.length;
  console.log(`Found ${applicantsWithPhotos.length} applicants with photos.`);

  for (const app of applicantsWithPhotos) {
    const photo = app.profilePhoto;
    if (!photo) continue;

    if (photo.startsWith('data:')) {
      try {
        const parsed = parseDataUri(photo);
        if (parsed) {
          const ext = getExtension(parsed.mimeType);
          const r2Key = `photos/applicant_${app.id}${ext}`;

          await provider.saveFile(r2Key, parsed.buffer, {
            originalName: `applicant_${app.id}${ext}`,
            mimeType: parsed.mimeType,
            size: parsed.buffer.length,
            uploadedAt: new Date(),
            applicantId: app.id,
            documentType: 'PROFILE_PHOTO',
          });

          // Also save in public/uploads/photos for local dev fallback
          try {
            const publicPhotoDir = path.resolve(process.cwd(), 'public/uploads/photos');
            if (!fs.existsSync(publicPhotoDir)) fs.mkdirSync(publicPhotoDir, { recursive: true });
            await fs.promises.writeFile(path.join(publicPhotoDir, `applicant_${app.id}${ext}`), parsed.buffer);
          } catch {}

          // Update profilePhoto to stream endpoint /api/portal/photo/${app.id}
          await prisma.applicant.update({
            where: { id: app.id },
            data: { profilePhoto: `/api/portal/photo/${app.id}` },
          });

          stats.applicantPhotosMigrated++;
          stats.totalBytesUploaded += parsed.buffer.length;
          console.log(`  ✓ Migrated Base64 photo for ${app.fullName} -> R2 key: ${r2Key} (${(parsed.buffer.length / 1024).toFixed(1)} KB)`);
        }
      } catch (err: any) {
        console.error(`  ✗ Error migrating photo for ${app.fullName}:`, err.message);
        stats.errors.push(`Photo for ${app.fullName}: ${err.message}`);
      }
    } else if (photo.startsWith('/uploads/photos/') || photo.startsWith('photos/')) {
      // Local disk photo
      const fileName = path.basename(photo);
      const candidates = [
        path.resolve(process.cwd(), 'uploads/private/photos', fileName),
        path.resolve(process.cwd(), 'public', photo.replace(/^\//, '')),
      ];
      let found: string | null = null;
      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          found = cand;
          break;
        }
      }

      if (found) {
        try {
          const buffer = await fs.promises.readFile(found);
          const ext = path.extname(found).toLowerCase();
          const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
          const r2Key = `photos/applicant_${app.id}${ext}`;

          await provider.saveFile(r2Key, buffer, {
            originalName: fileName,
            mimeType: mime,
            size: buffer.length,
            uploadedAt: new Date(),
            applicantId: app.id,
            documentType: 'PROFILE_PHOTO',
          });

          await prisma.applicant.update({
            where: { id: app.id },
            data: { profilePhoto: `/api/portal/photo/${app.id}` },
          });

          stats.applicantPhotosMigrated++;
          stats.totalBytesUploaded += buffer.length;
          console.log(`  ✓ Uploaded local photo to R2 for ${app.fullName} -> ${r2Key}`);
        } catch (err: any) {
          console.error(`  ✗ Failed uploading local photo for ${app.fullName}:`, err.message);
        }
      }
    } else {
      console.log(`  - Photo for ${app.fullName} is already URL/Endpoint: ${photo.slice(0, 40)}`);
    }
  }

  console.log('\n====================================================');
  console.log('🎉 MIGRATION SUMMARY:');
  console.log(`  Local files found: ${stats.localFilesFound}`);
  console.log(`  Local files uploaded to R2: ${stats.localFilesUploaded}`);
  console.log(`  Database documents processed: ${stats.dbDocsProcessed}`);
  console.log(`  Database documents migrated to R2: ${stats.dbDocsMigrated}`);
  console.log(`  Applicant photos processed: ${stats.applicantPhotosProcessed}`);
  console.log(`  Applicant photos migrated to R2: ${stats.applicantPhotosMigrated}`);
  console.log(`  Total data uploaded to Cloudflare R2: ${(stats.totalBytesUploaded / 1024 / 1024).toFixed(2)} MB`);
  if (stats.errors.length > 0) {
    console.log(`  Warnings/Errors (${stats.errors.length}):`);
    stats.errors.forEach((e) => console.log(`    - ${e}`));
  }
  console.log('====================================================\n');
}

main()
  .catch((err) => {
    console.error('Migration aborted with fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
