import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLAN_DETAILS } from '@/lib/stripe';

const PLAN_HIERARCHY = ['free', 'basic', 'pro', 'agency'];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { targetPlan, confirmFeatureLoss } = await req.json();

    if (!targetPlan || !['free', 'basic', 'pro', 'agency'].includes(targetPlan)) {
      return NextResponse.json({
        error: 'Invalid target plan'
      }, { status: 400 });
    }

    if (!confirmFeatureLoss) {
      return NextResponse.json({
        error: 'Feature loss confirmation required'
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionRenewalDate: true,
        usageThisMonth: true,
        teamId: true,
        team: {
          select: {
            memberLimit: true,
            members: { select: { id: true } }
          }
        }
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Validate this is actually a downgrade
    const currentPlanIndex = PLAN_HIERARCHY.indexOf(user.subscriptionPlan);
    const targetPlanIndex = PLAN_HIERARCHY.indexOf(targetPlan);

    if (targetPlanIndex >= currentPlanIndex) {
      return NextResponse.json({
        error: 'Invalid downgrade',
        message: 'Target plan must be lower tier than current plan'
      }, { status: 400 });
    }

    // Check if current usage exceeds target plan limits
    const targetPlanDetails = PLAN_DETAILS[targetPlan as keyof typeof PLAN_DETAILS];
    if (user.usageThisMonth > targetPlanDetails.limits.monthlyLimit) {
      return NextResponse.json({
        error: 'Usage limit exceeded',
        message: `Current usage (${user.usageThisMonth}) exceeds target plan limit (${targetPlanDetails.limits.monthlyLimit}). Please wait until next billing cycle.`,
        currentUsage: user.usageThisMonth,
        targetLimit: targetPlanDetails.limits.monthlyLimit
      }, { status: 400 });
    }

    // Check team member limits for Agency downgrades
    if (user.teamId && user.team) {
      const teamMemberCount = user.team.members.length;
      const targetMemberLimit = targetPlanDetails.limits.maxTeamMembers;
      
      if (teamMemberCount > targetMemberLimit) {
        return NextResponse.json({
          error: 'Team size exceeds limit',
          message: `Your team has ${teamMemberCount} members, but ${targetPlan} plan allows only ${targetMemberLimit}. Please remove team members first.`,
          currentMembers: teamMemberCount,
          targetLimit: targetMemberLimit
        }, { status: 400 });
      }
    }

    // Use renewal date or calculate next billing cycle
    let effectiveDate = user.subscriptionRenewalDate;
    if (!effectiveDate) {
      // If no renewal date, schedule for end of current month
      effectiveDate = new Date();
      effectiveDate.setMonth(effectiveDate.getMonth() + 1);
      effectiveDate.setDate(1); // First day of next month
      effectiveDate.setHours(0, 0, 0, 0);
    }

    // Create subscription change record
    const subscriptionChange = await prisma.subscriptionChange.create({
      data: {
        userId: user.id,
        fromPlan: user.subscriptionPlan,
        toPlan: targetPlan,
        changeType: 'downgrade',
        scheduledDate: effectiveDate,
        status: 'pending'
      }
    });

    // Update user with pending downgrade info
    await prisma.user.update({
      where: { id: user.id },
      data: {
        pendingDowngradePlan: targetPlan,
        pendingDowngradeDate: effectiveDate
      }
    });

    return NextResponse.json({
      success: true,
      message: `Downgrade to ${targetPlan} plan scheduled`,
      downgrade: {
        fromPlan: user.subscriptionPlan,
        toPlan: targetPlan,
        effectiveDate: effectiveDate,
        changeId: subscriptionChange.id
      }
    });

  } catch (error) {
    console.error('[DOWNGRADE_SUBSCRIPTION_ERROR]', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to schedule downgrade'
    }, { status: 500 });
  }
}

// Cancel pending downgrade
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, pendingDowngradePlan: true }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    if (!user.pendingDowngradePlan) {
      return NextResponse.json({
        error: 'No pending downgrade found'
      }, { status: 404 });
    }

    // Cancel pending subscription changes
    await prisma.subscriptionChange.updateMany({
      where: {
        userId: user.id,
        status: 'pending',
        changeType: 'downgrade'
      },
      data: {
        status: 'canceled',
        processedDate: new Date()
      }
    });

    // Clear pending downgrade from user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        pendingDowngradePlan: null,
        pendingDowngradeDate: null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Pending downgrade canceled'
    });

  } catch (error) {
    console.error('[CANCEL_DOWNGRADE_ERROR]', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to cancel downgrade'
    }, { status: 500 });
  }
} 