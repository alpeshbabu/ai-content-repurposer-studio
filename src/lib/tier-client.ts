import { Platform } from './ai-service';

// Tier configuration types
export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'agency';

export interface TierFeatures {
  monthlyLimit: number;
  dailyLimit: number | 'unlimited';
  platforms: Platform[];
  aiModel: 'basic' | 'standard' | 'advanced' | 'premium';
  analytics: boolean;
  teamCollaboration: boolean;
  prioritySupport: boolean;
  price: number;
  teamMembers?: number;
}

export interface TierInfo {
  currentTier: SubscriptionTier;
  hasActiveSubscription: boolean;
  currentUsage: number;
  tierEndpoint: string;
  tierFeatures: TierFeatures;
  allTiers: Record<SubscriptionTier, TierFeatures>;
  endpoints: Record<SubscriptionTier, string>;
}

export interface RepurposeRequest {
  title: string;
  content: string;
  contentType: string;
  platforms?: Platform[];
  brandVoice?: string;
  tone?: string;
  allowOverage?: boolean;
  schedule?: {
    publishAt?: string;
    timezone?: string;
    recurring?: boolean;
    recurringPattern?: string;
  };
  customTemplate?: string;
  targetAudience?: string;
  hashtags?: string[];
  callToAction?: string;
  teamMemberId?: string;
  clientId?: string;
  campaignId?: string;
  bulkOperation?: boolean;
  customBranding?: {
    logo?: string;
    colors?: string[];
    fonts?: string[];
  };
}

export interface RepurposeResponse {
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
        pooled?: boolean;
      };
      daily?: {
        current?: number;
        limit?: number;
        remaining?: number;
        resetsAt?: string;
        unlimited?: boolean;
        message?: string;
      };
    };
    tier: SubscriptionTier;
    overageCharge?: number;
    availableFeatures: Record<string, any>;
    analytics?: {
      enabled: boolean;
      trackingId: string;
      professional?: boolean;
      teamAnalytics?: boolean;
    };
    scheduling?: {
      enabled: boolean;
      recurring?: boolean;
      recurringPattern?: string;
      scheduledAt?: string;
    };
    teamInfo?: {
      teamId?: string;
      memberCount?: number;
      maxMembers?: number;
      assignedMember?: string;
      clientId?: string;
      campaignId?: string;
    };
    customBranding?: any;
  };
  error?: string;
  message?: string;
  details?: any;
  tierLimitations?: Record<string, any>;
  upgradeOptions?: Array<{
    plan: SubscriptionTier;
    monthlyLimit?: number;
    dailyLimit?: number | string;
    price: number;
    teamMembers?: number;
  }>;
  routedTo?: string;
}

/**
 * Tier Client - Handles tier-specific API operations
 */
export class TierClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get user's tier information
   */
  async getTierInfo(): Promise<TierInfo> {
    const response = await fetch(`${this.baseUrl}/tiers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get tier information');
    }

    return data.data;
  }

  /**
   * Repurpose content using the user's current tier
   */
  async repurposeContent(request: RepurposeRequest): Promise<RepurposeResponse> {
    const response = await fetch(`${this.baseUrl}/tiers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    return data;
  }

  /**
   * Repurpose content using a specific tier endpoint (for testing or admin use)
   */
  async repurposeContentWithTier(tier: SubscriptionTier, request: RepurposeRequest): Promise<RepurposeResponse> {
    const response = await fetch(`${this.baseUrl}/tiers/${tier}/repurpose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    return data;
  }

  /**
   * Check if a platform is available for the current tier
   */
  static isPlatformAvailable(platform: Platform, tierFeatures: TierFeatures): boolean {
    return tierFeatures.platforms.includes(platform);
  }

  /**
   * Get available platforms for a tier
   */
  static getAvailablePlatforms(tier: SubscriptionTier): Platform[] {
    const tierPlatforms: Record<SubscriptionTier, Platform[]> = {
      free: ['twitter', 'instagram'],
      basic: ['twitter', 'instagram', 'facebook'],
      pro: ['twitter', 'instagram', 'facebook', 'linkedin', 'thread', 'tiktok', 'youtube', 'email', 'newsletter'],
      agency: ['twitter', 'instagram', 'facebook', 'linkedin', 'thread', 'email', 'newsletter', 'youtube', 'tiktok']
    };

    return tierPlatforms[tier] || [];
  }

  /**
   * Check if user needs to upgrade for a feature
   */
  static needsUpgradeForFeature(currentTier: SubscriptionTier, feature: keyof TierFeatures): boolean {
    const tierHierarchy: SubscriptionTier[] = ['free', 'basic', 'pro', 'agency'];
    const featureAvailability: Record<keyof TierFeatures, SubscriptionTier> = {
      monthlyLimit: 'free',
      dailyLimit: 'free',
      platforms: 'free',
      aiModel: 'free',
      analytics: 'basic',
      teamCollaboration: 'agency',
      prioritySupport: 'pro',
      price: 'free',
      teamMembers: 'agency'
    };

    const requiredTier = featureAvailability[feature];
    const currentIndex = tierHierarchy.indexOf(currentTier);
    const requiredIndex = tierHierarchy.indexOf(requiredTier);

    return currentIndex < requiredIndex;
  }

  /**
   * Get upgrade suggestions based on current usage
   */
  static getUpgradeSuggestions(currentTier: SubscriptionTier, usage: number, platforms: Platform[]): {
    suggested: SubscriptionTier | null;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let suggested: SubscriptionTier | null = null;

    // Check usage limits
    if (currentTier === 'free' && usage >= 3) {
      suggested = 'basic';
      reasons.push('Higher monthly limit (60 vs 5)');
      reasons.push('Daily limit structure for consistent usage');
    } else if (currentTier === 'basic' && usage >= 40) {
      suggested = 'pro';
      reasons.push('Higher monthly limit (150 vs 60)');
      reasons.push('More daily repurposes (5 vs 2)');
    } else if (currentTier === 'pro' && usage >= 100) {
      suggested = 'agency';
      reasons.push('Highest monthly limit (450)');
      reasons.push('Unlimited daily usage');
    }

    // Check platform requirements
    const unavailablePlatforms = platforms.filter(p => !this.getAvailablePlatforms(currentTier).includes(p));
    if (unavailablePlatforms.length > 0) {
      if (currentTier === 'free' && unavailablePlatforms.includes('facebook')) {
        suggested = suggested || 'basic';
        reasons.push('Access to Facebook');
      }
      if ((currentTier === 'free' || currentTier === 'basic') && unavailablePlatforms.includes('linkedin')) {
        suggested = suggested || 'pro';
        reasons.push('Access to LinkedIn');
      }
      if (unavailablePlatforms.some(p => ['thread', 'email', 'newsletter', 'youtube', 'tiktok'].includes(p))) {
        suggested = 'agency';
        reasons.push('Access to all platforms');
      }
    }

    return { suggested, reasons };
  }

  /**
   * Format tier limits for display
   */
  static formatTierLimits(tierFeatures: TierFeatures): string {
    const monthly = tierFeatures.monthlyLimit;
    const daily = tierFeatures.dailyLimit === 'unlimited' ? 'unlimited' : tierFeatures.dailyLimit;
    
    return `${monthly}/month, ${daily}/day`;
  }

  /**
   * Get tier comparison data
   */
  static getTierComparison(): Record<SubscriptionTier, TierFeatures> {
    return {
      free: {
        monthlyLimit: 5,
        dailyLimit: 'unlimited',
        platforms: ['twitter', 'instagram'],
        aiModel: 'basic',
        analytics: false,
        teamCollaboration: false,
        prioritySupport: false,
        price: 0
      },
      basic: {
        monthlyLimit: 60,
        dailyLimit: 2,
        platforms: ['twitter', 'instagram', 'facebook'],
        aiModel: 'standard',
        analytics: true,
        teamCollaboration: false,
        prioritySupport: false,
        price: 6.99
      },
      pro: {
        monthlyLimit: 150,
        dailyLimit: 5,
        platforms: ['twitter', 'instagram', 'facebook', 'linkedin', 'thread', 'tiktok', 'youtube', 'email', 'newsletter'],
        aiModel: 'advanced',
        analytics: true,
        teamCollaboration: false,
        prioritySupport: true,
        price: 14.99
      },
      agency: {
        monthlyLimit: 450,
        dailyLimit: 'unlimited',
        platforms: ['twitter', 'instagram', 'facebook', 'linkedin', 'thread', 'email', 'newsletter', 'youtube', 'tiktok'],
        aiModel: 'premium',
        analytics: true,
        teamCollaboration: true,
        prioritySupport: true,
        price: 29.99,
        teamMembers: 3
      }
    };
  }
}

// Export a default instance
export const tierClient = new TierClient(); 