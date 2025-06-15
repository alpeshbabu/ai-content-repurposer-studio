// Server-side security utilities that require Node.js runtime
// These should only be used in API routes, not in middleware or Edge Runtime contexts

import crypto from 'crypto'
import bcrypt from 'bcryptjs'

// Strong password hashing using bcrypt (server-side only)
export async function hashPasswordSecure(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

export async function verifyPasswordSecure(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

// Cryptographically secure token generation (server-side only)
export function generateCryptoSecureToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

// HMAC signature generation for webhook verification
export function generateHMACSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

export function verifyHMACSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = generateHMACSignature(payload, secret)
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
}

// API key generation and validation (server-side only)
export function generateAPIKey(): { key: string; keyId: string } {
  const keyId = crypto.randomBytes(8).toString('hex')
  const keySecret = crypto.randomBytes(32).toString('base64url')
  const key = `ark_${keyId}_${keySecret}` // AI Repurposer Key format
  
  return { key, keyId }
}

export function validateAPIKeyFormat(apiKey: string): boolean {
  const apiKeyRegex = /^ark_[a-f0-9]{16}_[A-Za-z0-9_-]{43}$/
  return apiKeyRegex.test(apiKey)
}

// File upload security (server-side only)
export function generateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

export function validateFileIntegrity(buffer: Buffer, expectedHash: string): boolean {
  const actualHash = generateFileHash(buffer)
  return actualHash === expectedHash
}

// Session token encryption (server-side only)
export function encryptSessionData(data: string, secret: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher('aes-256-gcm', secret)
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decryptSessionData(encryptedData: string, secret: string): string | null {
  try {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    
    const decipher = crypto.createDecipher('aes-256-gcm', secret)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    return null
  }
}

// Database encryption utilities (server-side only)
export function encryptSensitiveData(data: string, key: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher('aes-256-cbc', key)
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  return `${iv.toString('hex')}:${encrypted}`
}

export function decryptSensitiveData(encryptedData: string, key: string): string | null {
  try {
    const [ivHex, encrypted] = encryptedData.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    
    const decipher = crypto.createDecipher('aes-256-cbc', key)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    return null
  }
}

// Audit log utilities (server-side only)
export function generateAuditHash(action: string, userId: string, timestamp: number, data?: any): string {
  const payload = JSON.stringify({
    action,
    userId,
    timestamp,
    data: data || null
  })
  
  return crypto.createHash('sha256').update(payload).digest('hex')
}

// Content integrity verification (server-side only)
export function generateContentSignature(content: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(content).digest('base64')
}

export function verifyContentSignature(content: string, signature: string, secret: string): boolean {
  const expectedSignature = generateContentSignature(content, secret)
  return crypto.timingSafeEqual(Buffer.from(signature, 'base64'), Buffer.from(expectedSignature, 'base64'))
}

// Rate limiting with cryptographic tokens (server-side only)
export function generateRateLimitToken(identifier: string, windowStart: number, secret: string): string {
  const payload = `${identifier}:${windowStart}`
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

// Environment validation with cryptographic checks
export function validateEnvironmentIntegrity(): { valid: boolean; issues: string[] } {
  const issues: string[] = []
  
  // Check that secrets are cryptographically strong
  const secrets = [
    { name: 'NEXTAUTH_SECRET', value: process.env.NEXTAUTH_SECRET },
    { name: 'ADMIN_JWT_SECRET', value: process.env.ADMIN_JWT_SECRET },
    { name: 'DATABASE_ENCRYPTION_KEY', value: process.env.DATABASE_ENCRYPTION_KEY }
  ]
  
  secrets.forEach(({ name, value }) => {
    if (!value) {
      issues.push(`Missing secret: ${name}`)
    } else if (value.length < 32) {
      issues.push(`Secret ${name} is too short (minimum 32 characters)`)
    } else if (!/[a-f0-9]{32,}/.test(value) && !/[A-Za-z0-9+/]{32,}/.test(value)) {
      issues.push(`Secret ${name} appears to be weak (should be cryptographically random)`)
    }
  })
  
  return {
    valid: issues.length === 0,
    issues
  }
}