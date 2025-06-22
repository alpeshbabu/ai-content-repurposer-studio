import { redis } from './redis'

// Cache durations in seconds - optimized for different data types
export const CACHE_DURATIONS = {
  // User data - changes frequently
  USER_SETTINGS: 300,      // 5 minutes
  USER_PROFILE: 600,       // 10 minutes
  
  // Subscription data - changes less frequently
  SUBSCRIPTION: 1800,      // 30 minutes
  USAGE_DATA: 120,         // 2 minutes
  DAILY_USAGE: 300,        // 5 minutes
  
  // Content data - varies by type
  CONTENT_LIST: 300,       // 5 minutes
  CONTENT_DETAIL: 900,     // 15 minutes
  CONTENT_SEARCH: 180,     // 3 minutes
  
  // Configuration data - rarely changes
  BRAND_VOICE: 3600,       // 1 hour
  PLATFORM_CONFIG: 7200,   // 2 hours
  SYSTEM_CONFIG: 14400,    // 4 hours
  
  // Analytics data - can be cached longer
  ANALYTICS_DAILY: 1800,   // 30 minutes
  ANALYTICS_WEEKLY: 3600,  // 1 hour
  ANALYTICS_MONTHLY: 7200, // 2 hours
  
  // Admin data
  ADMIN_STATS: 600,        // 10 minutes
  USER_LIST: 300,          // 5 minutes
} as const

// Cache key generators with consistent naming
export const cacheKeys = {
  // User caches
  userSettings: (userId: string) => `user:${userId}:settings`,
  userProfile: (userId: string) => `user:${userId}:profile`,
  subscription: (userId: string) => `user:${userId}:subscription`,
  usageData: (userId: string) => `user:${userId}:usage`,
  dailyUsage: (userId: string, date: string) => `user:${userId}:daily:${date}`,
  
  // Content caches
  contentList: (userId: string, page: number, limit: number, filters?: string) => 
    `user:${userId}:content:list:${page}:${limit}${filters ? `:${filters}` : ''}`,
  contentDetail: (contentId: string) => `content:${contentId}:detail`,
  contentSearch: (userId: string, query: string) => `user:${userId}:search:${query}`,
  
  // System caches
  platformConfig: () => 'system:platform:config',
  systemStats: () => 'system:stats',
  adminStats: () => 'admin:stats',
  userList: (page: number, limit: number, filters?: string) => 
    `admin:users:${page}:${limit}${filters ? `:${filters}` : ''}`,
  
  // Analytics caches
  analyticsDaily: (userId: string, date: string) => `analytics:${userId}:daily:${date}`,
  analyticsWeekly: (userId: string, week: string) => `analytics:${userId}:weekly:${week}`,
  analyticsMonthly: (userId: string, month: string) => `analytics:${userId}:monthly:${month}`,
}

// Generic cache functions with error handling and compression
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key)
    if (!cached) return null
    
    // Handle compressed data
    const data = cached.startsWith('compressed:') 
      ? JSON.parse(cached.slice(11)) // Remove 'compressed:' prefix
      : JSON.parse(cached)
    
    return data
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
    const serialized = JSON.stringify(value)
    
    // Compress large data (>1KB)
    const shouldCompress = serialized.length > 1024
    const dataToStore = shouldCompress ? `compressed:${serialized}` : serialized
    
    await redis.setex(key, ttl, dataToStore)
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

// Smart cache invalidation
export async function invalidateUserCache(userId: string): Promise<void> {
  try {
    const patterns = [
      `user:${userId}:*`,
      `analytics:${userId}:*`
    ]
    
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    }
  } catch (error) {
    console.error('Cache invalidation error:', error)
  }
}

// Batch cache operations for better performance
export async function batchGetCache<T>(keys: string[]): Promise<(T | null)[]> {
  try {
    const results = await Promise.all(keys.map(key => getCache<T>(key)))
    return results
  } catch (error) {
    console.error('Batch cache get error:', error)
    return keys.map(() => null)
  }
}

export async function batchSetCache<T>(
  operations: Array<{ key: string; value: T; ttl?: number }>
): Promise<void> {
  try {
    await Promise.all(
      operations.map(({ key, value, ttl }) => setCache(key, value, ttl))
    )
  } catch (error) {
    console.error('Batch cache set error:', error)
  }
}

// Enhanced cache service with smart strategies
export class CacheService {
  // User profile cache with fallback
  static async getUserProfile(userId: string) {
    return getCache(cacheKeys.userProfile(userId))
  }

  static async setUserProfile(userId: string, profile: any) {
    return setCache(cacheKeys.userProfile(userId), profile, CACHE_DURATIONS.USER_PROFILE)
  }

  // Subscription cache with auto-refresh
  static async getSubscription(userId: string) {
    return getCache(cacheKeys.subscription(userId))
  }

  static async setSubscription(userId: string, subscription: any) {
    return setCache(cacheKeys.subscription(userId), subscription, CACHE_DURATIONS.SUBSCRIPTION)
  }

  // Usage data with short TTL
  static async getUsageData(userId: string) {
    return getCache(cacheKeys.usageData(userId))
  }

  static async setUsageData(userId: string, usage: any) {
    return setCache(cacheKeys.usageData(userId), usage, CACHE_DURATIONS.USAGE_DATA)
  }

  // Daily usage with date-specific caching
  static async getDailyUsage(userId: string, date: string) {
    return getCache(cacheKeys.dailyUsage(userId, date))
  }

  static async setDailyUsage(userId: string, date: string, usage: any) {
    return setCache(cacheKeys.dailyUsage(userId, date), usage, CACHE_DURATIONS.DAILY_USAGE)
  }

  // Content list with intelligent invalidation
  static async getContentList(userId: string, page: number, limit: number, filters?: any) {
    const filterHash = filters ? JSON.stringify(filters) : ''
    return getCache(cacheKeys.contentList(userId, page, limit, filterHash))
  }

  static async setContentList(userId: string, page: number, limit: number, content: any, filters?: any) {
    const filterHash = filters ? JSON.stringify(filters) : ''
    return setCache(
      cacheKeys.contentList(userId, page, limit, filterHash), 
      content, 
      CACHE_DURATIONS.CONTENT_LIST
    )
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

  // Content detail with longer TTL
  static async getContentDetail(contentId: string) {
    return getCache(cacheKeys.contentDetail(contentId))
  }

  static async setContentDetail(contentId: string, content: any) {
    return setCache(cacheKeys.contentDetail(contentId), content, CACHE_DURATIONS.CONTENT_DETAIL)
  }

  // Search results with shorter TTL
  static async getSearchResults(userId: string, query: string) {
    return getCache(cacheKeys.contentSearch(userId, query))
  }

  static async setSearchResults(userId: string, query: string, results: any) {
    return setCache(cacheKeys.contentSearch(userId, query), results, CACHE_DURATIONS.CONTENT_SEARCH)
  }

  // Platform configuration cache (rarely changes)
  static async getPlatformConfig() {
    return getCache(cacheKeys.platformConfig())
  }

  static async setPlatformConfig(config: any) {
    return setCache(cacheKeys.platformConfig(), config, CACHE_DURATIONS.PLATFORM_CONFIG)
  }

  // Admin caches
  static async getAdminStats() {
    return getCache(cacheKeys.adminStats())
  }

  static async setAdminStats(stats: any) {
    return setCache(cacheKeys.adminStats(), stats, CACHE_DURATIONS.ADMIN_STATS)
  }

  static async getUserList(page: number, limit: number, filters?: any) {
    const filterHash = filters ? JSON.stringify(filters) : ''
    return getCache(cacheKeys.userList(page, limit, filterHash))
  }

  static async setUserList(page: number, limit: number, users: any, filters?: any) {
    const filterHash = filters ? JSON.stringify(filters) : ''
    return setCache(cacheKeys.userList(page, limit, filterHash), users, CACHE_DURATIONS.USER_LIST)
  }

  // Analytics caches
  static async getAnalytics(userId: string, type: 'daily' | 'weekly' | 'monthly', period: string) {
    const key = type === 'daily' 
      ? cacheKeys.analyticsDaily(userId, period)
      : type === 'weekly'
      ? cacheKeys.analyticsWeekly(userId, period)
      : cacheKeys.analyticsMonthly(userId, period)
    
    return getCache(key)
  }

  static async setAnalytics(userId: string, type: 'daily' | 'weekly' | 'monthly', period: string, data: any) {
    const key = type === 'daily' 
      ? cacheKeys.analyticsDaily(userId, period)
      : type === 'weekly'
      ? cacheKeys.analyticsWeekly(userId, period)
      : cacheKeys.analyticsMonthly(userId, period)
    
    const ttl = type === 'daily' 
      ? CACHE_DURATIONS.ANALYTICS_DAILY
      : type === 'weekly'
      ? CACHE_DURATIONS.ANALYTICS_WEEKLY
      : CACHE_DURATIONS.ANALYTICS_MONTHLY
    
    return setCache(key, data, ttl)
  }
}

// Cache warming strategies
export class CacheWarmer {
  static async warmUserCache(userId: string) {
    // Pre-load commonly accessed user data
    const promises = [
      // User profile and settings
      CacheService.getUserProfile(userId),
      CacheService.getSubscription(userId),
      CacheService.getUsageData(userId),
      
      // Recent content
      CacheService.getContentList(userId, 1, 10),
    ]
    
    await Promise.allSettled(promises)
  }

  static async warmSystemCache() {
    // Pre-load system-wide data
    const promises = [
      CacheService.getPlatformConfig(),
      CacheService.getAdminStats(),
    ]
    
    await Promise.allSettled(promises)
  }
}

// Cache health check with metrics
export async function checkCacheHealth(): Promise<{ 
  healthy: boolean; 
  error?: string;
  metrics?: {
    memoryUsage: string;
    keyCount: number;
    hitRate?: number;
  };
}> {
  try {
    await redis.ping()
    
    // Get cache metrics
    const info = await redis.info('memory')
    const keyCount = await redis.dbsize()
    
    const memoryMatch = info.match(/used_memory_human:(.+)/)
    const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'unknown'
    
    return { 
      healthy: true,
      metrics: {
        memoryUsage,
        keyCount
      }
    }
  } catch (error) {
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Unknown cache error'
    }
  }
}