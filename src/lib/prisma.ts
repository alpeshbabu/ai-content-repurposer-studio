import { PrismaClient } from '../generated/prisma'

// Enhanced PrismaClient configuration for enterprise stability
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn', 'info'] 
      : ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    // Enhanced error formatting
    errorFormat: 'pretty',
  })
}

// Connection pooling and retry configuration
const globalForPrisma = globalThis as unknown as { 
  prisma: PrismaClient | undefined 
}

const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Enhanced database connection monitoring
// Note: beforeExit event is not available in Prisma 5.0+ library engine
// Using process events instead for graceful shutdown
process.on('beforeExit', () => {
  console.log('🔄 Prisma client disconnecting...')
})

process.on('SIGINT', async () => {
  console.log('🔄 Received SIGINT, shutting down gracefully...')
  await disconnectDatabase()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('🔄 Received SIGTERM, shutting down gracefully...')
  await disconnectDatabase()
  process.exit(0)
})

// Add connection health check
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const latency = Date.now() - start
    
    return {
      healthy: true,
      latency
    }
  } catch (error) {
    console.error('Database health check failed:', error)
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    }
  }
}

// Graceful database disconnect
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect()
    console.log('✅ Database disconnected gracefully')
  } catch (error) {
    console.error('❌ Error disconnecting database:', error)
  }
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export { prisma } 