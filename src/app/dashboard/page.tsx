'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  MessageSquare, 
  Users, 
  Settings, 
  FileText, 
  TrendingUp, 
  Zap, 
  Calendar,
  ArrowUpRight,
  Star,
  Target,
  Activity
} from 'lucide-react'
import { QuickActions } from '@/components/dashboard/quick-actions'
import RecentContentList from '@/components/dashboard/recent-content-list'

interface DashboardData {
  usageThisMonth: number
  monthlyLimit: number
  subscriptionPlan: string
  subscriptionStatus: string
  renewalDate?: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      // In a real app, you'd fetch this from an API
      const userData = session.user as any
      setDashboardData({
        usageThisMonth: userData.usageThisMonth || 0,
        monthlyLimit: getMonthlyLimit(userData.subscriptionPlan),
        subscriptionPlan: userData.subscriptionPlan || 'free',
        subscriptionStatus: userData.subscriptionStatus || 'active',
        renewalDate: userData.subscriptionRenewalDate
      })
    }
  }, [session])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const userRole = (session.user as any)?.role
  const userSubscriptionPlan = (session.user as any)?.subscriptionPlan || 'free'
  const hasTeamAccess = userSubscriptionPlan === 'agency'
  
  const usagePercentage = dashboardData 
    ? Math.round((dashboardData.usageThisMonth / dashboardData.monthlyLimit) * 100)
    : 0

  function getMonthlyLimit(plan: string): number {
    switch (plan) {
      case 'basic': return 60
      case 'pro': return 150
      case 'agency': return 450
      default: return 5
    }
  }

  function getPlanDisplayName(plan: string): string {
    switch (plan) {
      case 'basic': return 'Basic'
      case 'pro': return 'Pro'
      case 'agency': return 'Agency'
      default: return 'Free'
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'text-green-700 bg-green-50 border-green-200'
      case 'pending_payment': return 'text-yellow-700 bg-yellow-50 border-yellow-200'
      case 'canceled': return 'text-red-700 bg-red-50 border-red-200'
      default: return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  function getUsageColor(percentage: number): string {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-indigo-500'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                      Welcome back, {session.user?.name?.split(' ')[0] || 'there'}! 👋
                    </h1>
                    <p className="text-indigo-100">
                      Ready to create amazing content today?
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(dashboardData?.subscriptionStatus || 'active')}`}>
                      {getPlanDisplayName(userSubscriptionPlan)} Plan
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            
            {/* Usage Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Activity className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Usage</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {dashboardData?.usageThisMonth || 0}
                  </span>
                  <span className="text-sm text-gray-500">
                    / {dashboardData?.monthlyLimit || 5}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(usagePercentage)}`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600">
                  {usagePercentage.toFixed(2)}% used this month
                </p>
              </div>
            </div>

            {/* Plan Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Star className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Plan</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900 capitalize">
                  {getPlanDisplayName(userSubscriptionPlan)}
                </h3>
                <p className="text-xs text-gray-600">
                  {userSubscriptionPlan === 'free' ? 'Free forever' : 'Active subscription'}
                </p>
              </div>
            </div>

            {/* Performance Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Performance</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">
                  {dashboardData?.usageThisMonth || 0 > 0 ? 'Great!' : 'Get Started'}
                </h3>
                <p className="text-xs text-gray-600">
                  {dashboardData?.usageThisMonth || 0 > 0 
                    ? 'Keep up the momentum' 
                    : 'Create your first content'
                  }
                </p>
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900 capitalize">
                  {dashboardData?.subscriptionStatus || 'Active'}
                </h3>
                <p className="text-xs text-gray-600">
                  All systems ready
                </p>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            
            {/* Quick Actions - Takes 2 columns */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <Zap className="h-5 w-5 text-indigo-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                  </div>
                </div>
                <QuickActions />
              </div>
            </div>

            {/* Account Overview - Takes 1 column */}
            <div className="space-y-6">
              
              {/* Account Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Settings className="h-5 w-5 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Account</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</dt>
                    <dd className="text-sm text-gray-900 font-medium">{session.user?.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Name</dt>
                    <dd className="text-sm text-gray-900 font-medium">{session.user?.name || 'Not provided'}</dd>
                  </div>
                  {dashboardData?.renewalDate && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Next Billing</dt>
                      <dd className="text-sm text-gray-900 font-medium">
                        {new Date(dashboardData.renewalDate).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
                <div className="space-y-3">
                  <Link
                    href="/dashboard/support"
                    className="flex items-center p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors group"
                  >
                    <MessageSquare className="h-4 w-4 text-gray-500 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-gray-800">Support</p>
                      <p className="text-xs text-gray-500">Get help when you need it</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  </Link>

                  <Link
                    href="/dashboard/settings"
                    className="flex items-center p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors group"
                  >
                    <Settings className="h-4 w-4 text-gray-500 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-gray-800">Settings</p>
                      <p className="text-xs text-gray-500">Manage preferences</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  </Link>

                  {hasTeamAccess && (
                    <Link
                      href="/dashboard/settings/team"
                      className="flex items-center p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors group"
                    >
                      <Users className="h-4 w-4 text-gray-500 mr-3" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-gray-800">Team</p>
                        <p className="text-xs text-gray-500">Manage team members</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Content Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <FileText className="h-5 w-5 text-gray-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Recent Content</h2>
              </div>
              <Link
                href="/dashboard/content"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                View all →
              </Link>
            </div>
            <RecentContentList limit={5} />
          </div>
        </div>
      </main>
    </div>
  )
} 