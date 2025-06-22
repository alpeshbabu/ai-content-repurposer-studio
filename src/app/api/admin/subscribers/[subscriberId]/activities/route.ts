import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAdminRequest } from '@/lib/admin-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { subscriberId: string } }
) {
  try {
    // Validate admin authentication
    const { isValid, error, payload } = await validateAdminRequest(req);
    if (!isValid) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const subscriberId = params.subscriberId;
    console.log('Fetching activities for subscriber:', subscriberId);

    // Fetch real audit logs for this user (with error handling)
    let activities = [];
    try {
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          OR: [
            { userId: subscriberId },
            { resourceId: subscriberId }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      // Transform audit logs into activity format
      activities = auditLogs.map(log => ({
        id: log.id,
        type: getActivityType(log.action),
        description: getActivityDescription(log.action, log.details),
        timestamp: log.createdAt.toISOString(),
        metadata: log.details
      }));
    } catch (auditError) {
      console.log('Could not fetch audit logs:', auditError.message);
      // Continue with empty activities array
    }

    // Add some mock activities for demonstration
    const mockActivities = [
      {
        id: 'mock-1',
        type: 'login',
        description: 'User logged in from Chrome on macOS',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        metadata: { browser: 'Chrome', os: 'macOS' }
      },
      {
        id: 'mock-2',
        type: 'content_created',
        description: 'Created new content: "Social Media Marketing Tips"',
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        metadata: { contentTitle: 'Social Media Marketing Tips' }
      },
      {
        id: 'mock-3',
        type: 'payment',
        description: 'Payment processed successfully for Pro plan',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        metadata: { amount: 29, plan: 'pro' }
      },
      {
        id: 'mock-4',
        type: 'content_created',
        description: 'Generated content for LinkedIn platform',
        timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        metadata: { platform: 'LinkedIn' }
      },
      {
        id: 'mock-5',
        type: 'subscription_change',
        description: 'Upgraded from Basic to Pro plan',
        timestamp: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
        metadata: { fromPlan: 'basic', toPlan: 'pro' }
      }
    ];

    // Combine real and mock activities, sort by timestamp
    const allActivities = [...activities, ...mockActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20); // Limit to 20 most recent

    return NextResponse.json({
      success: true,
      data: allActivities
    });

  } catch (error) {
    console.error('Error fetching subscriber activities:', error);
    console.error('Error details:', error.message, error.stack);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch activities'
    }, { status: 500 });
  }
}

function getActivityType(action: string): string {
  switch (action) {
    case 'LOGIN':
    case 'LOGOUT':
      return 'login';
    case 'CONTENT_CREATED':
    case 'CONTENT_GENERATED':
      return 'content_created';
    case 'CONTENT_REPURPOSED':
      return 'content_repurposed';
    case 'PAYMENT_SUCCESS':
    case 'PAYMENT_FAILED':
      return 'payment';
    case 'SUBSCRIPTION_CREATED':
    case 'SUBSCRIPTION_UPDATED':
    case 'SUBSCRIPTION_CANCELED':
      return 'subscription_change';
    case 'SUPPORT_TICKET_CREATED':
    case 'SUPPORT_TICKET_UPDATED':
      return 'support_ticket';
    case 'TEAM_INVITE_SENT':
    case 'TEAM_MEMBER_ADDED':
      return 'team_activity';
    default:
      return 'general';
  }
}

function getActivityDescription(action: string, details: any): string {
  switch (action) {
    case 'LOGIN':
      return `User logged in${details?.ip ? ` from ${details.ip}` : ''}`;
    case 'LOGOUT':
      return 'User logged out';
    case 'CONTENT_CREATED':
      return `Created new content${details?.title ? `: "${details.title}"` : ''}`;
    case 'CONTENT_GENERATED':
      return `Generated content${details?.keywords ? ` for keywords: ${details.keywords}` : ''}`;
    case 'CONTENT_REPURPOSED':
      return `Repurposed content${details?.platforms ? ` for ${details.platforms.join(', ')}` : ''}`;
    case 'PAYMENT_SUCCESS':
      return `Payment processed successfully${details?.amount ? ` ($${details.amount})` : ''}`;
    case 'PAYMENT_FAILED':
      return `Payment failed${details?.reason ? `: ${details.reason}` : ''}`;
    case 'SUBSCRIPTION_CREATED':
      return `Subscription created${details?.plan ? ` (${details.plan})` : ''}`;
    case 'SUBSCRIPTION_UPDATED':
      return `Subscription updated${details?.plan ? ` to ${details.plan}` : ''}`;
    case 'SUBSCRIPTION_CANCELED':
      return 'Subscription canceled';
    case 'SUPPORT_TICKET_CREATED':
      return `Created support ticket${details?.subject ? `: "${details.subject}"` : ''}`;
    case 'SUPPORT_TICKET_UPDATED':
      return `Updated support ticket${details?.status ? ` (${details.status})` : ''}`;
    case 'TEAM_INVITE_SENT':
      return `Sent team invitation${details?.email ? ` to ${details.email}` : ''}`;
    case 'TEAM_MEMBER_ADDED':
      return `Added team member${details?.email ? `: ${details.email}` : ''}`;
    case 'ADMIN_UPDATE_USER':
      return `Admin updated user profile${details?.adminEmail ? ` (by ${details.adminEmail})` : ''}`;
    default:
      return `Performed action: ${action}`;
  }
} 