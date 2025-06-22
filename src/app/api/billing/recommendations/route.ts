import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimiter } from '@/lib/rate-limit';
import { analyticsTracker } from '@/lib/analytics-tracker';

interface PlanRecommendation {
  planId: string;
  planName: string;
  currentPlan: string;
  confidence: number;
  reason: string;
  potentialSavings?: number;
  potentialCosts?: number;
  features: string[];
  metrics: {
    currentUsage: number;
    averageUsage: number;
    projectedUsage: number;
    usageGrowth: number;
  };
}

const PLAN_DETAILS = {
  free: {
    name: 'Free',
    monthlyLimit: 5,
    price: 0,
    features: ['Basic content generation', 'Limited repurposing', 'Community support']
  },
  basic: {
    name: 'Basic',
    monthlyLimit: 50,
    price: 9.99,
    features: ['Increased content generation', 'Multiple platforms', 'Email support', 'Custom brand voice']
  },
  pro: {
    name: 'Pro',
    monthlyLimit: 200,
    price: 29.99,
    features: ['Advanced analytics', 'API access', 'Priority support', 'Bulk operations', 'Advanced templates']
  },
  agency: {
    name: 'Agency',
    monthlyLimit: 1000,
    price: 99.99,
    features: ['Team collaboration', 'White-label options', 'Dedicated support', 'Advanced integrations', 'Custom workflows']
  }
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimiter.checkLimit(session.user.id, 'plan_recommendations');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: rateLimitResult.resetTime },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const analysisType = searchParams.get('type') || 'usage';

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionPlan: true,
        usageThisMonth: true,
        createdAt: true,
        team: {
          include: {
            members: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentPlan = user.subscriptionPlan || 'free';
    
    // Get usage history for analysis
    const usageHistory = await getUsageHistory(session.user.id);
    const teamSize = user.team?.members.length || 1;
    
    // Analyze usage patterns
    const usageAnalysis = analyzeUsagePatterns(usageHistory, user.usageThisMonth || 0);
    
    // Generate recommendations based on analysis type
    let recommendations: PlanRecommendation[] = [];

    switch (analysisType) {
      case 'usage':
        recommendations = generateUsageBasedRecommendations(currentPlan, usageAnalysis);
        break;
      case 'team':
        recommendations = generateTeamBasedRecommendations(currentPlan, teamSize, usageAnalysis);
        break;
      case 'cost':
        recommendations = generateCostOptimizationRecommendations(currentPlan, usageAnalysis);
        break;
      case 'features':
        recommendations = generateFeatureBasedRecommendations(currentPlan, usageAnalysis);
        break;
      default:
        recommendations = generateComprehensiveRecommendations(currentPlan, usageAnalysis, teamSize);
    }

    // Track analytics
    await analyticsTracker.trackEvent({
      userId: session.user.id,
      action: 'plan_recommendations_viewed',
      resource: 'billing',
      metadata: { 
        currentPlan,
        analysisType,
        recommendationCount: recommendations.length,
        topRecommendation: recommendations[0]?.planId
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        currentPlan,
        currentUsage: user.usageThisMonth || 0,
        usageAnalysis,
        recommendations: recommendations.slice(0, 3), // Top 3 recommendations
        analysisDate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating plan recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

async function getUsageHistory(userId: string): Promise<number[]> {
  try {
    // Get last 6 months of usage data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const usageRecords = await prisma.content.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      _count: true
    });

    // Group by month and return usage counts
    const monthlyUsage: { [key: string]: number } = {};
    
    usageRecords.forEach(record => {
      const monthKey = record.createdAt.toISOString().slice(0, 7); // YYYY-MM
      monthlyUsage[monthKey] = (monthlyUsage[monthKey] || 0) + record._count;
    });

    // Return last 6 months of usage (fill missing months with 0)
    const usage: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);
      usage.push(monthlyUsage[monthKey] || 0);
    }

    return usage;
  } catch (error) {
    console.error('Error getting usage history:', error);
    return [0, 0, 0, 0, 0, 0];
  }
}

function analyzeUsagePatterns(usageHistory: number[], currentUsage: number) {
  const averageUsage = usageHistory.reduce((sum, usage) => sum + usage, 0) / usageHistory.length;
  const maxUsage = Math.max(...usageHistory, currentUsage);
  const minUsage = Math.min(...usageHistory, currentUsage);
  
  // Calculate growth trend
  const recentAverage = usageHistory.slice(-3).reduce((sum, usage) => sum + usage, 0) / 3;
  const earlierAverage = usageHistory.slice(0, 3).reduce((sum, usage) => sum + usage, 0) / 3;
  const growthRate = earlierAverage > 0 ? ((recentAverage - earlierAverage) / earlierAverage) * 100 : 0;
  
  // Project next month usage
  const projectedUsage = Math.max(0, Math.round(currentUsage * (1 + (growthRate / 100))));
  
  // Determine usage pattern
  const isGrowing = growthRate > 10;
  const isStable = Math.abs(growthRate) <= 10;
  const isDecreasing = growthRate < -10;
  const isConsistent = (maxUsage - minUsage) / averageUsage < 0.5;
  
  return {
    averageUsage: Math.round(averageUsage),
    maxUsage,
    minUsage,
    currentUsage,
    projectedUsage,
    growthRate: Math.round(growthRate * 10) / 10,
    isGrowing,
    isStable,
    isDecreasing,
    isConsistent,
    trend: isGrowing ? 'growing' : isDecreasing ? 'decreasing' : 'stable'
  };
}

function generateUsageBasedRecommendations(currentPlan: string, analysis: any): PlanRecommendation[] {
  const recommendations: PlanRecommendation[] = [];
  const currentPlanDetails = PLAN_DETAILS[currentPlan as keyof typeof PLAN_DETAILS];
  
  // Check if user consistently exceeds current plan limits
  const exceedsLimit = analysis.projectedUsage > currentPlanDetails.monthlyLimit;
  const nearLimit = analysis.projectedUsage > currentPlanDetails.monthlyLimit * 0.8;
  
  if (exceedsLimit) {
    // Recommend upgrade
    const nextPlan = getNextPlanUp(currentPlan);
    if (nextPlan) {
      const nextPlanDetails = PLAN_DETAILS[nextPlan as keyof typeof PLAN_DETAILS];
      recommendations.push({
        planId: nextPlan,
        planName: nextPlanDetails.name,
        currentPlan,
        confidence: 90,
        reason: `Your projected usage (${analysis.projectedUsage}) exceeds your current limit (${currentPlanDetails.monthlyLimit}). Upgrading will provide more capacity and additional features.`,
        potentialCosts: (nextPlanDetails.price - currentPlanDetails.price) * 12,
        features: nextPlanDetails.features,
        metrics: {
          currentUsage: analysis.currentUsage,
          averageUsage: analysis.averageUsage,
          projectedUsage: analysis.projectedUsage,
          usageGrowth: analysis.growthRate
        }
      });
    }
  } else if (nearLimit && analysis.isGrowing) {
    // Recommend upgrade for growing usage
    const nextPlan = getNextPlanUp(currentPlan);
    if (nextPlan) {
      const nextPlanDetails = PLAN_DETAILS[nextPlan as keyof typeof PLAN_DETAILS];
      recommendations.push({
        planId: nextPlan,
        planName: nextPlanDetails.name,
        currentPlan,
        confidence: 75,
        reason: `Your usage is growing ${analysis.growthRate}% and approaching your limit. Upgrading now will prevent future overage charges.`,
        potentialCosts: (nextPlanDetails.price - currentPlanDetails.price) * 12,
        features: nextPlanDetails.features,
        metrics: {
          currentUsage: analysis.currentUsage,
          averageUsage: analysis.averageUsage,
          projectedUsage: analysis.projectedUsage,
          usageGrowth: analysis.growthRate
        }
      });
    }
  } else if (analysis.maxUsage < currentPlanDetails.monthlyLimit * 0.5 && currentPlan !== 'free') {
    // Recommend downgrade for low usage
    const previousPlan = getPlanDown(currentPlan);
    if (previousPlan) {
      const previousPlanDetails = PLAN_DETAILS[previousPlan as keyof typeof PLAN_DETAILS];
      const savings = (currentPlanDetails.price - previousPlanDetails.price) * 12;
      
      recommendations.push({
        planId: previousPlan,
        planName: previousPlanDetails.name,
        currentPlan,
        confidence: 80,
        reason: `Your usage (${analysis.maxUsage} max) is well below your current limit (${currentPlanDetails.monthlyLimit}). Downgrading could save you money.`,
        potentialSavings: savings,
        features: previousPlanDetails.features,
        metrics: {
          currentUsage: analysis.currentUsage,
          averageUsage: analysis.averageUsage,
          projectedUsage: analysis.projectedUsage,
          usageGrowth: analysis.growthRate
        }
      });
    }
  }
  
  return recommendations;
}

function generateTeamBasedRecommendations(currentPlan: string, teamSize: number, analysis: any): PlanRecommendation[] {
  const recommendations: PlanRecommendation[] = [];
  
  // If user has a team but not on agency plan
  if (teamSize > 1 && currentPlan !== 'agency') {
    const agencyPlan = PLAN_DETAILS.agency;
    const currentPlanDetails = PLAN_DETAILS[currentPlan as keyof typeof PLAN_DETAILS];
    
    recommendations.push({
      planId: 'agency',
      planName: agencyPlan.name,
      currentPlan,
      confidence: 85,
      reason: `You have ${teamSize} team members. The Agency plan offers team collaboration features, shared libraries, and better support for teams.`,
      potentialCosts: (agencyPlan.price - currentPlanDetails.price) * 12,
      features: agencyPlan.features,
      metrics: {
        currentUsage: analysis.currentUsage,
        averageUsage: analysis.averageUsage,
        projectedUsage: analysis.projectedUsage,
        usageGrowth: analysis.growthRate
      }
    });
  }
  
  return recommendations;
}

function generateCostOptimizationRecommendations(currentPlan: string, analysis: any): PlanRecommendation[] {
  const recommendations: PlanRecommendation[] = [];
  const currentPlanDetails = PLAN_DETAILS[currentPlan as keyof typeof PLAN_DETAILS];
  
  // Calculate overage costs
  const overage = Math.max(0, analysis.projectedUsage - currentPlanDetails.monthlyLimit);
  const overageCost = overage * 0.1; // Assume $0.10 per unit overage
  
  if (overageCost > 5) { // If overage costs more than $5
    const nextPlan = getNextPlanUp(currentPlan);
    if (nextPlan) {
      const nextPlanDetails = PLAN_DETAILS[nextPlan as keyof typeof PLAN_DETAILS];
      const upgradeCost = nextPlanDetails.price - currentPlanDetails.price;
      
      if (upgradeCost < overageCost) {
        recommendations.push({
          planId: nextPlan,
          planName: nextPlanDetails.name,
          currentPlan,
          confidence: 95,
          reason: `Upgrading costs $${upgradeCost}/month vs. projected overage costs of $${overageCost.toFixed(2)}/month.`,
          potentialSavings: (overageCost - upgradeCost) * 12,
          features: nextPlanDetails.features,
          metrics: {
            currentUsage: analysis.currentUsage,
            averageUsage: analysis.averageUsage,
            projectedUsage: analysis.projectedUsage,
            usageGrowth: analysis.growthRate
          }
        });
      }
    }
  }
  
  return recommendations;
}

function generateFeatureBasedRecommendations(currentPlan: string, analysis: any): PlanRecommendation[] {
  const recommendations: PlanRecommendation[] = [];
  
  // This would ideally be based on feature usage analytics
  // For now, we'll make recommendations based on plan progression
  
  if (currentPlan === 'free' && analysis.averageUsage > 3) {
    recommendations.push({
      planId: 'basic',
      planName: 'Basic',
      currentPlan,
      confidence: 70,
      reason: 'Unlock custom brand voice, email support, and increased limits to enhance your content creation.',
      potentialCosts: PLAN_DETAILS.basic.price * 12,
      features: PLAN_DETAILS.basic.features,
      metrics: {
        currentUsage: analysis.currentUsage,
        averageUsage: analysis.averageUsage,
        projectedUsage: analysis.projectedUsage,
        usageGrowth: analysis.growthRate
      }
    });
  }
  
  if (currentPlan === 'basic' && analysis.averageUsage > 30) {
    recommendations.push({
      planId: 'pro',
      planName: 'Pro',
      currentPlan,
      confidence: 75,
      reason: 'Access advanced analytics, API access, and bulk operations to scale your content strategy.',
      potentialCosts: (PLAN_DETAILS.pro.price - PLAN_DETAILS.basic.price) * 12,
      features: PLAN_DETAILS.pro.features,
      metrics: {
        currentUsage: analysis.currentUsage,
        averageUsage: analysis.averageUsage,
        projectedUsage: analysis.projectedUsage,
        usageGrowth: analysis.growthRate
      }
    });
  }
  
  return recommendations;
}

function generateComprehensiveRecommendations(currentPlan: string, analysis: any, teamSize: number): PlanRecommendation[] {
  const recommendations: PlanRecommendation[] = [];
  
  // Combine all recommendation types
  recommendations.push(...generateUsageBasedRecommendations(currentPlan, analysis));
  recommendations.push(...generateTeamBasedRecommendations(currentPlan, teamSize, analysis));
  recommendations.push(...generateCostOptimizationRecommendations(currentPlan, analysis));
  recommendations.push(...generateFeatureBasedRecommendations(currentPlan, analysis));
  
  // Remove duplicates and sort by confidence
  const uniqueRecommendations = recommendations.filter((rec, index, self) => 
    index === self.findIndex(r => r.planId === rec.planId)
  );
  
  return uniqueRecommendations.sort((a, b) => b.confidence - a.confidence);
}

function getNextPlanUp(currentPlan: string): string | null {
  const planOrder = ['free', 'basic', 'pro', 'agency'];
  const currentIndex = planOrder.indexOf(currentPlan);
  return currentIndex >= 0 && currentIndex < planOrder.length - 1 
    ? planOrder[currentIndex + 1] 
    : null;
}

function getPlanDown(currentPlan: string): string | null {
  const planOrder = ['free', 'basic', 'pro', 'agency'];
  const currentIndex = planOrder.indexOf(currentPlan);
  return currentIndex > 0 ? planOrder[currentIndex - 1] : null;
} 