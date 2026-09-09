import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    service: 'SHAKIL GLOBAL MANPOWER ERP',
    environment: process.env.NODE_ENV || 'development',
  });
}
