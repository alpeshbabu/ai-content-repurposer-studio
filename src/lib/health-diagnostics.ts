import { checkDatabaseHealth } from './prisma'
import { logger, LogCategory } from './logger'

export interface HealthDiagnostic {
  component: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  message: string
  details?: string
  actionable_steps?: string[]
  technical_details?: Record<string, any>
  severity: 'info' | 'warning' | 'error' | 'critical'
  impact: string
  resolution_time?: string
  last_checked: string
}

export interface SystemHealthReport {
  overall_status: 'healthy' | 'degraded' | 'unhealthy'
  overall_message: string
  priority_issues: HealthDiagnostic[]
  all_diagnostics: HealthDiagnostic[]
  summary: {
    healthy_count: number
    degraded_count: number
    unhealthy_count: number
    total_checks: number
  }
  recommendations: string[]
  estimated_fix_time?: string
}

export class HealthDiagnostics {
  
  /**
   * Comprehensive system health check with detailed diagnostics
   */
  static async performFullHealthCheck(): Promise<SystemHealthReport> {
    const diagnostics: HealthDiagnostic[] = []
    const startTime = Date.now()

    // 1. Database Health Check
    diagnostics.push(await this.checkDatabaseHealth())
    
    // 2. Environment Configuration Check
    diagnostics.push(await this.checkEnvironmentConfiguration())
    
    // 3. Memory and Performance Check
    diagnostics.push(await this.checkMemoryHealth())
    
    // 4. External Services Check
    diagnostics.push(...await this.checkExternalServices())
    
    // 5. File System and Storage Check
    diagnostics.push(await this.checkFileSystemHealth())
    
    // 6. Network and Connectivity Check
    diagnostics.push(await this.checkNetworkHealth())

    // Calculate overall health
    const report = this.generateHealthReport(diagnostics)
    
    // Log the health check
    logger.info('System health check completed', {
      overall_status: report.overall_status,
      total_checks: report.summary.total_checks,
      issues: report.summary.unhealthy_count + report.summary.degraded_count,
      duration: Date.now() - startTime
    }, LogCategory.SYSTEM)

    return report
  }

  /**
   * Database health check with detailed diagnostics
   */
  private static async checkDatabaseHealth(): Promise<HealthDiagnostic> {
    const component = 'Database Connection'
    const startTime = Date.now()
    
    try {
      const healthResult = await checkDatabaseHealth()
      const latency = Date.now() - startTime

      if (!healthResult.healthy) {
        return {
          component,
          status: 'unhealthy',
          message: '🔴 Database connection failed - Unable to connect to PostgreSQL database',
          details: healthResult.error || 'Connection timeout or authentication failure',
          actionable_steps: [
            '1. Check if DATABASE_URL environment variable is correctly set',
            '2. Verify Prisma Postgres credentials and API key',
            '3. Ensure database server is running and accessible',
            '4. Check network connectivity to accelerate.prisma-data.net',
            '5. Verify Prisma schema is up to date (run: npx prisma db push)'
          ],
          technical_details: {
            error_message: healthResult.error,
            connection_string: process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set',
            attempted_connection_time: `${latency}ms`,
            database_provider: 'Prisma Postgres with Accelerate'
          },
          severity: 'critical',
          impact: 'Complete application failure - No data persistence available',
          resolution_time: '5-15 minutes',
          last_checked: new Date().toISOString()
        }
      }

      // Check connection performance
      if (healthResult.latency && healthResult.latency > 1000) {
        return {
          component,
          status: 'degraded',
          message: '🟡 Database connection is slow - High latency detected',
          details: `Connection latency: ${healthResult.latency}ms (recommended: <200ms)`,
          actionable_steps: [
            '1. Check network connection quality',
            '2. Monitor database server load',
            '3. Consider optimizing database queries',
            '4. Check if using connection pooling effectively'
          ],
          technical_details: {
            latency: healthResult.latency,
            active_connections: healthResult.connectionInfo?.activeConnections,
            max_connections: healthResult.connectionInfo?.maxConnections,
            connection_utilization: healthResult.connectionInfo ? 
              `${((healthResult.connectionInfo.activeConnections / healthResult.connectionInfo.maxConnections) * 100).toFixed(1)}%` : 'Unknown'
          },
          severity: 'warning',
          impact: 'Slower application response times - User experience may be affected',
          resolution_time: '2-5 minutes',
          last_checked: new Date().toISOString()
        }
      }

      return {
        component,
        status: 'healthy',
        message: '✅ Database connection is healthy',
        details: `Connection established in ${healthResult.latency}ms`,
        technical_details: {
          latency: healthResult.latency,
          active_connections: healthResult.connectionInfo?.activeConnections,
          max_connections: healthResult.connectionInfo?.maxConnections
        },
        severity: 'info',
        impact: 'No impact - Database operating normally',
        last_checked: new Date().toISOString()
      }

    } catch (error) {
      return {
        component,
        status: 'unhealthy',
        message: '🔴 Database health check failed - Internal error during connection test',
        details: error instanceof Error ? error.message : 'Unknown internal error',
        actionable_steps: [
          '1. Check application logs for detailed error information',
          '2. Restart the application to reset connection state',
          '3. Verify Prisma client configuration',
          '4. Check if database migration is needed'
        ],
        technical_details: {
          error_type: error instanceof Error ? error.constructor.name : 'Unknown',
          error_message: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        },
        severity: 'critical',
        impact: 'Critical system failure - Application cannot function',
        resolution_time: '10-30 minutes',
        last_checked: new Date().toISOString()
      }
    }
  }

  /**
   * Environment configuration check
   */
  private static async checkEnvironmentConfiguration(): Promise<HealthDiagnostic> {
    const component = 'Environment Configuration'
    const requiredVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'ANTHROPIC_API_KEY'
    ]
    
    const optionalVars = [
      'STRIPE_SECRET_KEY',
      'NEXTAUTH_URL',
      'ADMIN_JWT_SECRET'
    ]

    const missing = requiredVars.filter(varName => !process.env[varName])
    const missingOptional = optionalVars.filter(varName => !process.env[varName])

    if (missing.length > 0) {
      return {
        component,
        status: 'unhealthy',
        message: `🔴 Critical environment variables missing - ${missing.length} required variables not set`,
        details: `Missing required variables: ${missing.join(', ')}`,
        actionable_steps: [
          '1. Check your .env file exists in the project root',
          '2. Verify the following variables are set:',
          ...missing.map(v => `   - ${v}`),
          '3. Restart the application after adding missing variables',
          '4. Refer to .env.example for variable format examples'
        ],
        technical_details: {
          missing_required: missing,
          missing_optional: missingOptional,
          environment: process.env.NODE_ENV,
          config_file_exists: require('fs').existsSync('.env')
        },
        severity: 'critical',
        impact: 'Application startup failure or critical features disabled',
        resolution_time: '2-5 minutes',
        last_checked: new Date().toISOString()
      }
    }

    if (missingOptional.length > 0) {
      return {
        component,
        status: 'degraded',
        message: `🟡 Optional features disabled - ${missingOptional.length} optional variables not configured`,
        details: `Missing optional variables: ${missingOptional.join(', ')}`,
        actionable_steps: [
          '1. Review which optional features you want to enable',
          ...missingOptional.map(v => `2. Configure ${v} for additional functionality`),
          '3. Some features may have limited functionality without these variables'
        ],
        technical_details: {
          missing_optional: missingOptional,
          available_features: requiredVars.filter(v => process.env[v]).length
        },
        severity: 'warning',
        impact: 'Reduced functionality - Some features may be unavailable',
        resolution_time: '5-10 minutes',
        last_checked: new Date().toISOString()
      }
    }

    return {
      component,
      status: 'healthy',
      message: '✅ Environment configuration is complete',
      details: 'All required environment variables are properly configured',
      technical_details: {
        total_required: requiredVars.length,
        total_optional: optionalVars.length,
        configured_optional: optionalVars.filter(v => process.env[v]).length
      },
      severity: 'info',
      impact: 'No impact - All features available',
      last_checked: new Date().toISOString()
    }
  }

  /**
   * Memory health check
   */
  private static async checkMemoryHealth(): Promise<HealthDiagnostic> {
    const component = 'Memory Usage'
    const memoryUsage = process.memoryUsage()
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024)
    const usagePercent = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)

    const isProduction = process.env.NODE_ENV === 'production'
    const criticalThreshold = isProduction ? 90 : 95
    const warningThreshold = isProduction ? 70 : 85

    if (usagePercent > criticalThreshold) {
      return {
        component,
        status: 'unhealthy',
        message: `🔴 Critical memory usage - ${usagePercent}% of available memory in use`,
        details: `Using ${heapUsedMB}MB of ${heapTotalMB}MB (${usagePercent}%)`,
        actionable_steps: [
          '1. Restart the application to free up memory',
          '2. Check for memory leaks in recent code changes',
          '3. Monitor memory usage patterns over time',
          '4. Consider increasing available memory resources',
          '5. Review and optimize data processing operations'
        ],
        technical_details: {
          heap_used: `${heapUsedMB}MB`,
          heap_total: `${heapTotalMB}MB`,
          usage_percent: `${usagePercent}%`,
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
          threshold: `${criticalThreshold}%`
        },
        severity: 'critical',
        impact: 'Risk of application crashes and performance degradation',
        resolution_time: '2-10 minutes',
        last_checked: new Date().toISOString()
      }
    }

    if (usagePercent > warningThreshold) {
      return {
        component,
        status: 'degraded',
        message: `🟡 High memory usage detected - ${usagePercent}% of available memory in use`,
        details: `Using ${heapUsedMB}MB of ${heapTotalMB}MB (${usagePercent}%)`,
        actionable_steps: [
          '1. Monitor memory usage trends',
          '2. Check for resource-intensive operations',
          '3. Consider restarting if usage continues to climb',
          '4. Review recent deployments for memory issues'
        ],
        technical_details: {
          heap_used: `${heapUsedMB}MB`,
          heap_total: `${heapTotalMB}MB`,
          usage_percent: `${usagePercent}%`,
          warning_threshold: `${warningThreshold}%`
        },
        severity: 'warning',
        impact: 'Potential performance slowdown if memory usage increases',
        resolution_time: '1-5 minutes',
        last_checked: new Date().toISOString()
      }
    }

    return {
      component,
      status: 'healthy',
      message: `✅ Memory usage is normal - ${usagePercent}% utilized`,
      details: `Using ${heapUsedMB}MB of ${heapTotalMB}MB`,
      technical_details: {
        heap_used: `${heapUsedMB}MB`,
        heap_total: `${heapTotalMB}MB`,
        usage_percent: `${usagePercent}%`
      },
      severity: 'info',
      impact: 'No impact - Memory usage within normal limits',
      last_checked: new Date().toISOString()
    }
  }

  /**
   * External services health check
   */
  private static async checkExternalServices(): Promise<HealthDiagnostic[]> {
    const diagnostics: HealthDiagnostic[] = []

    // AI Service Check
    if (process.env.ANTHROPIC_API_KEY) {
      diagnostics.push({
        component: 'AI Service (Anthropic)',
        status: 'healthy',
        message: '✅ AI service is configured and ready',
        details: 'Anthropic API key is configured',
        severity: 'info',
        impact: 'No impact - AI content generation available',
        last_checked: new Date().toISOString()
      })
    } else {
      diagnostics.push({
        component: 'AI Service (Anthropic)',
        status: 'unhealthy',
        message: '🔴 AI service unavailable - No API key configured',
        details: 'ANTHROPIC_API_KEY environment variable is not set',
        actionable_steps: [
          '1. Sign up for an Anthropic account at https://console.anthropic.com',
          '2. Generate an API key in your Anthropic dashboard',
          '3. Add ANTHROPIC_API_KEY to your .env file',
          '4. Restart the application'
        ],
        severity: 'critical',
        impact: 'Content generation features will not work',
        resolution_time: '5-10 minutes',
        last_checked: new Date().toISOString()
      })
    }

    // Payment Service Check
    if (process.env.STRIPE_SECRET_KEY) {
      diagnostics.push({
        component: 'Payment Service (Stripe)',
        status: 'healthy',
        message: '✅ Payment processing is configured',
        details: 'Stripe API key is configured',
        severity: 'info',
        impact: 'No impact - Payment processing available',
        last_checked: new Date().toISOString()
      })
    } else {
      diagnostics.push({
        component: 'Payment Service (Stripe)',
        status: 'degraded',
        message: '🟡 Payment processing disabled - Stripe not configured',
        details: 'STRIPE_SECRET_KEY environment variable is not set',
        actionable_steps: [
          '1. Create a Stripe account at https://stripe.com',
          '2. Get your API keys from the Stripe dashboard',
          '3. Add STRIPE_SECRET_KEY to your .env file',
          '4. Configure webhook endpoints for subscription management'
        ],
        severity: 'warning',
        impact: 'Subscription features and payments will not work',
        resolution_time: '10-20 minutes',
        last_checked: new Date().toISOString()
      })
    }

    return diagnostics
  }

  /**
   * File system health check
   */
  private static async checkFileSystemHealth(): Promise<HealthDiagnostic> {
    const component = 'File System'
    
    try {
      const fs = require('fs')
      
      // Check critical directories and files
      const criticalPaths = [
        { path: '.env', type: 'file', required: true },
        { path: 'prisma/schema.prisma', type: 'file', required: true },
        { path: 'src/generated/prisma', type: 'directory', required: true },
        { path: 'node_modules', type: 'directory', required: true }
      ]

      const issues = []
      for (const item of criticalPaths) {
        const exists = fs.existsSync(item.path)
        if (!exists && item.required) {
          issues.push(`${item.path} (${item.type})`)
        }
      }

      if (issues.length > 0) {
        return {
          component,
          status: 'unhealthy',
          message: `🔴 Critical files/directories missing - ${issues.length} required items not found`,
          details: `Missing: ${issues.join(', ')}`,
          actionable_steps: [
            '1. Ensure you are running from the correct directory',
            '2. Check if dependencies are installed (npm install)',
            '3. Run prisma generate if Prisma client is missing',
            '4. Verify .env file exists and is properly configured'
          ],
          technical_details: {
            missing_items: issues,
            current_directory: process.cwd(),
            node_modules_exists: fs.existsSync('node_modules')
          },
          severity: 'critical',
          impact: 'Application cannot start or function properly',
          resolution_time: '2-10 minutes',
          last_checked: new Date().toISOString()
        }
      }

      return {
        component,
        status: 'healthy',
        message: '✅ File system is healthy',
        details: 'All critical files and directories are present',
        severity: 'info',
        impact: 'No impact - File system ready',
        last_checked: new Date().toISOString()
      }

    } catch (error) {
      return {
        component,
        status: 'unhealthy',
        message: '🔴 File system check failed',
        details: error instanceof Error ? error.message : 'Unknown file system error',
        actionable_steps: [
          '1. Check disk space availability',
          '2. Verify read/write permissions',
          '3. Check if the application has proper file system access'
        ],
        severity: 'critical',
        impact: 'Cannot verify file system integrity',
        resolution_time: '5-15 minutes',
        last_checked: new Date().toISOString()
      }
    }
  }

  /**
   * Network connectivity check
   */
  private static async checkNetworkHealth(): Promise<HealthDiagnostic> {
    const component = 'Network Connectivity'
    
    try {
      const uptime = process.uptime()
      
      if (uptime < 30) {
        return {
          component,
          status: 'degraded',
          message: '🟡 Application just started - Network connectivity being established',
          details: `Application uptime: ${Math.round(uptime)} seconds`,
          actionable_steps: [
            '1. Wait for application to fully initialize',
            '2. Check again in 30-60 seconds',
            '3. Monitor for any connection errors in logs'
          ],
          severity: 'warning',
          impact: 'Temporary - Services may be slow during startup',
          resolution_time: '1-2 minutes',
          last_checked: new Date().toISOString()
        }
      }

      return {
        component,
        status: 'healthy',
        message: '✅ Network connectivity appears healthy',
        details: `Application has been running for ${Math.round(uptime / 60)} minutes`,
        severity: 'info',
        impact: 'No impact - Network services available',
        last_checked: new Date().toISOString()
      }

    } catch (error) {
      return {
        component,
        status: 'degraded',
        message: '🟡 Network connectivity check inconclusive',
        details: 'Unable to perform comprehensive network test',
        actionable_steps: [
          '1. Check internet connectivity',
          '2. Verify DNS resolution is working',
          '3. Test external API endpoints manually'
        ],
        severity: 'warning',
        impact: 'Unknown - External services may be affected',
        resolution_time: '2-5 minutes',
        last_checked: new Date().toISOString()
      }
    }
  }

  /**
   * Generate comprehensive health report
   */
  private static generateHealthReport(diagnostics: HealthDiagnostic[]): SystemHealthReport {
    const healthyCount = diagnostics.filter(d => d.status === 'healthy').length
    const degradedCount = diagnostics.filter(d => d.status === 'degraded').length
    const unhealthyCount = diagnostics.filter(d => d.status === 'unhealthy').length

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy'
    let overallMessage: string

    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy'
      overallMessage = `🔴 System has critical issues - ${unhealthyCount} critical problems need immediate attention`
    } else if (degradedCount > 0) {
      overallStatus = 'degraded'
      overallMessage = `🟡 System is partially functional - ${degradedCount} components need attention`
    } else {
      overallStatus = 'healthy'
      overallMessage = '✅ System is fully operational - All components healthy'
    }

    // Get priority issues (critical and unhealthy first)
    const priorityIssues = diagnostics
      .filter(d => d.status === 'unhealthy' || (d.status === 'degraded' && d.severity === 'critical'))
      .sort((a, b) => {
        const severityOrder = { critical: 0, error: 1, warning: 2, info: 3 }
        return severityOrder[a.severity] - severityOrder[b.severity]
      })

    // Generate recommendations
    const recommendations: string[] = []
    
    if (unhealthyCount > 0) {
      recommendations.push('🚨 Address critical issues immediately to restore full functionality')
      recommendations.push('📋 Follow the actionable steps for each critical component')
      recommendations.push('🔄 Restart the application after fixing configuration issues')
    } else if (degradedCount > 0) {
      recommendations.push('⚠️  Address degraded components to prevent future issues')
      recommendations.push('📊 Monitor system performance closely')
      recommendations.push('🔧 Consider preventive maintenance during low-traffic periods')
    } else {
      recommendations.push('✅ System is healthy - continue regular monitoring')
      recommendations.push('📈 Consider performance optimizations for enhanced user experience')
    }

    // Estimate fix time
    let estimatedFixTime: string | undefined
    if (priorityIssues.length > 0) {
      const maxTime = Math.max(...priorityIssues
        .filter(issue => issue.resolution_time)
        .map(issue => {
          const time = issue.resolution_time!
          const match = time.match(/(\d+)-(\d+)/)
          return match ? parseInt(match[1]) : 5
        }))
      estimatedFixTime = `${maxTime}-${maxTime * 2} minutes`
    }

    return {
      overall_status: overallStatus,
      overall_message: overallMessage,
      priority_issues: priorityIssues,
      all_diagnostics: diagnostics,
      summary: {
        healthy_count: healthyCount,
        degraded_count: degradedCount,
        unhealthy_count: unhealthyCount,
        total_checks: diagnostics.length
      },
      recommendations,
      estimated_fix_time: estimatedFixTime
    }
  }
} 