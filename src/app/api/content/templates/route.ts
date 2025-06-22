import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  contentType: z.enum(['blog', 'article', 'social_post', 'email', 'video_transcript', 'general']),
  template: z.string().min(1, 'Template content is required'),
  variables: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false)
});

const updateTemplateSchema = createTemplateSchema.partial();

// GET - Fetch user's templates and public templates
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('contentType');
    const includePublic = searchParams.get('includePublic') !== 'false';

    const whereClause: any = {
      OR: [
        { userId: user.id }, // User's own templates
        ...(includePublic ? [{ isPublic: true }] : []) // Public templates if requested
      ]
    };

    if (contentType) {
      whereClause.contentType = contentType;
    }

    const templates = await prisma.contentTemplate.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        contentType: true,
        template: true,
        variables: true,
        isPublic: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { isPublic: 'asc' }, // User's templates first
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      templates: templates.map(template => ({
        ...template,
        isOwner: template.userId === user.id
      }))
    });

  } catch (error) {
    console.error('Error fetching templates:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validation = createTemplateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const { name, description, contentType, template, variables, isPublic } = validation.data;

    // Check if template name already exists for this user
    const existingTemplate = await prisma.contentTemplate.findFirst({
      where: {
        name,
        userId: user.id
      }
    });

    if (existingTemplate) {
      return NextResponse.json(
        { error: 'Template with this name already exists' },
        { status: 409 }
      );
    }

    const newTemplate = await prisma.contentTemplate.create({
      data: {
        name,
        description,
        contentType,
        template,
        variables,
        isPublic,
        userId: user.id
      },
      select: {
        id: true,
        name: true,
        description: true,
        contentType: true,
        template: true,
        variables: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      template: newTemplate
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating template:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PUT - Update template
export async function PUT(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateTemplateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    // Check if template exists and user owns it
    const existingTemplate = await prisma.contentTemplate.findFirst({
      where: {
        id: templateId,
        userId: user.id
      }
    });

    if (!existingTemplate) {
      return new NextResponse('Template not found or not owned by user', { status: 404 });
    }

    const updatedTemplate = await prisma.contentTemplate.update({
      where: { id: templateId },
      data: validation.data,
      select: {
        id: true,
        name: true,
        description: true,
        contentType: true,
        template: true,
        variables: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      template: updatedTemplate
    });

  } catch (error) {
    console.error('Error updating template:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE - Delete template
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Check if template exists and user owns it
    const existingTemplate = await prisma.contentTemplate.findFirst({
      where: {
        id: templateId,
        userId: user.id
      }
    });

    if (!existingTemplate) {
      return new NextResponse('Template not found or not owned by user', { status: 404 });
    }

    // Check if template is being used by any content
    const contentUsingTemplate = await prisma.content.findFirst({
      where: { templateId }
    });

    if (contentUsingTemplate) {
      return NextResponse.json(
        { error: 'Cannot delete template that is being used by existing content' },
        { status: 409 }
      );
    }

    await prisma.contentTemplate.delete({
      where: { id: templateId }
    });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting template:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 