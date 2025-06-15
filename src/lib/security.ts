import { NextRequest, NextResponse } from 'next/server'

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (req: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

// In-memory store for rate limiting (replace with Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting middleware
export function createRateLimit(config: RateLimitConfig) {
  return (req: NextRequest): { allowed: boolean; remaining: number; resetTime: number } => {
    const key = config.keyGenerator ? config.keyGenerator(req) : getClientIP(req)
    const now = Date.now()
    const windowStart = now - config.windowMs

    // Clean up expired entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k)
      }
    }

    const current = rateLimitStore.get(key)
    
    if (!current || current.resetTime < now) {
      // First request or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      })
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs
      }
    }

    if (current.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime
      }
    }

    current.count++
    return {
      allowed: true,
      remaining: config.maxRequests - current.count,
      resetTime: current.resetTime
    }
  }
}

// Get client IP address
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  const cfIP = req.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return cfIP || realIP || req.ip || 'unknown'
}

// Input validation and sanitization
export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
  },

  password: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  },

  username: (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/
    return usernameRegex.test(username)
  },

  sanitizeString: (input: string, maxLength = 1000): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim()
      .substring(0, maxLength)
  }
}

// Security headers
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.stripe.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "form-action 'self'"
    ].join('; ')
  }
}

// JWT security enhancements (Edge Runtime compatible)
export function generateSecureToken(length = 32): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Password hashing utilities (Note: Use bcryptjs in actual implementations)
export async function hashPassword(password: string): Promise<string> {
  // This is a simplified version for Edge Runtime
  // In production, use bcryptjs or similar for actual password hashing
  const encoder = new TextEncoder()
  const data = encoder.encode(password + process.env.PASSWORD_SALT || 'default-salt')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hashedInput = await hashPassword(password)
  return hashedInput === hashedPassword
}

// Session security
export function createSecureSession() {
  return {
    sessionId: generateSecureToken(32),
    csrfToken: generateSecureToken(24),
    createdAt: Date.now(),
    expiresAt: Date.now() + (8 * 60 * 60 * 1000) // 8 hours
  }
}

// Request validation middleware
export function validateRequest(req: NextRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check content length
  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
    errors.push('Request payload too large')
  }

  // Check content type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      errors.push('Invalid content type')
    }
  }

  // Basic header validation
  const userAgent = req.headers.get('user-agent')
  if (!userAgent || userAgent.length < 5) {
    errors.push('Invalid user agent')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// API response wrapper with security headers
export function secureResponse(data: any, status = 200): NextResponse {
  const response = NextResponse.json(data, { status })
  
  // Add security headers
  Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

// Environment validation for production readiness
export function validateProductionEnvironment(): { ready: boolean; issues: string[] } {
  const issues: string[] = []

  // Check critical environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'ADMIN_JWT_SECRET'
  ]

  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      issues.push(`Missing required environment variable: ${envVar}`)
    }
  })

  // Check for development secrets in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.NEXTAUTH_SECRET === 'efd49f82b97ccd991f96f97b9b0de9ff56e8c5eaec24d9d4c8576c395b9b1d1d') {
      issues.push('Using development NEXTAUTH_SECRET in production')
    }
    
    if (process.env.ADMIN_JWT_SECRET === 'admin-secret-key-change-in-production') {
      issues.push('Using development ADMIN_JWT_SECRET in production')
    }
  }

  // Check database URL security
  const dbUrl = process.env.DATABASE_URL
  if (dbUrl && dbUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
    issues.push('Using localhost database in production')
  }

  return {
    ready: issues.length === 0,
    issues
  }
} 