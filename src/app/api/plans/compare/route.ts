import { NextResponse } from 'next/server';
import { PLAN_DETAILS } from '@/lib/stripe';

export async function GET() {
  try {
    const plans = Object.entries(PLAN_DETAILS).map(([key, plan]) => ({
      id: key,
      name: plan.name,
      price: plan.price,
      priceId: plan.priceId,
      features: plan.features,
      limits: plan.limits,
      // Enhanced feature breakdown for comparison
      featureMatrix: {
        monthlyLimit: plan.limits.monthlyLimit,
        dailyLimit: plan.limits.dailyLimit === -1 ? 'Unlimited' : plan.limits.dailyLimit,
        overageRate: `$${plan.limits.overageRate.toFixed(2)}`,
        maxTeamMembers: plan.limits.maxTeamMembers || 'N/A',
        aiModel: getAIModelType(key),
        platforms: getPlatforms(key),
        support: getSupportLevel(key),
        analytics: getAnalyticsLevel(key),
        customTemplates: hasCustomTemplates(key),
        teamCollaboration: hasTeamCollaboration(key),
        prioritySupport: hasPrioritySupport(key)
      }
    }));

    // Define feature categories for comparison table
    const featureCategories = [
      {
        category: 'Usage Limits',
        features: [
          { key: 'monthlyLimit', label: 'Monthly Repurposes', type: 'number' },
          { key: 'dailyLimit', label: 'Daily Limit', type: 'text' },
          { key: 'overageRate', label: 'Overage Rate', type: 'text' }
        ]
      },
      {
        category: 'AI & Templates',
        features: [
          { key: 'aiModel', label: 'AI Model', type: 'text' },
          { key: 'platforms', label: 'Platform Templates', type: 'list' },
          { key: 'customTemplates', label: 'Custom Templates', type: 'boolean' }
        ]
      },
      {
        category: 'Team & Collaboration',
        features: [
          { key: 'maxTeamMembers', label: 'Team Members', type: 'text' },
          { key: 'teamCollaboration', label: 'Team Analytics', type: 'boolean' }
        ]
      },
      {
        category: 'Support & Analytics',
        features: [
          { key: 'support', label: 'Support Level', type: 'text' },
          { key: 'analytics', label: 'Analytics', type: 'text' },
          { key: 'prioritySupport', label: 'Priority Support', type: 'boolean' }
        ]
      }
    ];

    return NextResponse.json({
      plans,
      featureCategories,
      hierarchy: ['free', 'basic', 'pro', 'agency']
    });

  } catch (error) {
    console.error('[PLANS_COMPARE_ERROR]', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch plan comparison data'
    }, { status: 500 });
  }
}

// Helper functions to determine plan features
function getAIModelType(planKey: string): string {
  switch (planKey) {
    case 'free': return 'Basic AI';
    case 'basic': return 'Standard AI';
    case 'pro':
    case 'agency': return 'Advanced AI';
    default: return 'Basic AI';
  }
}

function getPlatforms(planKey: string): string[] {
  switch (planKey) {
    case 'free': return ['Twitter', 'Instagram'];
    case 'basic': return ['Twitter', 'Instagram', 'Facebook'];
    case 'pro': return ['Twitter', 'Instagram', 'Facebook', 'LinkedIn'];
    case 'agency': return ['Twitter', 'Instagram', 'Facebook', 'LinkedIn', 'Threads', 'Email', 'Newsletter'];
    default: return ['Twitter', 'Instagram'];
  }
}

function getSupportLevel(planKey: string): string {
  switch (planKey) {
    case 'free': return 'Community';
    case 'basic': return 'Basic';
    case 'pro': return 'Professional';
    case 'agency': return 'Priority';
    default: return 'Community';
  }
}

function getAnalyticsLevel(planKey: string): string {
  switch (planKey) {
    case 'free': return 'None';
    case 'basic': return 'Basic';
    case 'pro': return 'Professional';
    case 'agency': return 'Advanced';
    default: return 'None';
  }
}

function hasCustomTemplates(planKey: string): boolean {
  return planKey === 'agency';
}

function hasTeamCollaboration(planKey: string): boolean {
  return planKey === 'agency';
}

function hasPrioritySupport(planKey: string): boolean {
  return planKey === 'agency';
} 