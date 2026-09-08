import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const startTime = Date.now();
  try {
    // 1. Verify database connectivity
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - startTime;

    // 2. Memory usage stats
    const memUsage = process.memoryUsage();

    return NextResponse.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        latencyMs: dbLatencyMs,
      },
      system: {
        uptime: process.uptime(),
        memoryHeapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
        memoryRssMB: Math.round(memUsage.rss / 1024 / 1024),
        nodeVersion: process.version,
      },
    });
  } catch (error: any) {
    const totalLatency = Date.now() - startTime;
    console.error('Readiness health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          status: 'disconnected',
          latencyMs: totalLatency,
          error:
            process.env.NODE_ENV === 'production'
              ? 'Database connection unavailable'
              : error.message || 'Database query failed',
        },
      },
      { status: 503 }
    );
  }
}
