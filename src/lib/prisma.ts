import { PrismaClient } from '../generated/prisma'
import { withAccelerate } from '@prisma/extension-accelerate'

// Enhanced PrismaClient configuration for enterprise stability and performance
const createPrismaClient = () => {
  const client = new PrismaClient({
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

  // Add middleware before extending with Accelerate
  client.$use(async (params: any, next: any) => {
    const before = Date.now()
    const result = await next(params)
    const after = Date.now()
    
    // Log slow queries in development
    if (process.env.NODE_ENV === 'development' && (after - before) > 1000) {
      console.log(`🐌 Slow Query: ${params.model}.${params.action} took ${after - before}ms`)
    }
    
    return result
  })

  return client.$extends(withAccelerate())
}

// Connection pooling and retry configuration
const globalForPrisma = globalThis as unknown as { 
  prisma: ReturnType<typeof createPrismaClient> | undefined 
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

// Add connection health check with performance metrics
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
  connectionInfo?: {
    activeConnections: number;
    maxConnections: number;
  };
}> {
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const latency = Date.now() - start
    
    // Get connection pool info (PostgreSQL specific)
    const connectionInfo = await prisma.$queryRaw<Array<{ active: number; max: number }>>`
      SELECT 
        count(*) as active,
        setting::int as max
      FROM pg_stat_activity, pg_settings 
      WHERE name = 'max_connections'
      GROUP BY setting
    `.catch(() => [{ active: 0, max: 100 }])
    
    return {
      healthy: true,
      latency,
      connectionInfo: {
        activeConnections: connectionInfo[0]?.active || 0,
        maxConnections: connectionInfo[0]?.max || 100
      }
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

// Query optimization helpers
export const queryOptimizations = {
  // Batch queries to reduce database round trips
  async batchQueries<T>(queries: Promise<T>[]): Promise<T[]> {
    return Promise.all(queries)
  },
  
  // Paginated query with count optimization
  async paginatedQuery<T>(
    model: any,
    options: {
      where?: any;
      select?: any;
      include?: any;
      orderBy?: any;
      page: number;
      limit: number;
    }
  ): Promise<{ data: T[]; total: number; pages: number }> {
    const { page, limit, ...queryOptions } = options
    const skip = (page - 1) * limit
    
    const [data, total] = await Promise.all([
      model.findMany({
        ...queryOptions,
        skip,
        take: limit
      }),
      model.count({ where: queryOptions.where })
    ])
    
    return {
      data,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export { prisma } 