import { NextRequest, NextResponse } from 'next/server';
import { createAdminHandler, AdminAccessControl } from '@/lib/admin-middleware';
import { prisma } from '@/lib/prisma';

// PUT /api/admin/team/[memberId]/role - Update user role (Owner only)
export const PUT = createAdminHandler(
  async (req: NextRequest, user, payload, { params }) => {
    try {
      const { memberId } = params;
      const { role } = await req.json();

      // Validate input
      if (!role) {
        return new NextResponse('Role is required', { status: 400 });
      }

      // Valid roles
      const validRoles = ['owner', 'admin', 'support', 'marketing', 'finance', 'content_developer'];
      if (!validRoles.includes(role)) {
        return new NextResponse('Invalid role', { status: 400 });
      }

      // Cannot modify your own role
      if (memberId === user.id) {
        return new NextResponse('Cannot modify your own role', { status: 403 });
      }

      // Get the target user
      const targetUser = await prisma.user.findUnique({
        where: { id: memberId },
        select: {
          id: true,
          email: true,
          name: true,
          adminRole: true,
          createdAt: true,
        }
      });

      if (!targetUser) {
        return new NextResponse('User not found', { status: 404 });
      }

      // Cannot change role of another owner (unless you're removing owner status)
      if (targetUser.adminRole === 'owner' && role !== 'owner') {
        // This would be removing owner status - requires special validation
        const ownerCount = await prisma.user.count({
          where: { adminRole: 'owner' }
        });

        if (ownerCount <= 1) {
          return new NextResponse('Cannot remove the last owner', { status: 403 });
        }
      }

      // Update the user's role
      const updatedUser = await prisma.user.update({
        where: { id: memberId },
        data: { 
          adminRole: role,
          updatedAt: new Date()
        },
        select: {
          id: true,
          email: true,
          name: true,
          adminRole: true,
          updatedAt: true,
        }
      });

      // Log the role change
      console.log(`[ROLE_CHANGE] ${user.username} changed ${targetUser.email}'s role from ${targetUser.adminRole} to ${role}`);

      return NextResponse.json({
        success: true,
        message: `User role updated to ${role}`,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.adminRole,
          updatedAt: updatedUser.updatedAt,
          updatedBy: user.username
        }
      });

    } catch (error) {
      console.error('[ADMIN_ROLE_CHANGE_ERROR]', error);
      return new NextResponse('Failed to update user role', { status: 500 });
    }
  },
  AdminAccessControl.owner() // Only owners can change roles
); 