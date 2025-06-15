import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withPrisma } from '@/lib/prisma-dynamic';
import { updateSubscription, SUBSCRIPTION_LIMITS, DAILY_LIMITS } from '@/lib/subscription';
import type { SubscriptionPlan } from '@/lib/subscription';
import { 
  validateUserTable, 
  ensureDailyUsageTableExists,
  tableExists
} from '@/lib/db-setup';
import { withCache } from '@/lib/cache-dynamic';

// Force dynamic to prevent build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check cache first for subscription and usage data
    const cachedSubscription = await withCache(async (cache) => {
      return await cache.getSubscription(userId);
    });
    const cachedUsageData = await withCache(async (cache) => {
      return await cache.getUsageData(userId);
    });
    
    if (cachedSubscription && cachedUsageData) {
      return NextResponse.json({
        subscription: cachedSubscription,
        usage: cachedUsageData
      });
    }

    // First, check if all required tables exist
    const userTableValid = await validateUserTable().catch(() => false);
    
    // If user table is invalid, return default values
    if (!userTableValid) {
      console.log('User table validation failed, returning default usage values');
      
      return NextResponse.json({
        subscription: {
          plan: 'free',
          status: 'active', // Set to active so users can use the app
          renewalDate: null
        },
        usage: {
          current: 0,
          limit: SUBSCRIPTION_LIMITS.free,
          remaining: SUBSCRIPTION_LIMITS.free,
          daily: {
            current: 0,
            limit: DAILY_LIMITS.free === Infinity ? 'Unlimited' : DAILY_LIMITS.free,
            remaining: DAILY_LIMITS.free === Infinity ? 'Unlimited' : DAILY_LIMITS.free
          }
        },
        // Message that will be displayed in the UI
        message: 'Could not check usage limits. System is being set up.'
      });
    }

    try {
      // Try to find the user
      const user = await withPrisma(async (prisma) => {
        return await prisma.user.findUnique({
          where: { id: userId },
          select: {
            subscriptionPlan: true,
            subscriptionStatus: true,
            subscriptionRenewalDate: true,
            usageThisMonth: true
          }
        });
      }).catch(error => {
        console.error('Error fetching user data:', error);
        return null;
      });

      // If user is not found, create a sensible default response
      if (!user) {
        console.log('User not found in database, returning default usage values');
        return NextResponse.json({
          subscription: {
            plan: 'free',
            status: 'active',
            renewalDate: null
          },
          usage: {
            current: 0,
            limit: SUBSCRIPTION_LIMITS.free,
            remaining: SUBSCRIPTION_LIMITS.free,
            daily: {
              current: 0,
              limit: DAILY_LIMITS.free === Infinity ? 'Unlimited' : DAILY_LIMITS.free,
              remaining: DAILY_LIMITS.free === Infinity ? 'Unlimited' : DAILY_LIMITS.free
            }
          }
        });
      }

      // Safely get the subscription plan with fallback to free
      const plan = (user.subscriptionPlan as SubscriptionPlan) || 'free';
      
      // Get usage limits from the configuration
      const usageLimit = SUBSCRIPTION_LIMITS[plan];
      const dailyLimit = DAILY_LIMITS[plan];
      
      // Ensure usageThisMonth is a number
      const usageThisMonth = typeof user.usageThisMonth === 'number' ? user.usageThisMonth : 0;

      // Response object with basic info
      const response = {
        subscription: {
          plan: user.subscriptionPlan || 'free',
          status: user.subscriptionStatus || 'active',
          renewalDate: user.subscriptionRenewalDate
        },
        usage: {
          current: usageThisMonth,
          limit: usageLimit === Infinity ? 'Unlimited' : usageLimit,
          remaining: usageLimit === Infinity 
            ? 'Unlimited' 
            : Math.max(0, usageLimit - usageThisMonth),
          daily: {
            current: 0,
            limit: dailyLimit === Infinity ? 'Unlimited' : dailyLimit,
            remaining: dailyLimit === Infinity ? 'Unlimited' : dailyLimit
          } as {
            current: number;
            limit: number | 'Unlimited';
            remaining: number | 'Unlimited';
          }
        }
      };

      // Try to get daily usage, but don't fail if it doesn't work
      try {
        // Check if DailyUsage table exists
        const dailyUsageTableExists = await ensureDailyUsageTableExists().catch(() => false);
        
        if (dailyUsageTableExists) {
          // Get today's usage
          const today = new Date(new Date().setHours(0, 0, 0, 0));
          
          // Use dynamic query to avoid TypeScript errors about missing models
          const dailyUsageResult = await withPrisma(async (prisma) => {
            return await prisma.$queryRawUnsafe<{ count: number }[]>(
              `SELECT "count" FROM "DailyUsage" WHERE "userId" = $1 AND "date" = $2 LIMIT 1`,
              userId,
              today.toISOString()
            );
          }).catch(() => []);
          
          const dailyUsed = dailyUsageResult.length > 0 ? Number(dailyUsageResult[0].count) : 0;
          
          // Update daily usage in response
          response.usage.daily = {
            current: dailyUsed,
            limit: dailyLimit === Infinity ? 'Unlimited' : dailyLimit,
            remaining: dailyLimit === Infinity
              ? 'Unlimited'
              : Math.max(0, dailyLimit - dailyUsed)
          };
        }
      } catch (dailyError) {
        console.error('Error getting daily usage (non-critical):', dailyError);
        // We already have fallback values so no action needed
      }

      // Cache the response data
      await withCache(async (cache) => {
        await cache.setSubscription(userId, response.subscription);
        await cache.setUsageData(userId, response.usage);
      });

      return NextResponse.json(response);
    } catch (dbError) {
      console.error('[DB_QUERY_ERROR]', dbError);
      // Return fallback data with a clear error message
      return NextResponse.json({
        subscription: {
          plan: 'free',
          status: 'active',
          renewalDate: null
        },
        usage: {
          current: 0,
          limit: SUBSCRIPTION_LIMITS.free,
          remaining: SUBSCRIPTION_LIMITS.free,
          daily: {
            current: 0,
            limit: DAILY_LIMITS.free === Infinity ? 'Unlimited' : DAILY_LIMITS.free,
            remaining: DAILY_LIMITS.free === Infinity ? 'Unlimited' : DAILY_LIMITS.free
          }
        },
        message: 'Database error. Usage limits could not be checked.'
      });
    }
  } catch (error) {
    console.error('[SUBSCRIPTION_GET_ERROR]', error);
    
    // Return a fallback response even for unexpected errors
    return NextResponse.json({
      subscription: {
        plan: 'free',
        status: 'active',
        renewalDate: null
      },
      usage: {
        current: 0,
        limit: SUBSCRIPTION_LIMITS.free,
        remaining: SUBSCRIPTION_LIMITS.free,
        daily: {
          current: 0,
          limit: DAILY_LIMITS.free === Infinity ? 'Unlimited' : DAILY_LIMITS.free,
          remaining: DAILY_LIMITS.free === Infinity ? 'Unlimited' : DAILY_LIMITS.free
        }
      },
      message: 'Error checking usage limits. Please try again later.'
    }, { status: 200 }); // Return 200 to avoid UI errors
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if the User table exists
    const userTableExists = await tableExists('User');
    if (!userTableExists) {
      console.error('User table does not exist');
      return new NextResponse('Subscription system is initializing', { status: 503 });
    }

    const { plan } = await req.json();

    if (!plan || !['free', 'basic', 'pro', 'agency'].includes(plan)) {
      return new NextResponse('Invalid plan', { status: 400 });
    }

    try {
      // This is where you would integrate with a payment provider
      // For now, we'll just update the subscription in the database
      
      const renewalDate = new Date();
      renewalDate.setMonth(renewalDate.getMonth() + 1); // Set renewal to 1 month from now

      await updateSubscription(
        userId, 
        plan as SubscriptionPlan,
        'active',
        renewalDate
      );

      // Invalidate cached subscription and usage data
      await withCache(async (cache) => {
        await cache.invalidateSubscription(userId);
        await cache.invalidateUsageData(userId);
      });

      return NextResponse.json({
        success: true,
        message: `Subscription updated to ${plan}`,
        renewalDate
      });
    } catch (dbError) {
      console.error('[DB_UPDATE_ERROR]', dbError);
      return new NextResponse('Database error while updating subscription', { status: 500 });
    }
  } catch (error) {
    console.error('[SUBSCRIPTION_POST_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 