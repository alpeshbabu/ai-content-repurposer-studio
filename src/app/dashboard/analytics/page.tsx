import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Share2, 
  Calendar, 
  Users, 
  Target,
  Activity,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Crown
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Analytics - AI Content Repurposer Studio',
  description: 'View your content performance analytics and insights',
};

interface ContentPerformance {
  platform: string;
  count: number;
  percentage: number;
}

interface UsageAnalytics {
  totalContentCreated: number;
  thisMonthUsage: number;
  lastMonthUsage: number;
  topPlatforms: ContentPerformance[];
  dailyUsage: { date: string; count: number }[];
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/signin');
  }

  // Get user with subscription info
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      subscriptionPlan: true,
      usageThisMonth: true,
      createdAt: true,
      role: true,
      teamId: true,
    }
  });

  if (!user) {
    redirect('/dashboard');
  }

  // Check if user has analytics access
  const hasAnalyticsAccess = ['basic', 'pro', 'agency'].includes(user.subscriptionPlan);
  
  if (!hasAnalyticsAccess) {
    redirect('/dashboard/settings/subscription');
  }

  // Get analytics data based on plan level
  const isBasicPlan = user.subscriptionPlan === 'basic';
  const isProfessionalPlan = ['pro', 'agency'].includes(user.subscriptionPlan);
  const isAgencyPlan = user.subscriptionPlan === 'agency';

  // Simulate analytics data (in a real app, this would come from actual usage tracking)
  const mockAnalytics: UsageAnalytics = {
    totalContentCreated: Math.floor(Math.random() * 100) + user.usageThisMonth,
    thisMonthUsage: user.usageThisMonth,
    lastMonthUsage: Math.floor(Math.random() * 50) + 10,
    topPlatforms: [
      { platform: 'Twitter', count: Math.floor(Math.random() * 20) + 5, percentage: 35 },
      { platform: 'Instagram', count: Math.floor(Math.random() * 15) + 3, percentage: 28 },
      { platform: 'LinkedIn', count: Math.floor(Math.random() * 12) + 2, percentage: 22 },
      { platform: 'Facebook', count: Math.floor(Math.random() * 10) + 1, percentage: 15 },
    ],
    dailyUsage: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      count: Math.floor(Math.random() * 5)
    }))
  };

  const usageGrowth = mockAnalytics.thisMonthUsage - mockAnalytics.lastMonthUsage;
  const growthPercentage = mockAnalytics.lastMonthUsage > 0 
    ? ((usageGrowth / mockAnalytics.lastMonthUsage) * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-600 mt-2">
                  {isBasicPlan && 'Track your content creation and usage patterns'}
                  {isProfessionalPlan && !isAgencyPlan && 'Comprehensive insights into your content performance'}
                  {isAgencyPlan && 'Advanced analytics with team collaboration insights'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isBasicPlan ? 'bg-green-100 text-green-800' :
                  user.subscriptionPlan === 'pro' ? 'bg-blue-100 text-blue-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {user.subscriptionPlan.charAt(0).toUpperCase() + user.subscriptionPlan.slice(1)} Plan
                </span>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Content</p>
                  <p className="text-2xl font-bold text-gray-900">{mockAnalytics.totalContentCreated}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <div className="flex items-center">
                    <p className="text-2xl font-bold text-gray-900">{mockAnalytics.thisMonthUsage}</p>
                    <div className={`ml-2 flex items-center ${usageGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {usageGrowth >= 0 ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">{Math.abs(parseFloat(growthPercentage))}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Top Platform</p>
                  <p className="text-2xl font-bold text-gray-900">{mockAnalytics.topPlatforms[0]?.platform}</p>
                  <p className="text-sm text-gray-500">{mockAnalytics.topPlatforms[0]?.count} posts</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Activity className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg. Daily</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(mockAnalytics.thisMonthUsage / 30).toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-500">repurposes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Platform Distribution */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Platform Distribution</h3>
                <PieChart className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {mockAnalytics.topPlatforms.map((platform, index) => (
                  <div key={platform.platform} className="flex items-center">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{platform.platform}</span>
                        <span className="text-sm text-gray-500">{platform.count} posts</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            index === 0 ? 'bg-blue-600' :
                            index === 1 ? 'bg-green-600' :
                            index === 2 ? 'bg-purple-600' :
                            'bg-orange-600'
                          }`}
                          style={{ width: `${platform.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Usage Trend */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Usage Trend (Last 30 Days)</h3>
                <LineChart className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-48 flex items-end justify-between space-x-1">
                {mockAnalytics.dailyUsage.slice(-7).map((day, index) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-600 rounded-t-sm mb-1"
                      style={{ 
                        height: `${Math.max((day.count / 5) * 100, 10)}%`,
                        minHeight: '8px'
                      }}
                    ></div>
                    <span className="text-xs text-gray-500 transform -rotate-45 origin-center">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Professional Analytics Features */}
          {isProfessionalPlan && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Performance</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Eye className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="text-sm font-medium">Avg. Engagement Rate</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">4.2%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Share2 className="h-5 w-5 text-green-600 mr-3" />
                      <span className="text-sm font-medium">Total Shares</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">1,247</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 text-purple-600 mr-3" />
                      <span className="text-sm font-medium">Growth Rate</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">+{growthPercentage}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Types</h3>
                <div className="space-y-3">
                  {[
                    { type: 'Social Media Posts', count: 45, color: 'bg-blue-600' },
                    { type: 'Blog Excerpts', count: 28, color: 'bg-green-600' },
                    { type: 'Video Descriptions', count: 15, color: 'bg-purple-600' },
                    { type: 'Email Content', count: 12, color: 'bg-orange-600' },
                  ].map((item) => (
                    <div key={item.type} className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${item.color} mr-3`}></div>
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-sm text-gray-900">{item.type}</span>
                        <span className="text-sm font-medium text-gray-600">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Agency-specific Team Analytics */}
          {isAgencyPlan && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Crown className="h-5 w-5 text-purple-600 mr-2" />
                    Agency Plan Analytics
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Advanced insights for your agency operations</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">3</div>
                  <div className="text-sm text-gray-600">Team Members</div>
                </div>
                <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">127</div>
                  <div className="text-sm text-gray-600">Client Projects</div>
                </div>
                <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">98%</div>
                  <div className="text-sm text-gray-600">Team Efficiency</div>
                </div>
                <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">4.8/5</div>
                  <div className="text-sm text-gray-600">Client Satisfaction</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-purple-200">
                <div className="flex space-x-4">
                  <Link 
                    href="/dashboard/analytics/agency"
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Advanced Analytics
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Link>
                  <Link 
                    href="/dashboard/settings/team"
                    className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                  >
                    Team Settings
                  </Link>
                </div>
                <div className="text-xs text-purple-600 font-medium">
                  ✨ Agency Plan Exclusive
                </div>
              </div>
            </div>
          )}

          {/* Upgrade Prompt for Basic Users */}
          {isBasicPlan && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Unlock Professional Analytics</h3>
                  <p className="text-gray-600 mt-1">
                    Upgrade to Pro or Agency plan to access advanced performance metrics, content insights, and team analytics.
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/dashboard/settings/subscription"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      View Plans
                      <ArrowUpRight className="h-4 w-4 ml-2" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 