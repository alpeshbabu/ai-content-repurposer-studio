import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateAnalyticsSchema = z.object({
  views: z.number().int().min(0).optional(),
  repurposes: z.number().int().min(0).optional(),
  engagement: z.record(z.any()).optional(),
  performance: z.record(z.any()).optional()
});

const trackEventSchema = z.object({
  event: z.enum(['view', 'repurpose', 'share', 'copy', 'download']),
  platform: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

// GET - Get analytics for a content item
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

    // Check if the content exists and belongs to the user
    const content = await prisma.content.findFirst({
      where: {
        id: contentId,
        userId: user.id
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        repurposed: {
          select: {
            platform: true,
            createdAt: true
          }
        }
      }
    });

    if (!content) {
      return new NextResponse('Content not found', { status: 404 });
    }

    // Get or create analytics record
    let analytics = await prisma.contentAnalytics.findUnique({
      where: { contentId }
    });

    if (!analytics) {
      analytics = await prisma.contentAnalytics.create({
        data: {
          contentId,
          views: 0,
          repurposes: content.repurposed.length,
          engagement: {},
          performance: {}
        }
      });
    }

    // Calculate derived metrics
    const daysSinceCreation = Math.floor(
      (Date.now() - content.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const viewsPerDay = daysSinceCreation > 0 ? analytics.views / daysSinceCreation : analytics.views;
    const platformsUsed = [...new Set(content.repurposed.map(r => r.platform))];

    return NextResponse.json({
      success: true,
      analytics: {
        ...analytics,
        contentTitle: content.title,
        contentStatus: content.status,
        platformsUsed,
        platformCount: platformsUsed.length,
        daysSinceCreation,
        viewsPerDay: Math.round(viewsPerDay * 100) / 100,
        lastRepurpose: content.repurposed.length > 0 
          ? Math.max(...content.repurposed.map(r => r.createdAt.getTime()))
          : null
      }
    });

  } catch (error) {
    console.error('Error fetching content analytics:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST - Track an analytics event
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
    const validation = trackEventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const { event, platform, metadata } = validation.data;

    // Check if the content exists and belongs to the user
    const content = await prisma.content.findFirst({
      where: {
        id: contentId,
        userId: user.id
      }
    });

    if (!content) {
      return new NextResponse('Content not found', { status: 404 });
    }

    // Get or create analytics record
    let analytics = await prisma.contentAnalytics.findUnique({
      where: { contentId }
    });

    if (!analytics) {
      analytics = await prisma.contentAnalytics.create({
        data: {
          contentId,
          views: 0,
          repurposes: 0,
          engagement: {},
          performance: {}
        }
      });
    }

    // Update analytics based on event type
    const updateData: any = {
      updatedAt: new Date()
    };

    switch (event) {
      case 'view':
        updateData.views = analytics.views + 1;
        break;
      
      case 'repurpose':
        updateData.repurposes = analytics.repurposes + 1;
        break;
      
      case 'share':
      case 'copy':
      case 'download':
        // Update engagement metrics
        const currentEngagement = analytics.engagement as any || {};
        const eventKey = platform ? `${event}_${platform}` : event;
        currentEngagement[eventKey] = (currentEngagement[eventKey] || 0) + 1;
        updateData.engagement = currentEngagement;
        break;
    }

    // Add metadata to performance tracking if provided
    if (metadata) {
      const currentPerformance = analytics.performance as any || {};
      const timestamp = new Date().toISOString();
      
      if (!currentPerformance.events) {
        currentPerformance.events = [];
      }
      
      currentPerformance.events.push({
        event,
        platform,
        metadata,
        timestamp
      });
      
      // Keep only last 100 events to prevent data bloat
      if (currentPerformance.events.length > 100) {
        currentPerformance.events = currentPerformance.events.slice(-100);
      }
      
      updateData.performance = currentPerformance;
    }

    // Update the analytics record
    const updatedAnalytics = await prisma.contentAnalytics.update({
      where: { contentId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      analytics: updatedAnalytics,
      eventTracked: event
    });

  } catch (error) {
    console.error('Error tracking analytics event:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PUT - Update analytics data manually
export async function PUT(
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
    const validation = updateAnalyticsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    // Check if the content exists and belongs to the user
    const content = await prisma.content.findFirst({
      where: {
        id: contentId,
        userId: user.id
      }
    });

    if (!content) {
      return new NextResponse('Content not found', { status: 404 });
    }

    // Get or create analytics record
    let analytics = await prisma.contentAnalytics.findUnique({
      where: { contentId }
    });

    if (!analytics) {
      analytics = await prisma.contentAnalytics.create({
        data: {
          contentId,
          views: 0,
          repurposes: 0,
          engagement: {},
          performance: {}
        }
      });
    }

    // Update analytics with provided data
    const updatedAnalytics = await prisma.contentAnalytics.update({
      where: { contentId },
      data: {
        ...validation.data,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      analytics: updatedAnalytics
    });

  } catch (error) {
    console.error('Error updating content analytics:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 