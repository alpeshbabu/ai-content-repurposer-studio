import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withPrisma } from '@/lib/prisma-dynamic'
import { incrementUsage, recordOverageCharge, SubscriptionPlan, SUBSCRIPTION_LIMITS, DAILY_LIMITS } from '@/lib/subscription'
import { aiService, Platform, AIProvider } from '@/lib/ai-service'
import { 
  tableExists, 
  ensureContentTableExists, 
  ensureRepurposedContentTableExists, 
  validateUserTable,
  generateId 
} from '@/lib/db-setup'
import { z } from 'zod'

// Force dynamic to prevent build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema
const repurposeContentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  contentType: z.string().min(1, 'Content type is required'),
  platforms: z.array(z.enum(['twitter', 'linkedin', 'instagram', 'facebook', 'email', 'newsletter', 'thread', 'general'])).optional(),
  brandVoice: z.string().optional(),
  tone: z.string().optional(),
  additionalInstructions: z.string().optional(),
  provider: z.enum(['anthropic', 'groq']).optional(),
  model: z.string().optional(),
  allowOverage: z.boolean().default(false)
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return new NextResponse('Invalid JSON', { status: 400 });
    }

    const validation = repurposeContentSchema.safeParse(body);
    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.error.issues
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { 
      title, 
      content, 
      contentType, 
      platforms,
      brandVoice,
      tone,
      additionalInstructions,
      provider,
      model,
      allowOverage 
    } = validation.data;

    // Ensure database tables exist
    const userTableValid = await validateUserTable();
    if (!userTableValid) {
      console.error('User table does not exist or is invalid');
      return new NextResponse('Database initialization in progress. Please try again in a few moments.', { 
        status: 503,
        headers: {
          'X-Error-Type': 'database-not-ready'
        }
      });
    }

    // Ensure content tables exist
    const contentTableExists = await ensureContentTableExists();
    const repurposedContentTableExists = await ensureRepurposedContentTableExists();
    
    if (!contentTableExists || !repurposedContentTableExists) {
      console.error('Failed to create Content or RepurposedContent tables');
      // We'll continue and handle errors gracefully in the content creation section
    }

    try {
      // Get user's subscription plan and payment status
      let user;
      try {
        user = await withPrisma(async (prisma) => {
          return await prisma.user.findUnique({
            where: { id: userId },
            select: {
              subscriptionPlan: true,
              subscriptionStatus: true,
              usageThisMonth: true,
              subscriptions: {
                where: { 
                  status: { in: ['active', 'trialing'] }
                },
                orderBy: { createdAt: 'desc' },
                take: 1
              }
            }
          });
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Use a fallback free plan if we can't get the user
        user = {
          subscriptionPlan: 'free',
          subscriptionStatus: 'inactive',
          usageThisMonth: 0,
          subscriptions: []
        };
      }
      
      if (!user) {
        return new NextResponse('User not found', { status: 404 });
      }

      // Check if user has access to their current plan
      const plan = user.subscriptionPlan as SubscriptionPlan;
      const hasActiveSubscription = user.subscriptionStatus === 'active' || user.subscriptions.length > 0;
      
      // For paid plans, require active subscription
      if (plan !== 'free' && !hasActiveSubscription) {
        return new NextResponse(
          JSON.stringify({
            error: 'Subscription required',
            message: `Your ${plan} plan requires an active subscription. Please complete payment to continue.`,
            requiredPlan: plan,
            upgradeUrl: `/dashboard/settings/subscription/checkout?plan=${plan}`
          }), 
          { 
            status: 402, // Payment Required
            headers: {
              'Content-Type': 'application/json',
              'X-Subscription-Required': 'true',
              'X-Required-Plan': plan
            }
          }
        );
      }
      
      // Check if monthly limit is exceeded
      const monthlyLimit = SUBSCRIPTION_LIMITS[plan];
      const isMonthlyExceeded = user.usageThisMonth >= monthlyLimit && monthlyLimit !== Infinity;
      
      // Check if daily limit is exceeded
      let isDailyExceeded = false;
      const dailyLimit = DAILY_LIMITS[plan];
      
      // Check if DailyUsage table exists
      const dailyUsageTableExists = await tableExists('DailyUsage');
      
      if (dailyLimit !== Infinity && dailyUsageTableExists) {
        try {
          const today = new Date(new Date().setHours(0, 0, 0, 0));
          
          // Use dynamic query instead of model-based query
          const dailyUsageResult = await withPrisma(async (prisma) => {
            return await prisma.$queryRawUnsafe<{ count: number }[]>(
              `SELECT "count" FROM "DailyUsage" 
               WHERE "userId" = $1 AND "date" = $2 
               LIMIT 1`,
              userId,
              today.toISOString()
            );
          });
          
          const dailyUsed = dailyUsageResult && dailyUsageResult.length > 0 
            ? Number(dailyUsageResult[0].count) 
            : 0;
            
          isDailyExceeded = dailyUsed >= dailyLimit;
        } catch (error) {
          console.error('Error checking daily usage:', error);
          // If we can't check daily usage, default to only checking monthly
          isDailyExceeded = false;
        }
      }
      
      // If either limit is exceeded and overage is not allowed, return 402
      if ((isMonthlyExceeded || isDailyExceeded) && !allowOverage) {
        return new NextResponse(
          isMonthlyExceeded 
            ? 'Monthly usage limit exceeded. Please upgrade your plan or enable overage charges.' 
            : 'Daily usage limit exceeded. Please upgrade your plan or try again tomorrow.', 
          { 
            status: 402, // Payment Required
            headers: {
              'X-Subscription-Required': 'true',
              'X-Allow-Overage': 'true',
              'X-Limit-Type': isMonthlyExceeded ? 'monthly' : 'daily'
            }
          }
        );
      }
      
      // If limit is exceeded but overage is allowed, record the charge
      if ((isMonthlyExceeded || isDailyExceeded) && allowOverage) {
        // Check if OverageCharge table exists
        const overageChargeTableExists = await tableExists('OverageCharge');
        if (overageChargeTableExists) {
          await recordOverageCharge(userId, 1); // 1 content repurpose
        } else {
          console.log('OverageCharge table does not exist, skipping overage recording');
        }
      }

      // Check if Settings table exists and fetch user settings
      const settingsTableExists = await tableExists('Settings');
      let userBrandVoice = brandVoice; // Use provided brand voice or default to user's saved one
      let preferredPlatforms: string[] = [];
      
      if (settingsTableExists) {
        try {
          const settings = await withPrisma(async (prisma) => {
            return await prisma.settings.findUnique({ where: { userId } });
          });
          if (!userBrandVoice) {
            userBrandVoice = settings?.brandVoice || '';
          }
          preferredPlatforms = settings?.preferredPlatforms || [];
        } catch (error) {
          console.error('Error fetching user settings:', error);
        }
      }
      
      // Filter platforms based on the user's subscription plan
      let availablePlatforms: Platform[] = [];
      
      switch (plan) {
        case 'free':
          availablePlatforms = ['twitter', 'instagram'];
          break;
        case 'basic':
          availablePlatforms = ['twitter', 'instagram', 'facebook'];
          break;
        case 'pro':
          availablePlatforms = ['twitter', 'instagram', 'facebook', 'linkedin'];
          break;
        case 'agency':
          availablePlatforms = ['twitter', 'instagram', 'facebook', 'linkedin', 'thread', 'email', 'newsletter'];
          break;
        default:
          availablePlatforms = ['twitter', 'instagram'];
      }
      
      // Get platforms to use: either from request, user preferences, or default available platforms
      const platformsToUse = platforms && platforms.length > 0
        ? platforms.filter(p => availablePlatforms.includes(p as Platform)) as Platform[]
        : preferredPlatforms.length 
          ? preferredPlatforms.filter(p => availablePlatforms.includes(p as Platform)) as Platform[]
          : availablePlatforms;

      // Check available AI providers
      const availableProviders = aiService.getAvailableProviders();
      if (availableProviders.length === 0) {
        return new NextResponse(
          JSON.stringify({
            error: 'AI service unavailable',
            message: 'No AI providers are currently configured. Please contact support.'
          }),
          { 
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Validate provider selection
      const selectedProvider = provider || availableProviders[0];
      if (!aiService.isProviderAvailable(selectedProvider as AIProvider)) {
        return new NextResponse(
          JSON.stringify({
            error: 'Provider unavailable',
            message: `The ${selectedProvider} provider is not available. Available providers: ${availableProviders.join(', ')}`
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Use AI service to repurpose content
      const repurposeRequest = {
        originalContent: content,
        platforms: platformsToUse,
        brandVoice: userBrandVoice,
        tone,
        additionalInstructions
      };

      const aiConfig = {
        provider: selectedProvider as AIProvider,
        ...(model && { model })
      };

      let repurposedContent;
      try {
        repurposedContent = await aiService.repurposeContent(repurposeRequest, aiConfig);
      } catch (aiError) {
        console.error('AI repurposing error:', aiError);
        return new NextResponse(
          JSON.stringify({
            error: 'Content repurposing failed',
            message: aiError instanceof Error ? aiError.message : 'Failed to repurpose content with AI service'
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Try to increment usage count, but don't fail if it doesn't work
      try {
        await incrementUsage(userId);
      } catch (error) {
        console.error('Error incrementing usage:', error);
        // Continue without failing the request
      }

      // Save the repurposed content to the database
      try {
        // Use either model-based approach or raw SQL depending on table existence
        let newContent;
        
        if (contentTableExists && repurposedContentTableExists) {
          // Use Prisma model approach
          newContent = await withPrisma(async (prisma) => {
            return await prisma.content.create({
              data: {
                title,
                originalContent: content,
                contentType,
                userId,
                repurposed: {
                  create: repurposedContent.map(item => ({
                    platform: item.platform,
                    content: item.content
                  }))
                }
              },
              include: {
                repurposed: true
              }
            });
          });
        } else {
          // Use raw SQL approach as fallback
          const contentId = generateId();
          
          // Insert into Content table
          await withPrisma(async (prisma) => {
            await prisma.$executeRawUnsafe(`
              INSERT INTO "Content" ("id", "title", "originalContent", "contentType", "userId", "createdAt", "updatedAt")
              VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            `, contentId, title, content, contentType, userId);
          });
          
          // Insert each repurposed content
          for (const item of repurposedContent) {
            await withPrisma(async (prisma) => {
              await prisma.$executeRawUnsafe(`
                INSERT INTO "RepurposedContent" ("id", "platform", "content", "contentId", "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, NOW(), NOW())
              `, generateId(), item.platform, item.content, contentId);
            });
          }
          
          // Construct result object
          newContent = {
            id: contentId,
            title,
            originalContent: content,
            contentType,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
            repurposed: repurposedContent.map(item => ({
              id: generateId(),
              platform: item.platform,
              content: item.content,
              contentId: contentId,
              createdAt: new Date(),
              updatedAt: new Date()
            }))
          };
        }

        return NextResponse.json({
          success: true,
          content: {
            id: newContent.id,
            title: newContent.title,
            originalContent: newContent.originalContent,
            repurposed: newContent.repurposed.map(item => ({
              platform: item.platform,
              content: item.content
            }))
          },
          usage: {
            currentUsage: user.usageThisMonth + 1,
            monthlyLimit: SUBSCRIPTION_LIMITS[plan] === Infinity ? null : SUBSCRIPTION_LIMITS[plan],
            plan: plan,
            remainingUsage: SUBSCRIPTION_LIMITS[plan] === Infinity ? null : Math.max(0, SUBSCRIPTION_LIMITS[plan] - user.usageThisMonth - 1)
          },
          metadata: {
            platformsUsed: platformsToUse,
            provider: selectedProvider,
            brandVoice: userBrandVoice,
            totalCharacters: repurposedContent.reduce((sum, item) => sum + (item.characterCount || item.content.length), 0)
          }
        });
      } catch (dbError) {
        console.error('[CONTENT_SAVE_ERROR]', dbError);
        
        // Return the repurposed content even if we couldn't save it to the database
        return NextResponse.json({
          success: true,
          content: {
            title,
            originalContent: content,
            repurposed: repurposedContent.map(item => ({
              platform: item.platform,
              content: item.content
            }))
          },
          usage: {
            currentUsage: user.usageThisMonth + 1,
            monthlyLimit: SUBSCRIPTION_LIMITS[plan] === Infinity ? null : SUBSCRIPTION_LIMITS[plan],
            plan: plan,
            remainingUsage: SUBSCRIPTION_LIMITS[plan] === Infinity ? null : Math.max(0, SUBSCRIPTION_LIMITS[plan] - user.usageThisMonth - 1)
          },
          warning: "Content was generated but could not be saved to the database. Please copy any content you'd like to keep."
        });
      }
    } catch (dbError) {
      console.error('[DB_ERROR]', dbError);
      return new NextResponse('Database error while processing content', { status: 500 });
    }
  } catch (error) {
    console.error('[REPURPOSE_ERROR]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 