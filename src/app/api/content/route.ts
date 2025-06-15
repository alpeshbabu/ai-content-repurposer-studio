import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withPrisma } from '@/lib/prisma-dynamic'
import { tableExists } from '@/lib/db-setup'
import { withCache } from '@/lib/cache-dynamic'

// Force dynamic to prevent build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Parse URL parameters
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const page = Math.floor(offset / limit) + 1

    // Check cache first
    const cachedData = await withCache(async (cache) => {
      return await cache.getContentList(userId, page, limit);
    })
    if (cachedData) {
      return NextResponse.json(cachedData)
    }

    // Check if Content table exists
    const contentTableExists = await tableExists('Content')
    const repurposedContentTableExists = await tableExists('RepurposedContent')

    if (!contentTableExists || !repurposedContentTableExists) {
      // Return empty array if tables don't exist yet
      return NextResponse.json([])
    }

    try {
      // Get total count for pagination and fetch content
      const { totalCount, contents } = await withPrisma(async (prisma) => {
        const [totalCount, contents] = await Promise.all([
          prisma.content.count({
            where: {
              userId: userId
            }
          }),
          prisma.content.findMany({
            where: {
              userId: userId
            },
            include: {
              repurposed: {
                orderBy: {
                  createdAt: 'desc'
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: limit,
            skip: offset
          })
        ]);
        
        return { totalCount, contents };
      });

      // Format the response to ensure consistent date formatting
      const formattedContents = contents.map(content => ({
        ...content,
        createdAt: content.createdAt.toISOString(),
        updatedAt: content.updatedAt.toISOString(),
        repurposed: content.repurposed.map(repurposed => ({
          ...repurposed,
          createdAt: repurposed.createdAt.toISOString(),
          updatedAt: repurposed.updatedAt.toISOString()
        }))
      }))

      // Prepare response data
      const responseData = {
        contents: formattedContents,
        pagination: {
          total: totalCount,
          page: page,
          limit: limit,
          pages: Math.ceil(totalCount / limit)
        }
      }

      // Cache the response
      await withCache(async (cache) => {
        await cache.setContentList(userId, page, limit, responseData);
      })

      // Return paginated response
      return NextResponse.json(responseData)
    } catch (dbError) {
      console.error('Database error fetching content:', dbError)
      
      // Try raw SQL as fallback
      try {
        const rawContents = await withPrisma(async (prisma) => {
          return await prisma.$queryRawUnsafe(`
          SELECT 
            c."id",
            c."title",
            c."originalContent",
            c."contentType",
            c."userId",
            c."createdAt",
            c."updatedAt",
            COALESCE(
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', r."id",
                  'platform', r."platform",
                  'content', r."content",
                  'createdAt', r."createdAt",
                  'updatedAt', r."updatedAt"
                )
                ORDER BY r."createdAt" DESC
              ) FILTER (WHERE r."id" IS NOT NULL),
              '[]'::json
            ) as repurposed
          FROM "Content" c
          LEFT JOIN "RepurposedContent" r ON c."id" = r."contentId"
          WHERE c."userId" = $1
          GROUP BY c."id", c."title", c."originalContent", c."contentType", c."userId", c."createdAt", c."updatedAt"
          ORDER BY c."createdAt" DESC
          LIMIT $2 OFFSET $3
          `, userId, limit, offset);
        });

        return NextResponse.json(rawContents || [])
      } catch (rawError) {
        console.error('Raw SQL fallback failed:', rawError)
        return NextResponse.json([])
      }
    }
  } catch (error) {
    console.error('[CONTENT_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { title, content, contentType, repurposedContent } = await req.json()

    if (!title || !content || !contentType || !repurposedContent) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Check if tables exist
    const contentTableExists = await tableExists('Content')
    const repurposedContentTableExists = await tableExists('RepurposedContent')

    if (!contentTableExists || !repurposedContentTableExists) {
      return new NextResponse('Database tables not ready', { status: 503 })
    }

    try {
      // Create the content and its repurposed versions in a transaction
      const savedContent = await withPrisma(async (prisma) => {
        return await prisma.content.create({
        data: {
          title,
          originalContent: content,
          contentType,
          userId,
          repurposed: {
            create: repurposedContent.map((item: { platform: string, content: string }) => ({
              platform: item.platform,
              content: item.content
            }))
          }
        },
        include: {
          repurposed: true
        }
        });
      });

      // Invalidate content list cache for this user
      await withCache(async (cache) => {
        await cache.invalidateContentList(userId);
      })

      return NextResponse.json(savedContent)
    } catch (dbError) {
      console.error('Database error saving content:', dbError)
      return new NextResponse('Failed to save content', { status: 500 })
    }
  } catch (error) {
    console.error('[CONTENT_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 