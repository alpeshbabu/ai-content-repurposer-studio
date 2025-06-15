import Redis from 'ioredis'

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  lazyConnect: true,
  // Connection pool settings
  family: 4,
  keepAlive: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
}

// Create Redis instance with fallback to memory cache if Redis is unavailable
class RedisClient {
  private client: Redis | null = null
  private memoryCache = new Map<string, { value: string; expiry: number }>()
  private useMemoryFallback = false

  constructor() {
    this.initializeRedis()
  }

  private async initializeRedis() {
    try {
      if (process.env.NODE_ENV === 'development' && !process.env.REDIS_URL && !process.env.REDIS_HOST) {
        console.log('Redis not configured, using memory cache fallback')
        this.useMemoryFallback = true
        return
      }

      this.client = new Redis(process.env.REDIS_URL || redisConfig)
      
      this.client.on('error', (error) => {
        console.error('Redis connection error:', error)
        this.useMemoryFallback = true
      })

      this.client.on('connect', () => {
        console.log('Connected to Redis')
        this.useMemoryFallback = false
      })

      this.client.on('ready', () => {
        console.log('Redis client ready')
      })

      this.client.on('close', () => {
        console.log('Redis connection closed')
        this.useMemoryFallback = true
      })

      this.client.on('reconnecting', () => {
        console.log('Redis reconnecting...')
      })

      // Test connection
      await this.client.ping()
    } catch (error) {
      console.error('Failed to initialize Redis, falling back to memory cache:', error)
      this.useMemoryFallback = true
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.useMemoryFallback || !this.client) {
      return this.getFromMemory(key)
    }

    try {
      return await this.client.get(key)
    } catch (error) {
      console.error('Redis GET error, falling back to memory:', error)
      return this.getFromMemory(key)
    }
  }

  async set(key: string, value: string): Promise<void> {
    if (this.useMemoryFallback || !this.client) {
      this.setInMemory(key, value)
      return
    }

    try {
      await this.client.set(key, value)
    } catch (error) {
      console.error('Redis SET error, falling back to memory:', error)
      this.setInMemory(key, value)
    }
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    if (this.useMemoryFallback || !this.client) {
      this.setInMemory(key, value, seconds)
      return
    }

    try {
      await this.client.setex(key, seconds, value)
    } catch (error) {
      console.error('Redis SETEX error, falling back to memory:', error)
      this.setInMemory(key, value, seconds)
    }
  }

  async del(...keys: string[]): Promise<number> {
    if (this.useMemoryFallback || !this.client) {
      return this.deleteFromMemory(...keys)
    }

    try {
      return await this.client.del(...keys)
    } catch (error) {
      console.error('Redis DEL error, falling back to memory:', error)
      return this.deleteFromMemory(...keys)
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (this.useMemoryFallback || !this.client) {
      return this.getKeysFromMemory(pattern)
    }

    try {
      return await this.client.keys(pattern)
    } catch (error) {
      console.error('Redis KEYS error, falling back to memory:', error)
      return this.getKeysFromMemory(pattern)
    }
  }

  async ping(): Promise<string> {
    if (this.useMemoryFallback || !this.client) {
      return 'PONG'
    }

    try {
      return await this.client.ping()
    } catch (error) {
      throw new Error('Redis ping failed')
    }
  }

  // Memory cache fallback methods
  private getFromMemory(key: string): string | null {
    const item = this.memoryCache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expiry) {
      this.memoryCache.delete(key)
      return null
    }
    
    return item.value
  }

  private setInMemory(key: string, value: string, ttlSeconds?: number): void {
    const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : Date.now() + (300 * 1000) // Default 5 min
    this.memoryCache.set(key, { value, expiry })
    
    // Simple cleanup of expired items
    if (this.memoryCache.size > 1000) {
      this.cleanupMemoryCache()
    }
  }

  private deleteFromMemory(...keys: string[]): number {
    let deletedCount = 0
    keys.forEach(key => {
      if (this.memoryCache.delete(key)) {
        deletedCount++
      }
    })
    return deletedCount
  }

  private getKeysFromMemory(pattern: string): string[] {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    return Array.from(this.memoryCache.keys()).filter(key => regex.test(key))
  }

  private cleanupMemoryCache(): void {
    const now = Date.now()
    for (const [key, item] of this.memoryCache.entries()) {
      if (now > item.expiry) {
        this.memoryCache.delete(key)
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect()
    }
    this.memoryCache.clear()
  }
}

// Export singleton instance
export const redis = new RedisClient()