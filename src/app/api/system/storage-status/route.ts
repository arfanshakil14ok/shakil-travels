import { NextResponse } from 'next/server';
import { isS3Configured, storage } from '@/lib/storage';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const configured = isS3Configured();
    const bucket = process.env.STORAGE_BUCKET || null;
    const endpoint = process.env.STORAGE_ENDPOINT || null;
    const region = process.env.STORAGE_REGION || 'auto';
    const provider = process.env.STORAGE_PROVIDER || 'LOCAL';
    const hasKey = !!process.env.STORAGE_ACCESS_KEY;
    const hasSecret = !!process.env.STORAGE_SECRET_KEY;

    let r2Connectivity = 'UNTESTED';
    let r2Error: string | null = null;

    if (configured) {
      try {
        const testKey = 'system-health-check.txt';
        const exists = await storage.fileExists(testKey);
        r2Connectivity = 'CONNECTED_OK';
      } catch (err: any) {
        r2Connectivity = 'FAILED';
        r2Error = err.message || 'Unknown S3 error';
      }
    }

    const [documentCount, applicantCount] = await Promise.all([
      prisma.document.count(),
      prisma.applicant.count(),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      storage: {
        isS3Configured: configured,
        activeProvider: provider,
        bucketName: bucket,
        endpointHost: endpoint ? new URL(endpoint).host : null,
        region,
        hasAccessKey: hasKey,
        hasSecretKey: hasSecret,
        r2Connectivity,
        r2Error,
      },
      counts: {
        documents: documentCount,
        applicants: applicantCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to inspect storage' },
      { status: 500 }
    );
  }
}
