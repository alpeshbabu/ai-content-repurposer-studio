# Tier-Specific API Guide

## Overview

The AI Content Repurposing Studio now implements separate, tier-specific APIs to ensure proper functionality and prevent any mixups between subscription tiers. Each tier has its own dedicated endpoint with specific features, limits, and AI models.

## Architecture

### Tier Endpoints

- **Free Tier**: `/api/tiers/free/repurpose`
- **Basic Tier**: `/api/tiers/basic/repurpose`
- **Pro Tier**: `/api/tiers/pro/repurpose`
- **Agency Tier**: `/api/tiers/agency/repurpose`
- **Router**: `/api/tiers` (automatically routes to correct tier)

### Tier Features Matrix

| Feature | Free | Basic | Pro | Agency |
|---------|------|-------|-----|--------|
| Monthly Limit | 5 | 60 | 150 | 450 |
| Daily Limit | Unlimited | 2 | 5 | Unlimited |
| Platforms | Twitter, Instagram | + Facebook | + LinkedIn, Thread, TikTok, YouTube, Email, Newsletter | + Thread, Email, Newsletter, YouTube, TikTok |
| AI Model | Basic (Llama) | Standard (Claude Haiku) | Advanced (Claude Sonnet) | Premium (Claude Opus) |
| Analytics | ❌ | ✅ | ✅ Professional | ✅ Team Analytics |
| Custom Templates | ❌ | ❌ | ✅ | ✅ |
| Team Collaboration | ❌ | ❌ | ❌ | ✅ (3 members) |
| Priority Support | ❌ | ❌ | ✅ | ✅ |
| Scheduling | ❌ | ✅ | ✅ Advanced | ✅ Advanced |
| Bulk Operations | ❌ | ❌ | ✅ | ✅ |
| Custom Branding | ❌ | ❌ | ❌ | ✅ |
| Overage Rate | $0.12 | $0.10 | $0.08 | $0.06 |

## Usage

### 1. Using the Tier Router (Recommended)

The simplest way to use the tier system is through the main router endpoint:

```typescript
import { tierClient } from '@/lib/tier-client';

// Automatically routes to the user's current tier
const response = await tierClient.repurposeContent({
  title: "My Content",
  content: "Content to repurpose...",
  contentType: "article",
  platforms: ["twitter", "instagram"],
  brandVoice: "professional",
  tone: "friendly"
});
```

### 2. Direct Tier Endpoints

For specific use cases, you can call tier endpoints directly:

```typescript
// Free tier specific request
const freeResponse = await fetch('/api/tiers/free/repurpose', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "Free Tier Content",
    content: "Simple content...",
    contentType: "post",
    platforms: ["twitter", "instagram"], // Only these allowed
    allowOverage: false
  })
});

// Agency tier with advanced features
const agencyResponse = await fetch('/api/tiers/agency/repurpose', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "Agency Content",
    content: "Professional content...",
    contentType: "campaign",
    platforms: ["linkedin", "thread", "email"],
    teamMemberId: "user123",
    clientId: "client456",
    campaignId: "campaign789",
    customBranding: {
      logo: "https://example.com/logo.png",
      colors: ["#FF0000", "#00FF00"]
    }
  })
});
```

### 3. Getting Tier Information

```typescript
// Get current user's tier info
const tierInfo = await tierClient.getTierInfo();
console.log(tierInfo);
// {
//   currentTier: "pro",
//   hasActiveSubscription: true,
//   currentUsage: 45,
//   tierEndpoint: "/api/tiers/pro",
//   tierFeatures: { ... },
//   allTiers: { ... }
// }
```

## Request/Response Formats

### Request Format

Each tier accepts different parameters based on its capabilities:

#### Free Tier
```typescript
{
  title: string;           // Max 100 chars
  content: string;         // Max 2000 chars
  contentType: string;
  platforms: ["twitter", "instagram"]; // Only these 2
  brandVoice?: string;
  tone?: "professional" | "casual" | "friendly";
  allowOverage?: boolean;
}
```

#### Basic Tier
```typescript
{
  title: string;           // Max 150 chars
  content: string;         // Max 5000 chars
  contentType: string;
  platforms: ["twitter", "instagram", "facebook"]; // Max 3
  brandVoice?: string;
  tone?: "professional" | "casual" | "friendly" | "formal";
  allowOverage?: boolean;
  schedule?: {
    publishAt?: string;
    timezone?: string;
  };
}
```

#### Pro Tier
```typescript
{
  title: string;           // Max 200 chars
  content: string;         // Max 10000 chars
  contentType: string;
  platforms: Platform[];   // All platforms: LinkedIn, Thread, TikTok, YouTube, Email, Newsletter
  brandVoice?: string;
  tone?: string;           // More options
  allowOverage?: boolean;
  schedule?: {
    publishAt?: string;
    timezone?: string;
    recurring?: boolean;
  };
  customTemplate?: string;
  targetAudience?: string;
  hashtags?: string[];     // Max 10
  callToAction?: string;
}
```

#### Agency Tier
```typescript
{
  title: string;           // Max 300 chars
  content: string;         // Max 25000 chars
  contentType: string;
  platforms: Platform[];   // All platforms available
  brandVoice?: string;
  tone?: string;           // All options including "expert", "thought-leader"
  allowOverage?: boolean;
  schedule?: {
    publishAt?: string;
    timezone?: string;
    recurring?: boolean;
    recurringPattern?: string;
  };
  customTemplate?: string;
  targetAudience?: string;
  hashtags?: string[];     // Max 20
  callToAction?: string;
  teamMemberId?: string;   // Assign to team member
  clientId?: string;       // Client tracking
  campaignId?: string;     // Campaign tracking
  bulkOperation?: boolean;
  customBranding?: {
    logo?: string;
    colors?: string[];
    fonts?: string[];
  };
}
```

### Response Format

All tiers return a consistent response structure:

```typescript
{
  success: boolean;
  data?: {
    contentId: string;
    repurposedContent: Array<{
      id: string;
      platform: Platform;
      content: string;
      scheduledAt?: string;
      isRecurring?: boolean;
      recurringPattern?: string;
    }>;
    usage: {
      monthly: {
        current: number;
        limit: number;
        remaining: number;
        pooled?: boolean; // Agency tier only
      };
      daily?: {
        current?: number;
        limit?: number;
        remaining?: number;
        resetsAt?: string;
        unlimited?: boolean; // Free/Agency tiers
        message?: string;
      };
    };
    tier: SubscriptionTier;
    overageCharge?: number;
    availableFeatures: Record<string, any>;
    analytics?: { ... };     // Basic+ tiers
    scheduling?: { ... };    // Basic+ tiers
    teamInfo?: { ... };      // Agency tier only
    customBranding?: any;    // Agency tier only
  };
  error?: string;
  message?: string;
  upgradeOptions?: Array<{ ... }>; // When limits reached
}
```

## Error Handling

### Tier Mismatch
If a user tries to access the wrong tier endpoint:

```json
{
  "error": "Tier mismatch",
  "message": "This endpoint is for Pro tier users only. Your plan: basic",
  "correctEndpoint": "/api/tiers/basic/repurpose"
}
```

### Platform Restrictions
If unsupported platforms are requested:

```json
{
  "error": "Platform not available",
  "message": "Basic tier supports: twitter, instagram, facebook",
  "invalidPlatforms": ["linkedin"],
  "availablePlatforms": ["twitter", "instagram", "facebook"],
  "upgradeMessage": "Upgrade to Pro for LinkedIn and more platforms"
}
```

### Usage Limits
When limits are reached:

```json
{
  "error": "Monthly limit reached",
  "message": "Basic tier allows 60 repurposes per month",
  "currentUsage": 60,
  "limit": 60,
  "overageRate": 0.10,
  "upgradeOptions": [
    {
      "plan": "pro",
      "monthlyLimit": 150,
      "price": 14.99
    }
  ]
}
```

## Security Features

### Tier Enforcement
- Each endpoint validates the user's subscription plan
- Strict tier restrictions prevent unauthorized access
- Active subscription validation for paid tiers

### Usage Tracking
- Monthly usage tracked per user
- Daily usage tracked for Basic/Pro tiers
- Team usage pooled for Agency tier
- Overage charges recorded with tier information

### Team Management (Agency)
- Team member validation
- Role-based access control
- Activity logging
- Client/campaign attribution

## Client-Side Integration

### React Hook Example

```typescript
import { useState, useEffect } from 'react';
import { tierClient, TierInfo, RepurposeRequest } from '@/lib/tier-client';

export function useRepurpose() {
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    tierClient.getTierInfo().then(setTierInfo);
  }, []);

  const repurpose = async (request: RepurposeRequest) => {
    setLoading(true);
    try {
      const response = await tierClient.repurposeContent(request);
      return response;
    } finally {
      setLoading(false);
    }
  };

  return { tierInfo, repurpose, loading };
}
```

### Platform Selection Component

```typescript
import { TierClient } from '@/lib/tier-client';

function PlatformSelector({ currentTier, onSelect }) {
  const availablePlatforms = TierClient.getAvailablePlatforms(currentTier);
  
  return (
    <div>
      {availablePlatforms.map(platform => (
        <button key={platform} onClick={() => onSelect(platform)}>
          {platform}
        </button>
      ))}
    </div>
  );
}
```

## Testing

### Unit Tests
Each tier endpoint has comprehensive test coverage:

```bash
npm test -- --grep "tier-specific"
```

### Integration Tests
Test tier routing and feature enforcement:

```bash
npm test -- --grep "tier-integration"
```

### Load Testing
Validate tier limits under load:

```bash
npm run test:load
```

## Migration Guide

### From Legacy API
If you're currently using the generic `/api/repurpose` endpoint:

1. **Update imports**:
   ```typescript
   // Old
   import { repurposeContent } from '@/lib/api';
   
   // New
   import { tierClient } from '@/lib/tier-client';
   ```

2. **Update API calls**:
   ```typescript
   // Old
   const response = await repurposeContent(data);
   
   // New
   const response = await tierClient.repurposeContent(data);
   ```

3. **Handle new response format**:
   ```typescript
   // Check for tier-specific features
   if (response.data?.analytics?.enabled) {
     // Handle analytics
   }
   
   if (response.data?.teamInfo) {
     // Handle team features
   }
   ```

### Database Migration
Ensure your database schema includes tier tracking:

```sql
-- Add tier column to content tables
ALTER TABLE "Content" ADD COLUMN "tier" VARCHAR(20);
ALTER TABLE "RepurposedContent" ADD COLUMN "tier" VARCHAR(20);

-- Add team and client tracking for Agency tier
ALTER TABLE "Content" ADD COLUMN "teamId" VARCHAR(50);
ALTER TABLE "Content" ADD COLUMN "clientId" VARCHAR(50);
ALTER TABLE "Content" ADD COLUMN "campaignId" VARCHAR(50);
```

## Best Practices

### 1. Always Use the Router
Use `/api/tiers` instead of direct tier endpoints unless you have a specific reason.

### 2. Handle Tier Limitations Gracefully
```typescript
const response = await tierClient.repurposeContent(request);

if (!response.success && response.upgradeOptions) {
  // Show upgrade modal
  showUpgradeModal(response.upgradeOptions);
}
```

### 3. Validate Platforms Client-Side
```typescript
const availablePlatforms = TierClient.getAvailablePlatforms(userTier);
const selectedPlatforms = platforms.filter(p => availablePlatforms.includes(p));
```

### 4. Monitor Usage
```typescript
const tierInfo = await tierClient.getTierInfo();
const usagePercentage = (tierInfo.currentUsage / tierInfo.tierFeatures.monthlyLimit) * 100;

if (usagePercentage > 80) {
  // Warn user about approaching limit
}
```

### 5. Implement Proper Error Handling
```typescript
try {
  const response = await tierClient.repurposeContent(request);
  if (!response.success) {
    handleTierError(response);
  }
} catch (error) {
  handleNetworkError(error);
}
```

## Monitoring and Analytics

### Tier Usage Metrics
- Track usage per tier
- Monitor upgrade conversion rates
- Analyze feature adoption by tier

### Performance Monitoring
- Response times per tier
- AI model performance by tier
- Error rates by tier

### Business Intelligence
- Revenue per tier
- Customer lifetime value by tier
- Churn analysis by tier

## Support and Troubleshooting

### Common Issues

1. **"Tier mismatch" errors**: User is calling wrong endpoint
2. **Platform restrictions**: User trying to access unavailable platforms
3. **Usage limits**: User has exceeded tier limits
4. **Subscription status**: Paid tier without active subscription

### Debug Mode
Enable debug logging for tier operations:

```typescript
// Set environment variable
DEBUG_TIERS=true

// Check logs for tier routing decisions
console.log('[TIER_DEBUG]', { userTier, endpoint, features });
```

### Health Checks
Monitor tier endpoint health:

```bash
curl /api/tiers/free/health
curl /api/tiers/basic/health
curl /api/tiers/pro/health
curl /api/tiers/agency/health
```

## Conclusion

The tier-specific API system ensures that each subscription tier receives exactly the features and limits specified in the requirements. This prevents any mixups and provides a clear upgrade path for users as their needs grow.

For questions or issues, please refer to the main documentation or contact the development team. 