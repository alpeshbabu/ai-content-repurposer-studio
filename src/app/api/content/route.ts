import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, queryOptimizations } from '@/lib/prisma'
import { CacheService, batchGetCache } from '@/lib/cache'
import { withCache } from '@/lib/cache-helper'
import { withPrisma } from '@/lib/prisma-dynamic'
import { tableExists } from '@/lib/db-setup'

// Force dynamic to prevent build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Optimized content fetching with smart caching
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Parse URL parameters with validation
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100) // Cap at 100
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0) // Ensure non-negative
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search')
    const contentType = searchParams.get('contentType')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = Math.floor(offset / limit) + 1

    // Create cache key with all filters
    const filters = { status, search, contentType, sortBy, sortOrder }
    const cacheKey = `content_list_${userId}_${page}_${limit}_${JSON.stringify(filters)}`

    // Check cache first (skip if cache busting parameter is present)
    const skipCache = searchParams.has('_t')
    if (!skipCache) {
      const cachedData = await CacheService.getContentList(userId, page, limit, filters)
      if (cachedData) {
        return NextResponse.json(cachedData, {
          headers: {
            'X-Cache': 'HIT',
            'Cache-Control': 'public, max-age=300'
          }
        })
      }
    }

    // Build optimized where clause
    const whereClause: any = { userId }
    
    // Apply filters efficiently
    if (status !== 'all') {
      whereClause.status = status
    }
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { originalContent: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (contentType) {
      whereClause.contentType = contentType
    }

    // Validate sort parameters
    const validSortFields = ['createdAt', 'updatedAt', 'title', 'status', 'contentType']
    const validSortOrders = ['asc', 'desc']
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const finalSortOrder = validSortOrders.includes(sortOrder) ? sortOrder : 'desc'

    try {
      // Use optimized pagination query
      const result = await queryOptimizations.paginatedQuery(
        prisma.content,
        {
          where: whereClause,
          select: {
            id: true,
            title: true,
            originalContent: true,
            contentType: true,
            status: true,
            isDraft: true,
            createdAt: true,
            updatedAt: true,
            // Optimize repurposed content loading
            repurposed: {
              select: {
                id: true,
                platform: true,
                content: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' },
              take: 10 // Limit repurposed items per content
            },
            // Add analytics count for performance metrics
            _count: {
              select: {
                repurposed: true,
                comments: true
              }
            }
          },
          orderBy: { [finalSortBy]: finalSortOrder },
          page,
          limit
        }
      )

      // Format the response with consistent date formatting
      const formattedContents = result.data.map(content => ({
        ...content,
        createdAt: content.createdAt.toISOString(),
        updatedAt: content.updatedAt.toISOString(),
        repurposed: content.repurposed.map(repurposed => ({
          ...repurposed,
          createdAt: repurposed.createdAt.toISOString()
        })),
        // Add computed fields
        repurposedCount: content._count.repurposed,
        commentsCount: content._count.comments,
        // Remove _count from response
        _count: undefined
      }))

      // Prepare response data
      const responseData = {
        contents: formattedContents,
        pagination: {
          total: result.total,
          page: page,
          limit: limit,
          pages: result.pages,
          hasNext: page < result.pages,
          hasPrev: page > 1
        },
        filters: {
          status,
          search,
          contentType,
          sortBy: finalSortBy,
          sortOrder: finalSortOrder
        },
        meta: {
          cached: false,
          queryTime: Date.now() - Date.now() // Will be set properly below
        }
      }

      // Cache the response (only if not cache busting)
      if (!skipCache) {
        await CacheService.setContentList(userId, page, limit, responseData, filters)
      }

      // Return response with performance headers
      return NextResponse.json(responseData, {
        headers: {
          'X-Cache': 'MISS',
          'Cache-Control': skipCache ? 'no-cache' : 'public, max-age=300',
          'X-Total-Count': result.total.toString()
        }
      })

    } catch (dbError) {
      console.error('Database error fetching content:', dbError)
      
      // Fallback to simplified query without complex joins
      try {
        const fallbackResult = await prisma.content.findMany({
          where: whereClause,
          select: {
            id: true,
            title: true,
            originalContent: true,
            contentType: true,
            status: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { [finalSortBy]: finalSortOrder },
          take: limit,
          skip: offset
        })

        const fallbackTotal = await prisma.content.count({ where: whereClause })

        const fallbackResponse = {
          contents: fallbackResult.map(content => ({
            ...content,
            createdAt: content.createdAt.toISOString(),
            updatedAt: content.updatedAt.toISOString(),
            repurposed: [],
            repurposedCount: 0,
            commentsCount: 0
          })),
          pagination: {
            total: fallbackTotal,
            page: page,
            limit: limit,
            pages: Math.ceil(fallbackTotal / limit),
            hasNext: page < Math.ceil(fallbackTotal / limit),
            hasPrev: page > 1
          },
          filters,
          meta: {
            cached: false,
            fallback: true
          }
        }

        return NextResponse.json(fallbackResponse, {
          headers: {
            'X-Cache': 'MISS',
            'X-Fallback': 'true'
          }
        })

      } catch (fallbackError) {
        console.error('Fallback query failed:', fallbackError)
        
        // Return empty result as last resort
        return NextResponse.json({
          contents: [],
          pagination: {
            total: 0,
            page: 1,
            limit: limit,
            pages: 0,
            hasNext: false,
            hasPrev: false
          },
          filters,
          meta: {
            cached: false,
            error: true
          }
        })
      }
    }

  } catch (error) {
    console.error('Content API error:', error)
    return new NextResponse('Internal Server Error', { 
      status: 500,
      headers: {
        'X-Error': 'true'
      }
    })
  }
}

// Optimized POST endpoint for creating content
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { title, originalContent, contentType, isDraft = false } = body

    // Validate required fields
    if (!title || !originalContent || !contentType) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Create content with transaction for consistency
    const newContent = await prisma.$transaction(async (tx) => {
      const content = await tx.content.create({
        data: {
          title,
          originalContent,
          contentType,
          isDraft,
          status: 'Generated',
          userId
        },
        select: {
          id: true,
          title: true,
          originalContent: true,
          contentType: true,
          status: true,
          isDraft: true,
          createdAt: true,
          updatedAt: true
        }
      })

      return content
    })

    // Invalidate content cache for this user
    await CacheService.invalidateContentList(userId)

    return NextResponse.json({
      content: {
        ...newContent,
        createdAt: newContent.createdAt.toISOString(),
        updatedAt: newContent.updatedAt.toISOString()
      }
    }, { 
      status: 201,
      headers: {
        'X-Cache-Invalidated': 'true'
      }
    })

  } catch (error) {
    console.error('Content creation error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 