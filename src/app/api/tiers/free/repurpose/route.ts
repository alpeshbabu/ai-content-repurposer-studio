import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withPrisma } from '@/lib/prisma-dynamic'
import { aiService, Platform } from '@/lib/ai-service'
import { z } from 'zod'

// Force dynamic to prevent build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// FREE TIER CONFIGURATION
const FREE_TIER_CONFIG = {
  MONTHLY_LIMIT: 5,
  DAILY_LIMIT: Infinity, // No daily limit
  OVERAGE_RATE: 0.12,
  ALLOWED_PLATFORMS: ['twitter', 'instagram'] as Platform[],
  AI_MODEL: 'basic', // Basic AI model
  FEATURES: {
    templates: ['twitter', 'instagram'],
    analytics: false,
    customTemplates: false,
    teamCollaboration: false,
    prioritySupport: false
  }
}

// Validation schema for Free tier
const freeRepurposeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long for free tier'),
  content: z.string().min(1, 'Content is required').max(2000, 'Content too long for free tier'),
  contentType: z.string().min(1, 'Content type is required'),
  platforms: z.array(z.enum(['twitter', 'instagram'])).max(2, 'Free tier limited to 2 platforms').optional(),
  brandVoice: z.string().optional(),
  tone: z.enum(['professional', 'casual', 'friendly']).optional(),
  allowOverage: z.boolean().default(false)
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
    const validation = freeRepurposeSchema.safeParse(body);
    
    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.error.issues,
          tierLimitations: FREE_TIER_CONFIG.FEATURES
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { title, content, contentType, platforms, brandVoice, tone, allowOverage } = validation.data;

    // Verify user is on Free tier
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

    // Enforce Free tier restriction
    if (user.subscriptionPlan !== 'free') {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Tier mismatch', 
          message: `This endpoint is for Free tier users only. Your plan: ${user.subscriptionPlan}`,
          correctEndpoint: `/api/tiers/${user.subscriptionPlan}/repurpose`
        }), 
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check monthly usage limit
    const currentUsage = user.usageThisMonth;
    const isAtLimit = currentUsage >= FREE_TIER_CONFIG.MONTHLY_LIMIT;

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

    if (isAtLimit && !shouldAllowOverage) {
      return new NextResponse(
        JSON.stringify({
          error: 'Monthly limit reached',
          message: `Free tier allows ${FREE_TIER_CONFIG.MONTHLY_LIMIT} repurposes per month. Enable overage charges in your settings to continue.`,
          currentUsage,
          limit: FREE_TIER_CONFIG.MONTHLY_LIMIT,
          overageRate: FREE_TIER_CONFIG.OVERAGE_RATE,
          overageEnabled,
          upgradeOptions: [
            { plan: 'basic', monthlyLimit: 60, price: 6.99 },
            { plan: 'pro', monthlyLimit: 150, price: 14.99 }
          ]
        }), 
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle overage if allowed
    let overageCharge = 0;
    if (isAtLimit && shouldAllowOverage) {
      overageCharge = FREE_TIER_CONFIG.OVERAGE_RATE;
    }

    // Determine platforms to use based on user preferences and tier limitations
    let platformsToUse: Platform[];

    if (platforms && platforms.length > 0) {
      // Use platforms from request, filtered by tier restrictions
      platformsToUse = platforms.filter(p => FREE_TIER_CONFIG.ALLOWED_PLATFORMS.includes(p)) as Platform[];
    } else if (preferredPlatforms.length > 0) {
      // Use user's preferred platforms, filtered by tier restrictions
      platformsToUse = preferredPlatforms.filter(p => FREE_TIER_CONFIG.ALLOWED_PLATFORMS.includes(p as Platform)) as Platform[];
    } else {
      // Use all available platforms for the tier
      platformsToUse = FREE_TIER_CONFIG.ALLOWED_PLATFORMS;
    }

    // Ensure we have at least one platform
    if (platformsToUse.length === 0) {
      return new NextResponse(
        JSON.stringify({
          error: 'No platforms available',
          message: 'No platforms are available for your Free tier subscription or your preferred platforms.',
          availablePlatforms: FREE_TIER_CONFIG.ALLOWED_PLATFORMS,
          preferredPlatforms,
          suggestion: 'Update your preferred platforms in settings or upgrade your plan for more options.'
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate platforms are allowed for Free tier (additional safety check)
    const invalidPlatforms = platformsToUse.filter(p => !FREE_TIER_CONFIG.ALLOWED_PLATFORMS.includes(p));
    if (invalidPlatforms.length > 0) {
      return new NextResponse(
        JSON.stringify({
          error: 'Platform not available',
          message: `Free tier only supports: ${FREE_TIER_CONFIG.ALLOWED_PLATFORMS.join(', ')}`,
          invalidPlatforms,
          availablePlatforms: FREE_TIER_CONFIG.ALLOWED_PLATFORMS
        }), 
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate repurposed content using basic AI model
    const repurposedContent = await aiService.repurposeContent({
      originalContent: content,
      platforms: platformsToUse,
      brandVoice,
      tone,
      additionalInstructions: 'Keep content concise and engaging for free tier users'
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
          tier: 'free'
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
              tier: 'free'
            }
          });
        })
      );

      return { contentRecord, repurposedRecords };
    });

    // Increment usage count
    await withPrisma(async (prisma) => {
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
          current: currentUsage + 1,
          limit: FREE_TIER_CONFIG.MONTHLY_LIMIT,
          remaining: Math.max(0, FREE_TIER_CONFIG.MONTHLY_LIMIT - currentUsage - 1)
        },
        tier: 'free',
        platformsUsed: platformsToUse,
        preferredPlatforms,
        ...(overageCharge > 0 && { overageCharge })
      },
      message: 'Content repurposed successfully for Free tier'
    });

  } catch (error) {
    console.error('[FREE_TIER_REPURPOSE_ERROR]', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to process repurpose request',
        tier: 'free'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 