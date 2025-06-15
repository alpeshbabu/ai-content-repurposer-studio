import { NextResponse } from 'next/server';

// Dynamic runtime to avoid build-time issues
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Dynamically import Prisma to avoid build-time issues
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    let dbCheck, dbLatency;
    try {
      // Check database connection
      dbCheck = await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - startTime;
    } finally {
      await prisma.$disconnect();
    }
    
    // Check environment variables
    const requiredEnvVars = [
      'NEXTAUTH_SECRET',
      'ANTHROPIC_API_KEY',
      'STRIPE_SECRET_KEY',
    ];
    
    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar]
    );
    
    // Determine health status
    const isHealthy = dbCheck && missingEnvVars.length === 0;
    const status = isHealthy ? 'healthy' : 'unhealthy';
    
    const healthData = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV || 'unknown',
      vercel: {
        env: process.env.VERCEL_ENV || 'unknown',
        region: process.env.VERCEL_REGION || 'unknown',
        url: process.env.VERCEL_URL || 'unknown',
      },
      services: {
        database: {
          status: dbCheck ? 'connected' : 'disconnected',
          latency: `${dbLatency}ms`,
        },
        environment: {
          status: missingEnvVars.length === 0 ? 'configured' : 'missing_variables',
          missing: missingEnvVars,
        },
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    };
    
    return NextResponse.json(healthData, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Also support HEAD requests for simple alive checks
export async function HEAD() {
  try {
    // Dynamically import Prisma to avoid build-time issues
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      // Quick database ping
      await prisma.$queryRaw`SELECT 1`;
      return new NextResponse(null, { status: 200 });
    } finally {
      await prisma.$disconnect();
    }
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}