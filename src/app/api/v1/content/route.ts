import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimiter } from '@/lib/rate-limit';
import { analyticsTracker } from '@/lib/analytics-tracker';
import { z } from 'zod';

// API Version and documentation
const API_VERSION = 'v1';

// Validation schemas
const createContentSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50000),
  contentType: z.enum(['generated', 'repurposed']).default('generated'),
  platforms: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  brandVoiceId: z.string().optional()
});

const querySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(25),
  search: z.string().optional(),
  contentType: z.enum(['generated', 'repurposed', 'all']).default('all'),
  platforms: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional()
});

// Helper function for API key authentication
async function authenticateApiKey(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  
  if (!apiKey) {
    return null;
  }

  try {
    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: {
        key: apiKey,
        isActive: true,
        expiresAt: {
          gte: new Date()
        }
      },
      include: {
        user: true
      }
    });

    if (!apiKeyRecord) {
      return null;
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() }
    });

    return apiKeyRecord.user;
  } catch (error) {
    console.error('Error authenticating API key:', error);
    return null;
  }
}

// Helper function for unified authentication
async function authenticateRequest(request: NextRequest) {
  // Try API key authentication first
  const apiUser = await authenticateApiKey(request);
  if (apiUser) {
    return apiUser;
  }

  // Fall back to session authentication
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    return user;
  }

  return null;
}

// Helper function to format response
function formatApiResponse(data: any, meta?: any) {
  return {
    success: true,
    data,
    meta: {
      version: API_VERSION,
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
}

function formatErrorResponse(error: string, statusCode: number = 400, details?: any) {
  return {
    success: false,
    error: {
      message: error,
      code: statusCode,
      details,
      timestamp: new Date().toISOString(),
      version: API_VERSION
    }
  };
}

// GET /api/v1/content - List content
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        formatErrorResponse('Authentication required', 401),
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitResult = await rateLimiter.checkLimit(user.id, 'api_content_list');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        formatErrorResponse('Rate limit exceeded', 429, { resetTime: rateLimitResult.resetTime }),
        { status: 429 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '25'),
      search: searchParams.get('search') || undefined,
      contentType: searchParams.get('contentType') || 'all',
      platforms: searchParams.get('platforms')?.split(',') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined
    };

    const validatedQuery = querySchema.parse(queryParams);

    // Build where clause
    const whereClause: any = {
      userId: user.id
    };

    if (validatedQuery.search) {
      whereClause.OR = [
        { title: { contains: validatedQuery.search, mode: 'insensitive' } },
        { content: { contains: validatedQuery.search, mode: 'insensitive' } }
      ];
    }

    if (validatedQuery.contentType !== 'all') {
      whereClause.contentType = validatedQuery.contentType;
    }

    if (validatedQuery.platforms && validatedQuery.platforms.length > 0) {
      whereClause.platforms = {
        hasSome: validatedQuery.platforms
      };
    }

    if (validatedQuery.tags && validatedQuery.tags.length > 0) {
      whereClause.tags = {
        hasSome: validatedQuery.tags
      };
    }

    if (validatedQuery.dateFrom || validatedQuery.dateTo) {
      whereClause.createdAt = {};
      if (validatedQuery.dateFrom) {
        whereClause.createdAt.gte = new Date(validatedQuery.dateFrom);
      }
      if (validatedQuery.dateTo) {
        whereClause.createdAt.lte = new Date(validatedQuery.dateTo);
      }
    }

    // Get total count
    const totalCount = await prisma.content.count({ where: whereClause });

    // Get content with pagination
    const content = await prisma.content.findMany({
      where: whereClause,
      orderBy: {
        [validatedQuery.sortBy]: validatedQuery.sortOrder
      },
      skip: (validatedQuery.page - 1) * validatedQuery.limit,
      take: validatedQuery.limit,
      include: {
        brandVoice: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Format response data
    const formattedContent = content.map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      contentType: item.contentType,
      platforms: item.platforms || [],
      tags: item.tags || [],
      brandVoice: item.brandVoice ? {
        id: item.brandVoice.id,
        name: item.brandVoice.name
      } : null,
      metadata: item.metadata || {},
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    }));

    // Track API usage
    await analyticsTracker.trackEvent({
      userId: user.id,
      action: 'api_content_list',
      resource: 'api',
      metadata: {
        count: formattedContent.length,
        filters: validatedQuery
      }
    });

    return NextResponse.json(
      formatApiResponse(formattedContent, {
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total: totalCount,
          pages: Math.ceil(totalCount / validatedQuery.limit)
        },
        filters: validatedQuery
      })
    );

  } catch (error) {
    console.error('Error in API content list:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        formatErrorResponse('Invalid query parameters', 400, error.errors),
        { status: 400 }
      );
    }

    return NextResponse.json(
      formatErrorResponse('Internal server error', 500),
      { status: 500 }
    );
  }
}

// POST /api/v1/content - Create content
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        formatErrorResponse('Authentication required', 401),
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitResult = await rateLimiter.checkLimit(user.id, 'api_content_create');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        formatErrorResponse('Rate limit exceeded', 429, { resetTime: rateLimitResult.resetTime }),
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createContentSchema.parse(body);

    // Check usage limits
    const usageThisMonth = user.usageThisMonth || 0;
    const plan = user.subscriptionPlan || 'free';
    
    const limits = {
      free: 5,
      basic: 50,
      pro: 200,
      agency: 1000
    };

    if (usageThisMonth >= limits[plan as keyof typeof limits]) {
      return NextResponse.json(
        formatErrorResponse('Usage limit exceeded for current plan', 403, {
          currentUsage: usageThisMonth,
          limit: limits[plan as keyof typeof limits],
          plan
        }),
        { status: 403 }
      );
    }

    // Validate brand voice if provided
    if (validatedData.brandVoiceId) {
      const brandVoice = await prisma.brandVoice.findFirst({
        where: {
          id: validatedData.brandVoiceId,
          userId: user.id
        }
      });

      if (!brandVoice) {
        return NextResponse.json(
          formatErrorResponse('Brand voice not found', 404),
          { status: 404 }
        );
      }
    }

    // Create content
    const content = await prisma.content.create({
      data: {
        userId: user.id,
        title: validatedData.title,
        content: validatedData.content,
        contentType: validatedData.contentType,
        platforms: validatedData.platforms || [],
        tags: validatedData.tags || [],
        metadata: validatedData.metadata || {},
        brandVoiceId: validatedData.brandVoiceId
      },
      include: {
        brandVoice: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Update user usage
    await prisma.user.update({
      where: { id: user.id },
      data: {
        usageThisMonth: {
          increment: 1
        }
      }
    });

    // Track API usage
    await analyticsTracker.trackEvent({
      userId: user.id,
      action: 'api_content_create',
      resource: 'api',
      resourceId: content.id,
      metadata: {
        contentType: content.contentType,
        platforms: content.platforms,
        tags: content.tags
      }
    });

    // Format response
    const formattedContent = {
      id: content.id,
      title: content.title,
      content: content.content,
      contentType: content.contentType,
      platforms: content.platforms || [],
      tags: content.tags || [],
      brandVoice: content.brandVoice ? {
        id: content.brandVoice.id,
        name: content.brandVoice.name
      } : null,
      metadata: content.metadata || {},
      createdAt: content.createdAt.toISOString(),
      updatedAt: content.updatedAt.toISOString()
    };

    return NextResponse.json(
      formatApiResponse(formattedContent, {
        usage: {
          current: usageThisMonth + 1,
          limit: limits[plan as keyof typeof limits],
          plan
        }
      }),
      { status: 201 }
    );

  } catch (error) {
    console.error('Error in API content create:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        formatErrorResponse('Invalid request data', 400, error.errors),
        { status: 400 }
      );
    }

    return NextResponse.json(
      formatErrorResponse('Internal server error', 500),
      { status: 500 }
    );
  }
}

// OPTIONS - CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
      'Access-Control-Max-Age': '86400'
    }
  });
} 