import { NextRequest, NextResponse } from 'next/server'
import { validateAdminRequest } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { logger, LogCategory } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await validateAdminRequest(req)
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 })
    }

    const startTime = Date.now()

    // System metrics collection
    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
        },
        cpu: {
          loadAverage: process.platform !== 'win32' ? process.loadavg() : [0, 0, 0],
          platform: process.platform,
          arch: process.arch,
          nodeVersion: process.version
        }
      },
      database: {
        connected: false,
        connectionTime: 0,
        activeConnections: 0,
        totalQueries: 0
      },
      application: {
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        port: process.env.PORT || 3000
      },
      circuitBreakers: {
        database: 'closed',
        external: 'closed',
        email: 'closed'
      },
      performance: {
        responseTime: 0
      }
    }

    // Test database connection and get metrics
    try {
      const dbStart = Date.now()
      
      // Test connection with a simple query
      await prisma.$queryRaw`SELECT 1`
      
      metrics.database.connected = true
      metrics.database.connectionTime = Date.now() - dbStart

      // Get basic database statistics (simplified for stability)
      try {
        const userCount = await prisma.user.count()
        metrics.database.totalQueries = 1
        
        // Add basic application metrics
        metrics.application = {
          ...metrics.application,
          users: {
            total: userCount,
            active: Math.floor(userCount * 0.7) // Estimate active users
          },
          support: {
            totalTickets: 0, // Will be populated by support endpoint
            openTickets: 0
          },
          content: {
            totalItems: 0, // Will be populated by content endpoint
            recentItems: 0
          }
        }
      } catch (error) {
        logger.warn('Failed to get detailed database metrics', error as Error, LogCategory.DATABASE)
        // Provide fallback metrics
        metrics.application = {
          ...metrics.application,
          users: { total: 0, active: 0 },
          support: { totalTickets: 0, openTickets: 0 },
          content: { totalItems: 0, recentItems: 0 }
        }
      }

    } catch (error) {
      logger.error('Database connection failed in metrics', error as Error, LogCategory.DATABASE)
      metrics.database.connected = false
    }

    // Calculate response time
    metrics.performance.responseTime = Date.now() - startTime

    // Log metrics collection
    logger.info('System metrics collected', {
      responseTime: metrics.performance.responseTime,
      memoryUsed: metrics.system.memory.used,
      dbConnected: metrics.database.connected
    }, LogCategory.SYSTEM)

    return NextResponse.json({
      success: true,
      metrics,
      collectedAt: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Failed to collect system metrics', error as Error, LogCategory.SYSTEM)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to collect metrics',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 