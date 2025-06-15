// src/middleware.ts
// (Delete all contents or the file itself) 

import { NextRequest, NextResponse } from "next/server"
import { createRateLimit, getSecurityHeaders, validateRequest, getClientIP } from '@/lib/security'
import { logger, LogCategory } from '@/lib/logger'

// Rate limiting configurations for different endpoints (enterprise-friendly)
const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10 // 10 attempts per window (increased for better UX)
})

const apiRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 200 // 200 requests per minute (increased for enterprise load)
})

const adminRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute (shorter window)
  maxRequests: 100 // 100 requests per minute (much more reasonable for admin operations)
})

// Enhanced middleware with security and monitoring
function enhancedMiddleware(req: NextRequest) {
  const startTime = Date.now()
  const ip = getClientIP(req)
  const { pathname } = req.nextUrl

  // Log incoming request
  logger.info(`Incoming request: ${req.method} ${pathname}`, {
    ip,
    userAgent: req.headers.get('user-agent'),
    referer: req.headers.get('referer')
  }, LogCategory.API)

  try {
    // Basic request validation
    const validation = validateRequest(req)
    if (!validation.valid) {
      logger.security(`Request validation failed: ${validation.errors.join(', ')}`, {
        ip,
        pathname,
        errors: validation.errors
      })
      
      const response = NextResponse.json(
        { error: 'Invalid request', details: validation.errors },
        { status: 400 }
      )
      
      // Add security headers
      Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      
      return response
    }

    // Apply rate limiting based on route
    let rateLimitResult
    
    if (pathname.startsWith('/api/auth') || pathname.startsWith('/admin/auth')) {
      rateLimitResult = authRateLimit(req)
      
      if (!rateLimitResult.allowed) {
        logger.security(`Authentication rate limit exceeded`, {
          ip,
          pathname,
          remaining: rateLimitResult.remaining
        })
        
        const response = NextResponse.json(
          { 
            error: 'Too many authentication attempts', 
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
          },
          { status: 429 }
        )
        
        response.headers.set('Retry-After', Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString())
        response.headers.set('X-RateLimit-Limit', '5')
        response.headers.set('X-RateLimit-Remaining', '0')
        response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString())
        
        return response
      }
    } else if (pathname.startsWith('/api/admin')) {
      rateLimitResult = adminRateLimit(req)
      
      if (!rateLimitResult.allowed) {
        logger.security(`Admin API rate limit exceeded`, {
          ip,
          pathname,
          remaining: rateLimitResult.remaining
        })
        
        const response = NextResponse.json(
          { 
            error: 'Too many admin requests', 
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
          },
          { status: 429 }
        )
        
        response.headers.set('Retry-After', Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString())
        return response
      }
    } else if (pathname.startsWith('/api/')) {
      rateLimitResult = apiRateLimit(req)
      
      if (!rateLimitResult.allowed) {
        logger.security(`API rate limit exceeded`, {
          ip,
          pathname,
          remaining: rateLimitResult.remaining
        })
        
        const response = NextResponse.json(
          { 
            error: 'Rate limit exceeded', 
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
          },
          { status: 429 }
        )
        
        response.headers.set('Retry-After', Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString())
        response.headers.set('X-RateLimit-Limit', '100')
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
        response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString())
        
        return response
      }
    }

    // Security headers for all responses
    const response = NextResponse.next()
    
    // Add comprehensive security headers
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Add rate limit headers if rate limiting was applied
    if (rateLimitResult) {
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString())
    }

    // Add request ID for tracking
    const requestId = Math.random().toString(36).substring(2, 15)
    response.headers.set('X-Request-ID', requestId)

    // Log performance
    const duration = Date.now() - startTime
    if (duration > 1000) { // Log slow requests
      logger.warn(`Slow request detected: ${req.method} ${pathname}`, {
        duration,
        ip,
        requestId
      }, LogCategory.PERFORMANCE)
    }

    return response

  } catch (error) {
    logger.error(`Middleware error for ${pathname}`, error as Error, {
      ip,
      pathname,
      method: req.method
    })
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    
    // Add security headers even on error
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    return response
  }
}

// Simplified middleware without NextAuth dependency for better performance
export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Skip middleware for static files and Next.js internals
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon') ||
      pathname.includes('.')) {
    return NextResponse.next()
  }
  
  // Apply enhanced middleware for API routes and protected pages
  return enhancedMiddleware(req)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
} 