import { NextRequest, NextResponse } from "next/server"

// Rate limiting store (simple in-memory for Vercel)
const rateLimit = new Map<string, { count: number; resetTime: number }>()

function createRateLimit(windowMs: number, maxRequests: number) {
  return (req: NextRequest) => {
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
    const key = `${ip}:${req.nextUrl.pathname}`
    const now = Date.now()
    
    const current = rateLimit.get(key)
    
    if (!current || now > current.resetTime) {
      rateLimit.set(key, { count: 1, resetTime: now + windowMs })
      return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs }
    }
    
    if (current.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetTime: current.resetTime }
    }
    
    current.count++
    return { allowed: true, remaining: maxRequests - current.count, resetTime: current.resetTime }
  }
}

// Rate limiting configurations
const authRateLimit = createRateLimit(15 * 60 * 1000, 10) // 10 attempts per 15 minutes
const apiRateLimit = createRateLimit(60 * 1000, 200) // 200 requests per minute
const adminRateLimit = createRateLimit(60 * 1000, 100) // 100 requests per minute

// Security headers
function getSecurityHeaders() {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Skip middleware for static files and Next.js internals
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon') ||
      pathname.includes('.')) {
    return NextResponse.next()
  }

  try {
    // Apply rate limiting based on route
    let rateLimitResult
    
    if (pathname.startsWith('/api/auth') || pathname.startsWith('/admin/auth')) {
      rateLimitResult = authRateLimit(req)
      
      if (!rateLimitResult.allowed) {
        const response = NextResponse.json(
          { 
            error: 'Too many authentication attempts', 
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
          },
          { status: 429 }
        )
        
        response.headers.set('Retry-After', Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString())
        response.headers.set('X-RateLimit-Limit', '10')
        response.headers.set('X-RateLimit-Remaining', '0')
        response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString())
        
        return response
      }
    } else if (pathname.startsWith('/api/admin')) {
      rateLimitResult = adminRateLimit(req)
      
      if (!rateLimitResult.allowed) {
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
        const response = NextResponse.json(
          { 
            error: 'Rate limit exceeded', 
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
          },
          { status: 429 }
        )
        
        response.headers.set('Retry-After', Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString())
        response.headers.set('X-RateLimit-Limit', '200')
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
        response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString())
        
        return response
      }
    }

    // Continue with the request
    const response = NextResponse.next()
    
    // Add security headers
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

    return response

  } catch (error) {
    console.error('Middleware error:', error)
    
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