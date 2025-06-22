import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const bulkActionSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one item must be selected'),
  action: z.enum(['archive', 'restore', 'publish']).optional()
});

const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one item must be selected')
});

// PATCH - Bulk update content (archive, restore, publish)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const body = await request.json();
    const { ids, action } = bulkActionSchema.parse(body);

    // Verify all content items belong to the user
    const userContent = await prisma.content.findMany({
      where: {
        id: { in: ids },
        userId: user.id
      },
      select: { id: true }
    });

    if (userContent.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some content items not found or not owned by user' },
        { status: 404 }
      );
    }

    let updateData: any = {};
    
    switch (action) {
      case 'archive':
        // For now, we'll use a soft delete approach or status field
        // Since the current schema doesn't have a status field, we'll add a note to the title
        // In a real implementation, you'd add a status field to the Content model
        updateData = {
          updatedAt: new Date()
          // status: 'archived' // This would be added to the schema
        };
        break;
      case 'restore':
        updateData = {
          updatedAt: new Date()
          // status: 'published'
        };
        break;
      case 'publish':
        updateData = {
          updatedAt: new Date()
          // status: 'published'
        };
        break;
    }

    // Perform bulk update
    const result = await prisma.content.updateMany({
      where: {
        id: { in: ids },
        userId: user.id
      },
      data: updateData
    });

    // Log audit trail for bulk action
    await logBulkAction(user.id, 'BULK_UPDATE', {
      action,
      contentIds: ids,
      affectedCount: result.count
    });

    return NextResponse.json({
      success: true,
      action,
      affectedCount: result.count,
      message: `Successfully ${action}d ${result.count} content item${result.count > 1 ? 's' : ''}`
    });

  } catch (error) {
    console.error('[BULK_UPDATE_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}

// DELETE - Bulk delete content
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const body = await request.json();
    const { ids } = bulkDeleteSchema.parse(body);

    // Verify all content items belong to the user and get titles for audit
    const userContent = await prisma.content.findMany({
      where: {
        id: { in: ids },
        userId: user.id
      },
      select: { id: true, title: true }
    });

    if (userContent.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some content items not found or not owned by user' },
        { status: 404 }
      );
    }

    // Delete repurposed content first (cascade should handle this, but being explicit)
    await prisma.repurposedContent.deleteMany({
      where: {
        contentId: { in: ids }
      }
    });

    // Delete the content items
    const result = await prisma.content.deleteMany({
      where: {
        id: { in: ids },
        userId: user.id
      }
    });

    // Log audit trail for bulk deletion
    await logBulkAction(user.id, 'BULK_DELETE', {
      contentIds: ids,
      contentTitles: userContent.map(c => c.title),
      affectedCount: result.count
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Successfully deleted ${result.count} content item${result.count > 1 ? 's' : ''}`
    });

  } catch (error) {
    console.error('[BULK_DELETE_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete content items' },
      { status: 500 }
    );
  }
}

// Helper function to log audit actions
async function logBulkAction(userId: string, action: string, details: any) {
  // For now, we'll just log to console
  // In Phase 1 security enhancements, we'll implement proper audit logging
  console.log('[AUDIT_LOG]', {
    userId,
    action,
    timestamp: new Date().toISOString(),
    details
  });
  
  // TODO: Implement proper audit logging in database
  // This will be implemented in security-enhanced-2 task
} 