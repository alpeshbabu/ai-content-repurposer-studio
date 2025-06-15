'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  DollarSign, 
  TrendingUp, 
  Mail, 
  Home, 
  ChevronRight,
  Activity,
  AlertTriangle,
  Crown,
  Calendar,
  CreditCard,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Target,
  BarChart3,
  PieChart,
  TrendingDown
} from 'lucide-react';
import { AdminProvider, RequirePermission, AccessDenied } from '@/components/admin/AdminAccessControl';
import { PERMISSIONS } from '@/lib/rbac';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionStartDate: string;
  subscriptionRenewalDate: string | null;
  usageThisMonth: number;
  totalUsage: number;
  role: string | null;
  createdAt: string;
  emailVerified: string | null;
  lastActiveAt: string;
  monthlyRevenue: number;
  lifetimeValue: number;
  churnRisk: string;
  subscriptionLength: number;
}

interface SubscriberStats {
  totalSubscribers: number;
  activeSubscribers: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  churnRate: number;
  newSubscribersThisMonth: number;
  subscriptionBreakdown: Record<string, number>;
  revenueByPlan: Record<string, number>;
  totalLifetimeValue: number;
}

function AdminSubscribersContent() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [churnRiskFilter, setChurnRiskFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `/api/admin/subscribers?page=${currentPage}&limit=20`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (planFilter !== 'all') url += `&plan=${planFilter}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      url += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;
      
      console.log('Fetching subscribers from:', url);
      
      const token = localStorage.getItem('admin_token');
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch subscribers' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Subscribers data:', data);
      
      setSubscribers(data.subscribers || []);
      setStats(data.stats || null);
      setTotalPages(data.totalPages || 1);
      
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      setError('Failed to load subscribers. Please try again later.');
      setSubscribers([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [currentPage, searchTerm, planFilter, statusFilter, sortBy, sortOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSubscribers();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setPlanFilter('all');
    setStatusFilter('all');
    setChurnRiskFilter('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const exportSubscribers = () => {
    // Create CSV data
    const csvHeaders = ['Email', 'Name', 'Plan', 'Status', 'MRR', 'LTV', 'Churn Risk', 'Start Date', 'Renewal Date'];
    const csvData = subscribers.map(sub => [
      sub.email,
      sub.name || 'N/A',
      sub.subscriptionPlan,
      sub.subscriptionStatus,
      `$${sub.monthlyRevenue}`,
      `$${sub.lifetimeValue.toFixed(2)}`,
      sub.churnRisk,
      new Date(sub.subscriptionStartDate).toLocaleDateString(),
      sub.subscriptionRenewalDate ? new Date(sub.subscriptionRenewalDate).toLocaleDateString() : 'N/A'
    ]);

    const csv = [csvHeaders, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredSubscribers = subscribers.filter(subscriber => {
    if (churnRiskFilter !== 'all' && subscriber.churnRisk !== churnRiskFilter) {
      return false;
    }
    return true;
  });

  const getPlanBadgeColor = (plan: string) => {
    const colors = {
      'basic': 'bg-green-100 text-green-800',
      'pro': 'bg-blue-100 text-blue-800',
      'agency': 'bg-purple-100 text-purple-800'
    };
    return colors[plan as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'canceled': 'bg-red-100 text-red-800',
      'past_due': 'bg-yellow-100 text-yellow-800',
      'paused': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getChurnRiskColor = (risk: string) => {
    const colors = {
      'low': 'text-green-600',
      'medium': 'text-yellow-600',
      'high': 'text-red-600',
      'churned': 'text-gray-600'
    };
    return colors[risk as keyof typeof colors] || 'text-gray-600';
  };

  const getChurnRiskIcon = (risk: string) => {
    const icons = {
      'low': CheckCircle,
      'medium': Clock,
      'high': AlertTriangle,
      'churned': XCircle
    };
    return icons[risk as keyof typeof icons] || Clock;
  };

  if (loading && subscribers.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-gray-600">Loading subscribers...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && subscribers.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Subscribers</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchSubscribers}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
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
        <span className="text-gray-900 font-medium">Subscriber Management</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscriber Management</h1>
          <p className="text-gray-600 mt-1">Manage paid subscribers, subscriptions, and revenue insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={exportSubscribers}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={fetchSubscribers}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Revenue & Subscription Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Subscribers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSubscribers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Subscribers</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeSubscribers}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-emerald-600">${stats.monthlyRecurringRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Revenue/User</p>
                <p className="text-2xl font-bold text-blue-600">${stats.averageRevenuePerUser.toFixed(0)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Churn Rate</p>
                <p className="text-2xl font-bold text-red-600">{stats.churnRate.toFixed(1)}%</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Subscription Breakdown */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-blue-500" />
              Subscription Plans
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.subscriptionBreakdown).map(([plan, count]) => (
                <div key={plan} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      plan === 'agency' ? 'bg-purple-500' :
                      plan === 'pro' ? 'bg-blue-500' :
                      'bg-green-500'
                    }`}></div>
                    <span className="text-sm text-gray-600 capitalize">{plan}</span>
                  </div>
                  <span className="text-sm font-medium">{count} subscribers</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-green-500" />
              Revenue by Plan
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.revenueByPlan).map(([plan, revenue]) => (
                <div key={plan} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      plan === 'agency' ? 'bg-purple-500' :
                      plan === 'pro' ? 'bg-blue-500' :
                      'bg-green-500'
                    }`}></div>
                    <span className="text-sm text-gray-600 capitalize">{plan}</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">${revenue.toLocaleString()}/mo</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Plans</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="agency">Agency</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="canceled">Canceled</option>
                <option value="past_due">Past Due</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Churn Risk</label>
              <select
                value={churnRiskFilter}
                onChange={(e) => setChurnRiskFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
                <option value="churned">Churned</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">Join Date</option>
                <option value="subscriptionStartDate">Subscription Start</option>
                <option value="lifetimeValue">Lifetime Value</option>
                <option value="monthlyRevenue">Monthly Revenue</option>
                <option value="usageThisMonth">Usage</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Reset Filters
            </button>
          </div>
        </form>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Subscribers</h3>
            <span className="text-sm text-gray-500">
              {filteredSubscribers.length} of {subscribers.length} subscribers
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscriber
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan & Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Churn Risk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubscribers.map((subscriber) => {
                const ChurnIcon = getChurnRiskIcon(subscriber.churnRisk);
                return (
                  <tr key={subscriber.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {subscriber.name || 'Unnamed User'}
                            {subscriber.subscriptionPlan === 'agency' && (
                              <Crown className="h-4 w-4 text-purple-500 ml-2" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {subscriber.email}
                          </div>
                          <div className="text-xs text-gray-400">
                            Since {new Date(subscriber.subscriptionStartDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanBadgeColor(subscriber.subscriptionPlan)}`}>
                          {subscriber.subscriptionPlan}
                        </span>
                        <br />
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(subscriber.subscriptionStatus)}`}>
                          {subscriber.subscriptionStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">${subscriber.monthlyRevenue}/mo</div>
                        <div className="text-xs text-gray-500">LTV: ${subscriber.lifetimeValue.toFixed(0)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{subscriber.usageThisMonth.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Total: {subscriber.totalUsage.toLocaleString()}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center text-sm ${getChurnRiskColor(subscriber.churnRisk)}`}>
                        <ChurnIcon className="h-4 w-4 mr-1" />
                        <span className="capitalize">{subscriber.churnRisk}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {subscriber.subscriptionLength} months
                        </div>
                        {subscriber.subscriptionRenewalDate && (
                          <div className="text-xs text-gray-400 mt-1">
                            Renews: {new Date(subscriber.subscriptionRenewalDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/admin/subscribers/${subscriber.id}`}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminSubscribersPage() {
  return (
    <AdminProvider>
      <RequirePermission 
        permission={PERMISSIONS.USERS_MANAGEMENT}
        fallback={<AccessDenied />}
      >
        <AdminSubscribersContent />
      </RequirePermission>
    </AdminProvider>
  );
} 