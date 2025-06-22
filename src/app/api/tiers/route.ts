import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withPrisma } from '@/lib/prisma-dynamic'

// Force dynamic to prevent build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Tier endpoint mapping
const TIER_ENDPOINTS = {
  free: '/api/tiers/free',
  basic: '/api/tiers/basic', 
  pro: '/api/tiers/pro',
  agency: '/api/tiers/agency'
} as const;

// Tier feature comparison
const TIER_FEATURES = {
  free: {
    monthlyLimit: 5,
    dailyLimit: 'unlimited',
    platforms: ['twitter', 'instagram'],
    aiModel: 'basic',
    analytics: false,
    teamCollaboration: false,
    prioritySupport: false,
    price: 0
  },
  basic: {
    monthlyLimit: 60,
    dailyLimit: 2,
    platforms: ['twitter', 'instagram', 'facebook'],
    aiModel: 'standard',
    analytics: true,
    teamCollaboration: false,
    prioritySupport: false,
    price: 6.99
  },
  pro: {
    monthlyLimit: 150,
    dailyLimit: 5,
    platforms: ['twitter', 'instagram', 'facebook', 'linkedin', 'thread', 'tiktok', 'youtube', 'email', 'newsletter'],
    aiModel: 'advanced',
    analytics: true,
    teamCollaboration: false,
    prioritySupport: true,
    price: 14.99
  },
  agency: {
    monthlyLimit: 450,
    dailyLimit: 'unlimited',
    platforms: ['twitter', 'instagram', 'facebook', 'linkedin', 'thread', 'email', 'newsletter', 'youtube', 'tiktok'],
    aiModel: 'premium',
    analytics: true,
    teamCollaboration: true,
    prioritySupport: true,
    price: 29.99,
    teamMembers: 3
  }
};

/**
 * GET /api/tiers - Get tier information and user's current tier
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Unauthorized',
          availableTiers: TIER_FEATURES
        }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get user's current subscription plan
    const user = await withPrisma(async (prisma) => {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          subscriptionPlan: true,
          subscriptionStatus: true,
          usageThisMonth: true,
          subscriptions: {
            where: { status: { in: ['active', 'trialing'] } },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });
    });

    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: 'User not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const currentTier = user.subscriptionPlan as keyof typeof TIER_FEATURES;
    const hasActiveSubscription = user.subscriptionStatus === 'active' || user.subscriptions.length > 0;

    return NextResponse.json({
      success: true,
      data: {
        currentTier,
        hasActiveSubscription,
        currentUsage: user.usageThisMonth,
        tierEndpoint: TIER_ENDPOINTS[currentTier],
        tierFeatures: TIER_FEATURES[currentTier],
        allTiers: TIER_FEATURES,
        endpoints: TIER_ENDPOINTS
      }
    });

  } catch (error) {
    console.error('[TIER_INFO_ERROR]', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'Failed to get tier information'
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /api/tiers - Route request to appropriate tier endpoint
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get user's current subscription plan
    const user = await withPrisma(async (prisma) => {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          subscriptionPlan: true,
          subscriptionStatus: true
        }
      });
    });

    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: 'User not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const currentTier = user.subscriptionPlan as keyof typeof TIER_ENDPOINTS;
    const tierEndpoint = TIER_ENDPOINTS[currentTier];

    if (!tierEndpoint) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Invalid tier',
          message: `Unknown subscription plan: ${user.subscriptionPlan}`,
          availableTiers: Object.keys(TIER_ENDPOINTS)
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body to forward it
    const body = await req.json();

    // Create a new request to the tier-specific endpoint
    const tierUrl = new URL(tierEndpoint + '/repurpose', req.url);
    const tierRequest = new Request(tierUrl.toString(), {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify(body)
    });

    // Forward the request to the appropriate tier endpoint
    const response = await fetch(tierRequest);
    const responseData = await response.json();

    // Return the response from the tier-specific endpoint
    return new NextResponse(
      JSON.stringify({
        ...responseData,
        routedTo: tierEndpoint,
        tier: currentTier
      }),
      { 
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[TIER_ROUTER_ERROR]', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'Failed to route request to tier endpoint'
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 