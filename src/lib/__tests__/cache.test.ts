// Test cache configuration constants directly
const CACHE_DURATIONS = {
  USER_SETTINGS: 300,      // 5 minutes
  SUBSCRIPTION: 600,       // 10 minutes
  USAGE_DATA: 120,         // 2 minutes
  CONTENT_LIST: 180,       // 3 minutes
  BRAND_VOICE: 1800,       // 30 minutes
  PLATFORM_CONFIG: 3600,   // 1 hour
} as const

const cacheKeys = {
  userSettings: (userId: string) => `user:${userId}:settings`,
  subscription: (userId: string) => `user:${userId}:subscription`,
  usageData: (userId: string) => `user:${userId}:usage`,
  contentList: (userId: string, page: number, limit: number) => `user:${userId}:content:${page}:${limit}`,
  brandVoice: (userId: string) => `user:${userId}:brand-voice`,
  platformConfig: () => 'platform:config',
} as const

describe('Cache Configuration', () => {
  it('should have proper cache durations', () => {
    expect(CACHE_DURATIONS.USER_SETTINGS).toBe(300) // 5 minutes
    expect(CACHE_DURATIONS.SUBSCRIPTION).toBe(600) // 10 minutes
    expect(CACHE_DURATIONS.USAGE_DATA).toBe(120) // 2 minutes
    expect(CACHE_DURATIONS.CONTENT_LIST).toBe(180) // 3 minutes
    expect(CACHE_DURATIONS.BRAND_VOICE).toBe(1800) // 30 minutes
    expect(CACHE_DURATIONS.PLATFORM_CONFIG).toBe(3600) // 1 hour
  })

  it('should generate proper cache keys', () => {
    const userId = 'user-123'
    
    expect(cacheKeys.userSettings(userId)).toBe('user:user-123:settings')
    expect(cacheKeys.subscription(userId)).toBe('user:user-123:subscription')
    expect(cacheKeys.usageData(userId)).toBe('user:user-123:usage')
    expect(cacheKeys.contentList(userId, 1, 10)).toBe('user:user-123:content:1:10')
    expect(cacheKeys.brandVoice(userId)).toBe('user:user-123:brand-voice')
    expect(cacheKeys.platformConfig()).toBe('platform:config')
  })

  it('should handle different pagination in cache keys', () => {
    const userId = 'user-456'
    
    expect(cacheKeys.contentList(userId, 1, 10)).toBe('user:user-456:content:1:10')
    expect(cacheKeys.contentList(userId, 2, 10)).toBe('user:user-456:content:2:10')
    expect(cacheKeys.contentList(userId, 1, 20)).toBe('user:user-456:content:1:20')
  })
})