# Role Management Guide for AI Content Repurposer Studio

## Overview

As an **Owner**, you have complete control over role permissions and access management in your AI Content Repurposer Studio admin panel. This guide explains how to manage roles, permissions, and user access.

## 🔑 Access Requirements

- **Owner Role Required**: Only users with the "Owner" role can modify role permissions
- **Location**: Admin Panel → Settings → Role Management
- **URL**: `/admin/settings/roles`

## 📋 Available Roles

### 1. Owner
- **Status**: Protected (cannot be modified)
- **Access Level**: Complete system control
- **Permissions**: All permissions (`all`)
- **Use Case**: Platform owners, founders
- **Restrictions**: Cannot be edited or removed

### 2. Administrator
- **Access Level**: Broad administrative access
- **Permissions**: User management, content, analytics, support, settings, team
- **Use Case**: Senior administrators, CTO/CTOs
- **Can Access**: Most admin features except owner-only settings

### 3. Support Manager
- **Access Level**: Support-focused permissions
- **Permissions**: Support tickets, user assistance, support analytics
- **Use Case**: Customer support managers, head of support
- **Can Access**: Support dashboard, user inquiries, ticket management

### 4. Marketing Manager
- **Access Level**: Content and marketing management
- **Permissions**: Content management, analytics, marketing campaigns
- **Use Case**: Marketing team leads, content strategy managers
- **Can Access**: Content creation, user analytics, marketing tools

### 5. Finance Manager
- **Access Level**: Billing and financial management
- **Permissions**: Billing access, revenue analytics, financial reports
- **Use Case**: CFO, finance team members, billing managers
- **Can Access**: Payment settings, revenue data, subscription management

### 6. Content Developer
- **Access Level**: Content creation and development
- **Permissions**: Content creation, editing, content analytics
- **Use Case**: Content creators, writers, developers
- **Can Access**: Content management, basic analytics

## 🔧 Managing Role Permissions

### Step 1: Access Role Management
1. Navigate to **Admin Panel** → **Settings** → **Role Management**
2. Ensure you're logged in as an **Owner**

### Step 2: Select Role to Edit
1. From the **Roles** list on the left, select any role except "Owner"
2. Click the **Edit** button (pencil icon) next to the role

### Step 3: Modify Permissions
1. **Permission Categories** are organized into logical groups:
   - **User Management**: View, edit, delete users, billing access
   - **Content Management**: View, create, edit, delete, moderate content
   - **Analytics**: Content, user, revenue, support analytics
   - **Support**: View, create, assign support tickets
   - **Billing**: View and manage billing information
   - **System**: View and modify system settings
   - **Team**: View, invite, manage team members
   - **Special**: Full access permissions

2. **Toggle Individual Permissions**: Click checkboxes for specific permissions
3. **Bulk Actions**: Use "Select All" or "Deselect All" for entire categories
4. **Preview Changes**: See permission count in real-time

### Step 4: Save Changes
1. Click **Save Changes** button
2. Confirm the update
3. Changes take effect immediately for all users with that role

## 👥 Managing User Roles

### Assign Roles to Team Members
1. Go to **Admin Panel** → **Team Management**
2. Click **Edit** next to any team member
3. Select the appropriate role from the dropdown
4. Save changes

### Role Assignment Rules
- **Cannot modify your own role**
- **Cannot remove the last owner** (system protection)
- **Role changes are logged** for security auditing
- **Immediate effect**: Changes apply instantly

## 🔐 Permission Categories Explained

### User Management Permissions
- `users:read` - View user profiles and account information
- `users:write` - Create and edit user accounts
- `users:delete` - Delete user accounts and data
- `users:billing` - Access user billing and subscription details

### Content Management Permissions
- `content:read` - View content and posts
- `content:write` - Create and edit content
- `content:delete` - Delete content and posts
- `content:moderate` - Moderate and review content

### Analytics Permissions
- `analytics:content` - View content analytics and metrics
- `analytics:users` - View user analytics and behavior data
- `analytics:revenue` - Access revenue and financial analytics
- `analytics:support` - View support metrics and ticket analytics

### Support Permissions
- `support:read` - View support tickets and messages
- `support:write` - Create and respond to support tickets
- `support:assign` - Assign tickets to team members

### Billing Permissions
- `billing:read` - View billing information and invoices
- `billing:write` - Manage billing and payment settings

### System Permissions
- `settings:read` - View system settings and configuration
- `settings:write` - Modify system settings and configuration

### Team Permissions
- `team:read` - View team members and organization
- `team:invite` - Invite new team members
- `team:manage` - Manage team members and roles

### Special Permissions
- `all` - Full system access (Owner only)

## 🛡️ Security Best Practices

### 1. Principle of Least Privilege
- **Grant minimum permissions** needed for each role
- **Regularly review** and audit role permissions
- **Remove unnecessary access** periodically

### 2. Role Segregation
- **Separate concerns**: Don't mix unrelated permissions
- **Specialized roles**: Create focused roles for specific functions
- **Avoid role creep**: Prevent gradual permission accumulation

### 3. Owner Account Management
- **Limit owner accounts**: Only assign to absolute necessary personnel
- **Protect owner credentials**: Use strong passwords and 2FA
- **Monitor owner activity**: Regular audit of owner-level changes

### 4. Change Management
- **Document changes**: Keep records of permission modifications
- **Notify stakeholders**: Inform relevant team members of role changes
- **Test access**: Verify permissions work as expected

## 📊 Monitoring and Auditing

### Access Logs
- All role changes are automatically logged
- View in **System Logs** with timestamps and user information
- Track who made changes and when

### Permission Verification
- Test role permissions in a safe environment
- Have users verify their access after changes
- Monitor for any access issues or complaints

### Regular Reviews
- **Monthly**: Review active roles and permissions
- **Quarterly**: Audit user role assignments
- **Annually**: Comprehensive permission structure review

## 🚨 Emergency Procedures

### Lost Owner Access
If you lose owner access:
1. Contact technical support immediately
2. Provide proof of ownership/identity
3. Request emergency owner access restoration

### Compromised Permissions
If you suspect unauthorized permission changes:
1. **Immediately audit** all roles and permissions
2. **Review system logs** for unauthorized changes
3. **Reset permissions** to known good state
4. **Change admin passwords** for all affected accounts

### Role Recovery
To restore default role permissions:
1. Go to **Role Management**
2. Select the affected role
3. **Reset to defaults** or manually reconfigure
4. **Save changes** and verify access

## 📞 Support and Assistance

### Getting Help
- **Documentation**: This guide and ADMIN_RBAC_GUIDE.md
- **Support Tickets**: Create tickets for permission issues
- **Contact**: Reach out for complex permission setups

### Best Practice Consultation
- **Role structure design**: Get advice on optimal role setups
- **Permission mapping**: Help mapping business needs to permissions
- **Security review**: Professional review of your permission structure

---

## Quick Reference Commands

```bash
# View current role configuration
Navigate to: /admin/settings/roles

# Edit role permissions
1. Select role from list
2. Click Edit button
3. Toggle permissions
4. Save changes

# Assign role to user
Navigate to: /admin/team
1. Click Edit on user
2. Select new role
3. Save changes

# View permission descriptions
Hover over permission names for detailed descriptions
```

## Sample Role Configurations

### Minimal Support Role
```
Permissions:
- support:read
- support:write
- users:read (for user context)
```

### Content Marketing Role
```
Permissions:
- content:read
- content:write
- content:moderate
- analytics:content
- analytics:users
```

### Finance Analytics Role
```
Permissions:
- billing:read
- billing:write
- analytics:revenue
- users:billing
- users:read
```

---

*This guide is designed to help you effectively manage roles and permissions in your AI Content Repurposer Studio. For additional support, please contact your system administrator or technical support team.* 