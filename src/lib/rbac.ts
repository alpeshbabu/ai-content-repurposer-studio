// Role-Based Access Control (RBAC) utilities

export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  permissions?: string[];
}

// Define all available permissions
export const PERMISSIONS = {
  // User management
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',
  USERS_BILLING: 'users:billing',
  
  // Content management
  CONTENT_READ: 'content:read',
  CONTENT_WRITE: 'content:write',
  CONTENT_DELETE: 'content:delete',
  CONTENT_MODERATE: 'content:moderate',
  
  // Analytics access
  ANALYTICS_CONTENT: 'analytics:content',
  ANALYTICS_USERS: 'analytics:users',
  ANALYTICS_REVENUE: 'analytics:revenue',
  ANALYTICS_SUPPORT: 'analytics:support',
  
  // Support management
  SUPPORT_READ: 'support:read',
  SUPPORT_WRITE: 'support:write',
  SUPPORT_ASSIGN: 'support:assign',
  
  // Billing access
  BILLING_READ: 'billing:read',
  BILLING_WRITE: 'billing:write',
  
  // System settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',
  
  // Team management
  TEAM_READ: 'team:read',
  TEAM_INVITE: 'team:invite',
  TEAM_MANAGE: 'team:manage',
  
  // Special permissions
  ALL: 'all'
} as const;

// Define roles and their permissions
export const ROLES: { [key: string]: UserRole } = {
  owner: {
    id: 'owner',
    name: 'Owner',
    permissions: [PERMISSIONS.ALL]
  },
  admin: {
    id: 'admin',
    name: 'Administrator',
    permissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.USERS_WRITE,
      PERMISSIONS.USERS_DELETE,
      PERMISSIONS.CONTENT_READ,
      PERMISSIONS.CONTENT_WRITE,
      PERMISSIONS.CONTENT_DELETE,
      PERMISSIONS.CONTENT_MODERATE,
      PERMISSIONS.ANALYTICS_CONTENT,
      PERMISSIONS.ANALYTICS_USERS,
      PERMISSIONS.SUPPORT_READ,
      PERMISSIONS.SUPPORT_WRITE,
      PERMISSIONS.SUPPORT_ASSIGN,
      PERMISSIONS.SETTINGS_READ,
      PERMISSIONS.SETTINGS_WRITE,
      PERMISSIONS.TEAM_READ,
      PERMISSIONS.TEAM_INVITE,
      PERMISSIONS.TEAM_MANAGE
    ]
  },
  support: {
    id: 'support',
    name: 'Support Manager',
    permissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.SUPPORT_READ,
      PERMISSIONS.SUPPORT_WRITE,
      PERMISSIONS.SUPPORT_ASSIGN,
      PERMISSIONS.ANALYTICS_SUPPORT,
      PERMISSIONS.TEAM_READ
    ]
  },
  marketing: {
    id: 'marketing',
    name: 'Marketing Manager',
    permissions: [
      PERMISSIONS.CONTENT_READ,
      PERMISSIONS.CONTENT_WRITE,
      PERMISSIONS.CONTENT_MODERATE,
      PERMISSIONS.ANALYTICS_CONTENT,
      PERMISSIONS.ANALYTICS_USERS,
      PERMISSIONS.USERS_READ,
      PERMISSIONS.TEAM_READ
    ]
  },
  finance: {
    id: 'finance',
    name: 'Finance Manager',
    permissions: [
      PERMISSIONS.BILLING_READ,
      PERMISSIONS.BILLING_WRITE,
      PERMISSIONS.ANALYTICS_REVENUE,
      PERMISSIONS.USERS_BILLING,
      PERMISSIONS.USERS_READ,
      PERMISSIONS.TEAM_READ
    ]
  },
  content_developer: {
    id: 'content_developer',
    name: 'Content Developer',
    permissions: [
      PERMISSIONS.CONTENT_READ,
      PERMISSIONS.CONTENT_WRITE,
      PERMISSIONS.TEAM_READ
    ]
  }
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: User, permission: string): boolean {
  if (!user || !user.role) {
    return false;
  }

  // Get user's role permissions
  const role = ROLES[user.role];
  if (!role) {
    return false;
  }

  // Check for 'all' permission (owner)
  if (role.permissions.includes(PERMISSIONS.ALL)) {
    return true;
  }

  // Check for specific permission
  return role.permissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(user: User, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(user: User, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Get all permissions for a user based on their role
 */
export function getUserPermissions(user: User): string[] {
  if (!user || !user.role) {
    return [];
  }

  const role = ROLES[user.role];
  if (!role) {
    return [];
  }

  return role.permissions;
}

/**
 * Check if a user can access a specific admin section
 */
export function canAccessSection(user: User, section: string): boolean {
  switch (section) {
    case 'dashboard':
      return hasAnyPermission(user, [
        PERMISSIONS.ALL,
        PERMISSIONS.ANALYTICS_CONTENT,
        PERMISSIONS.ANALYTICS_USERS,
        PERMISSIONS.ANALYTICS_REVENUE,
        PERMISSIONS.ANALYTICS_SUPPORT
      ]);
      
    case 'users':
      return hasPermission(user, PERMISSIONS.USERS_READ);
      
    case 'subscribers':
      return hasPermission(user, PERMISSIONS.USERS_READ);
      
    case 'content':
      return hasPermission(user, PERMISSIONS.CONTENT_READ);
      
    case 'analytics':
      return hasAnyPermission(user, [
        PERMISSIONS.ANALYTICS_CONTENT,
        PERMISSIONS.ANALYTICS_USERS,
        PERMISSIONS.ANALYTICS_REVENUE,
        PERMISSIONS.ANALYTICS_SUPPORT
      ]);
      
    case 'support':
      return hasPermission(user, PERMISSIONS.SUPPORT_READ);
      
    case 'billing':
      return hasPermission(user, PERMISSIONS.BILLING_READ);
      
    case 'settings':
      return hasPermission(user, PERMISSIONS.SETTINGS_READ);
      
    case 'team':
      return hasPermission(user, PERMISSIONS.TEAM_READ);
      
    case 'credentials':
      return user.role === 'owner' || user.role === 'admin';
      
    default:
      return false;
  }
}

/**
 * Filter admin navigation items based on user permissions
 */
export function getAuthorizedNavItems(user: User) {
  const navItems = [
    { 
      id: 'dashboard', 
      name: 'Dashboard', 
      href: '/admin/dashboard',
      icon: 'BarChart3'
    },
    { 
      id: 'analytics', 
      name: 'Analytics', 
      href: '/admin/analytics',
      icon: 'TrendingUp'
    },
    { 
      id: 'subscribers', 
      name: 'Subscribers', 
      href: '/admin/subscribers',
      icon: 'Users'
    },
    { 
      id: 'content', 
      name: 'Content', 
      href: '/admin/content',
      icon: 'FileText'
    },
    { 
      id: 'support', 
      name: 'Support', 
      href: '/admin/support',
      icon: 'MessageSquare'
    },
    { 
      id: 'billing', 
      name: 'Billing', 
      href: '/admin/billing',
      icon: 'CreditCard'
    },
    { 
      id: 'team', 
      name: 'Company Members', 
      href: '/admin/team',
      icon: 'UserPlus'
    },
    { 
      id: 'settings', 
      name: 'Settings', 
      href: '/admin/settings',
      icon: 'Settings'
    }
  ];

  return navItems.filter(item => canAccessSection(user, item.id));
}

/**
 * Check if a user can perform a specific action
 */
export function canPerformAction(user: User, action: string, resource?: string): boolean {
  const actionKey = resource ? `${resource}:${action}` : action;
  
  // Map common actions to permissions
  const actionPermissionMap: { [key: string]: string } = {
    'read': PERMISSIONS.USERS_READ,
    'write': PERMISSIONS.USERS_WRITE,
    'delete': PERMISSIONS.USERS_DELETE,
    'users:read': PERMISSIONS.USERS_READ,
    'users:write': PERMISSIONS.USERS_WRITE,
    'users:delete': PERMISSIONS.USERS_DELETE,
    'users:billing': PERMISSIONS.USERS_BILLING,
    'content:read': PERMISSIONS.CONTENT_READ,
    'content:write': PERMISSIONS.CONTENT_WRITE,
    'content:delete': PERMISSIONS.CONTENT_DELETE,
    'content:moderate': PERMISSIONS.CONTENT_MODERATE,
    'support:read': PERMISSIONS.SUPPORT_READ,
    'support:write': PERMISSIONS.SUPPORT_WRITE,
    'support:assign': PERMISSIONS.SUPPORT_ASSIGN,
    'billing:read': PERMISSIONS.BILLING_READ,
    'billing:write': PERMISSIONS.BILLING_WRITE,
    'settings:read': PERMISSIONS.SETTINGS_READ,
    'settings:write': PERMISSIONS.SETTINGS_WRITE,
    'team:read': PERMISSIONS.TEAM_READ,
    'team:invite': PERMISSIONS.TEAM_INVITE,
    'team:manage': PERMISSIONS.TEAM_MANAGE
  };

  const requiredPermission = actionPermissionMap[actionKey];
  if (!requiredPermission) {
    return false;
  }

  return hasPermission(user, requiredPermission);
}

/**
 * Get role information by role ID
 */
export function getRoleInfo(roleId: string): UserRole | null {
  return ROLES[roleId] || null;
} 