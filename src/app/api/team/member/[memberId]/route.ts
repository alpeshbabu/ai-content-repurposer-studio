import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// This handler needs to be fixed later
export async function GET() {
  return NextResponse.json({ message: 'Not implemented' });
}

interface RouteParams {
  params: {
    memberId: string;
  };
}

export async function DELETE(req: Request, { params }: { params: Promise<{ memberId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { memberId } = await params;

    if (!memberId) {
      return new NextResponse('Member ID is required', { status: 400 });
    }

    try {
      // Get current user to verify they can remove team members
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          role: true, 
          subscriptionPlan: true,
          name: true,
          email: true
        }
      });

      if (!currentUser) {
        return new NextResponse('User not found', { status: 404 });
      }

      // Check if user has team management permissions (agency plan or owner)
      const canManageTeam = currentUser.role === 'owner' || currentUser.subscriptionPlan === 'agency';
      
      if (!canManageTeam) {
        return new NextResponse('Team management requires agency subscription', { status: 403 });
      }

      // Get the member to be removed
      const memberToRemove = await prisma.user.findUnique({
        where: { id: memberId },
        select: { 
          id: true, 
          name: true, 
          email: true, 
          role: true 
        }
      });

      if (!memberToRemove) {
        return new NextResponse('Member not found', { status: 404 });
      }

      // Prevent removing website owners
      if (memberToRemove.role === 'owner') {
        return new NextResponse('Cannot remove website owners', { status: 403 });
      }

      // Prevent users from removing themselves (they should use a different endpoint)
      if (memberToRemove.id === userId) {
        return new NextResponse('Use account deletion endpoint to remove yourself', { status: 400 });
      }

      // For agency users, verify team relationship exists
      if (currentUser.role !== 'owner') {
        // You might want to implement team relationship verification here
        // For now, we'll allow agency users to remove any non-owner member
      }

      // Remove the team member (update their role or delete based on your business logic)
      await prisma.user.update({
        where: { id: memberId },
        data: {
          // Reset to basic member or update team relationship
          role: 'member',
          // You might also want to reset subscription or other team-related fields
        }
      });

      console.log(`Team member ${memberId} (${memberToRemove.email}) removed by ${currentUser.email}`);

      return NextResponse.json({
        success: true,
        message: `Team member ${memberToRemove.name || memberToRemove.email} has been removed`
      });

    } catch (dbError) {
      console.error('[TEAM_MEMBER_REMOVE_DB_ERROR]', dbError);
      return new NextResponse('Database error while removing team member', { status: 500 });
    }
  } catch (error) {
    console.error('[TEAM_MEMBER_REMOVE_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 