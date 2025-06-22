import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/prisma'
import { getSystemHealth } from '@/lib/error-handler'
import { logger, LogCategory } from '@/lib/logger'
import { validateProductionEnvironment } from '@/lib/security'
import { HealthDiagnostics } from '@/lib/health-diagnostics'

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

// In-memory metrics store (replace with Redis/InfluxDB in production)
const metrics = {
  requestCount: 0,
  errorCount: 0,
  totalResponseTime: 0,
  lastReset: Date.now()
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    logger.info('Health check requested', {
      ip: req.headers.get('x-forwarded-for') || req.ip || 'unknown',
      userAgent: req.headers.get('user-agent')
    }, LogCategory.SYSTEM)

    // Use enhanced health diagnostics for detailed reporting
    const healthReport = await HealthDiagnostics.performFullHealthCheck()
    
    // Also perform legacy checks for backward compatibility
    const [
      dbHealth,
      envValidation,
      systemHealth
    ] = await Promise.allSettled([
      checkDatabaseHealth(),
      Promise.resolve(validateProductionEnvironment()),
      Promise.resolve(getSystemHealth())
    ])

    // Database health check
    const databaseCheck: HealthCheckDetail = dbHealth.status === 'fulfilled' && dbHealth.value.healthy
      ? {
          status: 'healthy',
          message: 'Database connection is healthy',
          latency: dbHealth.value.latency
        }
      : {
          status: 'unhealthy',
          message: dbHealth.status === 'fulfilled' 
            ? dbHealth.value.error || 'Database connection failed'
            : 'Database health check failed',
          details: dbHealth.status === 'rejected' ? { error: dbHealth.reason } : undefined
        }

    // Environment validation check
    const environmentCheck: HealthCheckDetail = envValidation.status === 'fulfilled' && envValidation.value.ready
      ? {
          status: 'healthy',
          message: 'Environment configuration is valid'
        }
      : {
          status: envValidation.status === 'fulfilled' ? 'degraded' : 'unhealthy',
          message: envValidation.status === 'fulfilled' 
            ? `Environment issues: ${envValidation.value.issues.join(', ')}`
            : 'Environment validation failed',
          details: envValidation.status === 'fulfilled' ? { issues: envValidation.value.issues } : undefined
        }

    // Memory usage check
    const memoryUsage = process.memoryUsage()
    const memoryUsedMB = memoryUsage.heapUsed / 1024 / 1024
    const memoryLimitMB = memoryUsage.heapTotal / 1024 / 1024
    const memoryUsagePercent = (memoryUsedMB / memoryLimitMB) * 100

    // Adjust memory thresholds based on environment - more lenient for development
    const isProduction = process.env.NODE_ENV === 'production'
    const unhealthyThreshold = isProduction ? 90 : 99  // 99% for dev, 90% for prod
    const degradedThreshold = isProduction ? 70 : 95   // 95% for dev, 70% for prod

    const memoryCheck: HealthCheckDetail = {
      status: memoryUsagePercent > unhealthyThreshold ? 'unhealthy' : memoryUsagePercent > degradedThreshold ? 'degraded' : 'healthy',
      message: `Memory usage: ${memoryUsedMB.toFixed(2)}MB (${memoryUsagePercent.toFixed(1)}%)`,
      details: {
        used: `${memoryUsedMB.toFixed(2)}MB`,
        total: `${memoryLimitMB.toFixed(2)}MB`,
        percentage: `${memoryUsagePercent.toFixed(1)}%`
      }
    }

    // Disk space check (simplified for containerized environments)
    const diskCheck: HealthCheckDetail = {
      status: 'healthy',
      message: 'Disk space monitoring not implemented in container environment'
    }

    // Services check (circuit breakers)
    const servicesHealth = systemHealth.status === 'fulfilled' ? systemHealth.value : { status: 'unhealthy', services: {}, features: {} }
    const servicesCheck: HealthCheckDetail = {
      status: servicesHealth.status,
      message: `Services status: ${servicesHealth.status}`,
      details: servicesHealth.services
    }

    // Calculate CPU usage (simplified)
    const cpuUsage = process.cpuUsage()
    const cpuUsagePercent = (cpuUsage.user + cpuUsage.system) / 1000000 // Convert to seconds

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

    // Check external APIs if configured
    if (process.env.ANTHROPIC_API_KEY) {
      dependencies.anthropic = {
        status: 'healthy',
        message: 'Anthropic API configured'
      }
    } else {
      dependencies.anthropic = {
        status: 'degraded',
        message: 'Anthropic API not configured'
      }
    }

    if (process.env.STRIPE_SECRET_KEY) {
      dependencies.stripe = {
        status: 'healthy',
        message: 'Stripe configured'
      }
    } else {
      dependencies.stripe = {
        status: 'degraded',
        message: 'Stripe not configured'
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

    // Enhanced health check with detailed diagnostics
    const enhancedHealthCheck = {
      // Legacy format for backward compatibility
      status: healthReport.overall_status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor(process.uptime()),
      checks: {
        database: databaseCheck,
        environment: environmentCheck,
        memory: memoryCheck,
        disk: diskCheck,
        services: servicesCheck
      },
      metrics: {
        memoryUsage,
        cpuUsage: cpuUsagePercent,
        responseTime,
        requestCount: metrics.requestCount,
        errorRate
      },
      dependencies,
      
      // Enhanced diagnostics
      diagnostics: {
        overall_message: healthReport.overall_message,
        priority_issues: healthReport.priority_issues,
        all_components: healthReport.all_diagnostics,
        summary: healthReport.summary,
        recommendations: healthReport.recommendations,
        estimated_fix_time: healthReport.estimated_fix_time
      }
    }

    // Log health check result with enhanced information
    if (healthReport.overall_status === 'unhealthy') {
      logger.error('System health check failed', undefined, {
        status: healthReport.overall_status,
        message: healthReport.overall_message,
        priority_issues: healthReport.priority_issues.length,
        unhealthy_components: healthReport.summary.unhealthy_count,
        estimated_fix_time: healthReport.estimated_fix_time
      }, LogCategory.SYSTEM)
    } else if (healthReport.overall_status === 'degraded') {
      logger.warn('System health degraded', {
        status: healthReport.overall_status,
        message: healthReport.overall_message,
        degraded_components: healthReport.summary.degraded_count,
        priority_issues: healthReport.priority_issues.length
      }, LogCategory.SYSTEM)
    }

    // Return appropriate status code
    const statusCode = healthReport.overall_status === 'healthy' ? 200 : healthReport.overall_status === 'degraded' ? 200 : 503

    return NextResponse.json(enhancedHealthCheck, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Health-Status': healthReport.overall_status,
        'X-Priority-Issues': healthReport.priority_issues.length.toString()
      }
    })

  } catch (error) {
    logger.error('Health check endpoint error', error as Error, {
      endpoint: '/api/system/health'
    })

    metrics.errorCount++

    const errorHealthCheck: HealthCheck = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor(process.uptime()),
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
        errorRate: (metrics.errorCount / metrics.requestCount) * 100
      },
      dependencies: {}
    }

    return NextResponse.json(errorHealthCheck, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}

// Liveness probe (simple check for Kubernetes)
export async function HEAD(): Promise<NextResponse> {
  try {
    // Very basic liveness check
    const dbHealth = await checkDatabaseHealth()
    
    if (dbHealth.healthy) {
      return new NextResponse(null, { status: 200 })
    } else {
      return new NextResponse(null, { status: 503 })
    }
  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
} 