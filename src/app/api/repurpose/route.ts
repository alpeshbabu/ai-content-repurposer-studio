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
import { withCache } from '@/lib/cache-dynamic'
import { z } from 'zod'

// Force dynamic to prevent build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema
const repurposeContentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  contentType: z.string().min(1, 'Content type is required'),
  contentId: z.string().optional(), // Optional - if provided, update existing content
  platforms: z.array(z.enum(['twitter', 'linkedin', 'instagram', 'facebook', 'email', 'newsletter', 'thread', 'youtube', 'tiktok', 'general'])).optional(),
  brandVoice: z.string().optional(),
  tone: z.string().optional(),
  additionalInstructions: z.string().optional(),
  provider: z.enum(['anthropic', 'llama']).optional(),
  model: z.string().optional(),
  allowOverage: z.boolean().default(false)
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid JSON' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
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
      contentId: rawContentId,
      platforms,
      brandVoice,
      tone,
      additionalInstructions,
      provider,
      model,
      allowOverage 
    } = validation.data;

    // Ensure contentId is properly handled - empty strings should be treated as undefined
    const contentId = rawContentId && rawContentId.trim() !== '' ? rawContentId.trim() : undefined;

    // Log contentId handling for debugging
    console.log('[REPURPOSE_API] ContentId processing:', {
      received: rawContentId,
      processed: contentId,
      willUpdate: !!contentId,
      willCreate: !contentId
    });



    // Ensure database tables exist
    const userTableValid = await validateUserTable();
    if (!userTableValid) {
      console.error('User table does not exist or is invalid');
      return new NextResponse(
        JSON.stringify({ 
          error: 'Database initialization in progress', 
          message: 'Please try again in a few moments.' 
        }), 
        { 
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'X-Error-Type': 'database-not-ready'
          }
        }
      );
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
              overageConsent: true,
              overageConsentDate: true,
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
          overageConsent: false,
          overageConsentDate: null,
          subscriptions: []
        };
      }
      
      if (!user) {
        return new NextResponse(
          JSON.stringify({ error: 'User not found' }), 
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Check if user has access to their current plan
      const plan = user.subscriptionPlan as SubscriptionPlan;
      const hasActiveSubscription = user.subscriptionStatus === 'active' || user.subscriptions.length > 0;
      
      console.log('🧑‍💼 USER PLAN DEBUG:', {
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
        hasActiveSubscription,
        actualPlan: plan
      });
      
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
      
      // Check if Settings table exists and fetch user settings
      const settingsTableExists = await tableExists('Settings');
      let userBrandVoice = brandVoice; // Use provided brand voice or default to user's saved one
      let preferredPlatforms: string[] = [];
      let overageEnabled = false; // Check if user has enabled overage in settings
      
      if (settingsTableExists) {
        try {
          const settings = await withPrisma(async (prisma) => {
            return await prisma.settings.findUnique({ where: { userId } });
          });
          if (!userBrandVoice) {
            userBrandVoice = settings?.brandVoice || '';
          }
          preferredPlatforms = settings?.preferredPlatforms || [];
          overageEnabled = settings?.overageEnabled || false;
        } catch (error) {
          console.error('Error fetching user settings:', error);
        }
      }
      
      // Check if user has overage consent and automatically allow overage if they do
      const hasOverageConsent = user.overageConsent === true;
      const shouldAllowOverage = allowOverage || hasOverageConsent || overageEnabled;

      // If either limit is exceeded and overage is not allowed, return 402
      if ((isMonthlyExceeded || isDailyExceeded) && !shouldAllowOverage) {
        return new NextResponse(
          JSON.stringify({
            error: 'Usage limit exceeded',
            message: isMonthlyExceeded 
              ? 'Monthly usage limit exceeded. Please upgrade your plan or enable overage charges in your settings.' 
              : 'Daily usage limit exceeded. Please upgrade your plan or try again tomorrow.',
            limitType: isMonthlyExceeded ? 'monthly' : 'daily',
            currentUsage: user.usageThisMonth,
            limit: monthlyLimit,
            plan: plan,
            hasOverageConsent: hasOverageConsent,
            overageEnabled: overageEnabled
          }),
          { 
            status: 402, // Payment Required
            headers: {
              'Content-Type': 'application/json',
              'X-Subscription-Required': 'true',
              'X-Allow-Overage': 'true',
              'X-Limit-Type': isMonthlyExceeded ? 'monthly' : 'daily'
            }
          }
        );
      }
      
      // If limit is exceeded but overage is allowed, record the charge
      if ((isMonthlyExceeded || isDailyExceeded) && shouldAllowOverage) {
        // Check if OverageCharge table exists
        const overageChargeTableExists = await tableExists('OverageCharge');
        if (overageChargeTableExists) {
          await recordOverageCharge(userId, 1); // 1 content repurpose
        } else {
          console.log('OverageCharge table does not exist, skipping overage recording');
        }
      }

      // Filter platforms based on the user's subscription plan
      let availablePlatforms: Platform[] = [];
      
      console.log('🔄 PLATFORM FILTERING - Input plan:', plan);
      
      // STRICT PLATFORM ENFORCEMENT - Must match SUBSCRIPTION.md exactly
      switch (plan) {
        case 'free':
          availablePlatforms = ['twitter', 'instagram'];
          break;
        case 'basic':
          availablePlatforms = ['twitter', 'instagram', 'facebook'];
          break;
        case 'pro':
          availablePlatforms = ['twitter', 'instagram', 'facebook', 'linkedin', 'thread', 'email', 'newsletter'];
          break;
        case 'agency':
          availablePlatforms = ['twitter', 'instagram', 'facebook', 'linkedin', 'thread', 'email', 'newsletter'];
          break;
        default:
          console.log('⚠️  PLAN FELL THROUGH TO DEFAULT - Plan value:', plan);
          availablePlatforms = ['twitter', 'instagram']; // Default to free tier only
      }
      
      console.log('🎯 PLATFORM FILTERING - Result:', {
        plan,
        availablePlatforms
      });
      
      // Get platforms to use: either from request, user preferences, or default available platforms
      const platformsToUse = platforms && platforms.length > 0
        ? platforms.filter(p => availablePlatforms.includes(p as Platform)) as Platform[]
        : preferredPlatforms.length 
          ? preferredPlatforms.filter(p => availablePlatforms.includes(p as Platform)) as Platform[]
          : availablePlatforms;

      console.log('Debug - platforms from request:', platforms);
      console.log('Debug - preferredPlatforms:', preferredPlatforms);
      console.log('Debug - availablePlatforms:', availablePlatforms);
      console.log('Debug - platformsToUse:', platformsToUse);
      console.log('🔍 ABOUT TO CALL AI SERVICE WITH PLATFORMS:', platformsToUse);

      // Ensure we have at least one platform
      if (!platformsToUse || platformsToUse.length === 0) {
        return new NextResponse(
          JSON.stringify({
            error: 'No platforms available',
            message: 'No platforms are available for your subscription plan or no platforms were selected.',
            availablePlatforms,
            plan
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

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

      // Validate provider selection (if explicitly provided)
      if (provider && !aiService.isProviderAvailable(provider as AIProvider)) {
        return new NextResponse(
          JSON.stringify({
            error: 'Provider unavailable',
            message: `The ${provider} provider is not available. Available providers: ${availableProviders.join(', ')}`
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
        additionalInstructions,
        userId
      };

      const aiConfig = {
        ...(provider && { provider: provider as AIProvider }),
        ...(model && { model })
      };

      // Debug logging before AI service call
      console.log('=== AI SERVICE DEBUG START ===');
      console.log('1. Platforms being passed to aiService.repurposeContent:', JSON.stringify(platformsToUse));
      console.log('2. Complete repurpose request:', JSON.stringify({
        originalContent: content.substring(0, 100) + '...', // Truncate for readability
        platforms: platformsToUse,
        brandVoice: userBrandVoice,
        tone,
        additionalInstructions,
        userId
      }, null, 2));
      console.log('3. AI config:', JSON.stringify(aiConfig, null, 2));

      let repurposedContent;
      try {
        repurposedContent = await aiService.repurposeContent(repurposeRequest, aiConfig);
        
        // Debug logging after AI service call
        console.log('4. AI service response received:', JSON.stringify({
          totalItems: repurposedContent?.length || 0,
          platforms: repurposedContent?.map(item => item.platform) || [],
          platformsWithContent: repurposedContent?.filter(item => item.content && item.content.trim()).map(item => item.platform) || [],
          emptyContentPlatforms: repurposedContent?.filter(item => !item.content || !item.content.trim()).map(item => item.platform) || []
        }, null, 2));
        
        // Check if Facebook is specifically missing or empty
        const facebookContent = repurposedContent?.find(item => item.platform === 'facebook');
        if (platformsToUse.includes('facebook')) {
          console.log('5. Facebook content debug:', {
            requested: true,
            found: !!facebookContent,
            hasContent: facebookContent?.content ? facebookContent.content.length > 0 : false,
            contentPreview: facebookContent?.content ? facebookContent.content.substring(0, 100) + '...' : 'NO CONTENT'
          });
        } else {
          console.log('5. Facebook was not in requested platforms');
        }
        
        // Log all platform results
        console.log('6. All platform results:');
        repurposedContent?.forEach((item, index) => {
          console.log(`   Platform ${index + 1}: ${item.platform} - Content length: ${item.content?.length || 0} chars`);
          if (item.content) {
            console.log(`   Preview: ${item.content.substring(0, 50)}...`);
          } else {
            console.log('   ⚠️  NO CONTENT GENERATED');
          }
        });
        
        console.log('=== AI SERVICE DEBUG END ===');
        
        console.log('✅ AI SERVICE RETURNED:', repurposedContent?.length, 'items');
        console.log('📋 PLATFORMS IN RESPONSE:', repurposedContent?.map(r => r.platform));
      } catch (aiError) {
        console.error('AI repurposing error:', aiError);
        console.log('=== AI SERVICE DEBUG END (ERROR) ===');
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
            if (contentId) {
              // Update existing content
              console.log('[REPURPOSE_API] UPDATING existing content with ID:', contentId);
              return await prisma.content.update({
                where: { id: contentId },
                data: {
                  status: "Repurposed", // Update status to Repurposed
                  repurposed: {
                    deleteMany: {}, // Clear existing repurposed content
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
            } else {
              // Create new content
              console.log('[REPURPOSE_API] CREATING new content (no contentId provided)');
              return await prisma.content.create({
                data: {
                  title,
                  originalContent: content,
                  contentType,
                  status: "Repurposed", // Mark as repurposed since it's being repurposed
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
            }
          });
        } else {
          // Use raw SQL approach as fallback
          if (contentId) {
            // Update existing content
            await withPrisma(async (prisma) => {
              // Update content status
              await prisma.$executeRawUnsafe(`
                UPDATE "Content" 
                SET "status" = 'Repurposed', "updatedAt" = NOW()
                WHERE "id" = $1
              `, contentId);
              
              // Delete existing repurposed content
              await prisma.$executeRawUnsafe(`
                DELETE FROM "RepurposedContent" WHERE "contentId" = $1
              `, contentId);
            });
            
            // Insert new repurposed content
            for (const item of repurposedContent) {
              await withPrisma(async (prisma) => {
                await prisma.$executeRawUnsafe(`
                  INSERT INTO "RepurposedContent" ("id", "platform", "content", "contentId", "createdAt", "updatedAt")
                  VALUES ($1, $2, $3, $4, NOW(), NOW())
                `, generateId(), item.platform, item.content, contentId);
              });
            }
            
            // Construct result object for updated content
            newContent = {
              id: contentId,
              title,
              originalContent: content,
              contentType,
              userId,
              createdAt: new Date(), // We don't have the original date in this context
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
          } else {
            // Create new content
            const newContentId = generateId();
            
            // Insert into Content table
            await withPrisma(async (prisma) => {
              await prisma.$executeRawUnsafe(`
                INSERT INTO "Content" ("id", "title", "originalContent", "contentType", "status", "userId", "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, 'Repurposed', $5, NOW(), NOW())
              `, newContentId, title, content, contentType, userId);
            });
            
            // Insert each repurposed content
            for (const item of repurposedContent) {
              await withPrisma(async (prisma) => {
                await prisma.$executeRawUnsafe(`
                  INSERT INTO "RepurposedContent" ("id", "platform", "content", "contentId", "createdAt", "updatedAt")
                  VALUES ($1, $2, $3, $4, NOW(), NOW())
                `, generateId(), item.platform, item.content, newContentId);
              });
            }
            
            // Construct result object
            newContent = {
              id: newContentId,
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
                contentId: newContentId,
                createdAt: new Date(),
                updatedAt: new Date()
              }))
            };
          }
        }

        // Log the final result
        console.log('[REPURPOSE_API] Operation completed:', {
          contentId: newContent.id,
          wasUpdate: !!contentId,
          operation: contentId ? 'UPDATE' : 'CREATE',
          status: newContent.status,
          repurposedCount: newContent.repurposed.length
        });

        // Invalidate content list cache to ensure fresh data on next fetch
        try {
          await withCache(async (cache) => {
            await cache.invalidateContentList(userId);
          });
          console.log('[REPURPOSE_API] Content list cache invalidated for user:', userId);
        } catch (cacheError) {
          console.error('[REPURPOSE_API] Failed to invalidate cache:', cacheError);
          // Don't fail the request if cache invalidation fails
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
            provider: repurposedContent[0]?.provider || 'unknown',
            brandVoice: userBrandVoice,
            totalCharacters: repurposedContent.reduce((sum, item) => sum + (item.characterCount || item.content.length), 0)
          }
        });
      } catch (dbError) {
        console.error('[CONTENT_SAVE_ERROR] Failed to save content to database:', {
          error: dbError instanceof Error ? {
            message: dbError.message,
            stack: dbError.stack,
            name: dbError.name
          } : dbError,
          userId,
          contentType,
          platformsUsed: platformsToUse,
          contentTableExists,
          repurposedContentTableExists,
          databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
        });
        
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
      return new NextResponse(
        JSON.stringify({ 
          error: 'Database error', 
          message: 'Error while processing content' 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('[REPURPOSE_ERROR]', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Error', 
        message: 'An unexpected error occurred' 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
} 