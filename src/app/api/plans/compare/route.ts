import { NextResponse } from 'next/server';
import { getAllPlans, PRICING_CONFIG } from '@/lib/pricing-config';

export async function GET() {
  try {
    const allPlans = getAllPlans();
    
    const plans = allPlans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      features: plan.features,
      limits: {
        monthlyLimit: plan.monthlyLimit,
        overageRate: plan.overagePrice,
        maxTeamMembers: plan.teamMembers,
        additionalMemberPrice: plan.additionalMemberPrice
      },
      // Enhanced feature breakdown for comparison
      featureMatrix: {
        monthlyLimit: plan.monthlyLimit === -1 ? 'Unlimited' : plan.monthlyLimit,
        overageRate: `$${plan.overagePrice.toFixed(2)}`,
        maxTeamMembers: plan.teamMembers > 1 ? plan.teamMembers : 'N/A',
        additionalMemberPrice: plan.id === 'agency' && plan.additionalMemberPrice > 0 ? `$${plan.additionalMemberPrice}/month` : 'N/A',
        aiModel: getAIModelType(plan.id),
        platforms: getPlatforms(plan.id),
        customTemplates: hasCustomTemplates(plan.id),
        teamCollaboration: hasTeamCollaboration(plan.id),
        prioritySupport: hasPrioritySupport(plan.id)
      },
      formatted: {
        ...plan,
        monthlyLimit: plan.monthlyLimit === -1 ? 'Unlimited' : plan.monthlyLimit,
        overagePrice: `$${plan.overagePrice}/overage`,
        price: plan.price === 0 ? 'Free' : `$${plan.price}/month`,
        teamMembers: plan.teamMembers > 1 ? `Up to ${plan.teamMembers} members` : '1 member'
      },
      comparison: {
        features: [
          { key: 'monthlyLimit', label: 'Monthly Repurposes', type: 'number' },
          { key: 'overageRate', label: 'Overage Rate', type: 'text' }
        ]
      }
    }));

    // Define feature categories for comparison table
    const featureCategories = [
      {
        category: 'Usage Limits',
        features: [
          { key: 'monthlyLimit', label: 'Monthly Repurposes', type: 'number' },
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
          { key: 'additionalMemberPrice', label: 'Additional Members', type: 'text' },
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
      hierarchy: PRICING_CONFIG.hierarchy
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
    case 'agency': return ['Twitter', 'Instagram', 'Facebook', 'LinkedIn', 'Thread', 'TikTok', 'YouTube', 'Email', 'Newsletter'];
    default: return ['Twitter', 'Instagram'];
  }
}

function hasCustomTemplates(planKey: string): boolean {
  return planKey === 'agency' || planKey === 'pro';
}

function hasTeamCollaboration(planKey: string): boolean {
  return planKey === 'agency';
}

function hasPrioritySupport(planKey: string): boolean {
  return planKey === 'agency';
} 