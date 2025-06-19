import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Plan hierarchy for comparison
const PLAN_HIERARCHY = {
  free: 0,
  basic: 1,
  pro: 2,
  agency: 3,
} as const;

export interface SubscriptionCheck {
  hasAccess: boolean;
  currentPlan: string;
  requiredPlan?: string;
  isActive: boolean;
  redirectUrl?: string;
}

/**
 * Check if user has access to a specific plan feature
 */
export async function checkSubscriptionAccess(
  requiredPlan: keyof typeof PLAN_HIERARCHY,
  userId?: string
): Promise<SubscriptionCheck> {
  if (!userId) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        hasAccess: false,
        currentPlan: 'free',
        requiredPlan,
        isActive: false,
        redirectUrl: '/auth/signin'
      };
    }
    userId = session.user.id;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionPlan: true,
      subscriptionStatus: true,
      subscriptions: {
        where: { 
          status: { in: ['active', 'trialing'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  if (!user) {
    return {
      hasAccess: false,
      currentPlan: 'free',
      requiredPlan,
      isActive: false,
      redirectUrl: '/dashboard'
    };
  }

  const currentPlan = user.subscriptionPlan || 'free';
  const isActive = user.subscriptionStatus === 'active' || user.subscriptions.length > 0;
  
  // For free plan, always allow access
  if (requiredPlan === 'free') {
    return {
      hasAccess: true,
      currentPlan,
      isActive,
    };
  }

  // Check if current plan meets requirement
  const currentPlanLevel = PLAN_HIERARCHY[currentPlan as keyof typeof PLAN_HIERARCHY] || 0;
  const requiredPlanLevel = PLAN_HIERARCHY[requiredPlan];
  
  const hasAccess = isActive && currentPlanLevel >= requiredPlanLevel;

  return {
    hasAccess,
    currentPlan,
    requiredPlan,
    isActive,
    redirectUrl: hasAccess ? undefined : `/dashboard/settings/subscription/checkout?plan=${requiredPlan}&return_url=${encodeURIComponent(window?.location?.pathname || '/dashboard')}`
  };
}

/**
 * Middleware wrapper to protect routes by subscription plan
 */
export function requireSubscription(requiredPlan: keyof typeof PLAN_HIERARCHY) {
  return async function subscriptionMiddleware(
    request: NextRequest,
    params?: any
  ) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    const access = await checkSubscriptionAccess(requiredPlan, session.user.id);

    if (!access.hasAccess) {
      // For API routes, return JSON error
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json(
          { 
            error: 'Subscription required',
            requiredPlan: access.requiredPlan,
            currentPlan: access.currentPlan,
            upgradeUrl: `/dashboard/settings/subscription/checkout?plan=${access.requiredPlan}`
          },
          { status: 402 } // Payment required
        );
      }
      
      // For pages, redirect to upgrade
      const upgradeUrl = new URL(`/dashboard/settings/subscription/checkout`, request.url);
      upgradeUrl.searchParams.set('plan', access.requiredPlan!);
      upgradeUrl.searchParams.set('return_url', request.nextUrl.pathname);
      
      return NextResponse.redirect(upgradeUrl);
    }

    return NextResponse.next();
  };
}

/**
 * Usage limit check
 */
export async function checkUsageLimit(userId: string): Promise<{
  canUse: boolean;
  usage: number;
  limit: number;
  plan: string;
  overageRate: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionPlan: true,
      subscriptionStatus: true,
      usageThisMonth: true,
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const plan = user.subscriptionPlan || 'free';
  const usage = user.usageThisMonth || 0;
  
  // Define limits per plan - MUST match SUBSCRIPTION.md exactly
  const limits = {
    free: 5,
    basic: 60,
    pro: 150,
    agency: 450, // Changed from -1 to 450 per SUBSCRIPTION.md
  };

  const overageRates = {
    free: 0.12,
    basic: 0.10,
    pro: 0.08,
    agency: 0.06,
  };

  const limit = limits[plan as keyof typeof limits] || 5;
  const overageRate = overageRates[plan as keyof typeof overageRates] || 0.12;
  
  // Agency plan has the highest limit but is not unlimited
  // All plans have limits per SUBSCRIPTION.md

  return {
    canUse: usage < limit,
    usage,
    limit,
    plan,
    overageRate,
  };
}

/**
 * Feature access checker
 */
export const FEATURE_REQUIREMENTS = {
  // Content features
  'unlimited-repurposes': 'agency',
  'advanced-templates': 'pro',
  'custom-branding': 'basic',
  'api-access': 'pro',
  'bulk-processing': 'pro',
  
  // Team features
  'team-management': 'agency',
  'team-analytics': 'agency',
  'team-collaboration': 'agency',
  
  // Analytics features
  'advanced-analytics': 'pro',
  'agency-analytics': 'agency',
  'export-reports': 'pro',
  
  // Support features
  'priority-support': 'basic',
  'dedicated-support': 'agency',
} as const;

export async function hasFeatureAccess(
  feature: keyof typeof FEATURE_REQUIREMENTS,
  userId?: string
): Promise<boolean> {
  const requiredPlan = FEATURE_REQUIREMENTS[feature];
  const access = await checkSubscriptionAccess(requiredPlan, userId);
  return access.hasAccess;
}

/**
 * Component wrapper for feature gating
 */
export function withSubscriptionGate<T extends object>(
  Component: React.ComponentType<T>,
  requiredPlan: keyof typeof PLAN_HIERARCHY,
  fallback?: React.ComponentType<{ upgradeUrl: string; requiredPlan: string }>
) {
  return function GatedComponent(props: T) {
    // This would need to be implemented on the client side
    // For now, return the component as-is
    return React.createElement(Component, props);
  };
} 