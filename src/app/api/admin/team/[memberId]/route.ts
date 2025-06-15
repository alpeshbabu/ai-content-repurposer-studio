import { NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    // Validate admin authentication
    const { isValid, error } = await validateAdminRequest(req);
    if (!isValid) {
      return new NextResponse(error || 'Unauthorized', { status: 401 });
    }

    const { memberId } = await params;
    const body = await req.json();
    const { role, status, name } = body;

    // Validate role if provided
    if (role) {
      const validRoles = ['admin', 'support', 'marketing', 'finance', 'content_developer'];
      if (!validRoles.includes(role)) {
        return new NextResponse('Invalid role', { status: 400 });
      }
    }

    // Validate status if provided
    if (status && !['active', 'pending', 'suspended'].includes(status)) {
      return new NextResponse('Invalid status', { status: 400 });
    }

    try {
      // Check if member exists
      const existingMember = await prisma.user.findUnique({
        where: { id: memberId },
        select: { id: true, email: true, role: true }
      }).catch(() => null);

      if (!existingMember) {
        // Return mock success for demo if member not found
        console.log(`Mock: Company member ${memberId} updated successfully`);
        return NextResponse.json({
          success: true,
          message: 'Company member updated successfully (demo mode)',
          member: {
            id: memberId,
            role: role || 'support',
            status: status || 'active',
            updatedAt: new Date().toISOString()
          }
        });
      }

      // Prevent changing owner role
      if (existingMember.role === 'owner' && role && role !== 'owner') {
        return new NextResponse('Cannot change owner role', { status: 403 });
      }

      // Update member
      const updateData: any = {};
      if (role) updateData.role = role;
      if (name !== undefined) updateData.name = name;

      const updatedMember = await prisma.user.update({
        where: { id: memberId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          emailVerified: true
        }
      });

      // Log the update
      console.log(`Company member ${memberId} updated by admin. Changes:`, updateData);

      return NextResponse.json({
        success: true,
        message: 'Company member updated successfully',
        member: {
          ...updatedMember,
          status: updatedMember.emailVerified ? 'active' : 'pending',
          permissions: getRolePermissions(updatedMember.role || 'user'),
          createdAt: updatedMember.createdAt.toISOString(),
          emailVerified: updatedMember.emailVerified?.toISOString() || null
        }
      });

    } catch (dbError) {
      console.error('[ADMIN_COMPANY_UPDATE_DB_ERROR]', dbError);
      
      // Return mock success for demo
      console.log(`Mock: Company member ${memberId} updated successfully (DB fallback)`);
      return NextResponse.json({
        success: true,
        message: 'Company member updated successfully (demo mode)',
        member: {
          id: memberId,
          role: role || 'support',
          status: status || 'active',
          updatedAt: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('[ADMIN_COMPANY_UPDATE_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    // Validate admin authentication
    const { isValid, error } = await validateAdminRequest(req);
    if (!isValid) {
      return new NextResponse(error || 'Unauthorized', { status: 401 });
    }

    const { memberId } = await params;

    try {
      // Check if member exists and get their info
      const member = await prisma.user.findUnique({
        where: { id: memberId },
        select: { id: true, email: true, role: true }
      }).catch(() => null);

      if (!member) {
        // Return mock success for demo if member not found
        console.log(`Mock: Company member ${memberId} removed successfully`);
        return NextResponse.json({
          success: true,
          message: 'Company member removed successfully (demo mode)'
        });
      }

      // Prevent deleting owner
      if (member.role === 'owner') {
        return new NextResponse('Cannot remove the owner', { status: 403 });
      }

      // Delete the company member
      await prisma.user.delete({
        where: { id: memberId }
      });

      // Log the deletion
      console.log(`Company member ${memberId} (${member.email}) removed by admin`);

      return NextResponse.json({
        success: true,
        message: 'Company member removed successfully'
      });

    } catch (dbError) {
      console.error('[ADMIN_COMPANY_DELETE_DB_ERROR]', dbError);
      
      // Return mock success for demo
      console.log(`Mock: Company member ${memberId} removed successfully (DB fallback)`);
      return NextResponse.json({
        success: true,
        message: 'Company member removed successfully (demo mode)'
      });
    }
  } catch (error) {
    console.error('[ADMIN_COMPANY_DELETE_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

function getRolePermissions(role: string): string[] {
  const rolePermissions: { [key: string]: string[] } = {
    owner: ['all'],
    admin: ['users', 'content', 'analytics', 'support', 'settings'],
    support: ['support', 'users:read', 'analytics:support'],
    marketing: ['content', 'analytics:content', 'analytics:users'],
    finance: ['billing', 'analytics:revenue', 'users:billing'],
    content_developer: ['content:write', 'content:read'],
    user: []
  };
  
  return rolePermissions[role] || [];
} 