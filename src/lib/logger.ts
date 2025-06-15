import { NextRequest } from 'next/server'

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

// Log categories for structured logging
export enum LogCategory {
  SECURITY = 'SECURITY',
  DATABASE = 'DATABASE',
  API = 'API',
  AUTH = 'AUTH',
  PAYMENT = 'PAYMENT',
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  PERFORMANCE = 'PERFORMANCE',
  AUDIT = 'AUDIT',
  ERROR = 'ERROR'
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  category: LogCategory
  message: string
  metadata?: Record<string, any>
  userId?: string
  sessionId?: string
  requestId?: string
  ip?: string
  userAgent?: string
  stack?: string
  duration?: number
}

class EnterpriseLogger {
  private minLevel: LogLevel
  private logStore: LogEntry[] = []
  private maxLogSize: number = 10000 // Keep last 10k logs in memory

  constructor() {
    this.minLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel
  }

  private formatLog(entry: LogEntry): string {
    const levelName = LogLevel[entry.level]
    const timestamp = new Date(entry.timestamp).toISOString()
    
    let logLine = `[${timestamp}] [${levelName}] [${entry.category}] ${entry.message}`
    
    if (entry.userId) logLine += ` | User: ${entry.userId}`
    if (entry.ip) logLine += ` | IP: ${entry.ip}`
    if (entry.requestId) logLine += ` | Request: ${entry.requestId}`
    if (entry.duration) logLine += ` | Duration: ${entry.duration}ms`
    
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      logLine += ` | Metadata: ${JSON.stringify(entry.metadata)}`
    }
    
    if (entry.stack && entry.level >= LogLevel.ERROR) {
      logLine += `\nStack: ${entry.stack}`
    }

    return logLine
  }

  private storeLog(entry: LogEntry): void {
    // Store in memory for admin dashboard
    this.logStore.push(entry)
    
    // Keep only recent logs
    if (this.logStore.length > this.maxLogSize) {
      this.logStore = this.logStore.slice(-this.maxLogSize)
    }
  }

  private log(level: LogLevel, category: LogCategory, message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      metadata,
      requestId: this.generateRequestId()
    }

    // Add stack trace for errors
    if (level >= LogLevel.ERROR) {
      entry.stack = new Error().stack
    }

    this.storeLog(entry)
    
    // Console output with colors
    const formattedLog = this.formatLog(entry)
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug('\x1b[36m%s\x1b[0m', formattedLog) // Cyan
        break
      case LogLevel.INFO:
        console.info('\x1b[32m%s\x1b[0m', formattedLog) // Green
        break
      case LogLevel.WARN:
        console.warn('\x1b[33m%s\x1b[0m', formattedLog) // Yellow
        break
      case LogLevel.ERROR:
        console.error('\x1b[31m%s\x1b[0m', formattedLog) // Red
        break
      case LogLevel.CRITICAL:
        console.error('\x1b[41m%s\x1b[0m', formattedLog) // Red background
        break
    }

    // In production, send to external logging service
    if (process.env.NODE_ENV === 'production' && level >= LogLevel.WARN) {
      this.sendToExternalLogger(entry)
    }
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15)
  }

  private async sendToExternalLogger(entry: LogEntry): Promise<void> {
    // In production, implement integration with:
    // - DataDog
    // - New Relic
    // - Sentry
    // - CloudWatch
    // - or other logging services
    
    try {
      // Example: Send to external service
      // await fetch('https://your-logging-service.com/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // })
    } catch (error) {
      console.error('Failed to send log to external service:', error)
    }
  }

  // Public logging methods
  debug(message: string, metadata?: Record<string, any>, category: LogCategory = LogCategory.SYSTEM): void {
    this.log(LogLevel.DEBUG, category, message, metadata)
  }

  info(message: string, metadata?: Record<string, any>, category: LogCategory = LogCategory.SYSTEM): void {
    this.log(LogLevel.INFO, category, message, metadata)
  }

  warn(message: string, metadata?: Record<string, any>, category: LogCategory = LogCategory.SYSTEM): void {
    this.log(LogLevel.WARN, category, message, metadata)
  }

  error(message: string, error?: Error, metadata?: Record<string, any>, category: LogCategory = LogCategory.ERROR): void {
    const logMetadata = {
      ...metadata,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })
    }
    this.log(LogLevel.ERROR, category, message, logMetadata)
  }

  critical(message: string, error?: Error, metadata?: Record<string, any>, category: LogCategory = LogCategory.ERROR): void {
    const logMetadata = {
      ...metadata,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })
    }
    this.log(LogLevel.CRITICAL, category, message, logMetadata)
  }

  // Specialized logging methods
  security(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, LogCategory.SECURITY, message, metadata)
  }

  audit(action: string, userId: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, LogCategory.AUDIT, `Audit: ${action}`, {
      ...metadata,
      userId,
      action
    })
  }

  performance(operation: string, duration: number, metadata?: Record<string, any>): void {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.INFO
    this.log(level, LogCategory.PERFORMANCE, `Performance: ${operation}`, {
      ...metadata,
      duration,
      operation
    })
  }

  // Request logging
  logRequest(req: NextRequest, startTime: number, statusCode: number, metadata?: Record<string, any>): void {
    const duration = Date.now() - startTime
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO
    
    this.log(level, LogCategory.API, `${req.method} ${req.nextUrl.pathname}`, {
      ...metadata,
      method: req.method,
      url: req.nextUrl.pathname,
      statusCode,
      duration,
      userAgent: req.headers.get('user-agent'),
      ip: this.getClientIP(req)
    })
  }

  private getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for')
    const realIP = req.headers.get('x-real-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    return realIP || req.ip || 'unknown'
  }

  // Get logs for admin dashboard
  getLogs(filters?: {
    level?: LogLevel
    category?: LogCategory
    startTime?: string
    endTime?: string
    limit?: number
  }): LogEntry[] {
    let logs = [...this.logStore]

    if (filters) {
      if (filters.level !== undefined) {
        logs = logs.filter(log => log.level >= filters.level!)
      }
      
      if (filters.category) {
        logs = logs.filter(log => log.category === filters.category)
      }
      
      if (filters.startTime) {
        logs = logs.filter(log => log.timestamp >= filters.startTime!)
      }
      
      if (filters.endTime) {
        logs = logs.filter(log => log.timestamp <= filters.endTime!)
      }
      
      if (filters.limit) {
        logs = logs.slice(-filters.limit)
      }
    }

    return logs.reverse() // Most recent first
  }

  // Get log statistics
  getLogStats(): {
    total: number
    byLevel: Record<string, number>
    byCategory: Record<string, number>
    errors: number
    warnings: number
  } {
    const stats = {
      total: this.logStore.length,
      byLevel: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      errors: 0,
      warnings: 0
    }

    this.logStore.forEach(log => {
      const levelName = LogLevel[log.level]
      stats.byLevel[levelName] = (stats.byLevel[levelName] || 0) + 1
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1
      
      if (log.level >= LogLevel.ERROR) stats.errors++
      if (log.level === LogLevel.WARN) stats.warnings++
    })

    return stats
  }
}

// Singleton logger instance
export const logger = new EnterpriseLogger()

// Performance monitoring decorator
export function withPerformanceLogging<T extends (...args: any[]) => any>(
  fn: T,
  operationName: string
): T {
  return ((...args: any[]) => {
    const startTime = Date.now()
    const result = fn(...args)
    
    if (result instanceof Promise) {
      return result.finally(() => {
        logger.performance(operationName, Date.now() - startTime)
      })
    } else {
      logger.performance(operationName, Date.now() - startTime)
      return result
    }
  }) as T
}

// Error tracking utilities
export function trackError(error: Error, context?: string, metadata?: Record<string, any>): void {
  logger.error(
    `${context ? `${context}: ` : ''}${error.message}`,
    error,
    metadata,
    LogCategory.ERROR
  )
}

export function trackSecurityEvent(event: string, metadata?: Record<string, any>): void {
  logger.security(event, metadata)
}

export function trackAuditEvent(action: string, userId: string, metadata?: Record<string, any>): void {
  logger.audit(action, userId, metadata)
} 