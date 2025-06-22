import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAdminRequest } from '@/lib/admin-auth';

export async function POST(
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

    // Update user to active status
    const updatedUser = await prisma.user.update({
      where: { id: subscriberId },
      data: { 
        isActive: true,
        updatedAt: new Date()
      }
    });

    // Log the admin action
    await prisma.auditLog.create({
      data: {
        userId: `admin-${payload!.username}`,
        action: 'ADMIN_ACTIVATE_USER',
        resource: 'USER',
        resourceId: subscriberId,
        details: {
          adminId: `admin-${payload!.username}`,
          adminEmail: payload!.email,
          targetUserId: subscriberId,
          targetUserEmail: updatedUser.email
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User activated successfully'
    });

  } catch (error) {
    console.error('Error activating user:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to activate user'
    }, { status: 500 });
  }
} 