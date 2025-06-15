import { redis } from './redis'

// Cache durations in seconds
export const CACHE_DURATIONS = {
  USER_SETTINGS: 300,      // 5 minutes
  SUBSCRIPTION: 600,       // 10 minutes
  USAGE_DATA: 120,         // 2 minutes
  CONTENT_LIST: 180,       // 3 minutes
  BRAND_VOICE: 1800,       // 30 minutes
  PLATFORM_CONFIG: 3600,   // 1 hour
} as const

// Cache key generators
export const cacheKeys = {
  userSettings: (userId: string) => `user:${userId}:settings`,
  subscription: (userId: string) => `user:${userId}:subscription`,
  usageData: (userId: string) => `user:${userId}:usage`,
  contentList: (userId: string, page: number, limit: number) => `user:${userId}:content:${page}:${limit}`,
  brandVoice: (userId: string) => `user:${userId}:brand-voice`,
  platformConfig: () => 'platform:config',
} as const

// Generic cache functions
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key)
    return cached ? JSON.parse(cached) : null
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

export async function setCache<T>(
  key: string, 
  value: T, 
  ttl: number = CACHE_DURATIONS.USER_SETTINGS
): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value))
  } catch (error) {
    console.error('Cache set error:', error)
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (error) {
    console.error('Cache delete error:', error)
  }
}

export async function invalidateUserCache(userId: string): Promise<void> {
  try {
    const pattern = `user:${userId}:*`
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('Cache invalidation error:', error)
  }
}

// Specific cache functions for common data
export class CacheService {
  // User settings cache
  static async getUserSettings(userId: string) {
    return getCache(cacheKeys.userSettings(userId))
  }

  static async setUserSettings(userId: string, settings: any) {
    return setCache(cacheKeys.userSettings(userId), settings, CACHE_DURATIONS.USER_SETTINGS)
  }

  static async invalidateUserSettings(userId: string) {
    return deleteCache(cacheKeys.userSettings(userId))
  }

  // Subscription cache
  static async getSubscription(userId: string) {
    return getCache(cacheKeys.subscription(userId))
  }

  static async setSubscription(userId: string, subscription: any) {
    return setCache(cacheKeys.subscription(userId), subscription, CACHE_DURATIONS.SUBSCRIPTION)
  }

  static async invalidateSubscription(userId: string) {
    return deleteCache(cacheKeys.subscription(userId))
  }

  // Usage data cache
  static async getUsageData(userId: string) {
    return getCache(cacheKeys.usageData(userId))
  }

  static async setUsageData(userId: string, usage: any) {
    return setCache(cacheKeys.usageData(userId), usage, CACHE_DURATIONS.USAGE_DATA)
  }

  static async invalidateUsageData(userId: string) {
    return deleteCache(cacheKeys.usageData(userId))
  }

  // Content list cache
  static async getContentList(userId: string, page: number, limit: number) {
    return getCache(cacheKeys.contentList(userId, page, limit))
  }

  static async setContentList(userId: string, page: number, limit: number, content: any) {
    return setCache(cacheKeys.contentList(userId, page, limit), content, CACHE_DURATIONS.CONTENT_LIST)
  }

  static async invalidateContentList(userId: string) {
    try {
      const pattern = `user:${userId}:content:*`
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Content list cache invalidation error:', error)
    }
  }

  // Brand voice cache
  static async getBrandVoice(userId: string) {
    return getCache(cacheKeys.brandVoice(userId))
  }

  static async setBrandVoice(userId: string, brandVoice: any) {
    return setCache(cacheKeys.brandVoice(userId), brandVoice, CACHE_DURATIONS.BRAND_VOICE)
  }

  static async invalidateBrandVoice(userId: string) {
    return deleteCache(cacheKeys.brandVoice(userId))
  }

  // Platform configuration cache (rarely changes)
  static async getPlatformConfig() {
    return getCache(cacheKeys.platformConfig())
  }

  static async setPlatformConfig(config: any) {
    return setCache(cacheKeys.platformConfig(), config, CACHE_DURATIONS.PLATFORM_CONFIG)
  }

  // Bulk invalidation for user data changes
  static async invalidateAllUserData(userId: string) {
    return invalidateUserCache(userId)
  }
}

// Cache warming functions
export async function warmUserCache(userId: string): Promise<void> {
  // This function can be called to pre-populate cache with user data
  // Useful for new sessions or after cache eviction
  try {
    // Add logic to fetch and cache commonly accessed user data
    console.log(`Warming cache for user: ${userId}`)
  } catch (error) {
    console.error('Cache warming error:', error)
  }
}

// Cache health check
export async function checkCacheHealth(): Promise<{ healthy: boolean; error?: string }> {
  try {
    await redis.ping()
    return { healthy: true }
  } catch (error) {
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Unknown cache error'
    }
  }
}