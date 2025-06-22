import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper function to check admin access
async function checkAdminAccess(session: any) {
  if (!session?.user) {
    return { isAuthorized: false, error: 'Unauthorized', status: 401 };
  }

  // For development, allow any authenticated user to access admin functions
  // In production, you would check for specific admin roles

  return { isAuthorized: true };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { subscriberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const adminCheck = await checkAdminAccess(session);
    
    if (!adminCheck.isAuthorized) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const subscriberId = params.subscriberId;

    // Fetch comprehensive user data for export
    const user = await prisma.user.findUnique({
      where: { id: subscriberId },
      include: {
        subscription: true,
        team: {
          include: {
            members: true
          }
        },
        teamMemberships: {
          include: {
            team: true
          }
        },
        content: {
          select: {
            id: true,
            title: true,
            status: true,
            platforms: true,
            createdAt: true,
            updatedAt: true
          }
        },
        supportTickets: {
          select: {
            id: true,
            subject: true,
            status: true,
            priority: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Subscriber not found' 
      }, { status: 404 });
    }

    // Fetch audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { userId: subscriberId },
          { resourceId: subscriberId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Prepare export data
    const exportData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        isActive: user.isActive,
        isBanned: user.isBanned,
        emailVerified: user.emailVerified,
        usageCount: user.usageCount,
        tags: user.tags,
        adminNotes: user.adminNotes,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        banReason: user.banReason,
        bannedAt: user.bannedAt
      },
      subscription: user.subscription ? {
        id: user.subscription.id,
        plan: user.subscription.plan,
        status: user.subscription.status,
        currentPeriodStart: user.subscription.currentPeriodStart,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
        stripeCustomerId: user.subscription.stripeCustomerId,
        stripeSubscriptionId: user.subscription.stripeSubscriptionId,
        createdAt: user.subscription.createdAt,
        updatedAt: user.subscription.updatedAt
      } : null,
      team: user.team ? {
        id: user.team.id,
        name: user.team.name,
        memberCount: user.team.members.length,
        createdAt: user.team.createdAt
      } : user.teamMemberships[0] ? {
        id: user.teamMemberships[0].team.id,
        name: user.teamMemberships[0].team.name,
        role: user.teamMemberships[0].role,
        joinedAt: user.teamMemberships[0].createdAt
      } : null,
      content: user.content.map(content => ({
        id: content.id,
        title: content.title,
        status: content.status,
        platforms: content.platforms,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt
      })),
      supportTickets: user.supportTickets.map(ticket => ({
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt
      })),
      auditLogs: auditLogs.map(log => ({
        id: log.id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        details: log.details,
        createdAt: log.createdAt
      })),
      analytics: {
        totalContent: user.content.length,
        contentCreated: user.content.filter(c => c.status === 'Generated').length,
        contentRepurposed: user.content.filter(c => c.status === 'Repurposed').length,
        totalSupportTickets: user.supportTickets.length,
        openTickets: user.supportTickets.filter(t => t.status === 'open').length,
        closedTickets: user.supportTickets.filter(t => t.status === 'closed').length
      },
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: session.user.email,
        version: '1.0'
      }
    };

    // Log the export action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_EXPORT_USER_DATA',
        resource: 'USER',
        resourceId: subscriberId,
        details: {
          adminId: session.user.id,
          adminEmail: session.user.email,
          targetUserId: subscriberId,
          targetUserEmail: user.email,
          exportFormat: 'json'
        }
      }
    });

    // Return as downloadable JSON
    const jsonData = JSON.stringify(exportData, null, 2);
    
    return new NextResponse(jsonData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="subscriber-${subscriberId}-${new Date().toISOString().split('T')[0]}.json"`
      }
    });

  } catch (error) {
    console.error('Error exporting subscriber data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to export subscriber data'
    }, { status: 500 });
  }
} 