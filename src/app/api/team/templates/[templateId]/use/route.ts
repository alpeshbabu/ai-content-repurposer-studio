import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { analyticsTracker } from '@/lib/analytics-tracker';

interface Params {
  templateId: string;
}

// POST - Use template
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await prisma.contentTemplate.findUnique({
      where: { id: params.templateId },
      include: {
        user: true
      }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check access permission
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

    const teamMemberIds = userWithTeam?.team?.members.map(m => m.userId) || [];
    const hasAccess = template.userId === session.user.id || 
                     (template.isShared && teamMemberIds.includes(template.userId));

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update template usage statistics
    await prisma.contentTemplate.update({
      where: { id: params.templateId },
      data: {
        usageCount: {
          increment: 1
        },
        lastUsed: new Date()
      }
    });

    // Track analytics
    await analyticsTracker.trackEvent({
      userId: session.user.id,
      action: 'template_used',
      resource: 'template',
      resourceId: params.templateId,
      metadata: {
        templateName: template.name,
        templateOwner: template.userId,
        category: template.category
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: template.id,
        name: template.name,
        content: template.content,
        category: template.category,
        platforms: template.platforms || [],
        tags: template.tags || []
      }
    });

  } catch (error) {
    console.error('Error using template:', error);
    return NextResponse.json(
      { error: 'Failed to use template' },
      { status: 500 }
    );
  }
} 