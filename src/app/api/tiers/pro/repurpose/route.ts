import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withPrisma } from '@/lib/prisma-dynamic'
import { aiService, Platform } from '@/lib/ai-service'
import { z } from 'zod'

// Force dynamic to prevent build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// PRO TIER CONFIGURATION
const PRO_TIER_CONFIG = {
  MONTHLY_LIMIT: 150,
  DAILY_LIMIT: 5,
  OVERAGE_RATE: 0.08,
  ALLOWED_PLATFORMS: ['twitter', 'instagram', 'facebook', 'linkedin', 'thread', 'tiktok', 'youtube', 'email', 'newsletter'] as Platform[],
  AI_MODEL: 'advanced', // Advanced AI model
  FEATURES: {
    templates: ['twitter', 'instagram', 'facebook', 'linkedin', 'thread', 'tiktok', 'youtube', 'email', 'newsletter'],
    analytics: true,
    customTemplates: true,
    teamCollaboration: false,
    prioritySupport: true,
    professionalSupport: true,
    scheduling: true,
    bulkOperations: true
  }
}

// Validation schema for Pro tier
const proRepurposeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long for pro tier'),
  contentType: z.string().min(1, 'Content type is required'),
  platforms: z.array(z.enum(['twitter', 'instagram', 'facebook', 'linkedin', 'thread', 'tiktok', 'youtube', 'email', 'newsletter'])).max(9, 'Pro tier supports all platforms').optional(),
  brandVoice: z.string().optional(),
  tone: z.enum(['professional', 'casual', 'friendly', 'formal', 'authoritative', 'conversational']).optional(),
  allowOverage: z.boolean().default(false),
  schedule: z.object({
    publishAt: z.string().optional(),
    timezone: z.string().optional(),
    recurring: z.boolean().optional()
  }).optional(),
  customTemplate: z.string().optional(),
  targetAudience: z.string().optional(),
  hashtags: z.array(z.string()).max(10).optional(),
  callToAction: z.string().optional()
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
    const validation = proRepurposeSchema.safeParse(body);
    
    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.error.issues,
          tierLimitations: PRO_TIER_CONFIG.FEATURES
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { 
      title, 
      content, 
      contentType, 
      platforms, 
      brandVoice, 
      tone, 
      allowOverage, 
      schedule,
      customTemplate,
      targetAudience,
      hashtags,
      callToAction
    } = validation.data;

    // Verify user is on Pro tier
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

    // Enforce Pro tier restriction
    if (user.subscriptionPlan !== 'pro') {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Tier mismatch', 
          message: `This endpoint is for Pro tier users only. Your plan: ${user.subscriptionPlan}`,
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
          message: 'Your Pro subscription is not active. Please update your payment method.',
          subscriptionStatus: user.subscriptionStatus
        }), 
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check usage limits
    const currentUsage = user.usageThisMonth;
    const isMonthlyAtLimit = currentUsage >= PRO_TIER_CONFIG.MONTHLY_LIMIT;

    // Check daily usage
    let isDailyAtLimit = false;
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    try {
      const dailyUsage = await withPrisma(async (prisma) => {
        return await prisma.dailyUsage.findUnique({
          where: {
            userId_date: {
              userId,
              date: today
            }
          }
        });
      });
      const dailyCount = dailyUsage?.count || 0;
      isDailyAtLimit = dailyCount >= PRO_TIER_CONFIG.DAILY_LIMIT;
    } catch (error) {
      console.error('Error checking daily usage:', error);
    }

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

    if ((isMonthlyAtLimit || isDailyAtLimit) && !shouldAllowOverage) {
      return new NextResponse(
        JSON.stringify({
          error: isMonthlyAtLimit ? 'Monthly limit reached' : 'Daily limit reached',
          message: isMonthlyAtLimit 
            ? `Pro tier allows ${PRO_TIER_CONFIG.MONTHLY_LIMIT} repurposes per month. Enable overage charges in your settings to continue.`
            : `Pro tier allows ${PRO_TIER_CONFIG.DAILY_LIMIT} repurposes per day. Try again tomorrow or enable overage charges.`,
          currentUsage,
          limit: isMonthlyAtLimit ? PRO_TIER_CONFIG.MONTHLY_LIMIT : PRO_TIER_CONFIG.DAILY_LIMIT,
          limitType: isMonthlyAtLimit ? 'monthly' : 'daily',
          overageRate: PRO_TIER_CONFIG.OVERAGE_RATE,
          overageEnabled,
          upgradeOptions: [
            { plan: 'agency', monthlyLimit: 450, price: 39.99 }
          ]
        }), 
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle overage if allowed
    let overageCharge = 0;
    if ((isMonthlyAtLimit || isDailyAtLimit) && shouldAllowOverage) {
      overageCharge = PRO_TIER_CONFIG.OVERAGE_RATE;
    }

    // Determine platforms to use based on user preferences and tier limitations
    let platformsToUse: Platform[];

    if (platforms && platforms.length > 0) {
      // Use platforms from request, filtered by tier restrictions
      platformsToUse = platforms.filter(p => PRO_TIER_CONFIG.ALLOWED_PLATFORMS.includes(p)) as Platform[];
    } else if (preferredPlatforms.length > 0) {
      // Use user's preferred platforms, filtered by tier restrictions
      platformsToUse = preferredPlatforms.filter(p => PRO_TIER_CONFIG.ALLOWED_PLATFORMS.includes(p as Platform)) as Platform[];
    } else {
      // Use all available platforms for the tier
      platformsToUse = PRO_TIER_CONFIG.ALLOWED_PLATFORMS;
    }

    // Ensure we have at least one platform
    if (platformsToUse.length === 0) {
      return new NextResponse(
        JSON.stringify({
          error: 'No platforms available',
          message: 'No platforms are available for your Pro tier subscription or your preferred platforms.',
          availablePlatforms: PRO_TIER_CONFIG.ALLOWED_PLATFORMS,
          preferredPlatforms,
          suggestion: 'Update your preferred platforms in settings. Pro tier supports all major platforms.'
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate repurposed content using advanced AI model
    const repurposedContent = await aiService.repurposeContent({
      originalContent: content,
      platforms: platformsToUse,
      brandVoice,
      tone,
      additionalInstructions: [
        'Create high-quality, engaging content optimized for each platform',
        customTemplate && `Use this custom template: ${customTemplate}`,
        targetAudience && `Target audience: ${targetAudience}`,
        hashtags && hashtags.length > 0 && `Include relevant hashtags: ${hashtags.join(', ')}`,
        callToAction && `Include call-to-action: ${callToAction}`,
        'Enable advanced analytics tracking'
      ].filter(Boolean).join('. ')
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
          tier: 'pro',
          ...(schedule?.publishAt && { scheduledAt: new Date(schedule.publishAt) }),
          ...(targetAudience && { targetAudience }),
          ...(hashtags && { hashtags }),
          ...(callToAction && { callToAction })
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
              tier: 'pro'
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

      // Increment daily usage
      await prisma.dailyUsage.upsert({
        where: {
          userId_date: {
            userId,
            date: today
          }
        },
        update: {
          count: { increment: 1 }
        },
        create: {
          userId,
          date: today,
          count: 1
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
            limit: PRO_TIER_CONFIG.MONTHLY_LIMIT,
            remaining: Math.max(0, PRO_TIER_CONFIG.MONTHLY_LIMIT - currentUsage - 1)
          },
          daily: {
            current: dailyUsage + 1,
            limit: PRO_TIER_CONFIG.DAILY_LIMIT,
            remaining: Math.max(0, PRO_TIER_CONFIG.DAILY_LIMIT - dailyUsage - 1)
          }
        },
        tier: 'pro',
        platformsUsed: platformsToUse,
        preferredPlatforms,
        features: PRO_TIER_CONFIG.FEATURES,
        analytics: {
          enabled: true,
          trackingId: savedContent.contentRecord.id,
          platforms: platformsToUse
        },
        ...(overageCharge > 0 && { overageCharge }),
        ...(schedule && { schedule }),
        ...(customTemplate && { customTemplate }),
        ...(targetAudience && { targetAudience }),
        ...(hashtags && { hashtags }),
        ...(callToAction && { callToAction })
      },
      message: 'Content repurposed successfully for Pro tier with advanced features'
    });

  } catch (error) {
    console.error('[PRO_TIER_REPURPOSE_ERROR]', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to process repurpose request',
        tier: 'pro'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 