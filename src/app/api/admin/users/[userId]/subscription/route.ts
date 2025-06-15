import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const adminUserId = session?.user?.id;

    if (!adminUserId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if user is admin (website owner)
    const currentUser = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { role: true, name: true, email: true }
    });

    if (!currentUser || currentUser.role !== 'owner') {
      return new NextResponse('Admin access required', { status: 403 });
    }

    const { userId } = await params;
    const { subscriptionPlan, subscriptionStatus } = await req.json();

    if (!userId) {
      return new NextResponse('User ID is required', { status: 400 });
    }

    try {
      // Check if target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          name: true, 
          email: true, 
          subscriptionPlan: true, 
          subscriptionStatus: true 
        }
      });

      if (!targetUser) {
        return new NextResponse('User not found', { status: 404 });
      }

      // Prepare update data
      const updateData: any = {};
      
      if (subscriptionPlan && subscriptionPlan !== targetUser.subscriptionPlan) {
        updateData.subscriptionPlan = subscriptionPlan;
      }
      
      if (subscriptionStatus && subscriptionStatus !== targetUser.subscriptionStatus) {
        updateData.subscriptionStatus = subscriptionStatus;
      }

      // If no changes, return current data
      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({
          success: true,
          user: targetUser,
          message: 'No changes made'
        });
      }

      // Update user subscription
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          updatedAt: true
        }
      });

      console.log(`User ${userId} subscription updated by admin ${currentUser.email}:`, updateData);

      return NextResponse.json({
        success: true,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          subscriptionPlan: updatedUser.subscriptionPlan,
          subscriptionStatus: updatedUser.subscriptionStatus,
          updatedAt: updatedUser.updatedAt.toISOString()
        }
      });

    } catch (dbError) {
      console.error('[ADMIN_USER_SUBSCRIPTION_UPDATE_DB_ERROR]', dbError);
      return new NextResponse('Database error while updating user subscription', { status: 500 });
    }
  } catch (error) {
    console.error('[ADMIN_USER_SUBSCRIPTION_UPDATE_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 