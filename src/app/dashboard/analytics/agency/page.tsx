import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AgencyAnalyticsDashboard from '@/components/dashboard/AgencyAnalyticsDashboard';

export const metadata: Metadata = {
  title: 'Agency Analytics - AI Content Repurposer Studio',
  description: 'Comprehensive analytics and insights for agency plan users',
};

export default async function AgencyAnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/signin');
  }

  // Get user with subscription info
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      subscriptionPlan: true,
      usageThisMonth: true,
      createdAt: true,
      role: true,
      teamId: true,
      name: true,
      email: true,
    }
  });

  if (!user) {
    redirect('/dashboard');
  }

  // Restrict to agency plan users only
  if (user.subscriptionPlan !== 'agency') {
    redirect('/dashboard/analytics');
  }

  // Get team data if user is part of a team
  const teamData = user.teamId ? await prisma.team.findUnique({
    where: { id: user.teamId },
    include: {
      members: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          usageThisMonth: true,
          createdAt: true,
        }
      }
    }
  }) : null;

  // Get analytics data from API
  const analyticsData = await getAgencyAnalytics();

  return <AgencyAnalyticsDashboard user={user} team={teamData} analytics={analyticsData} />;
}

async function getAgencyAnalytics() {
  // This would typically be called from the client-side
  // For now, we'll generate the data here directly
  const now = new Date();
  
  return {
    overview: {
      totalContentCreated: Math.floor(Math.random() * 1000) + 500,
      thisMonthContent: Math.floor(Math.random() * 200) + 50,
      totalClients: Math.floor(Math.random() * 20) + 5,
      activeProjects: Math.floor(Math.random() * 15) + 8,
      teamProductivity: 87.5 + Math.random() * 10,
      clientSatisfaction: 4.2 + Math.random() * 0.6,
      revenueGrowth: 12.5 + Math.random() * 15,
      contentQualityScore: 8.5 + Math.random() * 1.2,
    },
    
    teamPerformance: {
      members: Array.from({ length: 5 }, (_, i) => ({
        id: `member-${i}`,
        name: `Team Member ${i + 1}`,
        role: ['Content Manager', 'Social Media Specialist', 'Copy Writer', 'Creative Director', 'Account Manager'][i],
        contentCreated: Math.floor(Math.random() * 100) + 20,
        efficiency: 75 + Math.random() * 20,
        clientRating: 4.0 + Math.random() * 1.0,
        hoursWorked: Math.floor(Math.random() * 40) + 120,
        tasksCompleted: Math.floor(Math.random() * 50) + 25,
      })),
      
      productivity: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        content: Math.floor(Math.random() * 15) + 2,
        hours: Math.floor(Math.random() * 8) + 16,
        efficiency: 70 + Math.random() * 25,
      })),
      
      collaboration: {
        sharedProjects: Math.floor(Math.random() * 10) + 12,
        crossTeamProjects: Math.floor(Math.random() * 5) + 3,
        knowledgeSharing: Math.floor(Math.random() * 20) + 15,
        peerReviews: Math.floor(Math.random() * 30) + 25,
      }
    },
    
    clientAnalytics: {
      clients: Array.from({ length: 8 }, (_, i) => ({
        id: `client-${i}`,
        name: `Client ${String.fromCharCode(65 + i)}`,
        industry: ['Technology', 'Healthcare', 'Finance', 'Retail', 'Education', 'Entertainment', 'Real Estate', 'Automotive'][i],
        contentVolume: Math.floor(Math.random() * 100) + 50,
        engagement: 2.5 + Math.random() * 4,
        roi: 150 + Math.random() * 200,
        satisfaction: 4.0 + Math.random() * 1.0,
        revenue: (Math.random() * 10000) + 5000,
        activeProjects: Math.floor(Math.random() * 5) + 1,
        lastActivity: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      })),
      
      performance: Array.from({ length: 6 }, (_, i) => ({
        month: new Date(now.getFullYear(), now.getMonth() - (5 - i), 1).toLocaleDateString('en-US', { month: 'short' }),
        newClients: Math.floor(Math.random() * 3) + 1,
        retainedClients: Math.floor(Math.random() * 15) + 8,
        revenue: (Math.random() * 50000) + 30000,
        satisfaction: 4.0 + Math.random() * 1.0,
      })),
      
      contentByClient: Array.from({ length: 8 }, (_, i) => ({
        client: `Client ${String.fromCharCode(65 + i)}`,
        posts: Math.floor(Math.random() * 50) + 10,
        campaigns: Math.floor(Math.random() * 10) + 2,
        platforms: Math.floor(Math.random() * 5) + 2,
      })),
    },
    
    contentInsights: {
      platforms: [
        { name: 'LinkedIn', posts: Math.floor(Math.random() * 200) + 100, engagement: 3.2 + Math.random() * 2, growth: 15 + Math.random() * 20 },
        { name: 'Twitter', posts: Math.floor(Math.random() * 300) + 150, engagement: 2.8 + Math.random() * 2, growth: 12 + Math.random() * 18 },
        { name: 'Instagram', posts: Math.floor(Math.random() * 250) + 120, engagement: 4.1 + Math.random() * 2, growth: 18 + Math.random() * 25 },
        { name: 'Facebook', posts: Math.floor(Math.random() * 180) + 80, engagement: 2.5 + Math.random() * 2, growth: 8 + Math.random() * 15 },
        { name: 'TikTok', posts: Math.floor(Math.random() * 150) + 60, engagement: 5.2 + Math.random() * 3, growth: 25 + Math.random() * 35 },
      ],
      
      contentTypes: [
        { type: 'Social Media Posts', count: Math.floor(Math.random() * 200) + 150, performance: 85 + Math.random() * 10 },
        { type: 'Blog Articles', count: Math.floor(Math.random() * 50) + 25, performance: 78 + Math.random() * 15 },
        { type: 'Video Scripts', count: Math.floor(Math.random() * 40) + 20, performance: 92 + Math.random() * 8 },
        { type: 'Email Campaigns', count: Math.floor(Math.random() * 60) + 30, performance: 88 + Math.random() * 10 },
        { type: 'Ad Copy', count: Math.floor(Math.random() * 80) + 40, performance: 90 + Math.random() * 8 },
      ],
      
      qualityMetrics: {
        grammarScore: 95 + Math.random() * 4,
        readabilityScore: 88 + Math.random() * 10,
        seoScore: 82 + Math.random() * 15,
        brandConsistency: 91 + Math.random() * 8,
        originalityScore: 93 + Math.random() * 6,
      },
      
      contentCalendar: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(now.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        scheduled: Math.floor(Math.random() * 10) + 2,
        published: Math.floor(Math.random() * 8) + 1,
        performance: 70 + Math.random() * 25,
      })),
    },
    
    roiAnalytics: {
      overall: {
        totalInvestment: 50000 + Math.random() * 30000,
        totalRevenue: 120000 + Math.random() * 80000,
        roi: 140 + Math.random() * 100,
        costPerLead: 25 + Math.random() * 20,
        ltv: 1200 + Math.random() * 800,
        conversionRate: 2.5 + Math.random() * 3,
      },
      
      byClient: Array.from({ length: 8 }, (_, i) => ({
        client: `Client ${String.fromCharCode(65 + i)}`,
        investment: 5000 + Math.random() * 10000,
        revenue: 12000 + Math.random() * 20000,
        roi: 120 + Math.random() * 150,
        leads: Math.floor(Math.random() * 100) + 50,
        conversions: Math.floor(Math.random() * 25) + 10,
      })),
      
      monthlyTrend: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(now.getFullYear(), i, 1).toLocaleDateString('en-US', { month: 'short' }),
        investment: 8000 + Math.random() * 5000,
        revenue: 18000 + Math.random() * 12000,
        roi: 125 + Math.random() * 75,
        leads: Math.floor(Math.random() * 200) + 100,
      })),
    },
    
    competitiveAnalysis: {
      benchmarks: {
        industryAvgEngagement: 2.8,
        industryAvgROI: 180,
        industryAvgContentVolume: 45,
        industryAvgClientSatisfaction: 4.1,
      },
      
      marketPosition: {
        contentQuality: 92,
        clientRetention: 88,
        teamEfficiency: 85,
        innovationScore: 78,
        marketShare: 12.5,
      },
      
      trends: Array.from({ length: 6 }, (_, i) => ({
        month: new Date(now.getFullYear(), now.getMonth() - (5 - i), 1).toLocaleDateString('en-US', { month: 'short' }),
        yourPerformance: 80 + Math.random() * 15,
        industryAverage: 75 + Math.random() * 10,
        topPerformer: 90 + Math.random() * 8,
      })),
    },
    
    alerts: [
      {
        type: 'success',
        title: 'Client Satisfaction Improved',
        message: 'Average client satisfaction increased by 0.3 points this month',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        type: 'warning',
        title: 'Content Volume Below Target',
        message: 'Client B content production is 15% below monthly target',
        timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      },
      {
        type: 'info',
        title: 'New Team Member Onboarded',
        message: 'Sarah Johnson joined as Content Specialist',
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
    ],
  };
} 