import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if user is part of a team
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        team: {
          include: {
            members: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    if (!user.team) {
      return NextResponse.json({ team: null });
    }

    return NextResponse.json({
      team: {
        id: user.team.id,
        name: user.team.name,
        ownerId: user.team.ownerId,
        memberLimit: user.team.memberLimit,
        members: user.team.members,
        isOwner: user.team.ownerId === userId,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[TEAM_GET_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check user's subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionPlan: true,
        team: true
      }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    if (user.subscriptionPlan !== 'agency') {
      return new NextResponse('Agency subscription required', { status: 403 });
    }

    if (user.team) {
      return new NextResponse('User already has a team', { status: 400 });
    }

    const { name } = await req.json();

    if (!name) {
      return new NextResponse('Team name is required', { status: 400 });
    }

    // Create new team with user as owner
    const team = await prisma.team.create({
      data: {
        name,
        ownerId: userId,
        members: {
          connect: { id: userId }
        }
      }
    });

    // Update user's role
    await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'owner'
      }
    });

    return NextResponse.json({
      success: true,
      team
    });
  } catch (error) {
    console.error('[TEAM_POST_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Find team where user is owner
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { team: true }
    });

    if (!user?.team) {
      return new NextResponse('Team not found', { status: 404 });
    }

    if (user.team.ownerId !== userId) {
      return new NextResponse('Only team owner can delete the team', { status: 403 });
    }

    // Delete team
    await prisma.team.delete({
      where: { id: user.team.id }
    });

    // Update team members
    await prisma.user.updateMany({
      where: { teamId: user.team.id },
      data: {
        teamId: null,
        role: 'member'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('[TEAM_DELETE_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 