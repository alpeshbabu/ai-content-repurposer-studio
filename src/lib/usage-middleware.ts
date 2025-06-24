/**
 * Usage Enforcement Middleware
 * 
 * This middleware checks usage limits and enforces subscription plan restrictions
 * using the centralized pricing configuration.
 */

import { PRICING_CONFIG, PlanType, getPlanConfig } from './pricing-config';
import { prisma } from './prisma';

export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  overagePrice?: number;
  currentUsage?: number;
  limit?: number;
  dailyUsage?: number;
  dailyLimit?: number;
}

/**
 * Check if user can perform an action based on their plan limits
 */
export async function checkUsageLimit(
  userId: string, 
  plan: PlanType,
  action: 'content_generation' | 'api_request' = 'content_generation'
): Promise<UsageCheckResult> {
  const planConfig = getPlanConfig(plan);
  
  try {
    // Get user's current usage
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        usageThisMonth: true,
        dailyUsageCount: true,
        dailyUsageDate: true,
        subscriptionStatus: true
      }
    });

    if (!user) {
      return {
        allowed: false,
        reason: 'User not found'
      };
    }

    // Check if subscription is active (except for free plan)
    if (plan !== 'free' && user.subscriptionStatus !== 'active') {
      return {
        allowed: false,
        reason: `${planConfig.name} plan requires active subscription`
      };
    }

    const currentUsage = user.usageThisMonth || 0;
    const dailyUsage = getDailyUsage(user);

    // Check monthly limits
    if (planConfig.monthlyLimit !== -1 && currentUsage >= planConfig.monthlyLimit) {
      return {
        allowed: false,
        reason: `Monthly limit of ${planConfig.monthlyLimit} generations reached`,
        overagePrice: planConfig.overagePrice,
        currentUsage,
        limit: planConfig.monthlyLimit
      };
    }

    // Check daily limits (if applicable)
    if (planConfig.dailyLimit !== -1 && dailyUsage >= planConfig.dailyLimit) {
      return {
        allowed: false,
        reason: `Daily limit of ${planConfig.dailyLimit} generations reached`,
        currentUsage,
        limit: planConfig.monthlyLimit,
        dailyUsage,
        dailyLimit: planConfig.dailyLimit
      };
    }

    // Usage allowed
    return {
      allowed: true,
      currentUsage,
      limit: planConfig.monthlyLimit === -1 ? undefined : planConfig.monthlyLimit,
      dailyUsage,
      dailyLimit: planConfig.dailyLimit === -1 ? undefined : planConfig.dailyLimit
    };

  } catch (error) {
    console.error('Error checking usage limit:', error);
    return {
      allowed: false,
      reason: 'Error checking usage limits'
    };
  }
}

/**
 * Record usage for a user
 */
export async function recordUsage(
  userId: string,
  action: 'content_generation' | 'api_request' = 'content_generation',
  quantity: number = 1
): Promise<void> {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    await prisma.user.update({
      where: { id: userId },
      data: {
        usageThisMonth: {
          increment: quantity
        },
        dailyUsageCount: {
          increment: quantity
        },
        dailyUsageDate: today
      }
    });

    // Create usage record for billing/analytics
    await prisma.usageRecord.create({
      data: {
        userId,
        featureType: action,
        quantity,
        billingPeriod: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
        createdAt: today
      }
    });

  } catch (error) {
    console.error('Error recording usage:', error);
    throw error;
  }
}

/**
 * Calculate overage charges for a user
 */
export async function calculateOverageCharges(
  userId: string, 
  plan: PlanType,
  billingPeriod?: string
): Promise<{
  overageCount: number;
  overageCharges: number;
  planLimit: number;
  totalUsage: number;
}> {
  const planConfig = getPlanConfig(plan);
  
  try {
    const currentPeriod = billingPeriod || getCurrentBillingPeriod();
    
    // Get total usage for billing period
    const usageRecords = await prisma.usageRecord.findMany({
      where: {
        userId,
        billingPeriod: currentPeriod
      },
      select: {
        quantity: true
      }
    });

    const totalUsage = usageRecords.reduce((sum, record) => sum + record.quantity, 0);
    const planLimit = planConfig.monthlyLimit === -1 ? Infinity : planConfig.monthlyLimit;
    const overageCount = Math.max(0, totalUsage - planLimit);
    const overageCharges = overageCount * planConfig.overagePrice;

    return {
      overageCount,
      overageCharges,
      planLimit: planLimit === Infinity ? -1 : planLimit,
      totalUsage
    };

  } catch (error) {
    console.error('Error calculating overage charges:', error);
    return {
      overageCount: 0,
      overageCharges: 0,
      planLimit: planConfig.monthlyLimit,
      totalUsage: 0
    };
  }
}

/**
 * Reset monthly usage counters (typically called at the start of each billing period)
 */
export async function resetMonthlyUsage(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        usageThisMonth: 0,
        dailyUsageCount: 0,
        dailyUsageDate: null
      }
    });
  } catch (error) {
    console.error('Error resetting monthly usage:', error);
    throw error;
  }
}

/**
 * Get current billing period in YYYY-MM format
 */
function getCurrentBillingPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Calculate daily usage based on user's dailyUsageDate
 */
function getDailyUsage(user: { dailyUsageCount: number | null; dailyUsageDate: Date | null }): number {
  if (!user.dailyUsageDate) return 0;
  
  const today = new Date();
  const usageDate = new Date(user.dailyUsageDate);
  
  // Check if the usage date is today
  const isToday = 
    today.getDate() === usageDate.getDate() &&
    today.getMonth() === usageDate.getMonth() &&
    today.getFullYear() === usageDate.getFullYear();
  
  return isToday ? (user.dailyUsageCount || 0) : 0;
}

/**
 * Middleware function for API routes
 */
export function createUsageMiddleware(plan: PlanType) {
  return async (userId: string) => {
    const result = await checkUsageLimit(userId, plan);
    
    if (!result.allowed) {
      throw new Error(result.reason || 'Usage limit exceeded');
    }
    
    return result;
  };
}

/**
 * Get usage summary for dashboard display
 */
export async function getUsageSummary(userId: string, plan: PlanType) {
  const planConfig = getPlanConfig(plan);
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      usageThisMonth: true,
      dailyUsageCount: true,
      dailyUsageDate: true
    }
  });

  if (!user) return null;

  const dailyUsage = getDailyUsage(user);
  const overageInfo = await calculateOverageCharges(userId, plan);

  return {
    monthly: {
      used: user.usageThisMonth || 0,
      limit: planConfig.monthlyLimit === -1 ? 'Unlimited' : planConfig.monthlyLimit,
      percentage: planConfig.monthlyLimit === -1 ? 0 : 
        Math.min(100, ((user.usageThisMonth || 0) / planConfig.monthlyLimit) * 100)
    },
    daily: {
      used: dailyUsage,
      limit: planConfig.dailyLimit === -1 ? 'Unlimited' : planConfig.dailyLimit,
      percentage: planConfig.dailyLimit === -1 ? 0 : 
        Math.min(100, (dailyUsage / planConfig.dailyLimit) * 100)
    },
    overage: overageInfo,
    plan: {
      name: planConfig.name,
      price: planConfig.price,
      overageRate: planConfig.overagePrice
    }
  };
}
