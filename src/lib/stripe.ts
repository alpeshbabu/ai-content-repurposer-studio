import Stripe from 'stripe';
import { getAllPlans } from '@/lib/pricing-config';

// Server-side Stripe instance - lazy initialization for serverless
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const rawSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!rawSecretKey) {
      console.error('[STRIPE_INIT] Environment variables check:', {
        hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        secretKeyPreview: process.env.STRIPE_SECRET_KEY ? 
          `${process.env.STRIPE_SECRET_KEY.substring(0, 7)}...` : 'undefined'
      });
      throw new Error('STRIPE_SECRET_KEY is not configured in environment variables');
    }

    // Clean the secret key to remove any invalid characters
    const secretKey = rawSecretKey.replace(/["'\n\r\t]/g, '').trim();
    
    console.log('[STRIPE_INIT] Key cleaning:', {
      originalLength: rawSecretKey.length,
      cleanedLength: secretKey.length,
      wasCleaned: rawSecretKey !== secretKey,
      prefix: secretKey.substring(0, 8)
    });
    
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-05-28.basil',
      typescript: true,
      telemetry: false,
      maxNetworkRetries: 2,
      timeout: 20000,
    });
    console.log('[STRIPE_INIT] Stripe client initialized successfully');
  }
  return stripeInstance;
}

// Create a Proxy that lazily initializes Stripe on first access
export const stripe = new Proxy({} as Stripe, {
  get(target, prop) {
    const stripeClient = getStripe();
    return stripeClient[prop as keyof Stripe];
  }
});

// Client-side Stripe configuration
export const getStripePromise = async () => {
  if (typeof window === 'undefined') return null;
  
  const { loadStripe } = await import('@stripe/stripe-js');
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
};

// Stripe price IDs for different plans
export const STRIPE_PRICE_IDS = {
  basic: process.env.STRIPE_BASIC_PRICE_ID || 'price_test_basic_placeholder',
  pro: process.env.STRIPE_PRO_PRICE_ID || 'price_test_pro_placeholder',
  agency: process.env.STRIPE_AGENCY_PRICE_ID || 'price_test_agency_placeholder',
} as const;

// Validate Stripe configuration
export function validateStripeConfig() {
  const missingVars = [];
  
  if (!process.env.STRIPE_SECRET_KEY) missingVars.push('STRIPE_SECRET_KEY');
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) missingVars.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
  if (!process.env.STRIPE_BASIC_PRICE_ID) missingVars.push('STRIPE_BASIC_PRICE_ID');
  if (!process.env.STRIPE_PRO_PRICE_ID) missingVars.push('STRIPE_PRO_PRICE_ID');
  if (!process.env.STRIPE_AGENCY_PRICE_ID) missingVars.push('STRIPE_AGENCY_PRICE_ID');
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}

// Plan details - now using centralized pricing config
export function getPlanDetails() {
  const plans = getAllPlans();
  const planDetails: Record<string, {
    name: string;
    price: number;
    priceId: string | null | undefined;
    features: readonly string[];
    limits: {
      monthlyLimit: number;
      dailyLimit: number;
      overageRate: number;
      maxTeamMembers: number;
    };
  }> = {};
  
  plans.forEach(plan => {
    planDetails[plan.id] = {
      name: plan.name,
      price: plan.price,
      priceId: plan.stripePriceId,
      features: plan.features,
      limits: {
        monthlyLimit: plan.monthlyLimit === -1 ? -1 : plan.monthlyLimit,
        dailyLimit: plan.dailyLimit === -1 ? -1 : plan.dailyLimit,
        overageRate: plan.overagePrice,
        maxTeamMembers: plan.teamMembers > 1 ? plan.teamMembers : 0
      }
    };
  });
  
  return planDetails;
}

// Backward compatibility - will be deprecated
export const PLAN_DETAILS = new Proxy({}, {
  get(target, prop) {
    console.warn('PLAN_DETAILS is deprecated. Use getPlanDetails() instead.');
    return getPlanDetails()[prop as string];
  }
}); 