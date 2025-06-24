import { prisma } from './prisma';
import { SUBSCRIPTION_LIMITS, OVERAGE_PRICING, SubscriptionPlan } from './subscription';
import { PRICING_CONFIG, validatePricingConfiguration } from './pricing-config';

/**
 * Validate that the subscription plans match the requirements
 */
export async function validateSubscriptionRequirements(): Promise<{
  success: boolean;
  issues: string[];
}> {
  const issues: string[] = [];
  
  // 1. Validate Subscription Plan Limits using centralized config
  if (PRICING_CONFIG.plans.free.monthlyLimit !== 5) {
    issues.push('Free tier should allow 5 repurposes per month');
  }
  
  if (PRICING_CONFIG.plans.basic.monthlyLimit !== 60) {
    issues.push('Basic tier should allow 60 repurposes per month');
  }
  
  if (PRICING_CONFIG.plans.pro.monthlyLimit !== 150) {
    issues.push('Pro tier should allow 150 repurposes per month');
  }
  
  if (PRICING_CONFIG.plans.agency.monthlyLimit !== 450) {
    issues.push('Agency tier should allow 450 repurposes per month');
  }
  
  // 2. Validate Overage Pricing
  if (PRICING_CONFIG.plans.free.overagePrice !== 0.12) {
    issues.push('Free tier should charge $0.12 per additional repurpose');
  }
  
  if (PRICING_CONFIG.plans.basic.overagePrice !== 0.10) {
    issues.push('Basic tier should charge $0.10 per additional repurpose');
  }
  
  if (PRICING_CONFIG.plans.pro.overagePrice !== 0.08) {
    issues.push('Pro tier should charge $0.08 per additional repurpose');
  }
  
  if (PRICING_CONFIG.plans.agency.overagePrice !== 0.06) {
    issues.push('Agency tier should charge $0.06 per additional repurpose');
  }
  
  // 4. Validate Plan Prices
  if (PRICING_CONFIG.plans.free.price !== 0) {
    issues.push('Free tier should cost $0');
  }
  
  if (PRICING_CONFIG.plans.basic.price !== 6.99) {
    issues.push('Basic tier should cost $6.99');
  }
  
  if (PRICING_CONFIG.plans.pro.price !== 14.99) {
    issues.push('Pro tier should cost $14.99');
  }
  
  if (PRICING_CONFIG.plans.agency.price !== 29.99) {
    issues.push('Agency tier should cost $29.99');
  }
  
  // 5. Validate Team Member Limits
  if (PRICING_CONFIG.plans.agency.teamMembers !== 3) {
    issues.push('Agency tier should include 3 team members');
  }
  
  if (PRICING_CONFIG.plans.agency.additionalMemberPrice !== 6.99) {
          issues.push('Agency tier should add additional member for just $6.99/month');
  }
  
  // 6. Validate API Access Pricing
  if (PRICING_CONFIG.api.pricePerRequest !== 0.10) {
    issues.push('API access should cost $0.10 per request');
  }
  
  // 7. Validate Stripe Environment Variables
  const stripValidation = validatePricingConfiguration();
  if (!stripValidation.valid) {
    issues.push(...stripValidation.errors);
  }
  
  // 8. Validate database schema matches requirements
  try {
    // Check User model has required subscription fields
    const userFields = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
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
  const overageRate = OVERAGE_PRICING[plan];
  
  const monthly = monthlyLimit === Infinity ? 'Unlimited' : `${monthlyLimit}`;
  
  return `${monthly} repurposes per month, $${overageRate} overage rate`;
}

/**
 * Check if a plan allows unlimited daily usage
 */
export function hasUnlimitedDaily(plan: SubscriptionPlan): boolean {
  return false;
}

/**
 * Check if a plan allows unlimited monthly usage
 */
export function hasUnlimitedMonthly(plan: SubscriptionPlan): boolean {
  return SUBSCRIPTION_LIMITS[plan] === Infinity;
} 