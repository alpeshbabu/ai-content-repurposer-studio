import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createVersionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  originalContent: z.string().min(1, 'Content is required'),
  contentType: z.string(),
  isDraft: z.boolean().default(false)
});

// GET - Get all versions of a content item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const contentId = params.id;

    // First, check if the content exists and belongs to the user
    const content = await prisma.content.findFirst({
      where: {
        id: contentId,
        userId: user.id
      }
    });

    if (!content) {
      return new NextResponse('Content not found', { status: 404 });
    }

    // Get the root content (original version) and all its versions
    const rootContentId = content.parentId || contentId;
    
    const versions = await prisma.content.findMany({
      where: {
        OR: [
          { id: rootContentId },
          { parentId: rootContentId }
        ],
        userId: user.id
      },
      select: {
        id: true,
        title: true,
        originalContent: true,
        contentType: true,
        status: true,
        isDraft: true,
        version: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
        repurposed: {
          select: {
            id: true,
            platform: true,
            createdAt: true
          }
        }
      },
      orderBy: { version: 'asc' }
    });

    return NextResponse.json({
      success: true,
      versions: versions.map(v => ({
        ...v,
        isOriginal: !v.parentId,
        repurposeCount: v.repurposed.length
      }))
    });

  } catch (error) {
    console.error('Error fetching content versions:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST - Create a new version of content
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const contentId = params.id;
    const body = await request.json();
    const validation = createVersionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const { title, originalContent, contentType, isDraft } = validation.data;

    // Check if the original content exists and belongs to the user
    const originalContentItem = await prisma.content.findFirst({
      where: {
        id: contentId,
        userId: user.id
      },
      select: {
        id: true,
        parentId: true,
        templateId: true,
        version: true
      }
    });

    if (!originalContentItem) {
      return new NextResponse('Original content not found', { status: 404 });
    }

    // Determine the root content ID and next version number
    const rootContentId = originalContentItem.parentId || contentId;
    
    // Get the highest version number for this content tree
    const maxVersionResult = await prisma.content.aggregate({
      where: {
        OR: [
          { id: rootContentId },
          { parentId: rootContentId }
        ],
        userId: user.id
      },
      _max: {
        version: true
      }
    });

    const nextVersion = (maxVersionResult._max.version || 0) + 1;

    // Create the new version
    const newVersion = await prisma.content.create({
      data: {
        title,
        originalContent,
        contentType,
        status: 'Generated', // New versions start as Generated
        isDraft,
        version: nextVersion,
        parentId: rootContentId,
        templateId: originalContentItem.templateId,
        userId: user.id
      },
      select: {
        id: true,
        title: true,
        originalContent: true,
        contentType: true,
        status: true,
        isDraft: true,
        version: true,
        parentId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      version: {
        ...newVersion,
        isOriginal: false,
        repurposeCount: 0
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating content version:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 