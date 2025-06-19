import { prisma } from './prisma'

export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'agency'

export interface UsageInfo {
  used: number
  limit: number
  isExceeded: boolean
  dailyUsed?: number
  dailyLimit?: number
  isDailyExceeded?: boolean
}

// Monthly limits - MUST match SUBSCRIPTION.md exactly
export const SUBSCRIPTION_LIMITS = {
  free: 5,
  basic: 60,
  pro: 150,
  agency: 450
}

// Daily limits
export const DAILY_LIMITS = {
  free: Infinity, // No daily limit, only monthly
  basic: 2,
  pro: 5,
  agency: Infinity // No daily limit for agency plan
}

// Overage pricing per content repurpose
export const OVERAGE_PRICING = {
  free: 0.12,
  basic: 0.10,
  pro: 0.08,
  agency: 0.06
}

/**
 * Get user's usage information for the current month
 */
export async function getUserUsage(userId: string): Promise<UsageInfo> {
  const today = new Date(new Date().setHours(0, 0, 0, 0)); // Today at midnight
  
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  let dailyUsed = 0;
  
  try {
    // Check if table exists
    try {
      await prisma.$executeRawUnsafe(`SELECT 1 FROM "DailyUsage" LIMIT 1`);
    } catch (error) {
      console.log('DailyUsage table may not exist, skipping daily usage check');
    }
    
    // Use dynamic query instead of model-based query
    const dailyUsageResult = await prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT "count" FROM "DailyUsage" 
       WHERE "userId" = $1 AND "date" = $2 
       LIMIT 1`,
      userId,
      today.toISOString()
    );
    
    if (dailyUsageResult && dailyUsageResult.length > 0) {
      dailyUsed = Number(dailyUsageResult[0].count);
    }
  } catch (error) {
    console.error('[DAILY_USAGE_ERROR]', error);
    // Continue execution even if this fails
  }

  const plan = user.subscriptionPlan as SubscriptionPlan;
  const limit = SUBSCRIPTION_LIMITS[plan];
  const used = user.usageThisMonth;
  
  // Get daily usage information
  const dailyLimit = DAILY_LIMITS[plan];
  const isDailyExceeded = dailyUsed >= dailyLimit;

  return {
    used,
    limit,
    isExceeded: used >= limit,
    dailyUsed,
    dailyLimit,
    isDailyExceeded
  };
}

/**
 * Check if user can perform a repurposing operation, with fallback for when DailyUsage table doesn't exist
 */
export async function canRepurpose(userId: string): Promise<boolean> {
  try {
    // First check if monthly limit is exceeded
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionPlan: true,
        usageThisMonth: true
      }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const plan = user.subscriptionPlan as SubscriptionPlan;
    const monthlyLimit = SUBSCRIPTION_LIMITS[plan];
    const isMonthlyExceeded = user.usageThisMonth >= monthlyLimit;
    
    // If monthly limit is exceeded, no need to check daily
    if (isMonthlyExceeded) {
      return false;
    }
    
    // Check daily limit
    try {
      const today = new Date(new Date().setHours(0, 0, 0, 0));
      const dailyLimit = DAILY_LIMITS[plan];
      
      // If there's no daily limit, we're good to go
      if (dailyLimit === Infinity) {
        return true;
      }
      
      // Try to query the DailyUsage table
      const dailyUsage = await prisma.dailyUsage.findUnique({
        where: {
          userId_date: {
            userId,
            date: today
          }
        }
      });
      
      const dailyUsed = dailyUsage?.count || 0;
      return dailyUsed < dailyLimit;
    } catch (error) {
      // If there's an error with DailyUsage table, assume daily limit is not exceeded
      console.error('Error checking daily usage (falling back to monthly only):', error);
      return true; // Since we already checked monthly limit
    }
  } catch (error) {
    console.error('Error checking if user can repurpose:', error);
    return false;
  }
}

/**
 * Increment user's usage count for the current month and day
 */
export async function incrementUsage(userId: string): Promise<void> {
  const today = new Date(new Date().setHours(0, 0, 0, 0)); // Today at midnight
  
  // Increment monthly usage
  await prisma.user.update({
    where: { id: userId },
    data: {
      usageThisMonth: {
        increment: 1
      }
    }
  });
  
  // Increment daily usage
  try {
    await prisma.dailyUsage.upsert({
      where: {
        userId_date: {
          userId,
          date: today
        }
      },
      create: {
        userId,
        date: today,
        count: 1
      },
      update: {
        count: {
          increment: 1
        }
      }
    });
  } catch (error) {
    console.error('Error updating daily usage:', error);
    // Continue without failing - daily usage tracking is not critical
  }
}

/**
 * Reset all users' usage counts (to be called on the 1st of each month)
 */
export async function resetAllUsageCounts(): Promise<void> {
  // Reset monthly usage for all users
  await prisma.user.updateMany({
    data: {
      usageThisMonth: 0
    }
  });
  
  // Try to delete all daily usage records
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "DailyUsage"`);
  } catch (error) {
    console.error('Error resetting daily usage counts:', error);
    // Continue execution even if this fails
  }
}

/**
 * Update user's subscription plan
 */
export async function updateSubscription(
  userId: string,
  plan: SubscriptionPlan,
  status: 'active' | 'inactive' | 'canceled' = 'active',
  renewalDate?: Date
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionPlan: plan,
      subscriptionStatus: status,
      subscriptionRenewalDate: renewalDate
    }
  });
}

/**
 * Record an overage charge for a user
 */
export async function recordOverageCharge(
  userId: string,
  count: number
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionPlan: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const plan = user.subscriptionPlan as SubscriptionPlan;
    const rate = OVERAGE_PRICING[plan];
    const amount = rate * count;

    // Check if OverageCharge table exists
    try {
      await prisma.$executeRawUnsafe(`SELECT 1 FROM "OverageCharge" LIMIT 1`);
    } catch (e) {
      // OverageCharge table doesn't exist
      console.log('OverageCharge table does not exist, skipping overage tracking');
      return;
    }

    // If we get here, the table exists
    await prisma.$executeRawUnsafe(
      `INSERT INTO "OverageCharge" ("id", "userId", "amount", "count", "date", "status") 
       VALUES ($1, $2, $3, $4, NOW(), 'pending')`,
      generateId(),
      userId,
      amount,
      count
    );
  } catch (error) {
    console.error('Error recording overage charge:', error);
    // Don't throw the error - just log it
  }
}

// Helper function to generate CUID-like IDs
function generateId(): string {
  return 'cuid_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
} 