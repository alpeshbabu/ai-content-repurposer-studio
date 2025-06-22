import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimiter } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimiter.checkLimit(session.user.id, 'team_activity');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: rateLimitResult.resetTime },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get user's team
    const userWithTeam = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, image: true }
                }
              }
            }
          }
        }
      }
    });

    if (!userWithTeam?.team) {
      return NextResponse.json({
        success: true,
        data: {
          activities: [],
          team: null
        }
      });
    }

    const teamMemberIds = userWithTeam.team.members.map(m => m.userId);

    // Get recent activities from team members
    const activities = await prisma.auditLog.findMany({
      where: {
        userId: { in: teamMemberIds },
        action: {
          in: [
            'content_created',
            'content_edited',
            'content_shared',
            'comment_added',
            'template_used',
            'content_repurposed'
          ]
        }
      },
      include: {
        user: {
          select: { name: true, image: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Transform to activity feed items
    const feedItems = activities.map(activity => ({
      id: activity.id,
      type: activity.action,
      userId: activity.userId,
      user: activity.user,
      contentId: activity.resourceId,
      description: generateActivityDescription(activity.action, activity.user.name, activity.metadata),
      metadata: activity.metadata,
      timestamp: activity.createdAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        activities: feedItems,
        team: {
          id: userWithTeam.team.id,
          name: userWithTeam.team.name,
          memberCount: userWithTeam.team.members.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching team activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team activity' },
      { status: 500 }
    );
  }
}

function generateActivityDescription(action: string, userName: string, metadata: any): string {
  switch (action) {
    case 'content_created':
      return `${userName} created new content`;
    case 'content_edited':
      return `${userName} edited content`;
    case 'content_shared':
      return `${userName} shared content with the team`;
    case 'comment_added':
      return `${userName} added a comment`;
    case 'template_used':
      return `${userName} used a template`;
    case 'content_repurposed':
      return `${userName} repurposed content for ${metadata?.platforms?.join(', ') || 'platforms'}`;
    default:
      return `${userName} performed an action`;
  }
} 