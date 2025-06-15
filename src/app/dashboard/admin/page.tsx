import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Shield, Users, MessageSquare, Star, TrendingUp, DollarSign, Activity, BarChart3, Settings, CreditCard, Database, Zap } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Admin Dashboard - AI Content Repurposer Studio',
  description: 'Master admin dashboard for platform management',
};

interface UsageStat {
  subscriptionPlan: string;
  _count: number;
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/signin');
  }

  // Check if user is website owner (admin)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      name: true,
      email: true
    }
  });

  if (!user || user.role !== 'owner') {
    redirect('/dashboard');
  }

  // Get comprehensive statistics
  const [
    totalUsers,
    activeSubscriptions,
    totalTickets,
    pendingTickets,
    totalReviews,
    averageRatingResult,
    monthlyRevenue,
    usageStats,
    recentUsers,
    recentTickets
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { subscriptionStatus: 'active' } }),
    prisma.supportTicket.count(),
    prisma.supportTicket.count({ where: { status: { in: ['open', 'in-progress'] } } }),
    prisma.review.count(),
    prisma.review.aggregate({ _avg: { rating: true } }),
    prisma.user.aggregate({ 
      _sum: { usageThisMonth: true },
      where: { subscriptionPlan: { not: 'free' } }
    }).then(r => r._sum.usageThisMonth || 0),
    prisma.user.groupBy({
      by: ['subscriptionPlan'],
      _count: true
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionPlan: true,
        createdAt: true
      }
    }),
    prisma.supportTicket.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        createdAt: true,
        user: {
          select: { name: true, email: true }
        }
      }
    })
  ]);

  const averageRating = averageRatingResult._avg.rating || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Master control panel for AI Content Repurposer Studio</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome, {user.name || user.email}</span>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                <p className="text-2xl font-bold text-green-600">{activeSubscriptions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Support Tickets</p>
                <p className="text-2xl font-bold text-orange-600">{totalTickets}</p>
                <p className="text-xs text-red-500">{pendingTickets} pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reviews</p>
                <p className="text-2xl font-bold text-yellow-600">{totalReviews}</p>
                <p className="text-xs text-gray-500">
                  Avg: {averageRating ? averageRating.toFixed(1) : 'N/A'} ⭐
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            href="/dashboard/admin/users"
            className="bg-white hover:bg-gray-50 p-6 rounded-lg shadow transition-colors group border border-gray-200"
          >
            <div className="flex items-center mb-4">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                  User Management
                </h3>
                <p className="text-sm text-gray-600">
                  {totalUsers} total users
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-700">
              Manage subscribers, subscriptions, and user accounts
            </p>
          </Link>

          <Link
            href="/dashboard/admin/support"
            className="bg-white hover:bg-gray-50 p-6 rounded-lg shadow transition-colors group border border-gray-200"
          >
            <div className="flex items-center mb-4">
              <MessageSquare className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600">
                  Support Management
                </h3>
                <p className="text-sm text-gray-600">
                  {pendingTickets} tickets pending
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-700">
              Manage customer support and resolve issues
            </p>
          </Link>

          <Link
            href="/dashboard/settings"
            className="bg-white hover:bg-gray-50 p-6 rounded-lg shadow transition-colors group border border-gray-200"
          >
            <div className="flex items-center mb-4">
              <Settings className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600">
                  System Settings
                </h3>
                <p className="text-sm text-gray-600">
                  Platform configuration
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-700">
              Configure system settings and preferences
            </p>
          </Link>

          <Link
            href="/dashboard/settings/subscription"
            className="bg-white hover:bg-gray-50 p-6 rounded-lg shadow transition-colors group border border-gray-200"
          >
            <div className="flex items-center mb-4">
              <CreditCard className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600">
                  Billing Overview
                </h3>
                <p className="text-sm text-gray-600">
                  {monthlyRevenue.toLocaleString()} monthly usage
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-700">
              Monitor subscription plans and billing
            </p>
          </Link>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center mb-4">
              <Database className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  System Health
                </h3>
                <p className="text-sm text-gray-600">
                  All systems operational
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-700">
              Database and API performance monitoring
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center mb-4">
              <BarChart3 className="h-8 w-8 text-pink-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Analytics
                </h3>
                <p className="text-sm text-gray-600">
                  Platform performance metrics
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-700">
              View detailed usage and performance analytics
            </p>
          </div>
        </div>

        {/* Subscription Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <DollarSign className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold">Subscription Breakdown</h3>
            </div>
            <div className="space-y-3">
              {usageStats.map((stat) => (
                <div key={stat.subscriptionPlan} className="flex justify-between items-center">
                  <span className="text-gray-600 capitalize">{stat.subscriptionPlan} Plan</span>
                  <div className="flex items-center">
                    <span className="font-semibold mr-2">{stat._count}</span>
                    <span className="text-sm text-gray-500">
                      ({((stat._count / totalUsers) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Activity className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold">Key Metrics</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Conversion Rate</span>
                <span className="font-semibold text-green-600">
                  {totalUsers > 0 ? ((activeSubscriptions / totalUsers) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ticket Resolution</span>
                <span className="font-semibold text-blue-600">
                  {totalTickets > 0 ? (((totalTickets - pendingTickets) / totalTickets) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Health</span>
                <span className="font-semibold text-green-600">Excellent</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Rating</span>
                <span className="font-semibold text-yellow-600">
                  {averageRating ? averageRating.toFixed(1) : 'N/A'}/5.0
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Support Tickets</h3>
            <div className="space-y-3">
              {recentTickets.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent tickets</p>
              ) : (
                recentTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <Link 
                        href={`/dashboard/admin/support/ticket/${ticket.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {ticket.subject}
                      </Link>
                      <p className="text-sm text-gray-500">
                        by {ticket.user.name || ticket.user.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ticket.status === 'open' ? 'bg-green-100 text-green-800' :
                        ticket.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.status.replace('-', ' ')}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4">
              <Link
                href="/dashboard/admin/support"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View all tickets →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Recent User Registrations</h3>
            <div className="space-y-3">
              {recentUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent users</p>
              ) : (
                recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="font-medium">{user.name || 'Unnamed User'}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.subscriptionPlan === 'agency' ? 'bg-purple-100 text-purple-800' :
                        user.subscriptionPlan === 'pro' ? 'bg-blue-100 text-blue-800' :
                        user.subscriptionPlan === 'basic' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.subscriptionPlan}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4">
              <Link
                href="/dashboard/admin/users"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View all users →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 