# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Development
npm run dev          # Start development server with Turbopack on http://localhost:3000

# Build & Production
npm run build        # Create production build
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint to check code quality

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema changes to database
npx prisma studio    # Open Prisma Studio GUI
```

## High-Level Architecture

### Multi-Tier SaaS Application Structure

This is a subscription-based AI content repurposing platform with three tiers:
- **Free**: 5 repurposes/month
- **Pro**: 60 repurposes/month + team features
- **Agency**: 450 repurposes/month + advanced features

### Authentication System

The app uses a dual authentication system:
1. **User Authentication**: NextAuth with Google OAuth for customers
2. **Admin Authentication**: Separate credential-based system for internal team

Key authentication patterns:
- Session validation in API routes: `await getServerSession(authOptions)`
- Role-based access control (RBAC) for admin roles
- Middleware protection for admin routes

### API Architecture

All API endpoints follow RESTful patterns under `/api`:
- User-facing APIs use session authentication
- Admin APIs require both session and admin credential validation
- Rate limiting is implemented on sensitive endpoints
- All endpoints validate request data before processing

### State Management & Data Flow

1. **Client State**: Zustand for global state (user preferences, UI state)
2. **Server State**: Prisma ORM with PostgreSQL
3. **AI Integration**: Anthropic Claude for content generation
4. **Payment Processing**: Stripe for subscriptions and invoices

### Key Architectural Decisions

1. **Separate Admin System**: Admin functionality is completely isolated with its own authentication, preventing privilege escalation
2. **Usage Tracking**: Daily usage is tracked and aggregated for billing
3. **Team Management**: Teams have member limits based on subscription tier
4. **Support System**: Built-in ticketing system for customer support

### Security Considerations

- All API routes validate authentication before processing
- Admin actions require additional credential verification
- Rate limiting on public endpoints
- Security headers configured in middleware
- Sensitive operations logged for audit trails

### Database Schema Overview

The database uses these core relationships:
- `User` → `Team` (one-to-many for team ownership)
- `User` → `Content` → `RepurposedContent` (content ownership)
- `User` → `Subscription` → `Invoice` (billing relationships)
- `User` → `SupportTicket` → `TicketReply` (support system)

### Environment Configuration

Required environment variables:
```
DATABASE_URL          # PostgreSQL connection string
GOOGLE_CLIENT_ID      # Google OAuth client ID
GOOGLE_CLIENT_SECRET  # Google OAuth client secret
NEXTAUTH_URL          # Application URL
NEXTAUTH_SECRET       # Random secret for session encryption
ANTHROPIC_API_KEY     # Claude API key
STRIPE_SECRET_KEY     # Stripe secret key
STRIPE_WEBHOOK_SECRET # Stripe webhook secret
EMAIL_FROM            # Sender email address
RESEND_API_KEY        # Resend API key (if using Resend)
```