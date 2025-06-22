import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withPrisma } from '@/lib/prisma-dynamic'
import { aiService, Platform } from '@/lib/ai-service'
import { z } from 'zod'

// Force dynamic to prevent build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// AGENCY TIER CONFIGURATION
const AGENCY_TIER_CONFIG = {
  MONTHLY_LIMIT: 450,
  DAILY_LIMIT: Infinity, // No daily limit
  OVERAGE_RATE: 0.06,
  ALLOWED_PLATFORMS: ['twitter', 'instagram', 'facebook', 'linkedin', 'thread', 'email', 'newsletter', 'youtube', 'tiktok'] as Platform[],
  AI_MODEL: 'premium', // Premium AI model
  MAX_TEAM_MEMBERS: 3,
  ADDITIONAL_MEMBER_COST: 6.99,
  FEATURES: {
    templates: ['twitter', 'instagram', 'facebook', 'linkedin', 'thread', 'email', 'newsletter', 'youtube', 'tiktok'],
    analytics: true,
    customTemplates: true,
    teamCollaboration: true,
    prioritySupport: true,
    professionalSupport: true,
    scheduling: true,
    bulkOperations: true,
    customBranding: true,
    apiAccess: true,
    whiteLabel: true
  }
}

// Validation schema for Agency tier
const agencyRepurposeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300, 'Title too long'),
  content: z.string().min(1, 'Content is required').max(25000, 'Content too long'),
  contentType: z.string().min(1, 'Content type is required'),
  platforms: z.array(z.enum(['twitter', 'instagram', 'facebook', 'linkedin', 'thread', 'email', 'newsletter', 'youtube', 'tiktok'])).optional(),
  brandVoice: z.string().optional(),
  tone: z.enum(['professional', 'casual', 'friendly', 'formal', 'authoritative', 'conversational', 'expert', 'thought-leader']).optional(),
  allowOverage: z.boolean().default(false),
  schedule: z.object({
    publishAt: z.string().optional(),
    timezone: z.string().optional(),
    recurring: z.boolean().optional(),
    recurringPattern: z.string().optional()
  }).optional(),
  customTemplate: z.string().optional(),
  targetAudience: z.string().optional(),
  hashtags: z.array(z.string()).max(20).optional(),
  callToAction: z.string().optional(),
  teamMemberId: z.string().optional(),
  clientId: z.string().optional(),
  campaignId: z.string().optional(),
  bulkOperation: z.boolean().default(false),
  customBranding: z.object({
    logo: z.string().optional(),
    colors: z.array(z.string()).optional(),
    fonts: z.array(z.string()).optional()
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
    const validation = agencyRepurposeSchema.safeParse(body);
    
    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.error.issues,
          tierLimitations: AGENCY_TIER_CONFIG.FEATURES
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
      callToAction,
      teamMemberId,
      clientId,
      campaignId,
      bulkOperation,
      customBranding
    } = validation.data;

    // Verify user is on Agency tier
    const user = await withPrisma(async (prisma) => {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          subscriptionPlan: true,
          subscriptionStatus: true,
          usageThisMonth: true,
          overageConsent: true,
          teamId: true,
          team: {
            include: {
              members: {
                select: {
                  id: true,
                  userId: true,
                  role: true,
                  user: {
                    select: {
                      name: true,
                      email: true
                    }
                  }
                }
              }
            }
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

    // Enforce Agency tier restriction
    if (user.subscriptionPlan !== 'agency') {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Tier mismatch', 
          message: `This endpoint is for Agency tier users only. Your plan: ${user.subscriptionPlan}`,
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
          message: 'Your Agency subscription is not active. Please update your payment method.',
          subscriptionStatus: user.subscriptionStatus
        }), 
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate team member access if specified
    if (teamMemberId && user.team) {
      const teamMember = user.team.members.find(m => m.userId === teamMemberId);
      if (!teamMember) {
        return new NextResponse(
          JSON.stringify({
            error: 'Team member not found',
            message: 'The specified team member is not part of your team',
            availableMembers: user.team.members.map(m => ({
              id: m.userId,
              name: m.user.name,
              role: m.role
            }))
          }), 
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get team usage (pooled across all team members)
    const teamUsage = user.team ? 
      await withPrisma(async (prisma) => {
        const teamMembers = user.team!.members.map(m => m.userId);
        const result = await prisma.user.aggregate({
          where: { id: { in: teamMembers } },
          _sum: { usageThisMonth: true }
        });
        return result._sum.usageThisMonth || 0;
      }) : user.usageThisMonth;

    // Check monthly usage limit (Agency has no daily limit)
    const currentUsage = user.usageThisMonth;
    const isAtLimit = currentUsage >= AGENCY_TIER_CONFIG.MONTHLY_LIMIT;

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
          message: `Agency tier allows ${AGENCY_TIER_CONFIG.MONTHLY_LIMIT} repurposes per month. Enable overage charges in your settings to continue.`,
          currentUsage,
          limit: AGENCY_TIER_CONFIG.MONTHLY_LIMIT,
          overageRate: AGENCY_TIER_CONFIG.OVERAGE_RATE,
          overageEnabled,
          features: ['Unlimited daily repurposes', 'Team collaboration', 'White-label options', 'Priority support']
        }), 
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle overage if allowed
    let overageCharge = 0;
    if (isAtLimit && shouldAllowOverage) {
      overageCharge = AGENCY_TIER_CONFIG.OVERAGE_RATE;
    }

    // Determine platforms to use based on user preferences and tier limitations
    let platformsToUse: Platform[];

    if (platforms && platforms.length > 0) {
      // Use platforms from request, filtered by tier restrictions
      platformsToUse = platforms.filter(p => AGENCY_TIER_CONFIG.ALLOWED_PLATFORMS.includes(p)) as Platform[];
    } else if (preferredPlatforms.length > 0) {
      // Use user's preferred platforms, filtered by tier restrictions
      platformsToUse = preferredPlatforms.filter(p => AGENCY_TIER_CONFIG.ALLOWED_PLATFORMS.includes(p as Platform)) as Platform[];
    } else {
      // Use all available platforms for the tier
      platformsToUse = AGENCY_TIER_CONFIG.ALLOWED_PLATFORMS;
    }

    // Ensure we have at least one platform
    if (platformsToUse.length === 0) {
      return new NextResponse(
        JSON.stringify({
          error: 'No platforms available',
          message: 'No platforms are available for your Agency tier subscription or your preferred platforms.',
          availablePlatforms: AGENCY_TIER_CONFIG.ALLOWED_PLATFORMS,
          preferredPlatforms,
          suggestion: 'Update your preferred platforms in settings. Agency tier supports all platforms.'
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate repurposed content using premium AI model
    const repurposedContent = await aiService.repurposeContent({
      originalContent: content,
      platforms: platformsToUse,
      brandVoice,
      tone,
      additionalInstructions: [
        'Create premium, enterprise-grade content optimized for Agency tier',
        customTemplate && `Use this custom template: ${customTemplate}`,
        targetAudience && `Target audience: ${targetAudience}`,
        hashtags && hashtags.length > 0 && `Include relevant hashtags: ${hashtags.join(', ')}`,
        callToAction && `Include call-to-action: ${callToAction}`,
        customBranding && 'Apply custom branding guidelines',
        'Enable comprehensive analytics and team collaboration features'
      ].filter(Boolean).join('. ')
    });

    // Save to database with Agency tier features
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
          tier: 'agency',
          ...(schedule?.publishAt && { scheduledAt: new Date(schedule.publishAt) }),
          ...(targetAudience && { targetAudience }),
          ...(hashtags && { hashtags }),
          ...(callToAction && { callToAction }),
          ...(teamMemberId && { teamMemberId }),
          ...(clientId && { clientId }),
          ...(campaignId && { campaignId })
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
              tier: 'agency'
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
          monthly: {
            current: currentUsage + 1,
            limit: AGENCY_TIER_CONFIG.MONTHLY_LIMIT,
            remaining: Math.max(0, AGENCY_TIER_CONFIG.MONTHLY_LIMIT - currentUsage - 1),
            isTeamPooled: !!user.team
          }
        },
        tier: 'agency',
        platformsUsed: platformsToUse,
        preferredPlatforms,
        features: AGENCY_TIER_CONFIG.FEATURES,
        team: user.team ? {
          id: user.team.id,
          memberCount: user.team.members.length,
          maxMembers: AGENCY_TIER_CONFIG.MAX_TEAM_MEMBERS,
          pooledUsage: currentUsage
        } : undefined,
        analytics: {
          enabled: true,
          trackingId: savedContent.contentRecord.id,
          platforms: platformsToUse,
          enterprise: true
        },
        ...(overageCharge > 0 && { overageCharge }),
        ...(schedule && { schedule }),
        ...(customTemplate && { customTemplate }),
        ...(targetAudience && { targetAudience }),
        ...(hashtags && { hashtags }),
        ...(callToAction && { callToAction }),
        ...(teamMemberId && { teamMemberId }),
        ...(clientId && { clientId }),
        ...(campaignId && { campaignId }),
        ...(customBranding && { customBranding }),
        ...(bulkOperation && { bulkOperation })
      },
      message: 'Content repurposed successfully for Agency tier with enterprise features'
    });

  } catch (error) {
    console.error('[AGENCY_TIER_REPURPOSE_ERROR]', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to process repurpose request',
        tier: 'agency'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 