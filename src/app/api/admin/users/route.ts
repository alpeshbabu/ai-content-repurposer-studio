import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/admin-auth';
import { withPrisma } from '@/lib/prisma-dynamic';
import { logger, LogCategory } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await validateAdminRequest(req);
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const subscriptionPlan = searchParams.get('subscriptionPlan');
    const subscriptionStatus = searchParams.get('subscriptionStatus');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (subscriptionPlan) {
      where.subscriptionPlan = subscriptionPlan;
    }
    
    if (subscriptionStatus) {
      where.subscriptionStatus = subscriptionStatus;
    }

    // Get users with pagination
    const [users, totalCount, subscriptionStats, activeUsers, newUsers] = await withPrisma(async (prisma) => {
      const [usersData, totalCountData] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            subscriptionPlan: true,
            subscriptionStatus: true,
            usageThisMonth: true,
            createdAt: true,
            lastLoginAt: true,
            emailVerified: true,
            stripeCustomerId: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.user.count({ where })
      ]);

      // Get subscription statistics
      const subscriptionStatsData = await prisma.user.groupBy({
        by: ['subscriptionPlan'],
        _count: {
          subscriptionPlan: true
        }
      });

      // Calculate user activity metrics
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const activeUsersData = await prisma.user.count({
        where: {
          lastLoginAt: {
            gte: thirtyDaysAgo
          }
        }
      });

      const newUsersData = await prisma.user.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      });

      return [usersData, totalCountData, subscriptionStatsData, activeUsersData, newUsersData];
    });

    const planCounts = subscriptionStats.reduce((acc, stat) => {
      acc[stat.subscriptionPlan || 'free'] = stat._count.subscriptionPlan;
      return acc;
    }, {} as Record<string, number>);

    logger.info('Admin users list retrieved', {
      adminUser: authResult.payload?.username,
      totalUsers: totalCount,
      page,
      limit
    }, LogCategory.ADMIN);

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      stats: {
        totalUsers: totalCount,
        activeUsers,
        newUsersLast30Days: newUsers,
        subscriptionBreakdown: planCounts,
        activityRate: totalCount > 0 ? ((activeUsers / totalCount) * 100).toFixed(1) : '0'
      }
    });

  } catch (error) {
    logger.error('Failed to retrieve admin users', error as Error, LogCategory.ADMIN);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve users',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 