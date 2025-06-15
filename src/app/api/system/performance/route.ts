import { NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    // Validate admin authentication
    const { isValid, error } = await validateAdminRequest(req);
    if (!isValid) {
      return new NextResponse(error || 'Unauthorized', { status: 401 });
    }

    const startTime = Date.now();

    // Test database performance
    const dbStart = Date.now();
    await prisma.user.count();
    const dbTime = Date.now() - dbStart;

    // Mock system metrics (in a real app, these would come from system monitoring)
    const metrics = {
      cpu: {
        usage: Math.floor(Math.random() * 60) + 10, // 10-70%
        cores: 4,
        loadAverage: [0.5, 0.8, 1.2]
      },
      memory: {
        usage: Math.floor(Math.random() * 70) + 20, // 20-90%
        total: 8192, // MB
        used: Math.floor(Math.random() * 5000) + 2000,
        free: Math.floor(Math.random() * 3000) + 1000
      },
      disk: {
        usage: Math.floor(Math.random() * 50) + 30, // 30-80%
        total: 500000, // MB
        used: Math.floor(Math.random() * 300000) + 150000,
        free: Math.floor(Math.random() * 200000) + 50000
      },
      network: {
        bytesIn: Math.floor(Math.random() * 1000000) + 500000,
        bytesOut: Math.floor(Math.random() * 800000) + 400000,
        packetsIn: Math.floor(Math.random() * 10000) + 5000,
        packetsOut: Math.floor(Math.random() * 8000) + 4000
      },
      database: {
        connectionTime: dbTime,
        activeConnections: Math.floor(Math.random() * 20) + 5,
        maxConnections: 100,
        queryTime: Math.floor(Math.random() * 50) + 10
      },
      uptime: {
        seconds: Math.floor(Math.random() * 604800) + 86400, // 1-7 days
        formatted: `${Math.floor(Math.random() * 7) + 1} days, ${Math.floor(Math.random() * 24)} hours`
      },
      requests: {
        total: Math.floor(Math.random() * 100000) + 50000,
        perSecond: Math.floor(Math.random() * 100) + 20,
        errors: Math.floor(Math.random() * 100) + 10,
        errorRate: ((Math.random() * 2) + 0.5).toFixed(2) + '%'
      }
    };

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      responseTime,
      metrics
    });
  } catch (error) {
    console.error('[PERFORMANCE_METRICS_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 