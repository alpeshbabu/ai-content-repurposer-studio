import { NextRequest } from 'next/server'
import { generateSecureToken } from './security'

// CSRF token store (use Redis in production)
const csrfTokenStore = new Map<string, { token: string; expiresAt: number }>()

// CSRF protection configuration
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000 // 1 hour
const CSRF_HEADER_NAME = 'X-CSRF-Token'
const CSRF_COOKIE_NAME = 'csrf-token'

/**
 * Generate a new CSRF token for a session
 */
export function generateCSRFToken(sessionId: string): string {
  const token = generateSecureToken(32)
  const expiresAt = Date.now() + CSRF_TOKEN_EXPIRY
  
  csrfTokenStore.set(sessionId, { token, expiresAt })
  
  // Clean up expired tokens
  cleanupExpiredTokens()
  
  return token
}

/**
 * Validate CSRF token from request
 */
export function validateCSRFToken(req: NextRequest, sessionId: string): boolean {
  // Get token from header or body
  const tokenFromHeader = req.headers.get(CSRF_HEADER_NAME)
  const tokenFromCookie = req.cookies.get(CSRF_COOKIE_NAME)?.value
  
  const providedToken = tokenFromHeader || tokenFromCookie
  
  if (!providedToken) {
    return false
  }
  
  const storedTokenData = csrfTokenStore.get(sessionId)
  
  if (!storedTokenData) {
    return false
  }
  
  // Check if token is expired
  if (Date.now() > storedTokenData.expiresAt) {
    csrfTokenStore.delete(sessionId)
    return false
  }
  
  // Constant time comparison to prevent timing attacks
  return constantTimeCompare(providedToken, storedTokenData.token)
}

/**
 * Remove CSRF token for a session
 */
export function removeCSRFToken(sessionId: string): void {
  csrfTokenStore.delete(sessionId)
}

/**
 * Clean up expired CSRF tokens
 */
function cleanupExpiredTokens(): void {
  const now = Date.now()
  for (const [sessionId, tokenData] of csrfTokenStore.entries()) {
    if (now > tokenData.expiresAt) {
      csrfTokenStore.delete(sessionId)
    }
  }
}

/**
 * Constant time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  
  return result === 0
}

/**
 * Check if request needs CSRF protection
 */
export function requiresCSRFProtection(req: NextRequest): boolean {
  const method = req.method.toUpperCase()
  const pathname = req.nextUrl.pathname
  
  // CSRF protection for state-changing operations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return false
  }
  
  // Skip CSRF for NextAuth API routes
  if (pathname.startsWith('/api/auth/')) {
    return false
  }
  
  // Skip CSRF for webhooks (they have their own security)
  if (pathname.startsWith('/api/webhooks/')) {
    return false
  }
  
  return true
}

/**
 * Generate CSRF-safe form action
 */
export function createCSRFSafeForm(sessionId: string): {
  token: string
  headers: Record<string, string>
} {
  const token = generateCSRFToken(sessionId)
  
  return {
    token,
    headers: {
      [CSRF_HEADER_NAME]: token
    }
  }
}

/**
 * CSRF middleware helper
 */
export function csrfMiddleware(req: NextRequest, sessionId: string): {
  valid: boolean
  error?: string
} {
  if (!requiresCSRFProtection(req)) {
    return { valid: true }
  }
  
  if (!sessionId) {
    return { 
      valid: false, 
      error: 'No session found for CSRF validation' 
    }
  }
  
  const isValid = validateCSRFToken(req, sessionId)
  
  if (!isValid) {
    return { 
      valid: false, 
      error: 'Invalid or missing CSRF token' 
    }
  }
  
  return { valid: true }
}