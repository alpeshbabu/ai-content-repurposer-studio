'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart
} from 'recharts';
import {
  TrendingUp, Users, DollarSign, Target, Star, Award, AlertCircle,
  Clock, BarChart3, PieChart as PieChartIcon, Activity, Briefcase,
  MessageSquare, Eye, Share2, Heart, Calendar, Filter, Download,
  ChevronDown, ArrowUpRight, ArrowDownRight, CheckCircle, AlertTriangle,
  Info, Crown, Shield, Headphones, Lightbulb, Zap, Globe
} from 'lucide-react';

interface AgencyAnalyticsDashboardProps {
  user: any;
  team: any;
  analytics: any;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

export default function AgencyAnalyticsDashboard({ user, team, analytics }: AgencyAnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [selectedClient, setSelectedClient] = useState('all');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'team', label: 'Team Performance', icon: Users },
    { id: 'clients', label: 'Client Analytics', icon: Briefcase },
    { id: 'content', label: 'Content Insights', icon: Activity },
    { id: 'roi', label: 'ROI Analysis', icon: DollarSign },
    { id: 'competitive', label: 'Market Analysis', icon: Globe },
  ];

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

  const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

  const renderAlert = (alert: any, index: number) => {
    const iconMap = {
      success: CheckCircle,
      warning: AlertTriangle,
      info: Info,
    };
    const colorMap = {
      success: 'text-green-600 bg-green-50 border-green-200',
      warning: 'text-amber-600 bg-amber-50 border-amber-200',
      info: 'text-blue-600 bg-blue-50 border-blue-200',
    };
    
    const IconComponent = iconMap[alert.type];
    const colorClass = colorMap[alert.type];

    return (
      <div key={index} className={`p-4 rounded-lg border ${colorClass}`}>
        <div className="flex items-start">
          <IconComponent className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium">{alert.title}</h4>
            <p className="text-sm mt-1 opacity-90">{alert.message}</p>
            <p className="text-xs mt-2 opacity-75">
              {new Date(alert.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Crown className="h-8 w-8 mr-3 text-purple-600" />
                Agency Analytics
              </h1>
              <p className="text-gray-600 mt-2">
                Comprehensive insights for your agency operations and client management
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Content Created</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalContentCreated}</p>
                    <p className="text-sm text-green-600 flex items-center mt-1">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      +{analytics.overview.thisMonthContent} this month
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Clients</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalClients}</p>
                    <p className="text-sm text-purple-600 flex items-center mt-1">
                      <Briefcase className="h-4 w-4 mr-1" />
                      {analytics.overview.activeProjects} projects
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Team Productivity</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.overview.teamProductivity.toFixed(1)}%</p>
                    <p className="text-sm text-orange-600 flex items-center mt-1">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Above target
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-orange-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Client Satisfaction</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.overview.clientSatisfaction.toFixed(1)}/5</p>
                    <p className="text-sm text-yellow-600 flex items-center mt-1">
                      <Star className="h-4 w-4 mr-1" />
                      Excellent rating
                    </p>
                  </div>
                  <Heart className="h-8 w-8 text-red-500" />
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Team Productivity Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.teamPerformance.productivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <YAxis />
                    <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <Line type="monotone" dataKey="efficiency" stroke="#8B5CF6" strokeWidth={2} />
                    <Line type="monotone" dataKey="content" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Content Quality Metrics</h3>
                <div className="space-y-4">
                  {Object.entries(analytics.contentInsights.qualityMetrics).map(([metric, value]) => (
                    <div key={metric} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">
                        {metric.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${(value as number)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{(value as number).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-blue-500" />
                Recent Alerts & Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analytics.alerts.map(renderAlert)}
              </div>
            </div>
          </div>
        )}

        {/* Team Performance Tab */}
        {activeTab === 'team' && (
          <div className="space-y-8">
            {/* Team Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
                <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{analytics.teamPerformance.members.length}</p>
                <p className="text-sm text-gray-600">Team Members</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
                <Briefcase className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{analytics.teamPerformance.collaboration.sharedProjects}</p>
                <p className="text-sm text-gray-600">Shared Projects</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
                <MessageSquare className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{analytics.teamPerformance.collaboration.peerReviews}</p>
                <p className="text-sm text-gray-600">Peer Reviews</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
                <Lightbulb className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{analytics.teamPerformance.collaboration.knowledgeSharing}</p>
                <p className="text-sm text-gray-600">Knowledge Shares</p>
              </div>
            </div>

            {/* Team Members Performance */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Individual Performance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Team Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Content Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Efficiency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tasks Completed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.teamPerformance.members.map((member: any) => (
                      <tr key={member.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            <div className="text-sm text-gray-500">{member.role}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.contentCreated}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${member.efficiency}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-900">{member.efficiency.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            <span className="text-sm text-gray-900">{member.clientRating.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.tasksCompleted}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Team Productivity Chart */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Daily Team Productivity</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={analytics.teamPerformance.productivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="content" fill="#8B5CF6" name="Content Created" />
                  <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#10B981" strokeWidth={2} name="Efficiency %" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Client Analytics Tab */}
        {activeTab === 'clients' && (
          <div className="space-y-8">
            {/* Client Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Client Performance Overview</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={analytics.clientAnalytics.clients.slice(0, 5)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="contentVolume"
                    >
                      {analytics.clientAnalytics.clients.slice(0, 5).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Client Growth Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={analytics.clientAnalytics.performance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="newClients" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" />
                    <Area type="monotone" dataKey="retainedClients" stackId="1" stroke="#10B981" fill="#10B981" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Revenue by Client</h3>
                <div className="space-y-3">
                  {analytics.clientAnalytics.clients.slice(0, 5).map((client: any) => (
                    <div key={client.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{client.name}</span>
                      <span className="text-sm font-medium">{formatCurrency(client.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Client Details Table */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Client Details</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Industry
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Content Volume
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Engagement
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ROI
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Satisfaction
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.clientAnalytics.clients.map((client: any) => (
                      <tr key={client.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {client.industry}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {client.contentVolume}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {client.engagement.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {client.roi.toFixed(0)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            <span className="text-sm text-gray-900">{client.satisfaction.toFixed(1)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Content Insights Tab */}
        {activeTab === 'content' && (
          <div className="space-y-8">
            {/* Platform Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Platform Performance</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.contentInsights.platforms}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="posts" fill="#8B5CF6" name="Posts" />
                    <Bar dataKey="engagement" fill="#10B981" name="Engagement %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Content Types Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.contentInsights.contentTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, count }) => `${type}: ${count}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.contentInsights.contentTypes.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Content Calendar */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Content Calendar Performance</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analytics.contentInsights.contentCalendar.slice(0, 14)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <YAxis />
                  <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <Legend />
                  <Line type="monotone" dataKey="scheduled" stroke="#8B5CF6" strokeWidth={2} name="Scheduled" />
                  <Line type="monotone" dataKey="published" stroke="#10B981" strokeWidth={2} name="Published" />
                  <Line type="monotone" dataKey="performance" stroke="#F59E0B" strokeWidth={2} name="Performance %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ROI Analysis Tab */}
        {activeTab === 'roi' && (
          <div className="space-y-8">
            {/* ROI Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{analytics.roiAnalytics.overall.roi.toFixed(0)}%</p>
                  <p className="text-sm text-gray-600">Overall ROI</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="text-center">
                  <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.roiAnalytics.overall.costPerLead)}</p>
                  <p className="text-sm text-gray-600">Cost per Lead</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.roiAnalytics.overall.ltv)}</p>
                  <p className="text-sm text-gray-600">Customer LTV</p>
                </div>
              </div>
            </div>

            {/* ROI Trends */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">ROI Trend Analysis</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={analytics.roiAnalytics.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="investment" fill="#EF4444" name="Investment" />
                  <Bar yAxisId="left" dataKey="revenue" fill="#10B981" name="Revenue" />
                  <Line yAxisId="right" type="monotone" dataKey="roi" stroke="#8B5CF6" strokeWidth={3} name="ROI %" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Client ROI Table */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Client ROI Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Investment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ROI
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Leads
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conversions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.roiAnalytics.byClient.map((client: any) => (
                      <tr key={client.client}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {client.client}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(client.investment)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(client.revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${client.roi > 150 ? 'text-green-600' : client.roi > 100 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {client.roi.toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {client.leads}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {client.conversions}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Competitive Analysis Tab */}
        {activeTab === 'competitive' && (
          <div className="space-y-8">
            {/* Market Position */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Market Position</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={Object.entries(analytics.competitiveAnalysis.marketPosition).map(([key, value]) => ({
                    metric: key.replace(/([A-Z])/g, ' $1').trim(),
                    value: value,
                    fullMark: 100,
                  }))}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Your Performance" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Industry Benchmarks</h3>
                <div className="space-y-4">
                  {Object.entries(analytics.competitiveAnalysis.benchmarks).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim().replace('Avg', 'Average')}
                      </span>
                      <span className="text-sm font-medium">
                        {typeof value === 'number' ? (
                          key.includes('ROI') || key.includes('Engagement') ? `${value}%` : value
                        ) : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance Comparison */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Performance vs Industry</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analytics.competitiveAnalysis.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="yourPerformance" stroke="#8B5CF6" strokeWidth={3} name="Your Performance" />
                  <Line type="monotone" dataKey="industryAverage" stroke="#10B981" strokeWidth={2} name="Industry Average" />
                  <Line type="monotone" dataKey="topPerformer" stroke="#F59E0B" strokeWidth={2} name="Top Performer" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 