import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateTeamMemberBilling } from '@/lib/team-billing';

// This handler needs to be fixed later
export async function GET() {
  return NextResponse.json({ message: 'Not implemented' });
}

interface RouteParams {
  params: {
    memberId: string;
  };
}

export async function DELETE(
  req: Request,
  { params }: { params: { memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { memberId } = params;

    // Get current user with team info
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        team: {
          include: {
            members: true
          }
        }
      }
    });

    if (!currentUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    if (!currentUser.team) {
      return new NextResponse('Team not found', { status: 404 });
    }

    // Check permissions
    if (currentUser.role !== 'owner' && currentUser.role !== 'admin') {
      return new NextResponse('Only team owners and admins can remove members', { status: 403 });
    }

    // Get member to remove
    const memberToRemove = await prisma.user.findFirst({
      where: {
        id: memberId,
        teamId: currentUser.team.id
      }
    });

    if (!memberToRemove) {
      return new NextResponse('Team member not found', { status: 404 });
    }

    // Prevent removing team owner
    if (memberToRemove.role === 'owner') {
      return new NextResponse('Cannot remove team owner', { status: 403 });
    }

    // Prevent non-owners from removing admins
    if (memberToRemove.role === 'admin' && currentUser.role !== 'owner') {
      return new NextResponse('Only team owners can remove admin members', { status: 403 });
    }

    // Prevent removing yourself (unless you're transferring ownership)
    if (memberToRemove.id === currentUser.id) {
      return new NextResponse('Cannot remove yourself from team', { status: 403 });
    }

    // Remove member from team
    await prisma.user.update({
      where: { id: memberId },
      data: {
        teamId: null,
        role: 'member'
      }
    });

    console.log(`Team member removed: ${memberToRemove.email} by ${currentUser.email}`);

    // Handle billing for reduced team members (Agency plan only)
    let billingResult = null;
    if (currentUser.subscriptionPlan === 'agency' && currentUser.stripeCustomerId) {
      try {
        // Get user's subscription
        const subscription = await prisma.subscription.findFirst({
          where: {
            userId: currentUser.id,
            status: 'active'
          }
        });

        if (subscription && subscription.stripeSubscriptionId) {
          billingResult = await updateTeamMemberBilling(
            currentUser.id,
            subscription.stripeSubscriptionId
          );
          
          if (!billingResult.success) {
            console.warn('[TEAM_MEMBER_BILLING_WARNING]', billingResult.message);
          }
        }
      } catch (billingError) {
        console.error('[TEAM_MEMBER_BILLING_ERROR]', billingError);
        // Don't fail the entire request if billing fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Team member removed successfully',
      removedMember: {
        id: memberToRemove.id,
        name: memberToRemove.name,
        email: memberToRemove.email
      },
      billing: billingResult ? {
        success: billingResult.success,
        message: billingResult.message
      } : null
    });

  } catch (error) {
    console.error('[REMOVE_TEAM_MEMBER_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { memberId } = params;
    const { role } = await req.json();

    // Get current user with team info
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        team: {
          include: {
            members: true
          }
        }
      }
    });

    if (!currentUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    if (!currentUser.team) {
      return new NextResponse('Team not found', { status: 404 });
    }

    // Only owners can change roles
    if (currentUser.role !== 'owner') {
      return new NextResponse('Only team owners can change member roles', { status: 403 });
    }

    // Validate role
    const validRoles = ['member', 'admin'];
    if (!validRoles.includes(role)) {
      return new NextResponse('Invalid role specified', { status: 400 });
    }

    // Get member to update
    const memberToUpdate = await prisma.user.findFirst({
      where: {
        id: memberId,
        teamId: currentUser.team.id
      }
    });

    if (!memberToUpdate) {
      return new NextResponse('Team member not found', { status: 404 });
    }

    // Prevent changing owner role
    if (memberToUpdate.role === 'owner') {
      return new NextResponse('Cannot change team owner role', { status: 403 });
    }

    // Update member role
    const updatedMember = await prisma.user.update({
      where: { id: memberId },
      data: { role }
    });

    console.log(`Team member role updated: ${updatedMember.email} -> ${role} by ${currentUser.email}`);

    return NextResponse.json({
      success: true,
      message: 'Team member role updated successfully',
      member: {
        id: updatedMember.id,
        name: updatedMember.name,
        email: updatedMember.email,
        role: updatedMember.role
      }
    });

  } catch (error) {
    console.error('[UPDATE_TEAM_MEMBER_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 