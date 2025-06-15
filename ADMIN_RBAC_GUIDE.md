# Admin Panel Role-Based Access Control (RBAC) Guide

This guide explains how to use the comprehensive role-based access control system implemented for the admin panel.

## Overview

The RBAC system provides fine-grained access control for admin panel features based on user roles and permissions. It includes both backend API protection and frontend UI access control.

## System Components

### 1. Core RBAC Library (`src/lib/rbac.ts`)
- Defines roles, permissions, and access control functions
- Provides utilities for checking user permissions
- Includes section-based access control

### 2. Admin Middleware (`src/lib/admin-middleware.ts`)
- Server-side middleware for API route protection
- Role-based access control decorators
- Helper functions for admin actions

### 3. React Components (`src/components/admin/AdminAccessControl.tsx`)
- Frontend access control components
- Admin context provider
- UI components for role management

## Available Roles

### Owner
- **Full system access** - all permissions included
- Cannot be modified or restricted
- Has access to all admin features

### Administrator
- **Broad administrative access** across most features
- Cannot access owner-only settings
- Can manage users, content, support, analytics, and settings

### Support Manager
- **Support-focused permissions**
- Access to support tickets and user inquiries
- Can view user analytics and support metrics

### Marketing Manager
- **Content and marketing management**
- Content creation, editing, and moderation
- Access to content and user analytics

### Finance Manager
- **Billing and financial management**
- Access to billing information and revenue analytics
- Can manage user billing and subscriptions

### Content Developer
- **Content creation and development**
- Basic content management permissions
- Limited to content-related features

## Permission Categories

### User Management
- `users:read` - View user profiles and account information
- `users:write` - Create and edit user accounts
- `users:delete` - Delete user accounts and data
- `users:billing` - Access user billing and subscription details

### Content Management
- `content:read` - View content and posts
- `content:write` - Create and edit content
- `content:delete` - Delete content and posts
- `content:moderate` - Moderate and review content

### Analytics Access
- `analytics:content` - View content analytics and metrics
- `analytics:users` - View user analytics and behavior data
- `analytics:revenue` - Access revenue and financial analytics
- `analytics:support` - View support metrics and ticket analytics

### Support Management
- `support:read` - View support tickets and messages
- `support:write` - Create and respond to support tickets
- `support:assign` - Assign tickets to team members

### Billing Management
- `billing:read` - View billing information and invoices
- `billing:write` - Manage billing and payment settings

### System Settings
- `settings:read` - View system settings and configuration
- `settings:write` - Modify system settings and configuration

### Team Management
- `team:read` - View team members and organization
- `team:invite` - Invite new team members
- `team:manage` - Manage team members and roles

## Backend Implementation

### Protecting API Routes

Use the `createAdminHandler` function with access control decorators:

```typescript
import { createAdminHandler, AdminAccessControl } from '@/lib/admin-middleware';

// Users management endpoint
export const GET = createAdminHandler(
  async (req: NextRequest, user, payload) => {
    // Your API logic here
    return NextResponse.json({ success: true, data: [] });
  },
  AdminAccessControl.usersManagement()
);

// Owner-only endpoint
export const DELETE = createAdminHandler(
  async (req: NextRequest, user, payload) => {
    // Sensitive operation
    return NextResponse.json({ success: true });
  },
  AdminAccessControl.owner()
);

// Custom permission requirements
export const POST = createAdminHandler(
  async (req: NextRequest, user, payload) => {
    // Custom logic
    return NextResponse.json({ success: true });
  },
  {
    requiredPermissions: [PERMISSIONS.CONTENT_WRITE, PERMISSIONS.CONTENT_MODERATE],
    section: 'content'
  }
);
```

### Available Access Control Decorators

```typescript
// Pre-defined access controls
AdminAccessControl.owner()                    // Owner only
AdminAccessControl.admin()                    // Admin or owner
AdminAccessControl.usersManagement()          // User management permissions
AdminAccessControl.contentManagement()        // Content management permissions
AdminAccessControl.supportManagement()        // Support management permissions
AdminAccessControl.billingManagement()        // Billing management permissions
AdminAccessControl.analyticsAccess()          // Analytics access permissions
AdminAccessControl.systemManagement()         // System management permissions
AdminAccessControl.teamManagement()           // Team management permissions
AdminAccessControl.settingsManagement()       // Settings management permissions

// Custom access controls
AdminAccessControl.roles(['admin', 'support'])                    // Specific roles
AdminAccessControl.permissions([PERMISSIONS.USERS_READ])          // Specific permissions
AdminAccessControl.section('users')                               // Section-based access
```

## Frontend Implementation

### Page-Level Access Control

Wrap entire pages with access control:

```tsx
import { 
  AdminProvider, 
  RequirePermission, 
  AccessDenied 
} from '@/components/admin/AdminAccessControl';
import { PERMISSIONS } from '@/lib/rbac';

export default function AdminUsersPage() {
  return (
    <AdminProvider>
      <RequirePermission 
        permissions={PERMISSIONS.USERS_READ}
        fallback={
          <AccessDenied 
            message="You need user management permissions to access this page."
            requiredRole="Administrator, Support Manager, or higher"
          />
        }
      >
        <UsersPageContent />
      </RequirePermission>
    </AdminProvider>
  );
}
```

### Component-Level Access Control

Control individual UI elements:

```tsx
import { RequireAction, RequireRole, RequireAdmin } from '@/components/admin/AdminAccessControl';

function UserActions({ user }) {
  return (
    <div className="flex space-x-2">
      {/* Always visible */}
      <ViewButton user={user} />
      
      {/* Only for users with edit permissions */}
      <RequireAction 
        action="write" 
        resource="users"
        fallback={<DisabledEditButton />}
      >
        <EditButton user={user} />
      </RequireAction>

      {/* Only for users with delete permissions */}
      <RequireAction 
        action="delete" 
        resource="users"
        fallback={<DisabledDeleteButton />}
      >
        <DeleteButton user={user} />
      </RequireAction>

      {/* Admin-only actions */}
      <RequireAdmin fallback={null}>
        <AdminOnlyButton user={user} />
      </RequireAdmin>

      {/* Owner-only actions */}
      <RequireRole roles="owner" fallback={null}>
        <OwnerOnlyButton user={user} />
      </RequireRole>
    </div>
  );
}
```

### Using the Admin Context

Access user information and permissions:

```tsx
import { useAdmin } from '@/components/admin/AdminAccessControl';

function UserProfile() {
  const { 
    user, 
    canAccess, 
    hasPermission, 
    canPerformAction, 
    isOwner, 
    isAdmin 
  } = useAdmin();

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <RoleBadge />
      
      {canAccess('users') && (
        <Link href="/admin/users">Manage Users</Link>
      )}
      
      {hasPermission(PERMISSIONS.BILLING_READ) && (
        <Link href="/admin/billing">View Billing</Link>
      )}
      
      {canPerformAction('manage_team') && (
        <Link href="/admin/team">Manage Team</Link>
      )}
      
      {isOwner() && (
        <Link href="/admin/settings/roles">Role Management</Link>
      )}
    </div>
  );
}
```

### Access Control Components

#### RequireRole
```tsx
<RequireRole roles={['owner', 'admin']} fallback={<AccessDenied />}>
  <AdminOnlyContent />
</RequireRole>
```

#### RequirePermission
```tsx
<RequirePermission 
  permissions={[PERMISSIONS.USERS_READ, PERMISSIONS.USERS_WRITE]}
  requireAll={false}  // true = all permissions required, false = any permission
  fallback={<NoAccess />}
>
  <UserManagement />
</RequirePermission>
```

#### RequireSection
```tsx
<RequireSection section="billing" fallback={<AccessDenied />}>
  <BillingDashboard />
</RequireSection>
```

#### RequireAction
```tsx
<RequireAction 
  action="write" 
  resource="content"
  fallback={<ReadOnlyView />}
>
  <ContentEditor />
</RequireAction>
```

#### AccessGuard (Combined)
```tsx
<AccessGuard
  roles={['admin', 'support']}
  permissions={PERMISSIONS.SUPPORT_READ}
  section="support"
  requireAdmin={false}
  fallback={<AccessDenied />}
>
  <SupportDashboard />
</AccessGuard>
```

## Role Management

### Viewing Roles
Access the role management page at `/admin/settings/roles` (admin+ required) to:
- View all available roles and their permissions
- Understand permission categories
- See current access level
- Review role descriptions

### Role Assignment
Role assignment is handled in the Company Members section (`/admin/team`) and requires owner-level access.

## Security Considerations

1. **Owner Protection**: The owner role cannot be modified or restricted
2. **Hierarchical Access**: Higher roles include permissions of lower roles where appropriate
3. **Fail-Safe Defaults**: Access is denied by default if no explicit permission is granted
4. **Frontend + Backend**: Both UI and API are protected for comprehensive security
5. **Token Validation**: All admin requests require valid JWT tokens with role information

## Best Practices

1. **Use Specific Permissions**: Prefer specific permissions over broad role checks
2. **Provide Fallbacks**: Always provide meaningful fallback UI for denied access
3. **Test Access Levels**: Test functionality with different role levels
4. **Document Requirements**: Clearly document required permissions for new features
5. **Graceful Degradation**: Disable features rather than hiding them when possible

## Example Implementation

See the updated admin users page (`src/app/admin/users/page.tsx`) for a complete example of:
- Page-level access control
- Component-level permission checks
- Action-based access control
- Graceful fallback handling

## API Endpoints

- `GET /api/admin/settings/roles` - Get role information (admin+ required)
- `GET /api/admin/auth/me` - Get current user with role information
- All admin APIs now use the new middleware system for consistent access control

## Migration Guide

To update existing admin pages:

1. Import the access control components
2. Wrap the page with `AdminProvider`
3. Add appropriate `Require*` components for access control
4. Update API routes to use `createAdminHandler`
5. Test with different role levels

This RBAC system provides a robust foundation for secure, role-based access control throughout the admin panel while maintaining flexibility for future requirements. 