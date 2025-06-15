'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Star, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Shield,
  FileText
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  totalTickets: number;
  pendingTickets: number;
  totalContent: number;
  averageRating: number;
  systemHealth: string;
  subscriptionBreakdown: {
    free: number;
    basic: number;
    pro: number;
    agency: number;
  };
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError('Failed to fetch dashboard statistics');
      }
    } catch (err) {
      setError('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'users':
        router.push('/admin/users');
        break;
      case 'tickets':
        router.push('/admin/support');
        break;
      case 'content':
        router.push('/admin/content');
        break;
      case 'analytics':
        router.push('/admin/analytics');
        break;
      case 'billing':
        router.push('/admin/billing');
        break;
      case 'system':
        // Navigate to system status when implemented
        alert('System status page coming soon!');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={fetchDashboardStats}
                className="mt-2 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Subscriptions',
      value: stats?.activeSubscriptions || 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Monthly Revenue',
      value: `$${((stats?.totalRevenue || 0) / 100).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Support Tickets',
      value: stats?.totalTickets || 0,
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      subtitle: `${stats?.pendingTickets || 0} pending`,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Platform statistics and system health</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center text-sm text-gray-500">
            <Activity className="h-4 w-4 mr-1" />
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <button
            onClick={fetchDashboardStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  {card.subtitle && (
                    <p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Subscription Breakdown</h3>
          <div className="space-y-3">
            {stats?.subscriptionBreakdown && Object.entries(stats.subscriptionBreakdown).map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    plan === 'agency' ? 'bg-purple-500' :
                    plan === 'pro' ? 'bg-blue-500' :
                    plan === 'basic' ? 'bg-green-500' :
                    'bg-gray-500'
                  }`}></div>
                  <span className="text-sm text-gray-600 capitalize">{plan}</span>
                </div>
                <span className="text-sm font-medium">{count} users</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">Healthy</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Services</span>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">Operational</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Storage</span>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">Available</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Payment System</span>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <button 
            onClick={() => handleQuickAction('users')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors group"
          >
            <Users className="h-6 w-6 text-blue-600 mb-2 group-hover:text-blue-700" />
            <span className="text-sm font-medium group-hover:text-blue-700">Manage Users</span>
          </button>
          <button 
            onClick={() => handleQuickAction('tickets')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-green-300 transition-colors group"
          >
            <MessageSquare className="h-6 w-6 text-green-600 mb-2 group-hover:text-green-700" />
            <span className="text-sm font-medium group-hover:text-green-700">View Tickets</span>
          </button>
          <button 
            onClick={() => handleQuickAction('content')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-purple-300 transition-colors group"
          >
            <FileText className="h-6 w-6 text-purple-600 mb-2 group-hover:text-purple-700" />
            <span className="text-sm font-medium group-hover:text-purple-700">Manage Content</span>
          </button>
          <button 
            onClick={() => handleQuickAction('analytics')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-orange-300 transition-colors group"
          >
            <BarChart3 className="h-6 w-6 text-orange-600 mb-2 group-hover:text-orange-700" />
            <span className="text-sm font-medium group-hover:text-orange-700">Analytics</span>
          </button>
          <button 
            onClick={() => handleQuickAction('billing')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-yellow-300 transition-colors group"
          >
            <DollarSign className="h-6 w-6 text-yellow-600 mb-2 group-hover:text-yellow-700" />
            <span className="text-sm font-medium group-hover:text-yellow-700">Billing</span>
          </button>
          <button 
            onClick={() => handleQuickAction('system')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-red-300 transition-colors group"
          >
            <Database className="h-6 w-6 text-red-600 mb-2 group-hover:text-red-700" />
            <span className="text-sm font-medium group-hover:text-red-700">System Status</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Recent System Activity</h3>
        <div className="space-y-3">
          {stats?.recentActivities?.length ? (
            stats.recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
                <div className="ml-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activity.type === 'user' ? 'bg-blue-100 text-blue-800' :
                    activity.type === 'support' ? 'bg-yellow-100 text-yellow-800' :
                    activity.type === 'system' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.type}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
} 