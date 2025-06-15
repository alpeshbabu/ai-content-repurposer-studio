import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateCryptoSecureToken } from '@/lib/security-node';
import { sendTeamInvitationEmail } from '@/lib/email-agents';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if user is team owner or admin and has agency plan
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        team: {
          include: {
            members: true,
            invitations: {
              where: {
                status: 'pending',
                expiresAt: {
                  gt: new Date()
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    if (user.subscriptionPlan !== 'agency') {
      return new NextResponse('Agency subscription required', { status: 403 });
    }

    if (!user.team) {
      return new NextResponse('Team not found', { status: 404 });
    }

    if (user.role !== 'owner' && user.role !== 'admin') {
      return new NextResponse('Only team owners and admins can invite members', { status: 403 });
    }

    const { email } = await req.json();

    if (!email) {
      return new NextResponse('Email is required', { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new NextResponse('Invalid email format', { status: 400 });
    }

    // Check if team has reached member limit (including pending invitations)
    const totalSlots = user.team.members.length + user.team.invitations.length;
    if (totalSlots >= user.team.memberLimit) {
      return new NextResponse('Team member limit reached', { status: 403 });
    }

    // Check if email is already a team member
    const existingMember = user.team.members.find(member => member.email === email);
    if (existingMember) {
      return new NextResponse('User is already a team member', { status: 400 });
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await prisma.teamInvitation.findUnique({
      where: {
        teamId_email: {
          teamId: user.team.id,
          email: email
        }
      }
    });

    if (existingInvitation) {
      if (existingInvitation.status === 'pending' && existingInvitation.expiresAt > new Date()) {
        return new NextResponse('An invitation has already been sent to this email', { status: 400 });
      }
      
      // Delete expired or declined invitation
      await prisma.teamInvitation.delete({
        where: { id: existingInvitation.id }
      });
    }

    // Generate invitation token and expiry
    const token = generateCryptoSecureToken(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    // Create invitation
    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId: user.team.id,
        email,
        invitedBy: userId,
        token,
        expiresAt,
        status: 'pending'
      },
      include: {
        team: {
          select: {
            name: true
          }
        },
        inviter: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Send invitation email
    const emailResult = await sendTeamInvitationEmail({
      recipientEmail: email,
      teamName: invitation.team.name,
      inviterName: invitation.inviter.name || invitation.inviter.email,
      invitationToken: token,
      expiresAt: expiresAt
    });

    // Log email result
    if (emailResult.success) {
      console.log(`Team invitation email sent successfully via ${emailResult.provider}:`, emailResult.messageId);
    } else {
      console.warn('Failed to send invitation email:', emailResult.error || emailResult.message);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        teamName: invitation.team.name,
        inviterName: invitation.inviter.name || invitation.inviter.email,
        expiresAt: invitation.expiresAt
      },
      emailSent: emailResult.success,
      emailProvider: emailResult.provider
    });
  } catch (error) {
    console.error('[TEAM_INVITE_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 