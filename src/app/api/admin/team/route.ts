import { NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    // Validate admin authentication
    const { isValid, error } = await validateAdminRequest(req);
    if (!isValid) {
      return NextResponse.json({ 
        success: false, 
        error: error || 'Unauthorized' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || 'all';
    const status = searchParams.get('status') || 'all';

    try {
      // Fetch company members from database
      let whereClause: any = {};

      // Apply search filter
      if (search) {
        whereClause.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Apply role filter
      if (role !== 'all') {
        whereClause.role = role;
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          subscriptionPlan: true,
          subscriptionStatus: true
        },
        orderBy: [
          { role: 'desc' }, // Owner first, then others
          { createdAt: 'desc' }
        ]
      });

      // Transform users to company member format
      let companyMembers = users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'user',
        status: user.emailVerified ? 'active' : 'pending',
        permissions: getRolePermissions(user.role || 'user'),
        createdAt: user.createdAt.toISOString(),
        lastLogin: null, // We don't track last login yet
        addedBy: user.role === 'owner' ? 'system' : 'admin',
        emailVerified: user.emailVerified?.toISOString() || null
      }));

      // Ensure we always have the owner (mainboss) even if not in database
      const hasOwner = companyMembers.some(member => member.role === 'owner');
      if (!hasOwner) {
        const ownerMember = {
          id: 'owner-1',
          email: 'alpesh@aicontentrepurposer.com',
          name: 'Alpesh Patel',
          role: 'owner',
          status: 'active',
          permissions: ['all'],
          createdAt: new Date('2024-01-01').toISOString(),
          lastLogin: new Date().toISOString(),
          addedBy: 'system',
          emailVerified: new Date('2024-01-01').toISOString()
        };
        companyMembers.unshift(ownerMember);
      }

      // Apply status filter after transformation
      if (status !== 'all') {
        companyMembers = companyMembers.filter(member => member.status === status);
      }

      return NextResponse.json({
        success: true,
        members: companyMembers
      });

    } catch (dbError) {
      console.error('[ADMIN_COMPANY_DB_ERROR]', dbError);
      
      // Fallback to owner only if database fails
      const ownerMember = {
        id: 'owner-1',
        email: 'alpesh@aicontentrepurposer.com',
        name: 'Alpesh Patel',
        role: 'owner',
        status: 'active',
        permissions: ['all'],
        createdAt: new Date('2024-01-01').toISOString(),
        lastLogin: new Date().toISOString(),
        addedBy: 'system',
        emailVerified: new Date('2024-01-01').toISOString()
      };

      return NextResponse.json({
        success: true,
        members: [ownerMember],
        warning: 'Database connection failed, showing fallback data'
      });
    }
  } catch (error) {
    console.error('[ADMIN_COMPANY_ERROR]', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Authentication failed' 
    }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    // Validate admin authentication
    const { isValid, error } = await validateAdminRequest(req);
    if (!isValid) {
      return NextResponse.json({ 
        success: false, 
        error: error || 'Unauthorized' 
      }, { status: 401 });
    }

    const body = await req.json();
    const { email, name, role } = body;

    // Validate input
    if (!email || !role) {
      return NextResponse.json({
        success: false,
        error: 'Email and role are required'
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 });
    }

    // Validate role
    const validRoles = ['admin', 'support', 'marketing', 'finance', 'content_developer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid role specified'
      }, { status: 400 });
    }

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        return NextResponse.json({
          success: false,
          error: 'A user with this email already exists'
        }, { status: 400 });
      }

      // Create new company member in database
      const newMember = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: name || email.split('@')[0],
          role: role,
          emailVerified: new Date(), // Auto-verify admin-created users
          subscriptionPlan: 'free',
          subscriptionStatus: 'active',
          usageThisMonth: 0
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          emailVerified: true
        }
      });

      console.log(`Company member created: ${newMember.email} with role ${role}`);

      // Return the created member
      return NextResponse.json({
        success: true,
        message: 'Company member added successfully',
        member: {
          id: newMember.id,
          email: newMember.email,
          name: newMember.name,
          role: newMember.role,
          status: 'active',
          permissions: getRolePermissions(role),
          createdAt: newMember.createdAt.toISOString(),
          lastLogin: null,
          addedBy: 'admin',
          emailVerified: newMember.emailVerified?.toISOString() || null
        }
      });

    } catch (dbError: any) {
      console.error('[ADMIN_COMPANY_CREATE_DB_ERROR]', dbError);
      
      if (dbError.code === 'P2002') {
        return NextResponse.json({
          success: false,
          error: 'A user with this email already exists'
        }, { status: 400 });
      }

      return NextResponse.json({
        success: false,
        error: 'Database error while creating company member'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[ADMIN_COMPANY_POST_ERROR]', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    // Validate admin authentication
    const { isValid, error } = await validateAdminRequest(req);
    if (!isValid) {
      return NextResponse.json({ 
        success: false, 
        error: error || 'Unauthorized' 
      }, { status: 401 });
    }

    const body = await req.json();
    const { memberId, name, role, status } = body;

    // Validate input
    if (!memberId) {
      return NextResponse.json({
        success: false,
        error: 'Member ID is required'
      }, { status: 400 });
    }

    // Prevent modification of owner
    if (memberId === 'owner-1') {
      return NextResponse.json({
        success: false,
        error: 'Cannot modify owner account'
      }, { status: 403 });
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['admin', 'support', 'marketing', 'finance', 'content_developer'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid role specified'
        }, { status: 400 });
      }
    }

    // Validate status if provided
    if (status && !['active', 'pending'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid status specified. Must be "active" or "pending"'
      }, { status: 400 });
    }

    try {
      // Check if member exists
      const existingMember = await prisma.user.findUnique({
        where: { id: memberId },
        select: { id: true, email: true, role: true }
      });

      if (!existingMember) {
        return NextResponse.json({
          success: false,
          error: 'Company member not found'
        }, { status: 404 });
      }

      // Prevent modification of owner role
      if (existingMember.role === 'owner') {
        return NextResponse.json({
          success: false,
          error: 'Cannot modify owner account'
        }, { status: 403 });
      }

      // Prepare update data
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (role) updateData.role = role;
      
      // Handle status changes by updating emailVerified field
      if (status) {
        if (status === 'active') {
          // Set emailVerified to current date to make user active
          updateData.emailVerified = new Date();
        } else if (status === 'pending') {
          // Set emailVerified to null to make user pending
          updateData.emailVerified = null;
        }
      }

      // Update the member
      const updatedMember = await prisma.user.update({
        where: { id: memberId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true
        }
      });

      console.log(`Company member ${memberId} updated:`, updateData);

      return NextResponse.json({
        success: true,
        message: 'Company member updated successfully',
        member: {
          id: updatedMember.id,
          email: updatedMember.email,
          name: updatedMember.name,
          role: updatedMember.role,
          status: updatedMember.emailVerified ? 'active' : 'pending',
          permissions: getRolePermissions(updatedMember.role || 'user'),
          createdAt: updatedMember.createdAt.toISOString(),
          lastLogin: null,
          addedBy: 'admin',
          emailVerified: updatedMember.emailVerified?.toISOString() || null
        }
      });

    } catch (dbError) {
      console.error('[ADMIN_COMPANY_UPDATE_DB_ERROR]', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database error while updating company member'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[ADMIN_COMPANY_PATCH_ERROR]', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    // Validate admin authentication
    const { isValid, error } = await validateAdminRequest(req);
    if (!isValid) {
      return NextResponse.json({ 
        success: false, 
        error: error || 'Unauthorized' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({
        success: false,
        error: 'Member ID is required'
      }, { status: 400 });
    }

    // Prevent deletion of owner
    if (memberId === 'owner-1') {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete owner account'
      }, { status: 403 });
    }

    try {
      // Check if member exists
      const existingMember = await prisma.user.findUnique({
        where: { id: memberId },
        select: { id: true, email: true, role: true }
      });

      if (!existingMember) {
        return NextResponse.json({
          success: false,
          error: 'Company member not found'
        }, { status: 404 });
      }

      // Prevent deletion of owner role
      if (existingMember.role === 'owner') {
        return NextResponse.json({
          success: false,
          error: 'Cannot delete owner account'
        }, { status: 403 });
      }

      // Delete the member
      await prisma.user.delete({
        where: { id: memberId }
      });

      console.log(`Company member ${memberId} (${existingMember.email}) deleted`);

      return NextResponse.json({
        success: true,
        message: 'Company member removed successfully'
      });

    } catch (dbError) {
      console.error('[ADMIN_COMPANY_DELETE_DB_ERROR]', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database error while removing company member'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[ADMIN_COMPANY_DELETE_ERROR]', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
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
    user: ['content:read']
  };
  
  return rolePermissions[role] || [];
} 