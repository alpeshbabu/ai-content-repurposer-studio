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
        name: true,
        email: true,
        subscriptionPlan: true,
        usageThisMonth: true,
        createdAt: true
      }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Get all user content with repurposed content and analytics
    const contents = await prisma.content.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        title: true,
        originalContent: true,
        contentType: true,
        status: true,
        isDraft: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        repurposed: {
          select: {
            id: true,
            platform: true,
            content: true,
            createdAt: true
          }
        },
        analytics: {
          select: {
            views: true,
            repurposes: true,
            engagement: true,
            performance: true,
            createdAt: true,
            updatedAt: true
          }
        },
        template: {
          select: {
            id: true,
            name: true,
            contentType: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get user templates
    const templates = await prisma.contentTemplate.findMany({
      where: { userId: user.id },
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

    // Get usage history
    const usageHistory = await prisma.usageHistory.findMany({
      where: { userId: user.id },
      select: {
        month: true,
        year: true,
        usageCount: true,
        createdAt: true
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    });

    // Calculate summary statistics
    const summary = {
      totalContent: contents.length,
      generatedContent: contents.filter(c => c.status === 'Generated').length,
      repurposedContent: contents.filter(c => c.status === 'Repurposed').length,
      totalRepurposes: contents.reduce((sum, c) => sum + c.repurposed.length, 0),
      totalViews: contents.reduce((sum, c) => sum + (c.analytics[0]?.views || 0), 0),
      totalTemplates: templates.length,
      platformsUsed: [...new Set(contents.flatMap(c => c.repurposed.map(r => r.platform)))],
      contentTypes: [...new Set(contents.map(c => c.contentType))],
      accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      currentPlan: user.subscriptionPlan,
      currentMonthUsage: user.usageThisMonth
    };

    // Prepare export data
    const exportData = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        exportedBy: user.email,
        userName: user.name,
        version: '1.0'
      },
      userProfile: {
        id: user.id,
        name: user.name,
        email: user.email,
        subscriptionPlan: user.subscriptionPlan,
        memberSince: user.createdAt,
        currentMonthUsage: user.usageThisMonth
      },
      summary,
      contents: contents.map(content => ({
        ...content,
        repurposedPlatforms: content.repurposed.map(r => r.platform),
        repurposeCount: content.repurposed.length,
        viewCount: content.analytics[0]?.views || 0,
        engagementData: content.analytics[0]?.engagement || {},
        performanceData: content.analytics[0]?.performance || {}
      })),
      templates,
      usageHistory,
      analytics: {
        contentByMonth: contents.reduce((acc, content) => {
          const month = content.createdAt.toISOString().substring(0, 7); // YYYY-MM
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        platformUsage: contents.reduce((acc, content) => {
          content.repurposed.forEach(r => {
            acc[r.platform] = (acc[r.platform] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>),
        contentTypeDistribution: contents.reduce((acc, content) => {
          acc[content.contentType] = (acc[content.contentType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    };

    // Return as JSON file download
    const jsonString = JSON.stringify(exportData, null, 2);
    const buffer = Buffer.from(jsonString, 'utf8');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="aicrs-export-${user.id}-${new Date().toISOString().split('T')[0]}.json"`,
        'Content-Length': buffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Error exporting dashboard data:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 