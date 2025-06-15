import { NextRequest, NextResponse } from 'next/server'
import { validateAdminRequest } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { logger, LogCategory } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await validateAdminRequest(req)
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (priority) {
      where.priority = priority
    }
    
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Get tickets with pagination
    const [tickets, totalCount] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              subscriptionPlan: true
            }
          },
          replies: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.supportTicket.count({ where })
    ])

    // Get summary statistics
    const stats = await prisma.supportTicket.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })

    const statusCounts = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status
      return acc
    }, {} as Record<string, number>)

    // Calculate response metrics
    const avgResponseTime = await prisma.supportTicketReply.aggregate({
      where: {
        isStaff: true,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      _avg: {
        id: true // This is a placeholder - you'd calculate actual response time
      }
    })

    logger.info('Admin support tickets retrieved', {
      adminUser: authResult.payload?.username,
      totalTickets: totalCount,
      page,
      limit
    }, LogCategory.ADMIN)

    return NextResponse.json({
      success: true,
      tickets,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      stats: {
        statusCounts,
        totalTickets: totalCount,
        avgResponseTimeHours: 2.5 // Mock data - calculate from actual response times
      }
    })

  } catch (error) {
    logger.error('Failed to retrieve admin support tickets', error as Error, LogCategory.ADMIN)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve support tickets',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 