import { prisma } from './prisma';
import { SUBSCRIPTION_LIMITS, DAILY_LIMITS, OVERAGE_PRICING, SubscriptionPlan } from './subscription';

/**
 * Validate that the subscription plans match the requirements
 */
export async function validateSubscriptionRequirements(): Promise<{
  success: boolean;
  issues: string[];
}> {
  const issues: string[] = [];
  
  // 1. Validate Subscription Plan Limits
  if (SUBSCRIPTION_LIMITS.free !== 5) {
    issues.push('Free tier should allow 5 repurposes per month');
  }
  
  if (SUBSCRIPTION_LIMITS.basic !== 60) {
    issues.push('Basic tier should allow 60 repurposes per month');
  }
  
  if (SUBSCRIPTION_LIMITS.pro !== 150) {
    issues.push('Pro tier should allow 150 repurposes per month');
  }
  
  if (SUBSCRIPTION_LIMITS.agency !== 450) {
    issues.push('Agency tier should allow 450 repurposes per month');
  }
  
  // 2. Validate Daily Limits
  if (DAILY_LIMITS.free !== Infinity) {
    issues.push('Free tier should have no daily limit');
  }
  
  if (DAILY_LIMITS.basic !== 2) {
    issues.push('Basic tier should allow 2 repurposes per day');
  }
  
  if (DAILY_LIMITS.pro !== 5) {
    issues.push('Pro tier should allow 5 repurposes per day');
  }
  
  if (DAILY_LIMITS.agency !== Infinity) {
    issues.push('Agency tier should have no daily limit');
  }
  
  // 3. Validate Overage Pricing
  if (OVERAGE_PRICING.free !== 0.12) {
    issues.push('Free tier should charge $0.12 per additional repurpose');
  }
  
  if (OVERAGE_PRICING.basic !== 0.10) {
    issues.push('Basic tier should charge $0.10 per additional repurpose');
  }
  
  if (OVERAGE_PRICING.pro !== 0.08) {
    issues.push('Pro tier should charge $0.08 per additional repurpose');
  }
  
  if (OVERAGE_PRICING.agency !== 0.06) {
    issues.push('Agency tier should charge $0.06 per additional repurpose');
  }
  
  // 4. Validate database schema matches requirements
  try {
    // Check User model has required subscription fields
    const userFields = await prisma.$queryRawUnsafe<any[]>(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'User'`
    );
    
    const userFieldNames = userFields.map(f => f.column_name?.toLowerCase());
    
    if (!userFieldNames.includes('subscriptionplan')) {
      issues.push('User model is missing subscriptionPlan field');
    }
    
    if (!userFieldNames.includes('subscriptionstatus')) {
      issues.push('User model is missing subscriptionStatus field');
    }
    
    if (!userFieldNames.includes('subscriptionrenewaldate')) {
      issues.push('User model is missing subscriptionRenewalDate field');
    }
    
    if (!userFieldNames.includes('usagethismonth')) {
      issues.push('User model is missing usageThisMonth field');
    }
    
    if (!userFieldNames.includes('teamid')) {
      issues.push('User model is missing teamId field for Agency plan');
    }
    
  } catch (error) {
    console.error('Error validating database schema:', error);
    issues.push('Could not validate database schema: ' + (error instanceof Error ? error.message : String(error)));
  }
  
  return {
    success: issues.length === 0,
    issues
  };
}

/**
 * Get a human readable plan description
 */
export function getPlanDescription(plan: SubscriptionPlan): string {
  const monthlyLimit = SUBSCRIPTION_LIMITS[plan];
  const dailyLimit = DAILY_LIMITS[plan];
  const overageRate = OVERAGE_PRICING[plan];
  
  const monthly = monthlyLimit === Infinity ? 'Unlimited' : `${monthlyLimit}`;
  const daily = dailyLimit === Infinity ? 'No daily limit' : `${dailyLimit} per day`;
  
  return `${monthly} repurposes per month, ${daily}, $${overageRate} overage rate`;
}

/**
 * Check if a plan allows unlimited daily usage
 */
export function hasUnlimitedDaily(plan: SubscriptionPlan): boolean {
  return DAILY_LIMITS[plan] === Infinity;
}

/**
 * Check if a plan allows unlimited monthly usage
 */
export function hasUnlimitedMonthly(plan: SubscriptionPlan): boolean {
  return SUBSCRIPTION_LIMITS[plan] === Infinity;
} 