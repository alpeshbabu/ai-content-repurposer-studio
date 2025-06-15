import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return new NextResponse('Token is required', { status: 400 });
    }

    // Find the invitation
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        team: {
          select: {
            name: true
          }
        }
      }
    });

    if (!invitation) {
      return new NextResponse('Invalid invitation token', { status: 404 });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return new NextResponse('Invitation is no longer pending', { status: 400 });
    }

    // Update the invitation status to declined
    await prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: { status: 'declined' }
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation declined successfully',
      team: {
        name: invitation.team.name
      }
    });
  } catch (error) {
    console.error('[TEAM_INVITE_DECLINE_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 