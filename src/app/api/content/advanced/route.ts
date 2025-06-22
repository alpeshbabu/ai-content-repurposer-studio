import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const querySchema = z.object({
  limit: z.string().transform(Number).default('20'),
  offset: z.string().transform(Number).default('0'),
  search: z.string().optional(),
  contentType: z.string().optional(),
  platforms: z.string().optional(),
  status: z.string().optional(),
  dateRange: z.enum(['all', 'today', 'week', 'month', '3months']).default('all'),
  sort: z.enum(['title', 'createdAt', 'updatedAt', 'contentType', 'views', 'engagements']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc')
});

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    // Build filter conditions
    const where: any = {
      userId: user.id
    };

    // Search filter
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { originalContent: { contains: query.search, mode: 'insensitive' } },
        { contentType: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    // Content type filter
    if (query.contentType) {
      const contentTypes = query.contentType.split(',');
      where.contentType = { in: contentTypes };
    }

    // Status filter - only apply if status is not "all"
    if (query.status && query.status !== 'all') {
      const statuses = query.status.split(',');
      where.status = { in: statuses };
    }

    // Date range filter
    if (query.dateRange !== 'all') {
      const now = new Date();
      let dateFilter: Date;
      
      switch (query.dateRange) {
        case 'today':
          dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case '3months':
          dateFilter = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          break;
        default:
          dateFilter = new Date(0);
      }
      
      where.createdAt = { gte: dateFilter };
    }

    // Platform filter (filter by repurposed content platforms)
    if (query.platforms) {
      const platforms = query.platforms.split(',');
      where.repurposed = {
        some: {
          platform: { in: platforms }
        }
      };
    }

    // Build order by
    const orderBy: any = {};
    orderBy[query.sort] = query.order;

    // Get total count for pagination
    const total = await prisma.content.count({ where });

    // Get contents with pagination
    const contents = await prisma.content.findMany({
      where,
      orderBy,
      skip: query.offset,
      take: query.limit,
      include: {
        repurposed: {
          select: {
            id: true,
            platform: true,
            content: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        // Include analytics if available (placeholder for future implementation)
        _count: {
          select: {
            repurposed: true
          }
        }
      }
    });

    // Transform the data to include mock analytics for now
    const transformedContents = contents.map(content => ({
      id: content.id,
      title: content.title,
      contentType: content.contentType,
      originalContent: content.originalContent,
      status: (content as any).status || 'draft', // Use actual status from database
      createdAt: content.createdAt.toISOString(),
      updatedAt: content.updatedAt.toISOString(),
      repurposed: content.repurposed.map(rep => ({
        id: rep.id,
        platform: rep.platform,
        content: rep.content,
        createdAt: rep.createdAt.toISOString()
      })),
      // Mock analytics data - replace with real data when analytics are implemented
      views: Math.floor(Math.random() * 100) + 10,
      engagements: Math.floor(Math.random() * 50) + 5,
      repurposedCount: content._count.repurposed
    }));

    // Calculate pagination info
    const pages = Math.ceil(total / query.limit);
    const page = Math.floor(query.offset / query.limit) + 1;

    return NextResponse.json({
      contents: transformedContents,
      pagination: {
        total,
        page,
        limit: query.limit,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      },
      filters: {
        search: query.search,
        contentType: query.contentType,
        platforms: query.platforms,
        dateRange: query.dateRange
      },
      sort: {
        field: query.sort,
        order: query.order
      }
    });

  } catch (error) {
    console.error('[ADVANCED_CONTENT_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
} 