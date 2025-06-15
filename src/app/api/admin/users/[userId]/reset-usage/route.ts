import { NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function POST(
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
      select: { id: true, email: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get current month start date
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Reset user's monthly usage
    await prisma.user.update({
      where: { id: userId },
      data: { usageThisMonth: 0 }
    });

    // Delete daily usage records for current month
    await prisma.dailyUsage.deleteMany({
      where: {
        userId: userId,
        date: {
          gte: monthStart
        }
      }
    });

    // Log the admin action
    console.log('[ADMIN_USER_RESET_USAGE]', {
      adminAction: true,
      userId: userId,
      userEmail: user.email,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'User usage reset successfully'
    });
  } catch (error) {
    console.error('[ADMIN_USER_RESET_USAGE_ERROR]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
} 