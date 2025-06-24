import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { aiService, ContentType, AIProvider } from '@/lib/ai-service';
import { incrementUsage, recordOverageCharge, SubscriptionPlan, SUBSCRIPTION_LIMITS } from '@/lib/subscription';
import { tableExists, validateUserTable } from '@/lib/db-setup';
import { z } from 'zod';
import { canUserRepurpose } from '@/lib/subscription';

// Validation schema
const generateContentSchema = z.object({
  keywords: z.string().min(1, 'Keywords are required'),
  contentType: z.enum(['blog', 'article', 'social_post', 'email', 'video_transcript', 'general']),
  tone: z.string().optional(),
  brandVoice: z.string().optional(),
  targetAudience: z.string().optional(),
  additionalInstructions: z.string().optional(),
  provider: z.enum(['anthropic', 'groq']).optional(),
  model: z.string().optional(),
  allowOverage: z.boolean().default(false)
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return new NextResponse('Invalid JSON', { status: 400 });
    }

    const validation = generateContentSchema.safeParse(body);
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
      keywords, 
      contentType, 
      tone, 
      brandVoice, 
      targetAudience, 
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

    try {
      // Get user's subscription plan and payment status
      let user;
      try {
        user = await prisma.user.findUnique({
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
      
      // Check if user can repurpose content
      const canGenerate = await canUserRepurpose(userId);
      
      if (!canGenerate) {
        return NextResponse.json(
          { 
            error: 'Usage limit exceeded',
            message: 'Monthly usage limit exceeded. Please upgrade your plan or enable overage charges in your settings.'
          },
          { status: 403 }
        );
      }

      // Check if Settings table exists and fetch user settings for brand voice
      const settingsTableExists = await tableExists('Settings');
      let userBrandVoice = brandVoice; // Use provided brand voice or default to user's saved one
      
      if (!userBrandVoice && settingsTableExists) {
        try {
          const settings = await prisma.settings.findUnique({ where: { userId } });
          userBrandVoice = settings?.brandVoice || '';
        } catch (error) {
          console.error('Error fetching user settings:', error);
        }
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

      // Generate content using AI service
      const generationRequest = {
        keywords,
        contentType: contentType as ContentType,
        tone,
        brandVoice: userBrandVoice,
        targetAudience,
        additionalInstructions
      };

      const aiConfig = {
        provider: selectedProvider as AIProvider,
        ...(model && { model })
      };

      let aiResponse;
      try {
        aiResponse = await aiService.generateContent(generationRequest, aiConfig);
      } catch (aiError) {
        console.error('AI generation error:', aiError);
        return new NextResponse(
          JSON.stringify({
            error: 'Content generation failed',
            message: aiError instanceof Error ? aiError.message : 'Failed to generate content with AI service'
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Try to increment usage count
      try {
        await incrementUsage(userId);
      } catch (error) {
        console.error('Error incrementing usage:', error);
        // Continue without failing the request
      }

      // Save generated content to database
      let savedContent = null;
      try {
        // Check if Content table exists
        const contentTableExists = await tableExists('Content');
        
        if (contentTableExists) {
          // Create a title from keywords if not provided
          const contentTitle = keywords.length > 50 
            ? keywords.substring(0, 50) + '...' 
            : keywords;

          savedContent = await prisma.content.create({
            data: {
              title: contentTitle,
              originalContent: aiResponse.content,
              contentType,
              status: 'Generated', // Mark as generated content
              userId,
            },
            select: {
              id: true,
              title: true,
              status: true,
              createdAt: true
            }
          });
          
          console.log(`✅ Saved generated content: "${savedContent.title}" (ID: ${savedContent.id})`);
        } else {
          console.log('⚠️ Content table does not exist, skipping database save');
        }
      } catch (saveError) {
        console.error('Error saving generated content to database:', saveError);
        // Continue without failing the request - content generation succeeded
      }

      // Return the generated content with database info
      const response = {
        success: true,
        data: {
          content: aiResponse.content,
          contentId: savedContent?.id || null,
          title: savedContent?.title || keywords,
          status: savedContent?.status || 'Generated',
          saved: !!savedContent,
          generatedAt: new Date().toISOString(),
          provider: aiResponse.provider,
          model: aiResponse.model,
          metadata: {
            keywords,
            contentType,
            tone,
            brandVoice: userBrandVoice,
            targetAudience,
            charactersGenerated: aiResponse.content.length
          }
        },
        usage: {
          currentUsage: user.usageThisMonth + 1,
          monthlyLimit: SUBSCRIPTION_LIMITS[plan],
          plan: plan,
          remainingUsage: Math.max(0, SUBSCRIPTION_LIMITS[plan] - user.usageThisMonth - 1)
        }
      };

      return NextResponse.json(response);

    } catch (dbError) {
      console.error('[DB_ERROR]', dbError);
      return new NextResponse('Database error while processing request', { status: 500 });
    }
  } catch (error) {
    console.error('[CONTENT_GENERATE_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}