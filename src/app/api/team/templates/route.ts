import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimiter } from '@/lib/rate-limit';
import { analyticsTracker } from '@/lib/analytics-tracker';

// GET - Fetch team templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimiter.checkLimit(session.user.id, 'team_templates');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: rateLimitResult.resetTime },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get user's team
    const userWithTeam = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        team: {
          include: {
            members: true
          }
        }
      }
    });

    if (!userWithTeam?.team) {
      return NextResponse.json({ success: true, data: [] });
    }

    const teamMemberIds = userWithTeam.team.members.map(m => m.userId);

    // Fetch team templates
    const whereClause: any = {
      OR: [
        { userId: { in: teamMemberIds }, isShared: true }, // Shared team templates
        { userId: session.user.id } // User's own templates
      ]
    };

    if (category && category !== 'all') {
      whereClause.category = category;
    }

    const templates = await prisma.contentTemplate.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: [
        { isStarred: 'desc' },
        { usageCount: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    // Transform templates data
    const templatesData = templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description || '',
      content: template.content,
      category: template.category || 'general',
      tags: template.tags || [],
      platforms: template.platforms || [],
      isShared: template.isShared,
      isStarred: template.isStarred || false,
      createdBy: {
        id: template.user.id,
        name: template.user.name || 'Unknown',
        image: template.user.image
      },
      usageCount: template.usageCount || 0,
      lastUsed: template.lastUsed?.toISOString(),
      createdAt: template.createdAt.toISOString()
    }));

    await analyticsTracker.trackEvent({
      userId: session.user.id,
      action: 'team_templates_viewed',
      resource: 'team',
      metadata: { category, count: templatesData.length }
    });

    return NextResponse.json({
      success: true,
      data: templatesData
    });

  } catch (error) {
    console.error('Error fetching team templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team templates' },
      { status: 500 }
    );
  }
}

// POST - Create new team template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimiter.checkLimit(session.user.id, 'create_template');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: rateLimitResult.resetTime },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, description, content, category, tags, platforms, isShared } = body;

    // Validation
    if (!name || !content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Name must be less than 100 characters' },
        { status: 400 }
      );
    }

    if (content.length > 10000) {
      return NextResponse.json(
        { error: 'Content must be less than 10,000 characters' },
        { status: 400 }
      );
    }

    // Create template
    const template = await prisma.contentTemplate.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        content: content.trim(),
        category: category || 'general',
        tags: Array.isArray(tags) ? tags : [],
        platforms: Array.isArray(platforms) ? platforms : [],
        isShared: Boolean(isShared),
        usageCount: 0
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    const templateData = {
      id: template.id,
      name: template.name,
      description: template.description || '',
      content: template.content,
      category: template.category || 'general',
      tags: template.tags || [],
      platforms: template.platforms || [],
      isShared: template.isShared,
      isStarred: false,
      createdBy: {
        id: template.user.id,
        name: template.user.name || 'Unknown',
        image: template.user.image
      },
      usageCount: 0,
      lastUsed: null,
      createdAt: template.createdAt.toISOString()
    };

    await analyticsTracker.trackEvent({
      userId: session.user.id,
      action: 'team_template_created',
      resource: 'template',
      resourceId: template.id,
      metadata: { 
        category: template.category,
        isShared: template.isShared,
        platforms: template.platforms,
        tags: template.tags
      }
    });

    return NextResponse.json({
      success: true,
      data: templateData
    });

  } catch (error) {
    console.error('Error creating team template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
} 