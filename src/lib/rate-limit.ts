interface RateLimitResult {
  allowed: boolean;
  resetTime?: number;
  remaining?: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  api: { windowMs: 60 * 1000, maxRequests: 100 },
  content_generation: { windowMs: 60 * 1000, maxRequests: 10 },
  ai_analysis: { windowMs: 60 * 1000, maxRequests: 20 },
  analytics: { windowMs: 60 * 1000, maxRequests: 30 },
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  team: { windowMs: 60 * 1000, maxRequests: 50 },
  billing: { windowMs: 60 * 1000, maxRequests: 20 },
  support: { windowMs: 60 * 1000, maxRequests: 15 },
};

class RateLimiter {
  private static instance: RateLimiter;
  private requests: Map<string, { count: number; resetTime: number }> = new Map();

  private constructor() {}

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  async checkLimit(userId: string, operation: string): Promise<RateLimitResult> {
    const config = RATE_LIMITS[operation] || RATE_LIMITS.api;
    const key = `${userId}:${operation}`;
    const now = Date.now();

    const requestData = this.requests.get(key);

    if (!requestData || requestData.resetTime <= now) {
      const resetTime = now + config.windowMs;
      this.requests.set(key, { count: 1, resetTime });
      
      return {
        allowed: true,
        resetTime,
        remaining: config.maxRequests - 1
      };
    }

    if (requestData.count >= config.maxRequests) {
      return {
        allowed: false,
        resetTime: requestData.resetTime,
        remaining: 0
      };
    }

    requestData.count++;
    this.requests.set(key, requestData);

    return {
      allowed: true,
      resetTime: requestData.resetTime,
      remaining: config.maxRequests - requestData.count
    };
  }
}

export const rateLimiter = RateLimiter.getInstance();
export type { RateLimitResult, RateLimitConfig };
