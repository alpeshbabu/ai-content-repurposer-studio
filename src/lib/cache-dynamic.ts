// Dynamic cache loader to prevent build-time initialization
import { CACHE_DURATIONS, cacheKeys } from './cache'

let cacheService: any = null

async function getCacheService() {
  if (!cacheService) {
    try {
      const { CacheService } = await import('./cache')
      cacheService = CacheService
    } catch (error) {
      console.error('Failed to load cache service:', error)
      // Return a no-op cache service that doesn't crash
      cacheService = {
        getUserSettings: () => Promise.resolve(null),
        setUserSettings: () => Promise.resolve(),
        invalidateUserSettings: () => Promise.resolve(),
        getSubscription: () => Promise.resolve(null),
        setSubscription: () => Promise.resolve(),
        invalidateSubscription: () => Promise.resolve(),
        getUsageData: () => Promise.resolve(null),
        setUsageData: () => Promise.resolve(),
        invalidateUsageData: () => Promise.resolve(),
        getContentList: () => Promise.resolve(null),
        setContentList: () => Promise.resolve(),
        invalidateContentList: () => Promise.resolve(),
        getBrandVoice: () => Promise.resolve(null),
        setBrandVoice: () => Promise.resolve(),
        invalidateBrandVoice: () => Promise.resolve(),
        getPlatformConfig: () => Promise.resolve(null),
        setPlatformConfig: () => Promise.resolve(),
        invalidateAllUserData: () => Promise.resolve(),
      }
    }
  }
  return cacheService
}

export async function withCache<T>(operation: (cache: any) => Promise<T>): Promise<T> {
  const cache = await getCacheService()
  return await operation(cache)
}

// Re-export for convenience
export { CACHE_DURATIONS, cacheKeys }