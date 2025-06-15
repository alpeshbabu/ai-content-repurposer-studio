# Admin Panel Documentation

## Overview

The AI Content Repurposer Studio includes a separate, secure admin panel for platform management. This admin panel is completely independent from the main user dashboard and provides comprehensive tools for managing users, monitoring system health, and overseeing platform operations.

## Features

### 🔐 Secure Authentication
- Separate login system with JWT tokens
- Environment-configurable credentials
- Session management with automatic logout
- Security logging and monitoring

### 📊 Dashboard Overview
- Platform statistics and KPIs
- User subscription breakdown
- System health monitoring
- Recent activity tracking
- Quick action buttons

### 👥 User Management
- View all registered users
- Search and filter capabilities
- User subscription management
- Usage tracking and analytics
- User role management

### 🎯 Planned Features
- Support ticket management
- Content moderation tools
- Analytics and reporting
- Billing and subscription management
- System settings and configuration

## Setup Instructions

### 1. Environment Variables

Add these variables to your `.env.local` file:

```bash
# Admin Panel Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password-here
ADMIN_JWT_SECRET=your-jwt-secret-key-here-change-in-production
```

### 2. Security Considerations

**IMPORTANT**: Change the default credentials before deploying to production!

- Use a strong, unique password for the admin account
- Generate a cryptographically secure JWT secret
- Consider implementing 2FA for additional security
- Regularly rotate credentials
- Monitor access logs

### 3. Access the Admin Panel

1. Navigate to `/admin` in your browser
2. Enter your admin credentials
3. You'll be redirected to the admin dashboard

## Usage Guide

### Login
- Go to `https://yourdomain.com/admin`
- Enter your configured admin username and password
- Click "Sign In"

### Dashboard Navigation
The admin panel includes a sidebar with the following sections:

- **Dashboard**: Overview of platform statistics
- **Users**: User management and analytics
- **Support**: Customer support ticket management (planned)
- **Content**: Content moderation tools (planned)
- **Analytics**: Advanced platform analytics (planned)
- **Billing**: Subscription and billing management (planned)
- **System**: System health and configuration (planned)
- **Settings**: Admin panel settings (planned)

### User Management
From the Users section, you can:
- View all registered users
- Search users by name or email
- Filter users by subscription plan
- Edit user subscription plans
- Monitor user usage statistics
- View user registration dates

## API Endpoints

### Authentication
- `POST /api/admin/auth/login` - Admin login

### Dashboard
- `GET /api/admin/dashboard/stats` - Get platform statistics

### User Management
- `GET /api/admin/users` - List users with pagination and filtering
- `PATCH /api/admin/users/[id]` - Update user details (planned)
- `DELETE /api/admin/users/[id]` - Delete user (planned)

## Security Features

### Authentication
- JWT-based authentication with configurable expiration
- Secure token storage in localStorage
- Automatic logout on token expiration
- Failed login attempt logging

### Authorization
- Admin-only access to all panel features
- Token validation on all API requests
- Role-based permissions (extensible)

### Monitoring
- All admin actions are logged
- Failed login attempts are tracked
- Session management with activity tracking

## Development

### Adding New Features
1. Create the page component in `src/app/admin/[feature]/page.tsx`
2. Add API endpoints in `src/app/api/admin/[feature]/`
3. Update the navigation in `src/app/admin/layout.tsx`
4. Ensure proper authentication validation

### Authentication Flow
1. User enters credentials on `/admin`
2. Credentials validated against environment variables
3. JWT token generated and returned
4. Token stored in localStorage
5. Token included in Authorization header for API requests
6. Token validated on each protected route

## Production Deployment

### Security Checklist
- [ ] Change default admin credentials
- [ ] Use strong, unique passwords
- [ ] Generate secure JWT secret
- [ ] Enable HTTPS
- [ ] Configure proper CORS policies
- [ ] Set up access logging
- [ ] Regular security audits

### Environment Setup
```bash
# Production environment variables
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-very-secure-password
ADMIN_JWT_SECRET=your-cryptographically-secure-jwt-secret-256-bit
```

### Recommended Security Measures
1. Use environment-specific credentials
2. Implement rate limiting on login endpoint
3. Add IP whitelisting for admin access
4. Set up monitoring and alerting
5. Regular password rotation
6. Consider implementing 2FA

## Troubleshooting

### Login Issues
- Verify environment variables are set correctly
- Check browser console for error messages
- Ensure credentials match environment configuration
- Clear localStorage if experiencing session issues

### API Errors
- Check server logs for detailed error messages
- Verify JWT token is valid and not expired
- Ensure proper Authorization headers are sent
- Check database connectivity

### Access Issues
- Verify admin credentials in environment variables
- Check that JWT secret matches between login and validation
- Ensure localStorage is enabled in browser
- Check for JavaScript errors in browser console

## Support

For technical support or questions about the admin panel:
1. Check this documentation
2. Review server logs for error details
3. Verify environment configuration
4. Check browser console for client-side errors

## Future Enhancements

Planned features for future releases:
- Two-factor authentication
- Advanced user analytics
- Automated backup management
- Custom dashboard widgets
- API rate limiting controls
- Advanced logging and audit trails
- Integration with external monitoring tools 