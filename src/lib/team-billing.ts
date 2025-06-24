import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { getPlanConfig } from '@/lib/pricing-config';

export interface TeamMemberBillingResult {
  success: boolean;
  message: string;
  subscriptionItemId?: string;
  error?: string;
}

/**
 * Calculate additional team members that need billing
 */
export function calculateAdditionalMembers(totalMembers: number, plan: string): number {
  const planConfig = getPlanConfig(plan as any);
  if (!planConfig || plan !== 'agency') {
    return 0;
  }
  
  const includedMembers = planConfig.teamMembers;
  return Math.max(0, totalMembers - includedMembers);
}

/**
 * Add additional team member billing to Stripe subscription
 */
export async function addTeamMemberBilling(
  userId: string,
  stripeCustomerId: string,
  subscriptionId: string
): Promise<TeamMemberBillingResult> {
  try {
    // Get user's team info
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
      return {
        success: false,
        message: 'User or team not found'
      };
    }

    if (user.subscriptionPlan !== 'agency') {
      return {
        success: false,
        message: 'Additional team member billing only available for Agency plan'
      };
    }

    // Calculate additional members
    const totalMembers = user.team.members.length;
    const additionalMembers = calculateAdditionalMembers(totalMembers, user.subscriptionPlan);

    if (additionalMembers <= 0) {
      return {
        success: true,
        message: 'No additional members to bill'
      };
    }

    // Get the Stripe subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Check if we already have a team member subscription item
    const existingItem = subscription.items.data.find(
      item => item.price.id === process.env.STRIPE_AGENCY_ADDITIONAL_MEMBER_PRICE_ID
    );

    if (existingItem) {
      // Update existing subscription item quantity
      await stripe.subscriptionItems.update(existingItem.id, {
        quantity: additionalMembers,
        proration_behavior: 'create_prorations'
      });

      return {
        success: true,
        message: `Updated billing for ${additionalMembers} additional team members`,
        subscriptionItemId: existingItem.id
      };
    } else {
      // Add new subscription item for additional members
      const subscriptionItem = await stripe.subscriptionItems.create({
        subscription: subscriptionId,
        price: process.env.STRIPE_AGENCY_ADDITIONAL_MEMBER_PRICE_ID!,
        quantity: additionalMembers,
        proration_behavior: 'create_prorations'
      });

      return {
        success: true,
        message: `Added billing for ${additionalMembers} additional team members`,
        subscriptionItemId: subscriptionItem.id
      };
    }
  } catch (error) {
    console.error('[TEAM_MEMBER_BILLING_ERROR]', error);
    return {
      success: false,
      message: 'Failed to update team member billing',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Remove team member billing when members are removed
 */
export async function updateTeamMemberBilling(
  userId: string,
  subscriptionId: string
): Promise<TeamMemberBillingResult> {
  try {
    // Get user's current team info
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
      return {
        success: false,
        message: 'User or team not found'
      };
    }

    // Calculate current additional members
    const totalMembers = user.team.members.length;
    const additionalMembers = calculateAdditionalMembers(totalMembers, user.subscriptionPlan);

    // Get the Stripe subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Find the team member subscription item
    const teamMemberItem = subscription.items.data.find(
      item => item.price.id === process.env.STRIPE_AGENCY_ADDITIONAL_MEMBER_PRICE_ID
    );

    if (!teamMemberItem) {
      if (additionalMembers > 0) {
        // Need to add billing for additional members
        return addTeamMemberBilling(userId, user.stripeCustomerId!, subscriptionId);
      }
      return {
        success: true,
        message: 'No team member billing to update'
      };
    }

    if (additionalMembers <= 0) {
      // Remove the subscription item entirely
      await stripe.subscriptionItems.del(teamMemberItem.id, {
        proration_behavior: 'create_prorations'
      });

      return {
        success: true,
        message: 'Removed additional team member billing'
      };
    } else {
      // Update the quantity
      await stripe.subscriptionItems.update(teamMemberItem.id, {
        quantity: additionalMembers,
        proration_behavior: 'create_prorations'
      });

      return {
        success: true,
        message: `Updated billing for ${additionalMembers} additional team members`,
        subscriptionItemId: teamMemberItem.id
      };
    }
  } catch (error) {
    console.error('[UPDATE_TEAM_MEMBER_BILLING_ERROR]', error);
    return {
      success: false,
      message: 'Failed to update team member billing',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get current team member billing info
 */
export async function getTeamMemberBillingInfo(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    const teamMemberItem = subscription.items.data.find(
      item => item.price.id === process.env.STRIPE_AGENCY_ADDITIONAL_MEMBER_PRICE_ID
    );

    if (!teamMemberItem) {
      return {
        hasAdditionalMembers: false,
        quantity: 0,
        monthlyCharge: 0
      };
    }

    const planConfig = getPlanConfig('agency');
    const monthlyCharge = (teamMemberItem.quantity || 0) * planConfig.additionalMemberPrice;

    return {
      hasAdditionalMembers: true,
      quantity: teamMemberItem.quantity || 0,
      monthlyCharge,
      subscriptionItemId: teamMemberItem.id
    };
  } catch (error) {
    console.error('[GET_TEAM_MEMBER_BILLING_INFO_ERROR]', error);
    return {
      hasAdditionalMembers: false,
      quantity: 0,
      monthlyCharge: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 