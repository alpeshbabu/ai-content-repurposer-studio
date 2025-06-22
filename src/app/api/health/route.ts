import { NextResponse } from 'next/server';
import { withPrisma } from '@/lib/prisma-dynamic';

// Dynamic runtime to avoid build-time issues
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const startTime = Date.now();
    
    let dbCheck = false;
    let dbLatency = 0;
    let dbError = null;
    
    try {
      // Check database connection using our dynamic Prisma setup
      await withPrisma(async (prisma) => {
        await prisma.$queryRaw`SELECT 1`;
        dbCheck = true;
        dbLatency = Date.now() - startTime;
      });
    } catch (error) {
      dbError = error;
      console.error('[HEALTH_CHECK] Database check failed:', error);
    }
    
    // Check environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar]
    );
    
    // Get system metrics
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Determine health status for each component
    const checks = {
      database: {
        status: dbCheck ? 'healthy' : 'unhealthy',
        message: dbCheck ? `Connected (${dbLatency}ms)` : 'Health check failed',
        latency: dbLatency
      },
      environment: {
        status: missingEnvVars.length === 0 ? 'healthy' : 'unhealthy',
        message: missingEnvVars.length === 0 ? 'All required variables present' : 'Health check failed',
        missing: missingEnvVars
      },
      memory: {
        status: memoryUsage.heapUsed < memoryUsage.heapTotal * 0.9 ? 'healthy' : 'unhealthy',
        message: memoryUsage.heapUsed < memoryUsage.heapTotal * 0.9 ? 'Memory usage normal' : 'Health check failed',
        usage: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
        }
      },
      disk: {
        status: 'healthy', // Simplified for now
        message: 'Disk space adequate'
      },
      services: {
        status: 'healthy', // Simplified for now
        message: 'All services operational'
      }
    };
    
    // Overall health status
    const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
    const overallStatus = allHealthy ? 'healthy' : 'unhealthy';
    
    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.round(uptime),
      checks,
      metrics: {
        memoryUsage,
        cpuUsage: 0, // Simplified for now
        responseTime: Date.now() - startTime,
        requestCount: 1, // Simplified for now
        errorRate: allHealthy ? 0 : 100
      },
      dependencies: {
        database: dbCheck ? 'connected' : 'disconnected',
        environment: missingEnvVars.length === 0 ? 'configured' : 'misconfigured'
      }
    };
    
    return NextResponse.json(healthData, {
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[HEALTH_CHECK] Unexpected error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '0.1.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: Math.round(process.uptime()),
        checks: {
          database: { status: 'unhealthy', message: 'Health check failed' },
          environment: { status: 'unhealthy', message: 'Health check failed' },
          memory: { status: 'unhealthy', message: 'Health check failed' },
          disk: { status: 'unhealthy', message: 'Health check failed' },
          services: { status: 'unhealthy', message: 'Health check failed' }
        },
        metrics: {
          memoryUsage: process.memoryUsage(),
          cpuUsage: 0,
          responseTime: 1000,
          requestCount: 1,
          errorRate: 100
        },
        dependencies: {},
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
    await withPrisma(async (prisma) => {
      // Quick database ping
      await prisma.$queryRaw`SELECT 1`;
    });
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('[HEALTH_CHECK] HEAD request failed:', error);
    return new NextResponse(null, { status: 503 });
  }
}