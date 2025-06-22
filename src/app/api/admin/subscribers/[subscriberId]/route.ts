import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAdminRequest } from '@/lib/admin-auth';

// GET /api/admin/subscribers/[subscriberId] - Get detailed subscriber information
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
    console.log('Fetching subscriber with ID:', subscriberId);

    // Fetch user with comprehensive data
    console.log('About to query user...');
    const user = await prisma.user.findUnique({
      where: { id: subscriberId },
      include: {
        subscriptions: true,
        contents: {
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        },
        supportTickets: {
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        }
      }
    });
    console.log('User query result:', user ? 'found' : 'not found');

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Subscriber not found' 
      }, { status: 404 });
    }

    // Calculate analytics
    const contentCreated = user.contents.filter(c => c.status === 'Generated').length;
    const contentRepurposed = user.contents.filter(c => c.status === 'Repurposed').length;
    const totalContent = user.contents.length;

    // Mock additional data (in a real app, this would come from analytics tables)
    const mockAnalytics = {
      loginCount: Math.floor(Math.random() * 100) + 10,
      averageSessionDuration: Math.floor(Math.random() * 30) + 5,
      lastActiveDate: user.updatedAt?.toISOString(),
      topPlatforms: ['Twitter', 'LinkedIn', 'Facebook', 'Instagram'].slice(0, Math.floor(Math.random() * 4) + 1),
      engagementScore: Math.floor(Math.random() * 40) + 60
    };

    const currentSubscription = user.subscriptions[0]; // Get the first/current subscription
    const mockBilling = {
      totalRevenue: Math.floor(Math.random() * 5000) + 100,
      lastPayment: currentSubscription?.updatedAt?.toISOString(),
      nextBilling: currentSubscription?.currentPeriodEnd?.toISOString(),
      paymentMethods: Math.floor(Math.random() * 3) + 1,
      invoiceCount: Math.floor(Math.random() * 12) + 1,
      overageCharges: Math.floor(Math.random() * 200)
    };

    const mockSupport = {
      ticketCount: user.supportTickets.length,
      lastTicketDate: user.supportTickets[0]?.createdAt?.toISOString(),
      satisfactionScore: Math.floor(Math.random() * 2) + 4, // 4-5 stars
      responseTime: Math.floor(Math.random() * 24) + 1
    };

    // Calculate risk score based on various factors
    let riskScore = 0;
    if (currentSubscription?.status === 'canceled') riskScore += 3;
    if (mockSupport.ticketCount > 5) riskScore += 2;
    if (totalContent === 0) riskScore += 2;
    if (!user.emailVerified) riskScore += 1;

    const subscriberData = {
      id: user.id,
      name: user.name || 'Unknown User',
      email: user.email,
      image: user.image,
      subscriptionPlan: currentSubscription?.plan || user.subscriptionPlan || 'free',
      subscriptionStatus: currentSubscription?.status || user.subscriptionStatus || 'inactive',
      subscriptionRenewalDate: currentSubscription?.currentPeriodEnd?.toISOString() || user.subscriptionRenewalDate?.toISOString(),
      usageThisMonth: user.usageCount || 0,
      totalUsage: totalContent,
      isActive: user.isActive ?? true,
      isBanned: user.isBanned ?? false,
      isVerified: user.emailVerified ?? false,
      riskScore,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString(),
      notes: user.adminNotes,
      tags: user.tags || [],
      
      // Team information (simplified)
      team: undefined,
      
      billing: mockBilling,
      analytics: {
        contentCreated,
        contentRepurposed,
        ...mockAnalytics
      },
      support: mockSupport
    };

    return NextResponse.json({
      success: true,
      data: subscriberData
    });

  } catch (error) {
    console.error('Error fetching subscriber:', error);
    console.error('Error details:', error.message, error.stack);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch subscriber data'
    }, { status: 500 });
  }
}

// PATCH /api/admin/subscribers/[subscriberId] - Update subscriber subscription
export async function PUT(
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
    const body = await req.json();
    
    const {
      name,
      email,
      subscriptionPlan,
      isActive,
      isBanned,
      isVerified,
      riskScore,
      notes,
      tags
    } = body;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: subscriberId },
      data: {
        name,
        email,
        isActive,
        isBanned,
        emailVerified: isVerified ? new Date() : null,
        adminNotes: notes,
        tags: tags || [],
        // Update subscription if plan changed
        ...(subscriptionPlan && {
          subscription: {
            upsert: {
              create: {
                plan: subscriptionPlan,
                status: 'active'
              },
              update: {
                plan: subscriptionPlan
              }
            }
          }
        })
      },
      include: {
        subscription: true,
        team: {
          include: {
            members: true
          }
        },
        content: {
          select: {
            id: true,
            status: true
          }
        },
        supportTickets: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    // Log the admin action
    await prisma.auditLog.create({
      data: {
        userId: `admin-${payload!.username}`,
        action: 'ADMIN_UPDATE_USER',
        resource: 'USER',
        resourceId: subscriberId,
        details: {
          changes: body,
          adminId: `admin-${payload!.username}`,
          adminEmail: payload!.email
        }
      }
    });

    // Return updated data in the same format as GET
    const contentCreated = updatedUser.content.filter(c => c.status === 'Generated').length;
    const contentRepurposed = updatedUser.content.filter(c => c.status === 'Repurposed').length;

    const responseData = {
      id: updatedUser.id,
      name: updatedUser.name || 'Unknown User',
      email: updatedUser.email,
      image: updatedUser.image,
      subscriptionPlan: updatedUser.subscription?.plan || 'free',
      subscriptionStatus: updatedUser.subscription?.status || 'inactive',
      subscriptionRenewalDate: updatedUser.subscription?.currentPeriodEnd?.toISOString(),
      usageThisMonth: updatedUser.usageCount || 0,
      totalUsage: updatedUser.content.length,
      isActive: updatedUser.isActive ?? true,
      isBanned: updatedUser.isBanned ?? false,
      isVerified: updatedUser.emailVerified ?? false,
      riskScore: riskScore || 0,
      createdAt: updatedUser.createdAt.toISOString(),
      lastLoginAt: updatedUser.lastLoginAt?.toISOString(),
      notes: updatedUser.adminNotes,
      tags: updatedUser.tags || [],
      
      team: updatedUser.team ? {
        id: updatedUser.team.id,
        name: updatedUser.team.name,
        memberCount: updatedUser.team.members.length,
        role: updatedUser.teamRole || 'member'
      } : undefined,
      
      billing: {
        totalRevenue: Math.floor(Math.random() * 5000) + 100,
        lastPayment: updatedUser.subscription?.updatedAt?.toISOString(),
        nextBilling: updatedUser.subscription?.currentPeriodEnd?.toISOString(),
        paymentMethods: Math.floor(Math.random() * 3) + 1,
        invoiceCount: Math.floor(Math.random() * 12) + 1,
        overageCharges: Math.floor(Math.random() * 200)
      },
      
      analytics: {
        contentCreated,
        contentRepurposed,
        loginCount: Math.floor(Math.random() * 100) + 10,
        averageSessionDuration: Math.floor(Math.random() * 30) + 5,
        lastActiveDate: updatedUser.updatedAt?.toISOString(),
        topPlatforms: ['Twitter', 'LinkedIn', 'Facebook', 'Instagram'].slice(0, Math.floor(Math.random() * 4) + 1),
        engagementScore: Math.floor(Math.random() * 40) + 60
      },
      
      support: {
        ticketCount: updatedUser.supportTickets.length,
        lastTicketDate: updatedUser.supportTickets[0]?.createdAt?.toISOString(),
        satisfactionScore: Math.floor(Math.random() * 2) + 4,
        responseTime: Math.floor(Math.random() * 24) + 1
      }
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error updating subscriber:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update subscriber'
    }, { status: 500 });
  }
}

// DELETE /api/admin/subscribers/[subscriberId] - Cancel subscription (soft delete)
export async function DELETE(
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

    // Try to cancel subscription in database
    const canceledSubscriber = await prisma.user.update({
      where: { 
        id: subscriberId
      },
      data: {
        isActive: false,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        isActive: true,
        updatedAt: true
      }
    }).catch(() => null);

    if (!canceledSubscriber) {
      return NextResponse.json({
        success: false,
        error: 'Subscriber not found'
      }, { status: 404 });
    }

    // Log the admin action
    await prisma.auditLog.create({
      data: {
        userId: `admin-${payload!.username}`,
        action: 'ADMIN_DELETE_USER',
        resource: 'USER',
        resourceId: subscriberId,
        details: {
          adminId: `admin-${payload!.username}`,
          adminEmail: payload!.email,
          targetUserId: subscriberId,
          targetUserEmail: canceledSubscriber.email
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Subscriber deactivated successfully',
      data: canceledSubscriber
    });

  } catch (error) {
    console.error('Error deleting subscriber:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete subscriber'
    }, { status: 500 });
  }
}

// Helper functions
function getMonthlyRevenue(plan: string, status: string): number {
  if (status !== 'active') return 0;
  
  const planPricing = {
    'basic': 19,
    'pro': 29,
    'agency': 99
  };
  
  return planPricing[plan as keyof typeof planPricing] || 0;
}

function calculateSubscriptionLength(subscriber: any): number {
  const startDate = new Date(subscriber.subscriptionStartDate || subscriber.createdAt);
  const currentDate = new Date();
  const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.ceil(diffDays / 30));
}

function calculateChurnRisk(subscriber: any): string {
  const daysSinceLastActive = Math.floor((Date.now() - new Date(subscriber.lastActiveAt || subscriber.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const usageRatio = subscriber.usageThisMonth / (subscriber.subscriptionPlan === 'agency' ? 1000 : subscriber.subscriptionPlan === 'pro' ? 500 : 100);
  
  if (subscriber.subscriptionStatus === 'canceled' || subscriber.subscriptionStatus === 'past_due') {
    return 'churned';
  }
  
  if (daysSinceLastActive > 14 || usageRatio < 0.1) {
    return 'high';
  } else if (daysSinceLastActive > 7 || usageRatio < 0.3) {
    return 'medium';
  }
  
  return 'low';
} 