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

export async function POST(
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

    // Update user to inactive status
    const updatedUser = await prisma.user.update({
      where: { id: subscriberId },
      data: { 
        isActive: false,
        updatedAt: new Date()
      }
    });

    // Log the admin action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_DEACTIVATE_USER',
        resource: 'USER',
        resourceId: subscriberId,
        details: {
          adminId: session.user.id,
          adminEmail: session.user.email,
          targetUserId: subscriberId,
          targetUserEmail: updatedUser.email
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('Error deactivating user:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to deactivate user'
    }, { status: 500 });
  }
} 