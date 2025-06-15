import { NextRequest, NextResponse } from 'next/server';
import { createAdminHandler, AdminAccessControl } from '@/lib/admin-middleware';
import { ROLES, PERMISSIONS } from '@/lib/rbac';

// GET /api/admin/settings/roles - Get role information for role management
export const GET = createAdminHandler(
  async (req: NextRequest, user, payload) => {
    try {
      // Transform roles for frontend consumption
      const roleList = Object.values(ROLES).map(role => ({
        id: role.id,
        name: role.name,
        permissions: role.permissions,
        description: getRoleDescription(role.id),
        canEdit: role.id !== 'owner' && (user.role === 'owner' || user.role === 'admin'),
        permissionCount: role.permissions.length,
        hasFullAccess: role.permissions.includes(PERMISSIONS.ALL)
      }));

      // Get permission descriptions
      const permissionDescriptions = getPermissionDescriptions();

      // Get permission categories for better organization
      const permissionCategories = getPermissionCategories();

      // Get access level information for current user
      const userAccess = {
        canManageRoles: user.role === 'owner',
        canViewRoles: ['owner', 'admin'].includes(user.role),
        currentRole: user.role,
        currentPermissions: user.permissions || [],
        hasFullAccess: user.role === 'owner' || user.permissions?.includes(PERMISSIONS.ALL)
      };

      return NextResponse.json({
        success: true,
        roles: roleList,
        permissions: permissionDescriptions,
        permissionCategories,
        userAccess,
        meta: {
          totalRoles: roleList.length,
          editableRoles: roleList.filter(r => r.canEdit).length,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('[ADMIN_ROLES_ERROR]', error);
      return new NextResponse('Internal server error', { status: 500 });
    }
  },
  AdminAccessControl.admin()
);

// PUT /api/admin/settings/roles - Update role permissions (Owner only)
export const PUT = createAdminHandler(
  async (req: NextRequest, user, payload) => {
    try {
      const { roleId, permissions, name, description } = await req.json();

      // Validate input
      if (!roleId || !Array.isArray(permissions)) {
        return new NextResponse('Invalid role data', { status: 400 });
      }

      // Owner role cannot be modified
      if (roleId === 'owner') {
        return new NextResponse('Owner role cannot be modified', { status: 403 });
      }

      // Validate permissions exist
      const validPermissions = Object.values(PERMISSIONS);
      const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
      if (invalidPermissions.length > 0) {
        return new NextResponse(`Invalid permissions: ${invalidPermissions.join(', ')}`, { status: 400 });
      }

      // This is a simulation - in a real app, you'd update a database
      // For now, we'll validate and return success
      console.log(`[ROLE_UPDATE] ${user.username} updated role ${roleId}:`, {
        roleId,
        permissions,
        name,
        description,
        timestamp: new Date().toISOString()
      });

      // Here you would update your role configuration store
      // Example: await updateRoleInDatabase(roleId, { permissions, name, description });

      return NextResponse.json({
        success: true,
        message: `Role ${roleId} updated successfully`,
        role: {
          id: roleId,
          name: name || ROLES[roleId]?.name || roleId,
          permissions,
          description: description || getRoleDescription(roleId),
          updatedAt: new Date().toISOString(),
          updatedBy: user.username
        }
      });

    } catch (error) {
      console.error('[ADMIN_ROLE_UPDATE_ERROR]', error);
      return new NextResponse('Failed to update role', { status: 500 });
    }
  },
  AdminAccessControl.owner() // Only owners can modify roles
);

function getRoleDescription(roleId: string): string {
  const descriptions: { [key: string]: string } = {
    owner: 'Complete system ownership and control. Has all permissions and cannot be modified.',
    admin: 'Administrative access to user management, content, analytics, support, and system settings.',
    support: 'Support team access to tickets, user assistance, and support-related analytics.',
    marketing: 'Marketing team access to content management, analytics, and marketing campaigns.',
    finance: 'Finance team access to billing, subscriptions, revenue analytics, and financial reports.',
    content_developer: 'Content team access to content creation, editing, and content analytics.',
  };
  return descriptions[roleId] || 'Custom role with specific permissions.';
}

function getPermissionDescriptions(): { [key: string]: string } {
  return {
    [PERMISSIONS.ALL]: 'Full system access - all permissions included',
    [PERMISSIONS.USERS_READ]: 'View user profiles and account information',
    [PERMISSIONS.USERS_WRITE]: 'Create and edit user accounts',
    [PERMISSIONS.USERS_DELETE]: 'Delete user accounts and data',
    [PERMISSIONS.USERS_BILLING]: 'Access user billing and subscription details',
    [PERMISSIONS.CONTENT_READ]: 'View content and posts',
    [PERMISSIONS.CONTENT_WRITE]: 'Create and edit content',
    [PERMISSIONS.CONTENT_DELETE]: 'Delete content and posts',
    [PERMISSIONS.CONTENT_MODERATE]: 'Moderate and review content',
    [PERMISSIONS.ANALYTICS_CONTENT]: 'View content analytics and metrics',
    [PERMISSIONS.ANALYTICS_USERS]: 'View user analytics and behavior data',
    [PERMISSIONS.ANALYTICS_REVENUE]: 'Access revenue and financial analytics',
    [PERMISSIONS.ANALYTICS_SUPPORT]: 'View support metrics and ticket analytics',
    [PERMISSIONS.SUPPORT_READ]: 'View support tickets and messages',
    [PERMISSIONS.SUPPORT_WRITE]: 'Create and respond to support tickets',
    [PERMISSIONS.SUPPORT_ASSIGN]: 'Assign tickets to team members',
    [PERMISSIONS.BILLING_READ]: 'View billing information and invoices',
    [PERMISSIONS.BILLING_WRITE]: 'Manage billing and payment settings',
    [PERMISSIONS.SETTINGS_READ]: 'View system settings and configuration',
    [PERMISSIONS.SETTINGS_WRITE]: 'Modify system settings and configuration',
    [PERMISSIONS.TEAM_READ]: 'View team members and organization',
    [PERMISSIONS.TEAM_INVITE]: 'Invite new team members',
    [PERMISSIONS.TEAM_MANAGE]: 'Manage team members and roles'
  };
}

function getPermissionCategories() {
  return {
    'User Management': {
      permissions: [
        PERMISSIONS.USERS_READ,
        PERMISSIONS.USERS_WRITE,
        PERMISSIONS.USERS_DELETE,
        PERMISSIONS.USERS_BILLING
      ],
      icon: 'users',
      color: 'blue'
    },
    'Content Management': {
      permissions: [
        PERMISSIONS.CONTENT_READ,
        PERMISSIONS.CONTENT_WRITE,
        PERMISSIONS.CONTENT_DELETE,
        PERMISSIONS.CONTENT_MODERATE
      ],
      icon: 'edit',
      color: 'green'
    },
    'Analytics': {
      permissions: [
        PERMISSIONS.ANALYTICS_CONTENT,
        PERMISSIONS.ANALYTICS_USERS,
        PERMISSIONS.ANALYTICS_REVENUE,
        PERMISSIONS.ANALYTICS_SUPPORT
      ],
      icon: 'bar-chart',
      color: 'purple'
    },
    'Support': {
      permissions: [
        PERMISSIONS.SUPPORT_READ,
        PERMISSIONS.SUPPORT_WRITE,
        PERMISSIONS.SUPPORT_ASSIGN
      ],
      icon: 'headphones',
      color: 'orange'
    },
    'Billing': {
      permissions: [
        PERMISSIONS.BILLING_READ,
        PERMISSIONS.BILLING_WRITE
      ],
      icon: 'dollar-sign',
      color: 'yellow'
    },
    'System': {
      permissions: [
        PERMISSIONS.SETTINGS_READ,
        PERMISSIONS.SETTINGS_WRITE
      ],
      icon: 'settings',
      color: 'gray'
    },
    'Team': {
      permissions: [
        PERMISSIONS.TEAM_READ,
        PERMISSIONS.TEAM_INVITE,
        PERMISSIONS.TEAM_MANAGE
      ],
      icon: 'users',
      color: 'indigo'
    },
    'Special': {
      permissions: [
        PERMISSIONS.ALL
      ],
      icon: 'crown',
      color: 'red'
    }
  };
} 