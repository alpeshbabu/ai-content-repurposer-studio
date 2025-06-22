import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { analyticsTracker } from '@/lib/analytics-tracker';

interface Params {
  templateId: string;
}

// GET - Get specific template
export async function GET(
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
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
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

    const templateData = {
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
    };

    await analyticsTracker.trackEvent({
      userId: session.user.id,
      action: 'template_viewed',
      resource: 'template',
      resourceId: template.id
    });

    return NextResponse.json({
      success: true,
      data: templateData
    });

  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

// PUT - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, content, category, tags, platforms, isShared } = body;

    // Check if template exists and user owns it
    const template = await prisma.contentTemplate.findUnique({
      where: { id: params.templateId }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (template.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Validation
    if (name && name.length > 100) {
      return NextResponse.json(
        { error: 'Name must be less than 100 characters' },
        { status: 400 }
      );
    }

    if (content && content.length > 10000) {
      return NextResponse.json(
        { error: 'Content must be less than 10,000 characters' },
        { status: 400 }
      );
    }

    // Update template
    const updatedTemplate = await prisma.contentTemplate.update({
      where: { id: params.templateId },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(content && { content: content.trim() }),
        ...(category && { category }),
        ...(tags && { tags: Array.isArray(tags) ? tags : [] }),
        ...(platforms && { platforms: Array.isArray(platforms) ? platforms : [] }),
        ...(isShared !== undefined && { isShared: Boolean(isShared) })
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
      id: updatedTemplate.id,
      name: updatedTemplate.name,
      description: updatedTemplate.description || '',
      content: updatedTemplate.content,
      category: updatedTemplate.category || 'general',
      tags: updatedTemplate.tags || [],
      platforms: updatedTemplate.platforms || [],
      isShared: updatedTemplate.isShared,
      isStarred: updatedTemplate.isStarred || false,
      createdBy: {
        id: updatedTemplate.user.id,
        name: updatedTemplate.user.name || 'Unknown',
        image: updatedTemplate.user.image
      },
      usageCount: updatedTemplate.usageCount || 0,
      lastUsed: updatedTemplate.lastUsed?.toISOString(),
      createdAt: updatedTemplate.createdAt.toISOString()
    };

    await analyticsTracker.trackEvent({
      userId: session.user.id,
      action: 'template_updated',
      resource: 'template',
      resourceId: updatedTemplate.id,
      metadata: { 
        category: updatedTemplate.category,
        isShared: updatedTemplate.isShared
      }
    });

    return NextResponse.json({
      success: true,
      data: templateData
    });

  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if template exists and user owns it
    const template = await prisma.contentTemplate.findUnique({
      where: { id: params.templateId }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (template.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete template
    await prisma.contentTemplate.delete({
      where: { id: params.templateId }
    });

    await analyticsTracker.trackEvent({
      userId: session.user.id,
      action: 'template_deleted',
      resource: 'template',
      resourceId: params.templateId,
      metadata: { 
        templateName: template.name,
        category: template.category
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
} 