'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, DollarSign, Users, FileText, MessageSquare, Star,
  Calendar, Activity, ArrowUpRight, ArrowDownRight, RefreshCw, Download,
  AlertTriangle, ChevronRight, Home
} from 'lucide-react';
import Link from 'next/link';

interface AnalyticsData {
  success?: boolean;
  overview: {
    totalRevenue: number;
    totalUsers: number;
    totalContent: number;
    totalTickets: number;
    revenueChange: number;
    userGrowth: number;
    contentGrowth: number;
    ticketChange: number;
  };
  financial: {
    monthlyRevenue: Array<{ month: string; revenue: number; subscriptions: number }>;
    revenueByPlan: Array<{ plan: string; revenue: number; users: number; percentage?: number }>;
    overageCharges: Array<{ month: string; amount: number; count: number }>;
  };
  users: {
    registrationTrend: Array<{ date: string; users: number }>;
    subscriptionBreakdown: Array<{ plan: string; count: number; percentage: number }>;
    userActivity: Array<{ date: string; active: number; total: number }>;
    topUsers: Array<{ name: string; email: string; plan: string; usage: number }>;
  };
  content: {
    contentByType: Array<{ type: string; count: number }>;
    contentCreationTrend: Array<{ date: string; count: number }>;
    topPerformers: Array<{ title: string; author: string; repurposed: number }>;
    usageByPlan: Array<{ plan: string; usage: number; limit: number }>;
  };
  support: {
    ticketsByStatus: Array<{ status: string; count: number }>;
    ticketsByPriority: Array<{ priority: string; count: number }>;
    resolutionTime: Array<{ month: string; avgHours: number }>;
    ticketTrend: Array<{ date: string; created: number; resolved: number }>;
  };
  reviews: {
    averageRating: number;
    ratingDistribution: Array<{ rating: number; count: number }>;
    recentReviews: Array<{ rating: number; title: string; message: string; user: string; date: string }>;
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30d');
  const router = useRouter();

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        setError('No admin token found. Please log in again.');
        return;
      }

      const response = await fetch(`/api/admin/analytics?range=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const analyticsData = await response.json();

      if (response.ok && analyticsData.success) {
        // Add percentage calculation for revenue by plan
        if (analyticsData.financial?.revenueByPlan) {
          const totalRevenue = analyticsData.financial.revenueByPlan.reduce((sum: number, plan: any) => sum + plan.revenue, 0);
          analyticsData.financial.revenueByPlan = analyticsData.financial.revenueByPlan.map((plan: any) => ({
            ...plan,
            percentage: totalRevenue > 0 ? Math.round((plan.revenue / totalRevenue) * 100) : 0
          }));
        }
        
        setData(analyticsData);
      } else if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
        localStorage.removeItem('admin_token');
      } else {
        setError(analyticsData.error || 'Failed to fetch analytics data');
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError('Network error occurred while fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!data) {
      alert('No data available to export');
      return;
    }
    
    try {
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data');
    }
  };

  const formatCurrency = (value: number) => {
    return `$${(value / 100).toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Safe data accessors with fallbacks
  const safeData = {
    overview: data?.overview || {
      totalRevenue: 0,
      totalUsers: 0,
      totalContent: 0,
      totalTickets: 0,
      revenueChange: 0,
      userGrowth: 0,
      contentGrowth: 0,
      ticketChange: 0
    },
    financial: {
      monthlyRevenue: data?.financial?.monthlyRevenue || [],
      revenueByPlan: data?.financial?.revenueByPlan || [],
      overageCharges: data?.financial?.overageCharges || []
    },
    users: {
      registrationTrend: data?.users?.registrationTrend || [],
      subscriptionBreakdown: data?.users?.subscriptionBreakdown || [],
      userActivity: data?.users?.userActivity || [],
      topUsers: data?.users?.topUsers || []
    },
    content: {
      contentByType: data?.content?.contentByType || [],
      contentCreationTrend: data?.content?.contentCreationTrend || [],
      topPerformers: data?.content?.topPerformers || [],
      usageByPlan: data?.content?.usageByPlan || []
    },
    support: {
      ticketsByStatus: data?.support?.ticketsByStatus || [],
      ticketsByPriority: data?.support?.ticketsByPriority || [],
      resolutionTime: data?.support?.resolutionTime || [],
      ticketTrend: data?.support?.ticketTrend || []
    },
    reviews: {
      averageRating: data?.reviews?.averageRating || 0,
      ratingDistribution: data?.reviews?.ratingDistribution || [],
      recentReviews: data?.reviews?.recentReviews || []
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
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
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Analytics</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Retry
            </button>
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center text-sm text-gray-500 mb-2">
        <Link 
          href="/admin/dashboard" 
          className="flex items-center hover:text-gray-700 transition-colors"
        >
          <Home className="h-4 w-4 mr-1" />
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="text-gray-900 font-medium">Analytics</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive platform insights and metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={exportData}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(safeData.overview.totalRevenue)}
              </p>
              <p className={`text-sm flex items-center ${
                safeData.overview.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {safeData.overview.revenueChange >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                )}
                {formatPercent(safeData.overview.revenueChange)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{safeData.overview.totalUsers.toLocaleString()}</p>
              <p className={`text-sm flex items-center ${
                safeData.overview.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {safeData.overview.userGrowth >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                )}
                {formatPercent(safeData.overview.userGrowth)}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Content</p>
              <p className="text-2xl font-bold text-gray-900">{safeData.overview.totalContent.toLocaleString()}</p>
              <p className={`text-sm flex items-center ${
                safeData.overview.contentGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {safeData.overview.contentGrowth >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                )}
                {formatPercent(safeData.overview.contentGrowth)}
              </p>
            </div>
            <FileText className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Support Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{safeData.overview.totalTickets}</p>
              <p className={`text-sm flex items-center ${
                safeData.overview.ticketChange <= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {safeData.overview.ticketChange <= 0 ? (
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                )}
                {formatPercent(Math.abs(safeData.overview.ticketChange))}
              </p>
            </div>
            <MessageSquare className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Financial Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={safeData.financial.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value: any) => [formatCurrency(value), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue by Subscription Plan</h3>
          {safeData.financial.revenueByPlan.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={safeData.financial.revenueByPlan}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ plan, percentage }) => `${plan} (${percentage || 0}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {safeData.financial.revenueByPlan.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [formatCurrency(value), 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No revenue data available</p>
            </div>
          )}
        </div>
      </div>

      {/* User Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">User Registration Trend</h3>
          {safeData.users.registrationTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={safeData.users.registrationTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis />
                <Tooltip labelFormatter={formatDate} />
                <Line type="monotone" dataKey="users" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No registration data available</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Subscription Distribution</h3>
          {safeData.users.subscriptionBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={safeData.users.subscriptionBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plan" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No subscription data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Content Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Content by Type</h3>
          {safeData.content.contentByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={safeData.content.contentByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, count }) => `${type} (${count})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {safeData.content.contentByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No content data available</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Content Creation Trend</h3>
          {safeData.content.contentCreationTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={safeData.content.contentCreationTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis />
                <Tooltip labelFormatter={formatDate} />
                <Area type="monotone" dataKey="count" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No content creation data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Support Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Support Tickets by Status</h3>
          {safeData.support.ticketsByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={safeData.support.ticketsByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No support ticket data available</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Average Resolution Time</h3>
          {safeData.support.resolutionTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={safeData.support.resolutionTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`${value} hours`, 'Avg Resolution Time']} />
                <Line type="monotone" dataKey="avgHours" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No resolution time data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Top Content Creators</h3>
          <div className="space-y-3">
            {safeData.content.topPerformers.length > 0 ? (
              safeData.content.topPerformers.slice(0, 5).map((user, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.title}</p>
                    <p className="text-xs text-gray-500">{user.author}</p>
                  </div>
                  <span className="text-sm text-blue-600">{user.repurposed} repurposed</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No content creator data available</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Reviews</h3>
          <div className="space-y-3">
            {safeData.reviews.recentReviews.length > 0 ? (
              safeData.reviews.recentReviews.slice(0, 3).map((review, index) => (
                <div key={index} className="border-l-2 border-blue-200 pl-3">
                  <div className="flex items-center mb-1">
                    <div className="flex">
                      {Array.from({ length: Math.max(0, Math.min(5, review.rating)) }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 ml-2">{review.user}</span>
                  </div>
                  <p className="text-sm text-gray-700">{review.message}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No reviews available</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Platform Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Rating</span>
              <div className="flex items-center">
                <span className="text-lg font-semibold text-gray-900 mr-1">
                  {safeData.reviews.averageRating.toFixed(1)}
                </span>
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">System Uptime</span>
              <span className="text-sm font-medium text-green-600">99.9%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Response Time</span>
              <span className="text-sm font-medium text-blue-600">142ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Sessions</span>
              <span className="text-sm font-medium text-gray-900">
                {Math.floor(Math.random() * 1000) + 500}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 