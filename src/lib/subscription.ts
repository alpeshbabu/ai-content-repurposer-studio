import { prisma } from './prisma'

export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'agency'

export interface UsageInfo {
  used: number
  limit: number
  isExceeded: boolean
}

export interface SubscriptionUsage {
  monthly: number
  monthlyLimit: number
  monthlyRemaining: number
  totalUsed: number
  isOverLimit: boolean
  plan: SubscriptionPlan
}

export interface UsageResult {
  canUse: boolean
  reason?: string
  usageDetails: SubscriptionUsage
}

// Monthly limits - MUST match SUBSCRIPTION.md exactly
export const SUBSCRIPTION_LIMITS = {
  free: 5,
  basic: 60,
  pro: 150,
  agency: 450
} as const;

// Overage pricing per additional use
export const OVERAGE_PRICING = {
  free: 0.12,   // $0.12 per overage for free
  basic: 0.10,  // $0.10 per overage for basic
  pro: 0.08,    // $0.08 per overage for pro
  agency: 0.06  // $0.06 per overage for agency
} as const;

/**
 * Get user's usage information for the current month
 */
export async function getUserUsage(userId: string): Promise<UsageInfo> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Daily usage tracking has been removed

  const plan = user.subscriptionPlan as SubscriptionPlan;
  const limit = SUBSCRIPTION_LIMITS[plan];
  const used = user.usageThisMonth;
  
  // Daily limits have been removed - only monthly limits are used
  return {
    used,
    limit,
    isExceeded: used >= limit
  };
}

/**
 * Check if user can perform a repurposing operation, using only monthly limits
 */
export async function canUserRepurpose(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user) return false;

    const plan = (user.subscription?.tier || 'free') as SubscriptionPlan;
    const monthlyLimit = SUBSCRIPTION_LIMITS[plan];
    const monthlyUsed = user.usageThisMonth || 0;

    // If monthly limit is exceeded, check if overage is allowed
    if (monthlyUsed >= monthlyLimit) {
      return user.overageConsent || false;
    }

    return true;
  } catch (error) {
    console.error('Error checking user repurpose ability:', error);
    return false;
  }
}

/**
 * Increment user's usage count
 */
export async function incrementUsage(
  userId: string, 
  chargeOverage = false
): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      // Update monthly usage
      await tx.user.update({
        where: { id: userId },
        data: {
          usageThisMonth: {
            increment: 1
          }
        }
      });
    });
  } catch (error) {
    console.error('Error updating usage:', error);
  }
}

/**
 * Reset monthly usage counts at the start of each month
 */
export async function resetMonthlyUsage(): Promise<void> {
  try {
    await prisma.user.updateMany({
      data: {
        usageThisMonth: 0
      }
    });
    console.log('Monthly usage counts reset successfully');
  } catch (error) {
    console.error('Error resetting monthly usage counts:', error);
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

export async function getUserSubscriptionUsage(userId: string): Promise<SubscriptionUsage> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true }
  });

  if (!user || !user.subscription) {
    return {
      monthly: 0,
      monthlyLimit: SUBSCRIPTION_LIMITS.free,
      monthlyRemaining: SUBSCRIPTION_LIMITS.free,
      totalUsed: 0,
      isOverLimit: false,
      plan: 'free'
    };
  }

  const plan = user.subscription.tier as SubscriptionPlan;
  const monthlyLimit = SUBSCRIPTION_LIMITS[plan];
  const monthly = user.usageThisMonth || 0;

  return {
    monthly,
    monthlyLimit,
    monthlyRemaining: Math.max(0, monthlyLimit - monthly),
    totalUsed: monthly,
    isOverLimit: monthly >= monthlyLimit,
    plan
  };
} 