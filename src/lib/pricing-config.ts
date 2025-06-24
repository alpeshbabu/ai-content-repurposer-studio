/**
 * Centralized Pricing Configuration
 * 
 * CRITICAL: This file is the single source of truth for all pricing.
 * All pricing displays, usage limits, and Stripe integrations MUST
 * reference this configuration to ensure consistency.
 * 
 * Must match SUBSCRIPTION.md specifications exactly.
 */

export type PlanLimits = number | -1; // -1 represents unlimited

export interface PlanConfig {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly monthlyLimit: PlanLimits;
  readonly overagePrice: number;
  readonly teamMembers: number;
  readonly additionalMemberPrice: number;
  readonly features: readonly string[];
  readonly stripePriceId: string | null | undefined;
  readonly stripeOveragePriceId: string | undefined;
  readonly stripeAdditionalMemberPriceId: string | undefined;
  readonly support: string;
  readonly analytics: string;
}

export const PRICING_CONFIG = {
  plans: {
    free: {
      id: 'free',
      name: 'Free',
      price: 0,
      monthlyLimit: 5 as PlanLimits,
      overagePrice: 0.12,
      teamMembers: 1,
      additionalMemberPrice: 0,
      features: [
        'Basic AI model',
        'Twitter & Instagram templates',
        'No credit card required'
      ],
      stripePriceId: null, // Free plan doesn't need Stripe price
      stripeOveragePriceId: process.env.STRIPE_FREE_OVERAGE_PRICE_ID,
      stripeAdditionalMemberPriceId: undefined, // Free plan doesn't support teams
      support: 'Community',
      analytics: 'Basic'
    },
    basic: {
      id: 'basic',
      name: 'Basic',
      price: 6.99,
      monthlyLimit: 60 as PlanLimits,
      overagePrice: 0.10,
      teamMembers: 1,
      additionalMemberPrice: 0,
      features: [
        'Standard AI model',
        'Twitter, Instagram & Facebook templates',
        'Basic customer support',
        'Basic Analytics'
      ],
      stripePriceId: process.env.STRIPE_BASIC_PRICE_ID,
      stripeOveragePriceId: process.env.STRIPE_BASIC_OVERAGE_PRICE_ID,
      stripeAdditionalMemberPriceId: undefined, // Basic plan doesn't support teams
      support: 'Basic',
      analytics: 'Basic'
    },
    pro: {
      id: 'pro',
      name: 'Pro',
      price: 14.99,
      monthlyLimit: 150 as PlanLimits,
      overagePrice: 0.08,
      teamMembers: 1,
      additionalMemberPrice: 0,
      features: [
        'Advanced AI model',
        'All platforms + custom templates',
        'Twitter, Instagram, Facebook, LinkedIn, Thread, TikTok, YouTube, Email, Newsletter',
        'Professional customer support',
        'Professional Analytics'
      ],
      stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
      stripeOveragePriceId: process.env.STRIPE_PRO_OVERAGE_PRICE_ID,
      stripeAdditionalMemberPriceId: undefined, // Pro plan doesn't support teams
      support: 'Professional',
      analytics: 'Professional'
    },
    agency: {
      id: 'agency',
      name: 'Agency',
      price: 29.99,
      monthlyLimit: 450 as PlanLimits,
      overagePrice: 0.06,
      teamMembers: 3,
      additionalMemberPrice: 6.99,
      features: [
        'Advanced AI model',
        'Priority Support',
        'All platforms + custom templates',
        'Twitter, Instagram, Facebook, LinkedIn, Thread, TikTok, YouTube, Email, Newsletter',
        'Professional Analytics',
        'Team collaboration & analytics',
        'Up to 3 team members included'
      ],
      stripePriceId: process.env.STRIPE_AGENCY_PRICE_ID,
      stripeOveragePriceId: process.env.STRIPE_AGENCY_OVERAGE_PRICE_ID,
      stripeAdditionalMemberPriceId: process.env.STRIPE_AGENCY_ADDITIONAL_MEMBER_PRICE_ID,
      support: 'Priority',
      analytics: 'Professional'
    }
  } satisfies Record<string, PlanConfig>,
  api: {
    name: 'API Access',
    description: 'Pay-as-you-go for developers',
    pricePerRequest: 0.10,
    stripePriceId: process.env.STRIPE_API_ACCESS_PRICE_ID,
    features: [
      'Programmatic access',
      'Usage dashboard',
      'API documentation',
      'Developer support'
    ]
  },
  hierarchy: ['free', 'basic', 'pro', 'agency']
} as const;

export type PlanType = keyof typeof PRICING_CONFIG.plans;

/**
 * Get plan configuration by plan ID
 */
export function getPlanConfig(planId: PlanType) {
  return PRICING_CONFIG.plans[planId];
}

/**
 * Check if target plan is an upgrade from current plan
 */
export function isUpgrade(currentPlan: PlanType, targetPlan: PlanType): boolean {
  const currentIndex = PRICING_CONFIG.hierarchy.indexOf(currentPlan);
  const targetIndex = PRICING_CONFIG.hierarchy.indexOf(targetPlan);
  return targetIndex > currentIndex;
}

/**
 * Check if target plan is a downgrade from current plan
 */
export function isDowngrade(currentPlan: PlanType, targetPlan: PlanType): boolean {
  const currentIndex = PRICING_CONFIG.hierarchy.indexOf(currentPlan);
  const targetIndex = PRICING_CONFIG.hierarchy.indexOf(targetPlan);
  return targetIndex < currentIndex;
}

/**
 * Get user-friendly limit display
 */
export function getLimitDisplay(plan: PlanType): {
  monthly: string;
} {
  const config = getPlanConfig(plan);
  return {
    monthly: config.monthlyLimit === -1 ? 'Unlimited' : `${config.monthlyLimit} per month`
  };
}

/**
 * Calculate overage charges
 */
export function calculateOverageCharges(plan: PlanType, overageCount: number): number {
  const config = getPlanConfig(plan);
  return overageCount * config.overagePrice;
}

/**
 * Get all plans as array for display
 */
export function getAllPlans() {
  return PRICING_CONFIG.hierarchy.map(planId => PRICING_CONFIG.plans[planId]);
}

/**
 * Validate that pricing matches Stripe configuration
 */
export function validatePricingConfiguration(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check that all required environment variables are set
  if (!process.env.STRIPE_BASIC_PRICE_ID) {
    errors.push('STRIPE_BASIC_PRICE_ID environment variable is required');
  }
  if (!process.env.STRIPE_PRO_PRICE_ID) {
    errors.push('STRIPE_PRO_PRICE_ID environment variable is required');
  }
  if (!process.env.STRIPE_AGENCY_PRICE_ID) {
    errors.push('STRIPE_AGENCY_PRICE_ID environment variable is required');
  }

  // Check overage price IDs
  if (!process.env.STRIPE_FREE_OVERAGE_PRICE_ID) {
    errors.push('STRIPE_FREE_OVERAGE_PRICE_ID environment variable is required');
  }
  if (!process.env.STRIPE_BASIC_OVERAGE_PRICE_ID) {
    errors.push('STRIPE_BASIC_OVERAGE_PRICE_ID environment variable is required');
  }
  if (!process.env.STRIPE_PRO_OVERAGE_PRICE_ID) {
    errors.push('STRIPE_PRO_OVERAGE_PRICE_ID environment variable is required');
  }
  if (!process.env.STRIPE_AGENCY_OVERAGE_PRICE_ID) {
    errors.push('STRIPE_AGENCY_OVERAGE_PRICE_ID environment variable is required');
  }

  // Check API access
  if (!process.env.STRIPE_API_ACCESS_PRICE_ID) {
    errors.push('STRIPE_API_ACCESS_PRICE_ID environment variable is required');
  }

  // Check additional member pricing for Agency plan
  if (!process.env.STRIPE_AGENCY_ADDITIONAL_MEMBER_PRICE_ID) {
    errors.push('STRIPE_AGENCY_ADDITIONAL_MEMBER_PRICE_ID environment variable is required for Agency plan team member billing');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
