import { NextRequest, NextResponse } from 'next/server'
import { validateAdminRequest } from '@/lib/admin-auth'
import { withPrisma } from '@/lib/prisma-dynamic'

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Verify admin authentication
    const authResult = await validateAdminRequest(req)
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 })
    }

    const status = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      services: {
        database: { status: 'unknown', latency: 0, error: null },
        authentication: { status: 'healthy', latency: 0 },
        middleware: { status: 'healthy', latency: 0 },
        logging: { status: 'healthy', latency: 0 }
      },
      system: {
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
        },
        environment: process.env.NODE_ENV,
        nodeVersion: process.version
      },
      endpoints: {
        working: [],
        failing: [],
        total: 0
      }
    }

    // Test database connection
    try {
      const dbStart = Date.now()
      await withPrisma(async (prisma) => {
        await prisma.$queryRaw`SELECT 1`
      });
      status.services.database.status = 'healthy'
      status.services.database.latency = Date.now() - dbStart
    } catch (error) {
      status.services.database.status = 'unhealthy'
      status.services.database.error = error instanceof Error ? error.message : 'Unknown error'
      status.overall = 'degraded'
    }

    // Test basic database operations
    let dbOperations = {
      userCount: 0,
      ticketCount: 0,
      contentCount: 0
    }

    try {
      const userCount = await withPrisma(async (prisma) => {
        return await prisma.user.count()
      });
      dbOperations.userCount = userCount
      status.endpoints.working.push('user-count')
    } catch (error) {
      status.endpoints.failing.push('user-count')
    }

    try {
      const ticketCount = await withPrisma(async (prisma) => {
        return await prisma.supportTicket.count()
      });
      dbOperations.ticketCount = ticketCount
      status.endpoints.working.push('ticket-count')
    } catch (error) {
      status.endpoints.failing.push('ticket-count')
    }

    // Determine overall health
    if (status.endpoints.failing.length > 0) {
      status.overall = 'degraded'
    }

    if (status.services.database.status === 'unhealthy') {
      status.overall = 'unhealthy'
    }

    status.endpoints.total = status.endpoints.working.length + status.endpoints.failing.length

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      status,
      dbOperations,
      responseTime,
      recommendations: status.overall !== 'healthy' ? [
        'Check database connection',
        'Review system logs',
        'Monitor memory usage'
      ] : []
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'System status check failed',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime
    }, { status: 500 })
  }
} 