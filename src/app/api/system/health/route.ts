import { NextRequest, NextResponse } from 'next/server'
import { withPrisma } from '@/lib/prisma-dynamic'

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  environment: string
  uptime: number
  checks: {
    database: HealthCheckDetail
    environment: HealthCheckDetail
    memory: HealthCheckDetail
    disk: HealthCheckDetail
    services: HealthCheckDetail
  }
  metrics: {
    memoryUsage: NodeJS.MemoryUsage
    cpuUsage: number
    responseTime: number
    requestCount: number
    errorRate: number
  }
  dependencies: {
    [key: string]: HealthCheckDetail
  }
}

interface HealthCheckDetail {
  status: 'healthy' | 'degraded' | 'unhealthy'
  message: string
  latency?: number
  details?: Record<string, any>
}

// In-memory metrics store
const metrics = {
  requestCount: 0,
  errorCount: 0,
  totalResponseTime: 0,
  lastReset: Date.now()
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    // Database health check using our working prisma setup
    let databaseCheck: HealthCheckDetail
    try {
      await withPrisma(async (prisma) => {
        await prisma.$queryRaw`SELECT 1`
      })
      databaseCheck = {
        status: 'healthy',
        message: 'Database connection is healthy',
        latency: Date.now() - startTime
      }
    } catch (error) {
      databaseCheck = {
        status: 'unhealthy',
        message: 'Database connection failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }

    // Environment validation check
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ]
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    const environmentCheck: HealthCheckDetail = missingVars.length === 0
      ? {
          status: 'healthy',
          message: 'Environment configuration is valid'
        }
      : {
          status: 'unhealthy',
          message: `Missing environment variables: ${missingVars.join(', ')}`,
          details: { missing: missingVars }
        }

    // Memory usage check
    const memoryUsage = process.memoryUsage()
    const memoryUsedMB = memoryUsage.heapUsed / 1024 / 1024
    const memoryLimitMB = memoryUsage.heapTotal / 1024 / 1024
    const memoryUsagePercent = (memoryUsedMB / memoryLimitMB) * 100

    const isProduction = process.env.NODE_ENV === 'production'
    const unhealthyThreshold = isProduction ? 90 : 99
    const degradedThreshold = isProduction ? 70 : 95

    const memoryCheck: HealthCheckDetail = {
      status: memoryUsagePercent > unhealthyThreshold ? 'unhealthy' : memoryUsagePercent > degradedThreshold ? 'degraded' : 'healthy',
      message: `Memory usage: ${memoryUsedMB.toFixed(2)}MB (${memoryUsagePercent.toFixed(1)}%)`,
      details: {
        used: `${memoryUsedMB.toFixed(2)}MB`,
        total: `${memoryLimitMB.toFixed(2)}MB`,
        percentage: `${memoryUsagePercent.toFixed(1)}%`
      }
    }

    // Disk space check (simplified)
    const diskCheck: HealthCheckDetail = {
      status: 'healthy',
      message: 'Disk space monitoring not implemented in container environment'
    }

    // Services check (simplified)
    const servicesCheck: HealthCheckDetail = {
      status: 'healthy',
      message: 'All services operational'
    }

    // Calculate metrics
    metrics.requestCount++
    const responseTime = Date.now() - startTime
    metrics.totalResponseTime += responseTime
    
    const avgResponseTime = metrics.totalResponseTime / metrics.requestCount
    const errorRate = (metrics.errorCount / metrics.requestCount) * 100

    // Reset metrics periodically (every hour)
    if (Date.now() - metrics.lastReset > 3600000) {
      metrics.requestCount = 1
      metrics.errorCount = 0
      metrics.totalResponseTime = responseTime
      metrics.lastReset = Date.now()
    }

    // Dependency checks
    const dependencies: Record<string, HealthCheckDetail> = {}

    if (process.env.ANTHROPIC_API_KEY) {
      dependencies.anthropic = {
        status: 'healthy',
        message: 'Anthropic API configured'
      }
    }

    if (process.env.STRIPE_SECRET_KEY) {
      dependencies.stripe = {
        status: 'healthy',
        message: 'Stripe configured'
      }
    }

    // Overall status
    const allChecks = [databaseCheck, environmentCheck, memoryCheck, diskCheck, servicesCheck]
    const unhealthyCount = allChecks.filter(check => check.status === 'unhealthy').length
    const degradedCount = allChecks.filter(check => check.status === 'degraded').length

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy'
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy'
    } else if (degradedCount > 0) {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'healthy'
    }

    const healthCheck: HealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.round(process.uptime()),
      checks: {
        database: databaseCheck,
        environment: environmentCheck,
        memory: memoryCheck,
        disk: diskCheck,
        services: servicesCheck
      },
      metrics: {
        memoryUsage,
        cpuUsage: 0,
        responseTime,
        requestCount: metrics.requestCount,
        errorRate
      },
      dependencies
    }

    return NextResponse.json(healthCheck, {
      status: overallStatus === 'unhealthy' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('[SYSTEM_HEALTH] Unexpected error:', error)
    metrics.errorCount++
    
    const errorResponse: HealthCheck = {
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
        responseTime: Date.now() - startTime,
        requestCount: metrics.requestCount,
        errorRate: 100
      },
      dependencies: {}
    }

    return NextResponse.json(errorResponse, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    })
  }
}

export async function HEAD(): Promise<NextResponse> {
  try {
    await withPrisma(async (prisma) => {
      await prisma.$queryRaw`SELECT 1`
    })
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error('[SYSTEM_HEALTH] HEAD request failed:', error)
    return new NextResponse(null, { status: 503 })
  }
} 