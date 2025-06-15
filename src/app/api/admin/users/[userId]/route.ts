import { NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Validate admin authentication
    const { isValid, error } = await validateAdminRequest(req);
    if (!isValid) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionRenewalDate: true,
        role: true,
        createdAt: true,
        emailVerified: true,
        usageThisMonth: true,
        DailyUsage: {
          where: {
            date: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          },
          orderBy: { date: 'desc' }
        },
        overageCharges: {
          orderBy: { date: 'desc' },
          take: 10
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate monthly usage
    const monthlyUsage = user.DailyUsage.reduce((sum, usage) => sum + usage.count, 0);

    const userWithDetails = {
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionRenewalDate: user.subscriptionRenewalDate?.toISOString() || null,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      emailVerified: user.emailVerified?.toISOString() || null,
      usageThisMonth: monthlyUsage,
      totalUsage: user.usageThisMonth || 0,
      recentUsage: user.DailyUsage.slice(0, 7).map(usage => ({
        date: usage.date.toISOString(),
        count: usage.count
      })),
      paymentInfo: {
        subscriptionRenewalDate: user.subscriptionRenewalDate?.toISOString() || null,
        recentOverageCharges: user.overageCharges.map(charge => ({
          id: charge.id,
          amount: charge.amount,
          count: charge.count,
          date: charge.date.toISOString(),
          status: charge.status,
          invoiceId: charge.invoiceId
        })),
        totalOverageCharges: user.overageCharges.reduce((sum, charge) => sum + charge.amount, 0)
      }
    };

    return NextResponse.json({
      success: true,
      user: userWithDetails
    });
  } catch (error) {
    console.error('[ADMIN_USER_GET_ERROR]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Validate admin authentication
    const { isValid, error } = await validateAdminRequest(req);
    if (!isValid) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const body = await req.json();
    const { name, subscriptionPlan, subscriptionStatus, role } = body;

    // Validate input
    if (subscriptionPlan && !['free', 'basic', 'pro', 'agency'].includes(subscriptionPlan)) {
      return NextResponse.json({ error: 'Invalid subscription plan' }, { status: 400 });
    }

    if (subscriptionStatus && !['active', 'inactive', 'canceled'].includes(subscriptionStatus)) {
      return NextResponse.json({ error: 'Invalid subscription status' }, { status: 400 });
    }

    if (role && !['user', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(subscriptionPlan !== undefined && { subscriptionPlan }),
        ...(subscriptionStatus !== undefined && { subscriptionStatus }),
        ...(role !== undefined && { role })
      },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        usageThisMonth: true,
        createdAt: true,
        emailVerified: true,
        role: true
      }
    });

    // Log the admin action
    console.log('[ADMIN_USER_UPDATE]', {
      adminAction: true,
      userId: userId,
      changes: body,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name || 'Anonymous User',
        subscriptionPlan: updatedUser.subscriptionPlan || 'free',
        subscriptionStatus: updatedUser.subscriptionStatus || 'active',
        usageThisMonth: updatedUser.usageThisMonth || 0,
        createdAt: updatedUser.createdAt.toISOString(),
        emailVerified: updatedUser.emailVerified?.toISOString() || null,
        role: updatedUser.role || 'user'
      }
    });
  } catch (error) {
    console.error('[ADMIN_USER_UPDATE_ERROR]', error);
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Validate admin authentication
    const { isValid, error } = await validateAdminRequest(req);
    if (!isValid) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deletion of admin users
    if (user.role === 'admin') {
      return NextResponse.json({ error: 'Cannot delete admin users' }, { status: 403 });
    }

    // Delete user and related data
    await prisma.$transaction([
      // Delete daily usage records
      prisma.dailyUsage.deleteMany({
        where: { userId: userId }
      }),
      // Delete overage charges
      prisma.overageCharge.deleteMany({
        where: { userId: userId }
      }),
      // Delete user
      prisma.user.delete({
        where: { id: userId }
      })
    ]);

    // Log the admin action
    console.log('[ADMIN_USER_DELETE]', {
      adminAction: true,
      userId: userId,
      userEmail: user.email,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('[ADMIN_USER_DELETE_ERROR]', error);
    
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
} 