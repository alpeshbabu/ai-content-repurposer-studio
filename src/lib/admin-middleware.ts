// Admin middleware for role-based access control
import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/admin-auth';
import { hasPermission, hasAnyPermission, canAccessSection, PERMISSIONS } from '@/lib/rbac';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  username: string;
}

export interface AdminMiddlewareOptions {
  requiredPermissions?: string[];
  requiredRole?: string | string[];
  allowedRoles?: string[];
  section?: string;
  requireOwner?: boolean;
  requireAdmin?: boolean;
}

/**
 * Admin authentication and authorization middleware
 */
export async function withAdminAuth(
  request: NextRequest,
  options: AdminMiddlewareOptions = {}
) {
  try {
    // Validate admin authentication
    const { isValid, error, payload } = await validateAdminRequest(request);
    
    if (!isValid || !payload) {
      return {
        success: false,
        error: error || 'Authentication required',
        status: 401
      };
    }

    const user: AdminUser = {
      id: `admin-${payload.username}`,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      permissions: payload.permissions || [],
      username: payload.username
    };

    // Check role-based access
    const authResult = checkAdminAccess(user, options);
    
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error,
        status: 403
      };
    }

    return {
      success: true,
      user,
      payload
    };

  } catch (error) {
    console.error('[ADMIN_MIDDLEWARE_ERROR]', error);
    return {
      success: false,
      error: 'Authentication failed',
      status: 500
    };
  }
}

/**
 * Check if user has required access for admin features
 */
export function checkAdminAccess(user: AdminUser, options: AdminMiddlewareOptions) {
  const {
    requiredPermissions = [],
    requiredRole,
    allowedRoles = [],
    section,
    requireOwner = false,
    requireAdmin = false
  } = options;

  // Owner has access to everything
  if (user.role === 'owner') {
    return { success: true };
  }

  // Check owner requirement
  if (requireOwner && user.role !== 'owner') {
    return {
      success: false,
      error: 'Owner access required'
    };
  }

  // Check admin requirement
  if (requireAdmin && !['owner', 'admin'].includes(user.role)) {
    return {
      success: false,
      error: 'Administrator access required'
    };
  }

  // Check specific role requirement
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) {
      return {
        success: false,
        error: `Required role: ${roles.join(' or ')}`
      };
    }
  }

  // Check allowed roles
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      success: false,
      error: `Access restricted to: ${allowedRoles.join(', ')}`
    };
  }

  // Check section access
  if (section && !canAccessSection(user, section)) {
    return {
      success: false,
      error: `Access denied to ${section} section`
    };
  }

  // Check specific permissions
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = hasAnyPermission(user, requiredPermissions);
    if (!hasRequiredPermissions) {
      return {
        success: false,
        error: 'Insufficient permissions'
      };
    }
  }

  return { success: true };
}

/**
 * Create admin API route handler with role-based access control
 */
export function createAdminHandler(
  handler: (request: NextRequest, user: AdminUser, payload: any) => Promise<NextResponse>,
  options: AdminMiddlewareOptions = {}
) {
  return async (request: NextRequest) => {
    const authResult = await withAdminAuth(request, options);
    
    if (!authResult.success) {
      return new NextResponse(authResult.error, { 
        status: authResult.status || 401 
      });
    }

    try {
      return await handler(request, authResult.user!, authResult.payload);
    } catch (error) {
      console.error('[ADMIN_HANDLER_ERROR]', error);
      return new NextResponse('Internal server error', { status: 500 });
    }
  };
}

/**
 * Admin access control decorators for different permission levels
 */
export const AdminAccessControl = {
  // Owner only access
  owner: (options: Omit<AdminMiddlewareOptions, 'requireOwner'> = {}) => ({
    ...options,
    requireOwner: true
  }),

  // Admin or owner access
  admin: (options: Omit<AdminMiddlewareOptions, 'requireAdmin'> = {}) => ({
    ...options,
    requireAdmin: true
  }),

  // Specific roles
  roles: (roles: string[], options: Omit<AdminMiddlewareOptions, 'allowedRoles'> = {}) => ({
    ...options,
    allowedRoles: roles
  }),

  // Section-based access
  section: (section: string, options: Omit<AdminMiddlewareOptions, 'section'> = {}) => ({
    ...options,
    section
  }),

  // Permission-based access
  permissions: (permissions: string[], options: Omit<AdminMiddlewareOptions, 'requiredPermissions'> = {}) => ({
    ...options,
    requiredPermissions: permissions
  }),

  // Specific combinations
  usersManagement: () => ({
    requiredPermissions: [PERMISSIONS.USERS_READ],
    section: 'users'
  }),

  contentManagement: () => ({
    requiredPermissions: [PERMISSIONS.CONTENT_READ],
    section: 'content'
  }),

  supportManagement: () => ({
    requiredPermissions: [PERMISSIONS.SUPPORT_READ],
    section: 'support'
  }),

  billingManagement: () => ({
    requiredPermissions: [PERMISSIONS.BILLING_READ],
    section: 'billing'
  }),

  analyticsAccess: () => ({
    requiredPermissions: [
      PERMISSIONS.ANALYTICS_CONTENT,
      PERMISSIONS.ANALYTICS_USERS,
      PERMISSIONS.ANALYTICS_REVENUE,
      PERMISSIONS.ANALYTICS_SUPPORT
    ],
    section: 'analytics'
  }),

  systemManagement: () => ({
    allowedRoles: ['owner', 'admin'],
    section: 'system'
  }),

  teamManagement: () => ({
    requiredPermissions: [PERMISSIONS.TEAM_READ],
    section: 'team'
  }),

  settingsManagement: () => ({
    requiredPermissions: [PERMISSIONS.SETTINGS_READ],
    section: 'settings'
  })
};

/**
 * Helper function to check if current user can perform specific actions
 */
export function canPerformAdminAction(
  user: AdminUser, 
  action: string, 
  resource?: string
): boolean {
  // Owner can do everything
  if (user.role === 'owner') {
    return true;
  }

  // Map actions to permissions
  const actionPermissions: { [key: string]: string } = {
    'read_users': PERMISSIONS.USERS_READ,
    'write_users': PERMISSIONS.USERS_WRITE,
    'delete_users': PERMISSIONS.USERS_DELETE,
    'manage_billing': PERMISSIONS.BILLING_WRITE,
    'read_analytics': PERMISSIONS.ANALYTICS_CONTENT,
    'manage_support': PERMISSIONS.SUPPORT_WRITE,
    'manage_content': PERMISSIONS.CONTENT_WRITE,
    'manage_settings': PERMISSIONS.SETTINGS_WRITE,
    'manage_team': PERMISSIONS.TEAM_MANAGE,
    'invite_team': PERMISSIONS.TEAM_INVITE
  };

  const resourceActions: { [key: string]: string } = {
    'users:read': PERMISSIONS.USERS_READ,
    'users:write': PERMISSIONS.USERS_WRITE,
    'users:delete': PERMISSIONS.USERS_DELETE,
    'billing:read': PERMISSIONS.BILLING_READ,
    'billing:write': PERMISSIONS.BILLING_WRITE,
    'support:read': PERMISSIONS.SUPPORT_READ,
    'support:write': PERMISSIONS.SUPPORT_WRITE,
    'content:read': PERMISSIONS.CONTENT_READ,
    'content:write': PERMISSIONS.CONTENT_WRITE,
    'analytics:read': PERMISSIONS.ANALYTICS_CONTENT,
    'settings:read': PERMISSIONS.SETTINGS_READ,
    'settings:write': PERMISSIONS.SETTINGS_WRITE,
    'team:read': PERMISSIONS.TEAM_READ,
    'team:write': PERMISSIONS.TEAM_MANAGE,
    'team:invite': PERMISSIONS.TEAM_INVITE
  };

  // Check resource-specific action
  if (resource) {
    const actionKey = `${resource}:${action}`;
    const requiredPermission = resourceActions[actionKey];
    if (requiredPermission) {
      return hasPermission(user, requiredPermission);
    }
  }

  // Check general action
  const requiredPermission = actionPermissions[action];
  if (requiredPermission) {
    return hasPermission(user, requiredPermission);
  }

  // Default to false for unknown actions
  return false;
}

/**
 * Get role-based navigation items for admin panel
 */
export function getAdminNavigation(user: AdminUser) {
  const baseNavigation = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: 'BarChart3',
      section: 'dashboard',
      description: 'Overview and key metrics'
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: 'Activity',
      section: 'analytics',
      description: 'Platform analytics and insights'
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: 'Users',
      section: 'users',
      description: 'User management and profiles'
    },
    {
      name: 'Content',
      href: '/admin/content',
      icon: 'FileText',
      section: 'content',
      description: 'Content management and moderation'
    },
    {
      name: 'Support',
      href: '/admin/support',
      icon: 'MessageSquare',
      section: 'support',
      description: 'Support tickets and help desk'
    },
    {
      name: 'Billing',
      href: '/admin/billing',
      icon: 'CreditCard',
      section: 'billing',
      description: 'Billing and subscription management'
    },
    {
      name: 'Company Members',
      href: '/admin/team',
      icon: 'UserPlus',
      section: 'team',
      description: 'Internal team management',
      adminOnly: true
    },
    {
      name: 'Admin Credentials',
      href: '/admin/credentials',
      icon: 'Key',
      section: 'credentials',
      description: 'Admin access credentials',
      ownerOnly: true
    },
    {
      name: 'System',
      href: '/admin/system',
      icon: 'Database',
      section: 'system',
      description: 'System management and maintenance',
      adminOnly: true
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: 'Settings',
      section: 'settings',
      description: 'Platform settings and configuration'
    }
  ];

  return baseNavigation.filter(item => {
    // Owner can see everything
    if (user.role === 'owner') {
      return true;
    }

    // Filter owner-only items
    if (item.ownerOnly) {
      return false;
    }

    // Filter admin-only items for non-admin users
    if (item.adminOnly && !['owner', 'admin'].includes(user.role)) {
      return false;
    }

    // Check section access
    return canAccessSection(user, item.section);
  });
}

/**
 * Format user role for display
 */
export function formatAdminRole(role: string): {
  name: string;
  color: string;
  bgColor: string;
  description: string;
} {
  const roleMap: { [key: string]: any } = {
    owner: {
      name: 'Owner',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: 'Full system access and control'
    },
    admin: {
      name: 'Administrator',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Administrative privileges'
    },
    support: {
      name: 'Support Manager',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Support and help desk management'
    },
    marketing: {
      name: 'Marketing Manager',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Content and marketing management'
    },
    finance: {
      name: 'Finance Manager',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'Billing and financial management'
    },
    content_developer: {
      name: 'Content Developer',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      description: 'Content creation and development'
    }
  };

  return roleMap[role] || {
    name: 'User',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: 'Standard user access'
  };
} 