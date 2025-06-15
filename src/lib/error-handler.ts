import { NextResponse } from 'next/server'
import { logger, LogCategory } from './logger'

// Error types for categorization
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  DATABASE = 'DATABASE',
  EXTERNAL_API = 'EXTERNAL_API',
  RATE_LIMIT = 'RATE_LIMIT',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  SYSTEM = 'SYSTEM',
  NETWORK = 'NETWORK'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Custom error class
export class AppError extends Error {
  public readonly type: ErrorType
  public readonly severity: ErrorSeverity
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: Record<string, any>
  public readonly timestamp: string

  constructor(
    message: string,
    type: ErrorType = ErrorType.SYSTEM,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.severity = severity
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context
    this.timestamp = new Date().toISOString()

    Error.captureStackTrace(this, this.constructor)
  }
}

// Circuit breaker implementation
class CircuitBreaker {
  private failures = 0
  private lastFailureTime?: number
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN'
      } else {
        throw new AppError(
          'Service temporarily unavailable',
          ErrorType.SYSTEM,
          ErrorSeverity.HIGH,
          503
        )
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failures = 0
    this.state = 'CLOSED'
  }

  private onFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN'
      logger.warn(`Circuit breaker opened after ${this.failures} failures`, {
        failures: this.failures,
        threshold: this.failureThreshold
      }, LogCategory.SYSTEM)
    }
  }

  private shouldAttemptReset(): boolean {
    return (
      this.lastFailureTime !== undefined &&
      Date.now() - this.lastFailureTime >= this.recoveryTimeout
    )
  }

  getState(): string {
    return this.state
  }
}

// Global circuit breakers for different services
const circuitBreakers = {
  database: new CircuitBreaker(3, 30000), // 3 failures, 30s recovery
  externalApi: new CircuitBreaker(5, 60000), // 5 failures, 1m recovery
  email: new CircuitBreaker(3, 60000), // 3 failures, 1m recovery
}

// Retry configuration
interface RetryConfig {
  maxAttempts: number
  delay: number
  backoffMultiplier: number
  maxDelay: number
}

// Retry with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {
    maxAttempts: 3,
    delay: 1000,
    backoffMultiplier: 2,
    maxDelay: 10000
  }
): Promise<T> {
  let lastError: Error
  let currentDelay = config.delay

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === config.maxAttempts) {
        logger.error(`Operation failed after ${config.maxAttempts} attempts`, lastError, {
          attempts: config.maxAttempts,
          finalError: lastError.message
        })
        break
      }

      // Don't retry certain types of errors
      if (error instanceof AppError) {
        if (
          error.type === ErrorType.AUTHENTICATION ||
          error.type === ErrorType.AUTHORIZATION ||
          error.type === ErrorType.VALIDATION
        ) {
          throw error
        }
      }

      logger.warn(`Operation failed, retrying in ${currentDelay}ms (attempt ${attempt}/${config.maxAttempts})`, {
        error: lastError.message,
        attempt,
        delay: currentDelay
      })

      await new Promise(resolve => setTimeout(resolve, currentDelay))
      currentDelay = Math.min(currentDelay * config.backoffMultiplier, config.maxDelay)
    }
  }

  throw lastError!
}

// Database operations with circuit breaker
export async function withDatabaseCircuitBreaker<T>(
  operation: () => Promise<T>
): Promise<T> {
  return circuitBreakers.database.execute(operation)
}

// External API operations with circuit breaker
export async function withExternalApiCircuitBreaker<T>(
  operation: () => Promise<T>
): Promise<T> {
  return circuitBreakers.externalApi.execute(operation)
}

// Email operations with circuit breaker
export async function withEmailCircuitBreaker<T>(
  operation: () => Promise<T>
): Promise<T> {
  return circuitBreakers.email.execute(operation)
}

// Error response formatter
export function formatErrorResponse(error: unknown, requestId?: string): NextResponse {
  let statusCode = 500
  let message = 'Internal server error'
  let type = ErrorType.SYSTEM
  let details: any = undefined

  if (error instanceof AppError) {
    statusCode = error.statusCode
    message = error.message
    type = error.type
    
    // Include context in development
    if (process.env.NODE_ENV === 'development') {
      details = error.context
    }

    // Log based on severity
    switch (error.severity) {
      case ErrorSeverity.LOW:
        logger.info(`App error: ${message}`, error, { requestId })
        break
      case ErrorSeverity.MEDIUM:
        logger.warn(`App error: ${message}`, error, { requestId })
        break
      case ErrorSeverity.HIGH:
        logger.error(`App error: ${message}`, error, { requestId })
        break
      case ErrorSeverity.CRITICAL:
        logger.critical(`Critical app error: ${message}`, error, { requestId })
        break
    }
  } else if (error instanceof Error) {
    logger.error(`Unhandled error: ${error.message}`, error, { requestId })
    
    // Map common error types
    if (error.name === 'ValidationError') {
      statusCode = 400
      type = ErrorType.VALIDATION
      message = 'Validation failed'
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
      statusCode = 503
      type = ErrorType.NETWORK
      message = 'Service temporarily unavailable'
    } else if (error.message.includes('Unauthorized') || error.message.includes('Authentication')) {
      statusCode = 401
      type = ErrorType.AUTHENTICATION
      message = 'Authentication required'
    }
  } else {
    logger.error(`Unknown error type`, undefined, { error, requestId })
  }

  const response = {
    error: {
      message,
      type,
      statusCode,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
      ...(details && { details })
    }
  }

  return NextResponse.json(response, { status: statusCode })
}

// Global error handler
export function handleError(error: unknown, context?: string, metadata?: Record<string, any>): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    logger.error(
      `${context ? `${context}: ` : ''}${error.message}`,
      error,
      metadata
    )

    return new AppError(
      error.message,
      ErrorType.SYSTEM,
      ErrorSeverity.MEDIUM,
      500,
      true,
      metadata
    )
  }

  const unknownError = new AppError(
    'An unknown error occurred',
    ErrorType.SYSTEM,
    ErrorSeverity.HIGH,
    500,
    false,
    { originalError: error, ...metadata }
  )

  logger.critical('Unknown error type encountered', undefined, {
    originalError: error,
    context,
    ...metadata
  })

  return unknownError
}

// Graceful degradation helpers
export class FeatureFlag {
  private static flags: Map<string, boolean> = new Map()

  static set(feature: string, enabled: boolean): void {
    this.flags.set(feature, enabled)
    logger.info(`Feature flag updated: ${feature} = ${enabled}`, {
      feature,
      enabled
    }, LogCategory.SYSTEM)
  }

  static isEnabled(feature: string, defaultValue: boolean = false): boolean {
    return this.flags.get(feature) ?? defaultValue
  }

  static disable(feature: string): void {
    this.set(feature, false)
  }

  static enable(feature: string): void {
    this.set(feature, true)
  }

  static getAll(): Record<string, boolean> {
    return Object.fromEntries(this.flags)
  }
}

// Health check for circuit breakers
export function getSystemHealth(): {
  status: 'healthy' | 'degraded' | 'unhealthy'
  services: Record<string, { status: string; uptime: string }>
  features: Record<string, boolean>
} {
  const services = {
    database: { 
      status: circuitBreakers.database.getState().toLowerCase(),
      uptime: process.uptime() > 0 ? `${Math.floor(process.uptime())}s` : '0s'
    },
    externalApi: { 
      status: circuitBreakers.externalApi.getState().toLowerCase(),
      uptime: process.uptime() > 0 ? `${Math.floor(process.uptime())}s` : '0s'
    },
    email: { 
      status: circuitBreakers.email.getState().toLowerCase(),
      uptime: process.uptime() > 0 ? `${Math.floor(process.uptime())}s` : '0s'
    }
  }

  const openCircuits = Object.values(services).filter(s => s.status === 'open').length
  
  let status: 'healthy' | 'degraded' | 'unhealthy'
  if (openCircuits === 0) {
    status = 'healthy'
  } else if (openCircuits < Object.keys(services).length) {
    status = 'degraded'
  } else {
    status = 'unhealthy'
  }

  return {
    status,
    services,
    features: FeatureFlag.getAll()
  }
}

// Common error factory functions
export const Errors = {
  validation: (message: string, context?: Record<string, any>) =>
    new AppError(message, ErrorType.VALIDATION, ErrorSeverity.LOW, 400, true, context),
  
  authentication: (message: string = 'Authentication required') =>
    new AppError(message, ErrorType.AUTHENTICATION, ErrorSeverity.MEDIUM, 401),
  
  authorization: (message: string = 'Insufficient permissions') =>
    new AppError(message, ErrorType.AUTHORIZATION, ErrorSeverity.MEDIUM, 403),
  
  notFound: (resource: string) =>
    new AppError(`${resource} not found`, ErrorType.BUSINESS_LOGIC, ErrorSeverity.LOW, 404),
  
  rateLimit: (message: string = 'Rate limit exceeded') =>
    new AppError(message, ErrorType.RATE_LIMIT, ErrorSeverity.MEDIUM, 429),
  
  database: (message: string, context?: Record<string, any>) =>
    new AppError(message, ErrorType.DATABASE, ErrorSeverity.HIGH, 500, true, context),
  
  externalApi: (message: string, context?: Record<string, any>) =>
    new AppError(message, ErrorType.EXTERNAL_API, ErrorSeverity.MEDIUM, 502, true, context),
  
  system: (message: string, context?: Record<string, any>) =>
    new AppError(message, ErrorType.SYSTEM, ErrorSeverity.HIGH, 500, true, context)
} 