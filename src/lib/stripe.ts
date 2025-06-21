import Stripe from 'stripe';

// Server-side Stripe instance - lazy initialization for serverless
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey) {
      console.error('[STRIPE_INIT] Environment variables check:', {
        hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        secretKeyPreview: process.env.STRIPE_SECRET_KEY ? 
          `${process.env.STRIPE_SECRET_KEY.substring(0, 7)}...` : 'undefined'
      });
      throw new Error('STRIPE_SECRET_KEY is not configured in environment variables');
    }
    
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

// Plan details
export const PLAN_DETAILS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: ['5 content repurposes per month', 'Basic AI model', 'Twitter & Instagram templates', 'No daily limit'],
    limits: { monthlyLimit: 5, dailyLimit: -1, overageRate: 0.12, maxTeamMembers: 0 }
  },
  basic: {
    name: 'Basic',
    price: 6.99,
    priceId: STRIPE_PRICE_IDS.basic,
    features: ['2 repurposes per day (60/month)', 'Standard AI model', 'Twitter, Instagram & Facebook templates', 'Basic customer support', 'Basic Analytics'],
    limits: { monthlyLimit: 60, dailyLimit: 2, overageRate: 0.10, maxTeamMembers: 0 }
  },
  pro: {
    name: 'Pro',
    price: 14.99,
    priceId: STRIPE_PRICE_IDS.pro,
    features: ['5 repurposes per day (150/month)', 'Advanced AI model', 'All major platforms + LinkedIn templates', 'Professional customer support', 'Professional Analytics'],
    limits: { monthlyLimit: 150, dailyLimit: 5, overageRate: 0.08, maxTeamMembers: 0 }
  },
  agency: {
    name: 'Agency',
    price: 29.99,
    priceId: STRIPE_PRICE_IDS.agency,
    features: ['450 repurposes per month', 'No daily limit', 'Up to 3 team members', 'Advanced AI model', 'All platforms + custom templates', 'Priority Support', 'Team collaboration & analytics'],
    limits: { monthlyLimit: 450, dailyLimit: -1, overageRate: 0.06, maxTeamMembers: 3 }
  }
} as const; 