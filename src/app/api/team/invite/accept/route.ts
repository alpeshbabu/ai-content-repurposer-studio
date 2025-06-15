import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { token } = await req.json();

    if (!token) {
      return new NextResponse('Token is required', { status: 400 });
    }

    // Find the invitation
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        team: {
          include: {
            members: true
          }
        }
      }
    });

    if (!invitation) {
      return new NextResponse('Invalid invitation token', { status: 404 });
    }

    // Check if invitation is still valid
    if (invitation.status !== 'pending') {
      return new NextResponse('Invitation is no longer pending', { status: 400 });
    }

    if (invitation.expiresAt < new Date()) {
      return new NextResponse('Invitation has expired', { status: 400 });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Check if invitation email matches user email
    if (user.email !== invitation.email) {
      return new NextResponse('Invitation email does not match your account', { status: 403 });
    }

    // Check if user is already in a team
    if (user.teamId) {
      return new NextResponse('You are already a member of a team', { status: 400 });
    }

    // Check if team has capacity
    if (invitation.team.members.length >= invitation.team.memberLimit) {
      return new NextResponse('Team has reached its member limit', { status: 400 });
    }

    // Accept the invitation - update user and invitation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the invitation status
      await tx.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted' }
      });

      // Add user to the team
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          teamId: invitation.teamId,
          role: 'member'
        },
        include: {
          team: {
            select: {
              name: true
            }
          }
        }
      });

      return updatedUser;
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the team',
      team: {
        name: result.team?.name
      }
    });
  } catch (error) {
    console.error('[TEAM_INVITE_ACCEPT_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 