import { NextResponse } from 'next/server'
import { withPrisma } from '@/lib/prisma-dynamic'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    // Basic environment check
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET'
    ]
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      console.error('[HEALTH_CHECK] Missing environment variables:', missingVars)
      return NextResponse.json({
        status: 'unhealthy',
        message: 'Missing required environment variables',
        details: {
          missing: missingVars.length,
          // Don't expose which vars are missing in production
          variables: process.env.NODE_ENV === 'development' ? missingVars : undefined
        }
      }, { status: 503 })
    }
    
    // Simple database check
    let dbHealthy = false
    let dbError = null
    
    try {
      await withPrisma(async (prisma) => {
        // Simple query to check database connection
        await prisma.$queryRaw`SELECT 1`
        dbHealthy = true
      })
    } catch (error) {
      dbError = error
      console.error('[HEALTH_CHECK] Database connection failed:', error)
    }
    
    if (!dbHealthy) {
      return NextResponse.json({
        status: 'unhealthy',
        message: 'Database connection failed',
        details: {
          error: process.env.NODE_ENV === 'development' ? String(dbError) : 'Connection error'
        }
      }, { status: 503 })
    }
    
    // All checks passed
    return NextResponse.json({
      status: 'healthy',
      message: 'System is operational',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    }, { status: 200 })
    
  } catch (error) {
    console.error('[HEALTH_CHECK] Unexpected error:', error)
    return NextResponse.json({
      status: 'unhealthy',
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 503 })
  }
}