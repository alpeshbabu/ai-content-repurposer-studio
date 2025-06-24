import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTeamMemberBillingInfo, calculateAdditionalMembers } from '@/lib/team-billing';
import { getPlanConfig } from '@/lib/pricing-config';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with team and subscription info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        team: {
          include: {
            members: true,
            billings: {
              orderBy: { createdAt: 'desc' },
              take: 12 // Last 12 months
            }
          }
        },
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.subscriptionPlan !== 'agency') {
      return NextResponse.json({ 
        error: 'Team member billing is only available for Agency plan users' 
      }, { status: 403 });
    }

    const planConfig = getPlanConfig('agency');
    const currentTeamSize = user.team?.members.length || 0;
    const additionalMembers = calculateAdditionalMembers(currentTeamSize, 'agency');
    const monthlyCharge = additionalMembers * planConfig.additionalMemberPrice;

    // Get current billing info from Stripe if subscription exists
    let stripeBillingInfo = null;
    if (user.subscriptions.length > 0 && user.subscriptions[0].stripeSubscriptionId) {
      try {
        stripeBillingInfo = await getTeamMemberBillingInfo(
          user.subscriptions[0].stripeSubscriptionId
        );
      } catch (error) {
        console.warn('Failed to fetch Stripe billing info:', error);
      }
    }

    return NextResponse.json({
      currentBilling: {
        teamSize: currentTeamSize,
        includedMembers: planConfig.teamMembers,
        additionalMembers,
        pricePerAdditionalMember: planConfig.additionalMemberPrice,
        monthlyCharge,
        nextBillingDate: user.subscriptionRenewalDate
      },
      stripeBilling: stripeBillingInfo,
      billingHistory: user.team?.billings.map(billing => ({
        id: billing.id,
        month: billing.billingMonth,
        year: billing.billingYear,
        memberCount: billing.memberCount,
        additionalMembers: billing.additionalMembers,
        chargeAmount: billing.chargeAmount,
        createdAt: billing.createdAt
      })) || [],
      teamMembers: user.team?.members.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        joinedAt: member.createdAt
      })) || []
    });

  } catch (error) {
    console.error('[TEAM_MEMBER_BILLING_API_ERROR]', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch team member billing information'
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with team info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        team: {
          include: {
            members: true
          }
        }
      }
    });

    if (!user || !user.team) {
      return NextResponse.json({ error: 'User or team not found' }, { status: 404 });
    }

    if (user.subscriptionPlan !== 'agency') {
      return NextResponse.json({ 
        error: 'Team member billing is only available for Agency plan users' 
      }, { status: 403 });
    }

    // Create billing record for current month
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const planConfig = getPlanConfig('agency');
    const currentTeamSize = user.team.members.length;
    const additionalMembers = calculateAdditionalMembers(currentTeamSize, 'agency');
    const chargeAmount = additionalMembers * planConfig.additionalMemberPrice;

    // Check if billing record already exists for this month
    const existingBilling = await prisma.teamMemberBilling.findUnique({
      where: {
        teamId_billingMonth_billingYear: {
          teamId: user.team.id,
          billingMonth: currentMonth,
          billingYear: currentYear
        }
      }
    });

    if (existingBilling) {
      return NextResponse.json({
        message: 'Billing record already exists for this month',
        billing: existingBilling
      });
    }

    // Create new billing record
    const billingRecord = await prisma.teamMemberBilling.create({
      data: {
        teamId: user.team.id,
        userId: user.id,
        billingMonth: currentMonth,
        billingYear: currentYear,
        memberCount: currentTeamSize,
        additionalMembers,
        chargeAmount
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Team member billing record created',
      billing: billingRecord
    });

  } catch (error) {
    console.error('[CREATE_TEAM_MEMBER_BILLING_ERROR]', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to create team member billing record'
    }, { status: 500 });
  }
} 