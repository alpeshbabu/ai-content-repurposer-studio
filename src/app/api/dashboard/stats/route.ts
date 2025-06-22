import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        usageThisMonth: true,
        subscriptionPlan: true
      }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Get plan limits
    const planLimits = {
      free: 5,
      basic: 60,
      pro: 150,
      agency: 450
    };
    const monthlyLimit = planLimits[user.subscriptionPlan as keyof typeof planLimits] || 5;

    // Get content statistics
    const [
      totalContent,
      generatedContent,
      repurposedContent,
      contentAnalytics,
      repurposedContentData
    ] = await Promise.all([
      // Total content count
      prisma.content.count({
        where: { userId: user.id }
      }),
      
      // Generated content count
      prisma.content.count({
        where: { 
          userId: user.id,
          status: 'Generated'
        }
      }),
      
      // Repurposed content count
      prisma.content.count({
        where: { 
          userId: user.id,
          status: 'Repurposed'
        }
      }),
      
      // Content analytics aggregation
      prisma.contentAnalytics.aggregate({
        where: {
          content: {
            userId: user.id
          }
        },
        _sum: {
          views: true,
          repurposes: true
        }
      }),
      
      // Platform statistics
      prisma.repurposedContent.findMany({
        where: {
          originalContent: {
            userId: user.id
          }
        },
        select: {
          platform: true,
          createdAt: true
        }
      })
    ]);

    // Calculate platform statistics
    const platformCounts = repurposedContentData.reduce((acc, item) => {
      acc[item.platform] = (acc[item.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topPlatforms = Object.entries(platformCounts)
      .map(([platform, count]) => ({ platform, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get recent activity (last 10 content items with their activity)
    const recentContent = await prisma.content.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        repurposed: {
          select: {
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    });

    // Format recent activity
    const recentActivity = [];
    
    for (const content of recentContent) {
      // Add content creation activity
      recentActivity.push({
        id: `${content.id}-created`,
        type: 'content_created' as const,
        title: content.title,
        timestamp: content.createdAt.toISOString()
      });

      // Add repurpose activity if exists
      if (content.repurposed.length > 0 && content.status === 'Repurposed') {
        recentActivity.push({
          id: `${content.id}-repurposed`,
          type: 'content_repurposed' as const,
          title: content.title,
          timestamp: content.repurposed[0].createdAt.toISOString()
        });
      }
    }

    // Sort by timestamp and take latest 10
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const latestActivity = recentActivity.slice(0, 10).map(activity => ({
      ...activity,
      timestamp: new Date(activity.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    // Prepare response data
    const stats = {
      totalContent,
      generatedContent,
      repurposedContent,
      totalViews: contentAnalytics._sum.views || 0,
      totalRepurposes: contentAnalytics._sum.repurposes || 0,
      thisMonthUsage: user.usageThisMonth,
      monthlyLimit,
      topPlatforms,
      recentActivity: latestActivity
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 