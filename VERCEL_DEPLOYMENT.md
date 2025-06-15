# Vercel Deployment Guide for AI Content Repurposer Studio

## 📋 Overview

This guide walks you through deploying your AI Content Repurposer Studio to Vercel, leveraging their native Next.js support and PostgreSQL database hosting.

## 🎯 Why Vercel?

✅ **Perfect Fit**: Built specifically for Next.js applications  
✅ **Zero Configuration**: Works out of the box with minimal setup  
✅ **Integrated Database**: PostgreSQL with connection pooling  
✅ **Automatic Scaling**: Handles traffic spikes seamlessly  
✅ **Global CDN**: Fast loading worldwide  
✅ **Preview Deployments**: Test changes before production  

## 🚀 Quick Start

### 1. Prerequisites

- GitHub repository with your code
- Vercel account (free to start)
- Environment variables ready

### 2. Connect to Vercel

1. Visit [vercel.com](https://vercel.com) and sign up/sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js and configure settings

## 🗄️ Database Setup

### Step 1: Create Vercel Postgres Database

1. In your Vercel project dashboard:
   - Go to the **Storage** tab
   - Click **Connect Database**
   - Select **Create New** → **Postgres**
   - Choose a database name
   - Select your region

### Step 2: Environment Variables Auto-Configuration

Vercel automatically creates these environment variables:
- `POSTGRES_PRISMA_URL` (with connection pooling)
- `POSTGRES_URL_NON_POOLING` (direct connection)
- `POSTGRES_DATABASE`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_USER`

### Step 3: Run Database Migrations

After your first deployment, run migrations:

```bash
# Install Vercel CLI
npm i -g vercel

# Pull environment variables locally (optional)
vercel env pull .env.local

# Run migrations in production
vercel exec -- npx prisma migrate deploy
```

## 🔧 Environment Variables Configuration

### Required Variables

Navigate to **Project Settings** → **Environment Variables** and add:

#### Authentication & Security
```env
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-super-secret-32-char-key
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
```

#### AI Services
```env
ANTHROPIC_API_KEY=your-anthropic-api-key
```

#### Payment Processing
```env
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-publishable-key
```

#### Email Services
```env
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@your-domain.com
```

#### Application Settings
```env
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### Environment Configuration

**For each variable:**
1. Set the **Environment** to include:
   - ✅ Production (required)
   - ✅ Preview (recommended for testing)
   - ⚠️ Development (only if needed)

## 🚦 Deployment Process

### Automatic Deployment

1. **Push to main branch** → Automatic production deployment
2. **Create pull request** → Automatic preview deployment
3. **Merge PR** → Automatic production update

### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod

# Deploy preview
vercel
```

### Using GitHub Actions (Optional)

The included workflow (`.github/workflows/vercel-deployment.yml`) provides:
- Automated testing before deployment
- Lint checking
- Production and preview deployments
- PR comments with preview URLs

**Setup:**
1. Add these secrets to your GitHub repository:
   - `VERCEL_TOKEN` (from Vercel account settings)
   - `VERCEL_ORG_ID` (from `.vercel/project.json`)
   - `VERCEL_PROJECT_ID` (from `.vercel/project.json`)

## 🎯 Domain Configuration

### Custom Domain Setup

1. Go to **Project Settings** → **Domains**
2. Add your custom domain
3. Configure DNS records as instructed
4. SSL certificates are automatically provisioned

### Domain Examples
- Production: `https://yourapp.com`
- Preview: `https://yourapp-git-feature-username.vercel.app`

## 📊 Monitoring & Performance

### Built-in Analytics

Enable in Project Settings:
- **Vercel Analytics**: Page performance insights
- **Speed Insights**: Core Web Vitals monitoring
- **Function Logs**: API route debugging

### Health Monitoring

Your app includes a health check endpoint:
- **URL**: `https://your-domain.vercel.app/api/health`
- **Alias**: `https://your-domain.vercel.app/healthz`

### Performance Optimizations

The configuration includes:
- Image optimization for avatars and user images
- Static asset caching
- API route optimizations
- Security headers
- Rate limiting

## 🔒 Security Features

### Automatic Security
- **HTTPS Enforcement**: Automatic SSL certificates
- **DDoS Protection**: Edge network protection
- **Environment Variable Encryption**: Secrets encrypted at rest

### Configured Security Headers
```javascript
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: origin-when-cross-origin
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

### Rate Limiting
- Authentication: 10 attempts per 15 minutes
- API routes: 200 requests per minute
- Admin routes: 100 requests per minute

## 🛠️ Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs in Vercel dashboard
# Common fix: Update dependencies
npm update
```

#### Database Connection Issues
```bash
# Verify environment variables are set
vercel env ls

# Test database connection
vercel exec -- npx prisma db push
```

#### Environment Variable Problems
1. Check variable names match exactly
2. Ensure NEXT_PUBLIC_ prefix for client-side variables
3. Redeploy after adding new variables

### Performance Issues
1. Check Function Logs in Vercel dashboard
2. Monitor Analytics for slow pages
3. Use health check endpoint to verify system status

### Database Migration Issues
```bash
# Reset database (development only)
vercel exec -- npx prisma migrate reset

# Deploy specific migration
vercel exec -- npx prisma migrate deploy
```

## 📈 Scaling Considerations

### Free Tier Limits
- 100 GB-hours of compute per month
- 100 GB bandwidth per month
- Unlimited static requests

### Pro Plan Benefits ($20/month)
- Faster builds and deployment
- Advanced analytics
- More compute hours
- Priority support

### Database Scaling
- Vercel Postgres scales automatically
- Connection pooling included
- Monitor usage in dashboard

## 🔄 Maintenance

### Regular Tasks

1. **Monitor Performance**: Check analytics weekly
2. **Review Logs**: Check function logs for errors
3. **Update Dependencies**: Monthly security updates
4. **Database Maintenance**: Monitor connection usage

### Backup Strategy

1. **Database**: Vercel handles automated backups
2. **Environment Variables**: Keep secure copies
3. **Code**: GitHub repository serves as backup

## 📞 Support Resources

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Guide**: [nextjs.org/docs](https://nextjs.org/docs)
- **Prisma with Vercel**: [prisma.io/docs/guides/nextjs](https://prisma.io/docs/guides/nextjs)
- **Support**: Vercel dashboard support chat

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Tests passing locally
- [ ] Database schema up to date
- [ ] Custom domain purchased (if needed)

### Post-Deployment
- [ ] Health check endpoint responding
- [ ] Database migrations completed
- [ ] Authentication working
- [ ] Payment processing functional
- [ ] Email sending operational
- [ ] Custom domain configured
- [ ] Analytics enabled
- [ ] Performance monitoring active

---

## 🎉 Success!

Your AI Content Repurposer Studio is now live on Vercel with:
- Automatic scaling and global distribution
- Integrated PostgreSQL database
- Comprehensive monitoring and analytics
- Enterprise-grade security
- Zero-downtime deployments

**Next Steps:**
1. Test all functionality in production
2. Set up monitoring alerts
3. Configure custom domain
4. Enable analytics and monitoring
5. Plan for scaling as usage grows