'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart
} from 'recharts';
import {
  DollarSign, TrendingUp, TrendingDown, Users, CreditCard, AlertTriangle,
  Calendar, Download, RefreshCw, ArrowUpRight, ArrowDownRight, CheckCircle,
  XCircle, Clock, Target, Zap, BarChart3
} from 'lucide-react';

interface BillingData {
  overview: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    averageRevenuePerUser: number;
    customerLifetimeValue: number;
    churnRate: number;
    revenueGrowth: number;
    totalCustomers: number;
    paidCustomers: number;
  };
  revenue: {
    monthlyRevenue: Array<{ month: string; subscription: number; overage: number; total: number }>;
    revenueByPlan: Array<{ plan: string; revenue: number; customers: number; percentage: number }>;
    revenueForecast: Array<{ month: string; projected: number; actual?: number }>;
  };
  subscriptions: {
    planDistribution: Array<{ plan: string; count: number; mrr: number; percentage: number }>;
    subscriptionTrends: Array<{ month: string; new: number; churned: number; net: number }>;
    upgrades: Array<{ month: string; upgrades: number; downgrades: number }>;
    retentionCohorts: Array<{ cohort: string; month1: number; month3: number; month6: number; month12: number }>;
  };
  payments: {
    paymentMethods: Array<{ method: string; count: number; percentage: number }>;
    paymentStatus: Array<{ status: string; count: number; amount: number }>;
    failedPayments: Array<{ month: string; failed: number; recovered: number; amount: number }>;
    dunningAnalytics: { totalFailed: number; recovered: number; recoveryRate: number };
  };
  overage: {
    overageRevenue: Array<{ month: string; revenue: number; customers: number }>;
    topOverageCustomers: Array<{ name: string; email: string; amount: number; plan: string }>;
    overageByPlan: Array<{ plan: string; totalOverage: number; customerCount: number; avgPerCustomer: number }>;
  };
  insights: {
    topCustomers: Array<{ name: string; email: string; plan: string; totalSpent: number; mrr: number }>;
    revenueRisks: Array<{ type: string; description: string; impact: number; customers: number }>;
    opportunities: Array<{ type: string; description: string; potential: number; confidence: number }>;
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
const PLAN_COLORS = {
  'free': '#6B7280',
  'basic': '#3B82F6', 
  'pro': '#10B981',
  'agency': '#8B5CF6'
};

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('12m');
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  useEffect(() => {
    fetchBillingData();
  }, [dateRange]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        setError('No admin token found. Please log in again.');
        return;
      }

      const response = await fetch(`/api/admin/billing?range=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const responseData = await response.json();

      if (response.ok) {
        // Check if the response has success property and handle accordingly
        if (responseData.success !== false) {
          setData(responseData);
          setError(null);
        } else {
          setError(responseData.error || 'Failed to fetch billing data');
        }
      } else if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
        localStorage.removeItem('admin_token');
      } else {
        setError(responseData.error || responseData.message || 'Failed to fetch billing data');
      }
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError('Network error occurred while fetching billing data');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `billing-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

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
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={fetchBillingData}
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'subscriptions', label: 'Subscriptions', icon: Users },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'overage', label: 'Overage', icon: Zap },
    { id: 'insights', label: 'Insights', icon: Target }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive revenue and subscription insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="3m">Last 3 months</option>
            <option value="6m">Last 6 months</option>
            <option value="12m">Last 12 months</option>
            <option value="24m">Last 24 months</option>
          </select>
          <button
            onClick={exportData}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={fetchBillingData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data?.overview.totalRevenue || 0)}
              </p>
              <p className={`text-sm flex items-center ${
                (data?.overview.revenueGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(data?.overview.revenueGrowth || 0) >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                )}
                {formatPercentage(Math.abs(data?.overview.revenueGrowth || 0))} vs last period
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Recurring Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data?.overview.monthlyRecurringRevenue || 0)}
              </p>
              <p className="text-sm text-gray-500">
                {data?.overview.paidCustomers || 0} paying customers
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ARPU</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data?.overview.averageRevenuePerUser || 0)}
              </p>
              <p className="text-sm text-gray-500">Average Revenue Per User</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Customer LTV</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data?.overview.customerLifetimeValue || 0)}
              </p>
              <p className="text-sm text-gray-500">
                {formatPercentage(data?.overview.churnRate || 0)} churn rate
              </p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-50">
              <Target className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={data?.revenue.monthlyRevenue || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => [formatCurrency(value), '']} />
                <Bar dataKey="subscription" stackId="a" fill="#3B82F6" name="Subscription" />
                <Bar dataKey="overage" stackId="a" fill="#10B981" name="Overage" />
                <Line type="monotone" dataKey="total" stroke="#EF4444" strokeWidth={2} name="Total" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue by Plan</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.revenue.revenueByPlan || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ plan, percentage }) => `${plan} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {(data?.revenue.revenueByPlan || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PLAN_COLORS[entry.plan as keyof typeof PLAN_COLORS] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [formatCurrency(value), 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Monthly Revenue Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data?.revenue.monthlyRevenue || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [formatCurrency(value), '']} />
                  <Area type="monotone" dataKey="subscription" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="overage" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue Forecast</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.revenue.revenueForecast || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [formatCurrency(value), '']} />
                  <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={2} name="Actual" />
                  <Line type="monotone" dataKey="projected" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" name="Projected" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue by Plan Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customers</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ARPU</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(data?.revenue.revenueByPlan || []).map((plan, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3`} 
                               style={{ backgroundColor: PLAN_COLORS[plan.plan as keyof typeof PLAN_COLORS] || COLORS[index % COLORS.length] }}>
                          </div>
                          <span className="text-sm font-medium text-gray-900 capitalize">{plan.plan}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(plan.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {plan.customers.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPercentage(plan.percentage)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(plan.customers > 0 ? plan.revenue / plan.customers : 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Subscription Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.subscriptions.planDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="plan" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" name="Customers" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Subscription Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={data?.subscriptions.subscriptionTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="new" fill="#10B981" name="New" />
                  <Bar dataKey="churned" fill="#EF4444" name="Churned" />
                  <Line type="monotone" dataKey="net" stroke="#3B82F6" strokeWidth={2} name="Net Growth" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Plan Changes</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.subscriptions.upgrades || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="upgrades" fill="#10B981" name="Upgrades" />
                  <Bar dataKey="downgrades" fill="#F59E0B" name="Downgrades" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Retention Cohorts</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cohort</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month 1</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month 3</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month 6</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month 12</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(data?.subscriptions.retentionCohorts || []).map((cohort, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cohort.cohort}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatPercentage(cohort.month1)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatPercentage(cohort.month3)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatPercentage(cohort.month6)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatPercentage(cohort.month12)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data?.payments.paymentMethods || []}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ method, percentage }) => `${method} (${percentage}%)`}
                  >
                    {(data?.payments.paymentMethods || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Payment Status</h3>
              <div className="space-y-3">
                {(data?.payments.paymentStatus || []).map((status, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      {status.status === 'successful' && <CheckCircle className="h-4 w-4 text-green-500 mr-2" />}
                      {status.status === 'failed' && <XCircle className="h-4 w-4 text-red-500 mr-2" />}
                      {status.status === 'pending' && <Clock className="h-4 w-4 text-yellow-500 mr-2" />}
                      <span className="text-sm capitalize">{status.status}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{status.count}</div>
                      <div className="text-xs text-gray-500">{formatCurrency(status.amount)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Dunning Analytics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Failed Payments</span>
                  <span className="text-lg font-semibold text-red-600">
                    {data?.payments.dunningAnalytics.totalFailed || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Recovered</span>
                  <span className="text-lg font-semibold text-green-600">
                    {data?.payments.dunningAnalytics.recovered || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Recovery Rate</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {formatPercentage(data?.payments.dunningAnalytics.recoveryRate || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Failed Payment Recovery</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={data?.payments.failedPayments || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="failed" fill="#EF4444" name="Failed" />
                <Bar yAxisId="left" dataKey="recovered" fill="#10B981" name="Recovered" />
                <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#F59E0B" strokeWidth={2} name="Amount" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'overage' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Overage Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={data?.overage.overageRevenue || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="revenue" fill="#8B5CF6" name="Revenue" />
                  <Line yAxisId="right" type="monotone" dataKey="customers" stroke="#3B82F6" strokeWidth={2} name="Customers" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Overage by Plan</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.overage.overageByPlan || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="plan" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [formatCurrency(value), '']} />
                  <Bar dataKey="totalOverage" fill="#8B5CF6" name="Total Overage" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Top Overage Customers</h3>
              <div className="space-y-3">
                {(data?.overage.topOverageCustomers || []).slice(0, 10).map((customer, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{customer.name || 'Anonymous'}</p>
                      <p className="text-xs text-gray-500">{customer.email} • {customer.plan}</p>
                    </div>
                    <span className="text-sm font-medium text-purple-600">
                      {formatCurrency(customer.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Overage Statistics by Plan</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customers</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg/Customer</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(data?.overage.overageByPlan || []).map((plan, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                          {plan.plan}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(plan.totalOverage)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {plan.customerCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(plan.avgPerCustomer)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Top Revenue Customers</h3>
              <div className="space-y-4">
                {(data?.insights.topCustomers || []).slice(0, 10).map((customer, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{customer.name || 'Anonymous'}</p>
                      <p className="text-xs text-gray-500">{customer.email} • {customer.plan}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(customer.totalSpent)}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(customer.mrr)}/mo</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue Opportunities</h3>
              <div className="space-y-4">
                {(data?.insights.opportunities || []).map((opportunity, index) => (
                  <div key={index} className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-green-900">{opportunity.type}</h4>
                        <p className="text-sm text-green-700 mt-1">{opportunity.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-900">{formatCurrency(opportunity.potential)}</p>
                        <p className="text-xs text-green-600">{formatPercentage(opportunity.confidence)} confidence</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue Risks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(data?.insights.revenueRisks || []).map((risk, index) => (
                <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-900">{risk.type}</h4>
                      <p className="text-sm text-red-700 mt-1">{risk.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-red-600">{risk.customers} customers</span>
                        <span className="text-sm font-medium text-red-900">{formatCurrency(risk.impact)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 