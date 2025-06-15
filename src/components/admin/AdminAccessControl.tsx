'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { canAccessSection, hasPermission, hasAnyPermission } from '@/lib/rbac';
import { canPerformAdminAction, formatAdminRole } from '@/lib/admin-middleware';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  username: string;
  isOwner: boolean;
  isAdmin: boolean;
}

interface AdminContextType {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  canAccess: (section: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  canPerformAction: (action: string, resource?: string) => boolean;
  isOwner: () => boolean;
  isAdmin: () => boolean;
  formatRole: () => ReturnType<typeof formatAdminRole>;
}

const AdminContext = createContext<AdminContextType | null>(null);

interface AdminProviderProps {
  children: React.ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setError('No admin token found');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch user data');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const contextValue: AdminContextType = {
    user,
    loading,
    error,
    canAccess: (section: string) => {
      if (!user) return false;
      return canAccessSection(user, section);
    },
    hasPermission: (permission: string) => {
      if (!user) return false;
      return hasPermission(user, permission);
    },
    hasAnyPermission: (permissions: string[]) => {
      if (!user) return false;
      return hasAnyPermission(user, permissions);
    },
    canPerformAction: (action: string, resource?: string) => {
      if (!user) return false;
      return canPerformAdminAction(user, action, resource);
    },
    isOwner: () => user?.role === 'owner',
    isAdmin: () => ['owner', 'admin'].includes(user?.role || ''),
    formatRole: () => formatAdminRole(user?.role || '')
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
}

// Role-based access control components
interface AccessControlProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface RoleAccessProps extends AccessControlProps {
  roles: string | string[];
}

interface PermissionAccessProps extends AccessControlProps {
  permissions: string | string[];
  requireAll?: boolean;
}

interface SectionAccessProps extends AccessControlProps {
  section: string;
}

interface ActionAccessProps extends AccessControlProps {
  action: string;
  resource?: string;
}

// Component for role-based access
export function RequireRole({ roles, children, fallback = null }: RoleAccessProps) {
  const { user } = useAdmin();
  
  if (!user) return fallback;
  
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const hasAccess = allowedRoles.includes(user.role);
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Component for permission-based access
export function RequirePermission({ 
  permissions, 
  requireAll = false, 
  children, 
  fallback = null 
}: PermissionAccessProps) {
  const { hasPermission: checkPermission, hasAnyPermission } = useAdmin();
  
  const permissionList = Array.isArray(permissions) ? permissions : [permissions];
  
  const hasAccess = requireAll 
    ? permissionList.every(permission => checkPermission(permission))
    : hasAnyPermission(permissionList);
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Component for section-based access
export function RequireSection({ section, children, fallback = null }: SectionAccessProps) {
  const { canAccess } = useAdmin();
  
  const hasAccess = canAccess(section);
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Component for action-based access
export function RequireAction({ 
  action, 
  resource, 
  children, 
  fallback = null 
}: ActionAccessProps) {
  const { canPerformAction } = useAdmin();
  
  const hasAccess = canPerformAction(action, resource);
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Owner-only access component
export function RequireOwner({ children, fallback = null }: AccessControlProps) {
  return (
    <RequireRole roles="owner" fallback={fallback}>
      {children}
    </RequireRole>
  );
}

// Admin-only access component (owner or admin)
export function RequireAdmin({ children, fallback = null }: AccessControlProps) {
  return (
    <RequireRole roles={['owner', 'admin']} fallback={fallback}>
      {children}
    </RequireRole>
  );
}

// Combined access control component
interface AccessGuardProps extends AccessControlProps {
  roles?: string | string[];
  permissions?: string | string[];
  section?: string;
  action?: string;
  resource?: string;
  requireOwner?: boolean;
  requireAdmin?: boolean;
  requireAll?: boolean; // For permissions
}

export function AccessGuard({
  roles,
  permissions,
  section,
  action,
  resource,
  requireOwner = false,
  requireAdmin = false,
  requireAll = false,
  children,
  fallback = null
}: AccessGuardProps) {
  const { 
    user, 
    canAccess, 
    hasPermission: checkPermission, 
    hasAnyPermission, 
    canPerformAction,
    isOwner,
    isAdmin
  } = useAdmin();

  if (!user) return <>{fallback}</>;

  // Owner check
  if (requireOwner && !isOwner()) {
    return <>{fallback}</>;
  }

  // Admin check
  if (requireAdmin && !isAdmin()) {
    return <>{fallback}</>;
  }

  // Role check
  if (roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(user.role)) {
      return <>{fallback}</>;
    }
  }

  // Permission check
  if (permissions) {
    const permissionList = Array.isArray(permissions) ? permissions : [permissions];
    const hasAccess = requireAll 
      ? permissionList.every(permission => checkPermission(permission))
      : hasAnyPermission(permissionList);
    
    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }

  // Section check
  if (section && !canAccess(section)) {
    return <>{fallback}</>;
  }

  // Action check
  if (action && !canPerformAction(action, resource)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Access denied message component
interface AccessDeniedProps {
  message?: string;
  requiredRole?: string;
  className?: string;
}

export function AccessDenied({ 
  message = 'Access denied. You do not have permission to view this content.',
  requiredRole,
  className = ''
}: AccessDeniedProps) {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-6 text-center ${className}`}>
      <div className="text-red-600 text-lg font-medium mb-2">
        Access Denied
      </div>
      <p className="text-red-700 mb-4">{message}</p>
      {requiredRole && (
        <p className="text-sm text-red-600">
          Required access level: <span className="font-medium">{requiredRole}</span>
        </p>
      )}
    </div>
  );
}

// Role badge component
interface RoleBadgeProps {
  role?: string;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
  className?: string;
}

export function RoleBadge({ 
  role, 
  size = 'md', 
  showDescription = false, 
  className = '' 
}: RoleBadgeProps) {
  const { user, formatRole } = useAdmin();
  
  const userRole = role || user?.role || '';
  const roleInfo = formatAdminRole(userRole);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  return (
    <div className={className}>
      <span className={`inline-flex items-center rounded-full font-medium ${roleInfo.bgColor} ${roleInfo.color} ${sizeClasses[size]}`}>
        {roleInfo.name}
      </span>
      {showDescription && (
        <p className="text-sm text-gray-600 mt-1">
          {roleInfo.description}
        </p>
      )}
    </div>
  );
}

// Permission list component
interface PermissionListProps {
  permissions?: string[];
  className?: string;
}

export function PermissionList({ permissions, className = '' }: PermissionListProps) {
  const { user } = useAdmin();
  
  const userPermissions = permissions || user?.permissions || [];
  
  if (userPermissions.length === 0) {
    return (
      <div className={`text-gray-500 ${className}`}>
        No specific permissions assigned
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="text-sm text-gray-700 mb-2">Permissions:</div>
      <div className="flex flex-wrap gap-1">
        {userPermissions.map((permission) => (
          <span
            key={permission}
            className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded"
          >
            {permission.replace(/[:_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        ))}
      </div>
    </div>
  );
}

export default AdminProvider; 