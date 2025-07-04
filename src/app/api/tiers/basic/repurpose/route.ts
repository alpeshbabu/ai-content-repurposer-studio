import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withPrisma } from '@/lib/prisma-dynamic'
import { aiService, Platform } from '@/lib/ai-service'
import { z } from 'zod'

// Force dynamic to prevent build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// BASIC TIER CONFIGURATION
const BASIC_TIER_CONFIG = {
  PLAN_NAME: 'Basic',
  MONTHLY_LIMIT: 60,
  OVERAGE_RATE: 0.10,
  FEATURES: [
    'Standard AI model',
    'Twitter, Instagram & Facebook templates',
    'Basic customer support',
    'Basic Analytics'
  ]
} as const;

// Validation schema for Basic tier
const basicRepurposeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150, 'Title too long'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long for basic tier'),
  contentType: z.string().min(1, 'Content type is required'),
  platforms: z.array(z.enum(['twitter', 'instagram', 'facebook'])).max(3, 'Basic tier limited to 3 platforms').optional(),
  brandVoice: z.string().optional(),
  tone: z.enum(['professional', 'casual', 'friendly', 'formal']).optional(),
  allowOverage: z.boolean().default(false),
  schedule: z.object({
    publishAt: z.string().optional(),
    timezone: z.string().optional()
  }).optional()
});

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

    // Parse and validate request body
    const body = await req.json();
    const validation = basicRepurposeSchema.safeParse(body);
    
    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.error.issues,
          tierLimitations: BASIC_TIER_CONFIG.FEATURES
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { title, content, contentType, platforms, brandVoice, tone, allowOverage, schedule } = validation.data;

    // Verify user is on Basic tier
    const user = await withPrisma(async (prisma) => {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          subscriptionPlan: true,
          subscriptionStatus: true,
          usageThisMonth: true,
          overageConsent: true
        }
      });
    });

    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: 'User not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Enforce Basic tier restriction
    if (user.subscriptionPlan !== 'basic') {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Tier mismatch', 
          message: `This endpoint is for Basic tier users only. Your plan: ${user.subscriptionPlan}`,
          correctEndpoint: `/api/tiers/${user.subscriptionPlan}/repurpose`
        }), 
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check subscription status
    if (user.subscriptionStatus !== 'active') {
      return new NextResponse(
        JSON.stringify({
          error: 'Subscription inactive',
          message: 'Your Basic subscription is not active. Please update your payment method.',
          subscriptionStatus: user.subscriptionStatus
        }), 
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check usage limits
    const currentUsage = user.usageThisMonth;
    const isMonthlyAtLimit = currentUsage >= BASIC_TIER_CONFIG.MONTHLY_LIMIT;

    // Fetch user's preferred platforms and overage settings from settings
    let preferredPlatforms: string[] = [];
    let overageEnabled = false;
    try {
      const settings = await withPrisma(async (prisma) => {
        return await prisma.settings.findUnique({ 
          where: { userId },
          select: { 
            preferredPlatforms: true,
            overageEnabled: true
          }
        });
      });
      preferredPlatforms = settings?.preferredPlatforms || [];
      overageEnabled = settings?.overageEnabled || false;
    } catch (error) {
      console.error('Error fetching user settings:', error);
    }

    // Check if overage is allowed (from request, user consent, or settings)
    const shouldAllowOverage = allowOverage || user.overageConsent || overageEnabled;

    if (isMonthlyAtLimit && !shouldAllowOverage) {
      return new NextResponse(
        JSON.stringify({
          error: 'Monthly limit reached',
          message: `Basic tier allows ${BASIC_TIER_CONFIG.MONTHLY_LIMIT} repurposes per month. Enable overage charges in your settings to continue.`,
          currentUsage,
          limit: BASIC_TIER_CONFIG.MONTHLY_LIMIT,
          overageRate: BASIC_TIER_CONFIG.OVERAGE_RATE,
          overageEnabled,
          upgradeOptions: [
            { plan: 'pro', monthlyLimit: 150, price: 14.99 },
            { plan: 'agency', monthlyLimit: 450, price: 39.99 }
          ]
        }), 
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle overage if allowed
    let overageCharge = 0;
    if (isMonthlyAtLimit && shouldAllowOverage) {
      overageCharge = BASIC_TIER_CONFIG.OVERAGE_RATE;
    }

    // Determine platforms to use based on user preferences and tier limitations
    let platformsToUse: Platform[];

    if (platforms && platforms.length > 0) {
      // Use platforms from request, filtered by tier restrictions
      platformsToUse = platforms.filter(p => BASIC_TIER_CONFIG.ALLOWED_PLATFORMS.includes(p)) as Platform[];
    } else if (preferredPlatforms.length > 0) {
      // Use user's preferred platforms, filtered by tier restrictions
      platformsToUse = preferredPlatforms.filter(p => BASIC_TIER_CONFIG.ALLOWED_PLATFORMS.includes(p as Platform)) as Platform[];
    } else {
      // Use all available platforms for the tier
      platformsToUse = BASIC_TIER_CONFIG.ALLOWED_PLATFORMS;
    }

    // Ensure we have at least one platform
    if (platformsToUse.length === 0) {
      return new NextResponse(
        JSON.stringify({
          error: 'No platforms available',
          message: 'No platforms are available for your Basic tier subscription or your preferred platforms.',
          availablePlatforms: BASIC_TIER_CONFIG.ALLOWED_PLATFORMS,
          preferredPlatforms,
          suggestion: 'Update your preferred platforms in settings or upgrade your plan for more options.'
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate platforms are allowed for Basic tier (additional safety check)
    const invalidPlatforms = platformsToUse.filter(p => !BASIC_TIER_CONFIG.ALLOWED_PLATFORMS.includes(p));
    if (invalidPlatforms.length > 0) {
      return new NextResponse(
        JSON.stringify({
          error: 'Platform not available',
          message: `Basic tier only supports: ${BASIC_TIER_CONFIG.ALLOWED_PLATFORMS.join(', ')}`,
          invalidPlatforms,
          availablePlatforms: BASIC_TIER_CONFIG.ALLOWED_PLATFORMS
        }), 
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate repurposed content using standard AI model
    const repurposedContent = await aiService.repurposeContent({
      originalContent: content,
      platforms: platformsToUse,
      brandVoice,
      tone,
      additionalInstructions: 'Create engaging content optimized for each platform with basic analytics tracking'
    });

    // Save to database
    const savedContent = await withPrisma(async (prisma) => {
      // Create content record
      const contentRecord = await prisma.content.create({
        data: {
          id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          title,
          originalContent: content,
          contentType,
          status: 'completed',
          tier: 'basic',
          ...(schedule?.publishAt && { scheduledAt: new Date(schedule.publishAt) })
        }
      });

      // Create repurposed content records
      const repurposedRecords = await Promise.all(
        repurposedContent.map(async (item) => {
          return await prisma.repurposedContent.create({
            data: {
              id: `repurposed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              contentId: contentRecord.id,
              userId,
              platform: item.platform,
              content: item.content,
              tier: 'basic'
            }
          });
        })
      );

      return { contentRecord, repurposedRecords };
    });

    // Increment usage counts
    await withPrisma(async (prisma) => {
      // Increment monthly usage
      await prisma.user.update({
        where: { id: userId },
        data: {
          usageThisMonth: { increment: 1 }
        }
      });
    });

    // Record overage charge if applicable
    if (overageCharge > 0) {
      await withPrisma(async (prisma) => {
        await prisma.overageCharge.create({
          data: {
            userId,
            amount: overageCharge,
            count: 1,
            status: 'pending'
          }
        });
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        content: savedContent.contentRecord,
        repurposedContent: repurposedContent,
        usage: {
          monthly: {
            current: currentUsage + 1,
            limit: BASIC_TIER_CONFIG.MONTHLY_LIMIT,
            remaining: Math.max(0, BASIC_TIER_CONFIG.MONTHLY_LIMIT - currentUsage - 1)
          }
        },
        tier: 'basic',
        platformsUsed: platformsToUse,
        preferredPlatforms,
        features: BASIC_TIER_CONFIG.FEATURES,
        ...(overageCharge > 0 && { overageCharge }),
        ...(schedule && { schedule })
      },
      message: 'Content repurposed successfully for Basic tier'
    });

  } catch (error) {
    console.error('[BASIC_TIER_REPURPOSE_ERROR]', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to process repurpose request',
        tier: 'basic'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 