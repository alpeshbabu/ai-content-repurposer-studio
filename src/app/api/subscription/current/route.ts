import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLAN_DETAILS } from '@/lib/stripe';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionRenewalDate: true,
        usageThisMonth: true,
        dailyUsageCount: true,
        dailyUsageDate: true,
        pendingDowngradePlan: true,
        pendingDowngradeDate: true,
        teamId: true,
        team: {
          select: {
            memberLimit: true,
            members: {
              select: { id: true }
            }
          }
        },
        subscriptions: {
          where: { status: { in: ['active', 'trialing'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Get plan details
    const currentPlanDetails = PLAN_DETAILS[user.subscriptionPlan as keyof typeof PLAN_DETAILS];
    const pendingPlanDetails = user.pendingDowngradePlan 
      ? PLAN_DETAILS[user.pendingDowngradePlan as keyof typeof PLAN_DETAILS]
      : null;

    // Calculate daily usage for plans with daily limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isToday = user.dailyUsageDate && 
      user.dailyUsageDate.getTime() === today.getTime();
    
    const currentDailyUsage = isToday ? user.dailyUsageCount : 0;

    // Get team member count for Agency plans
    const teamMemberCount = user.team?.members?.length || 0;

    // Calculate usage limits and remaining
    const monthlyLimit = currentPlanDetails?.limits.monthlyLimit || 0;
    const dailyLimit = currentPlanDetails?.limits.dailyLimit || -1;
    const monthlyRemaining = Math.max(0, monthlyLimit - user.usageThisMonth);
    const dailyRemaining = dailyLimit > 0 ? Math.max(0, dailyLimit - currentDailyUsage) : -1;

    return NextResponse.json({
      currentPlan: user.subscriptionPlan,
      status: user.subscriptionStatus,
      renewalDate: user.subscriptionRenewalDate,
      pendingDowngrade: user.pendingDowngradePlan ? {
        plan: user.pendingDowngradePlan,
        effectiveDate: user.pendingDowngradeDate,
        planDetails: pendingPlanDetails
      } : null,
      usage: {
        monthly: user.usageThisMonth,
        monthlyLimit: monthlyLimit,
        monthlyRemaining: monthlyRemaining,
        daily: currentDailyUsage,
        dailyLimit: dailyLimit,
        dailyRemaining: dailyRemaining,
        usageDate: user.dailyUsageDate
      },
      team: user.teamId ? {
        memberCount: teamMemberCount,
        memberLimit: user.team?.memberLimit || 0,
        canAddMembers: teamMemberCount < (user.team?.memberLimit || 0)
      } : null,
      planDetails: currentPlanDetails,
      subscription: user.subscriptions[0] || null,
    });
  } catch (error) {
    console.error('[GET_CURRENT_SUBSCRIPTION_ERROR]', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch subscription details'
    }, { status: 500 });
  }
} 