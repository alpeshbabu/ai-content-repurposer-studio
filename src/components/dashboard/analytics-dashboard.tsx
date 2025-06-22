'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Share2,
  Calendar,
  Download,
  RefreshCw,
  Target,
  Activity,
  PieChart,
  LineChart
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsData {
  timeframe: string;
  period: {
    start: string;
    end: string;
  };
  events: number;
  usageMetrics: {
    contentGenerated: number;
    contentRepurposed: number;
    platformsUsed: string[];
    templatesUsed: number;
    collaborationEvents: number;
    apiCalls: number;
  };
  contentAnalytics: {
    totalViews: number;
    totalRepurposes: number;
    avgViews: number;
    avgRepurposes: number;
  };
  topActions: Record<string, number>;
  activityTimeline: Array<{
    time: string;
    events: number;
  }>;
}

interface ContentAnalytics {
  contentStats: Array<{
    status: string;
    count: number;
  }>;
  platformStats: Array<{
    platform: string;
    count: number;
  }>;
  topContent: Array<{
    id: string;
    title: string;
    views: number;
    repurposes: number;
    createdAt: string;
  }>;
}

interface UsageAnalytics {
  dailyUsage: Record<string, number>;
  monthlyUsage: number;
  subscription: any;
  plan: string;
  usagePercentage: number;
}

interface PerformanceAnalytics {
  contentPerformance: Array<{
    contentId: string;
    title: string;
    views: number;
    repurposes: number;
    engagement: any;
    performance: any;
    createdAt: string;
  }>;
  averageMetrics: {
    avgViews: number;
    avgRepurposes: number;
    totalViews: number;
    totalRepurposes: number;
  };
}

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [overviewData, setOverviewData] = useState<AnalyticsData | null>(null);
  const [contentData, setContentData] = useState<ContentAnalytics | null>(null);
  const [usageData, setUsageData] = useState<UsageAnalytics | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceAnalytics | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const [overview, content, usage, performance] = await Promise.all([
        fetch(`/api/analytics?type=overview&timeframe=${timeframe}`).then(r => r.json()),
        fetch(`/api/analytics?type=content&timeframe=${timeframe}`).then(r => r.json()),
        fetch(`/api/analytics?type=usage&timeframe=${timeframe}`).then(r => r.json()),
        fetch(`/api/analytics?type=performance&timeframe=${timeframe}`).then(r => r.json())
      ]);

      console.log('Analytics API responses:', { overview, content, usage, performance });

      if (overview.success) {
        console.log('Setting overview data:', overview.data);
        setOverviewData(overview.data);
      } else {
        console.error('Overview API error:', overview);
      }
      
      if (content.success) {
        console.log('Setting content data:', content.data);
        setContentData(content.data);
      } else {
        console.error('Content API error:', content);
      }
      
      if (usage.success) {
        console.log('Setting usage data:', usage.data);
        setUsageData(usage.data);
      } else {
        console.error('Usage API error:', usage);
      }
      
      if (performance.success) {
        console.log('Setting performance data:', performance.data);
        setPerformanceData(performance.data);
      } else {
        console.error('Performance API error:', performance);
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch('/api/dashboard/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'analytics',
          timeframe,
          format: 'csv'
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${timeframe}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Analytics data exported successfully');
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export analytics data');
    }
  };

  if (loading && !overviewData) {
    return <AnalyticsLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Insights and performance metrics for your content
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Timeframe:</span>
        {(['day', 'week', 'month', 'year'] as const).map((period) => (
          <Button
            key={period}
            variant={timeframe === period ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeframe(period)}
          >
            <Calendar className="h-4 w-4 mr-1" />
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Button>
        ))}
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="content">
            <PieChart className="h-4 w-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="usage">
            <Activity className="h-4 w-4 mr-2" />
            Usage
          </TabsTrigger>
          <TabsTrigger value="performance">
            <TrendingUp className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewAnalytics data={overviewData} />
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <ContentAnalyticsView data={contentData} />
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <UsageAnalyticsView data={usageData} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceAnalyticsView data={performanceData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewAnalytics({ data }: { data: AnalyticsData | null }) {
  if (!data) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Start creating content to see analytics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Generated</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              No content created yet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Repurposed</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              No repurposing activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              No views recorded
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                <h3 className="text-lg font-medium">No Analytics Data Yet</h3>
                <p className="text-sm">Create some content to start seeing insights and analytics.</p>
              </div>
              <Button asChild>
                <a href="/dashboard/new">Create Your First Content</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Key Metrics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.events.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            In the last {data.timeframe}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Content Generated</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.usageMetrics.contentGenerated}</div>
          <p className="text-xs text-muted-foreground">
            New content pieces
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Content Repurposed</CardTitle>
          <Share2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.usageMetrics.contentRepurposed}</div>
          <p className="text-xs text-muted-foreground">
            Across platforms
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.contentAnalytics.totalViews}</div>
          <p className="text-xs text-muted-foreground">
            Avg: {data.contentAnalytics.avgViews} per content
          </p>
        </CardContent>
      </Card>

      {/* Top Actions */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Top Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(data.topActions).length > 0 ? (
              Object.entries(data.topActions).slice(0, 5).map(([action, count]) => (
                <div key={action} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{action.replace('_', ' ')}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No actions recorded yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Platform Usage */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Platform Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data.usageMetrics.platformsUsed.map((platform) => (
              <Badge key={platform} variant="outline">
                {platform}
              </Badge>
            ))}
          </div>
          {data.usageMetrics.platformsUsed.length === 0 && (
            <p className="text-sm text-muted-foreground">No platforms used yet</p>
          )}
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card className="md:col-span-4">
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.activityTimeline.length > 0 ? (
              data.activityTimeline.slice(-10).map((item) => (
                <div key={item.time} className="flex items-center justify-between">
                  <span className="text-sm">
                    {new Date(item.time).toLocaleString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${(item.events / Math.max(...data.activityTimeline.map(t => t.events))) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">{item.events}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No activity timeline available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ContentAnalyticsView({ data }: { data: ContentAnalytics | null }) {
  if (!data) return <div>No content data available</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Content Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Content by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.contentStats.map((stat) => (
              <div key={stat.status} className="flex items-center justify-between">
                <span className="text-sm">{stat.status}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${(stat.count / Math.max(...data.contentStats.map(s => s.count))) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">{stat.count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Platform Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.platformStats.map((stat) => (
              <div key={stat.platform} className="flex items-center justify-between">
                <span className="text-sm">{stat.platform}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${(stat.count / Math.max(...data.platformStats.map(s => s.count))) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">{stat.count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Content */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Top Performing Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topContent.slice(0, 10).map((content) => (
              <div key={content.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{content.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(content.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {content.views}
                  </div>
                  <div className="flex items-center gap-1">
                    <Share2 className="h-3 w-3" />
                    {content.repurposes}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UsageAnalyticsView({ data }: { data: UsageAnalytics | null }) {
  if (!data) return <div>No usage data available</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Monthly Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-3xl font-bold">{data.monthlyUsage}</div>
            <Progress value={data.usagePercentage} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Used this month</span>
              <span>{data.usagePercentage}%</span>
            </div>
            <Badge variant={data.plan === 'free' ? 'secondary' : 'default'}>
              {data.plan?.toUpperCase()} Plan
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Daily Usage Pattern */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Usage Pattern</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(data.dailyUsage).slice(-7).map(([date, count]) => (
              <div key={date} className="flex items-center justify-between">
                <span className="text-sm">{new Date(date).toLocaleDateString()}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${(count / Math.max(...Object.values(data.dailyUsage))) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PerformanceAnalyticsView({ data }: { data: PerformanceAnalytics | null }) {
  if (!data) return <div>No performance data available</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Average Metrics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Views</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.averageMetrics.avgViews}</div>
          <p className="text-xs text-muted-foreground">
            Per content piece
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Repurposes</CardTitle>
          <Share2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.averageMetrics.avgRepurposes}</div>
          <p className="text-xs text-muted-foreground">
            Per content piece
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.averageMetrics.totalViews}</div>
          <p className="text-xs text-muted-foreground">
            All content combined
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Repurposes</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.averageMetrics.totalRepurposes}</div>
          <p className="text-xs text-muted-foreground">
            All content combined
          </p>
        </CardContent>
      </Card>

      {/* Content Performance List */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Content Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.contentPerformance.slice(0, 10).map((content) => (
              <div key={content.contentId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{content.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(content.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{content.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Share2 className="h-3 w-3" />
                    <span>{content.repurposes}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Engagement: {typeof content.engagement === 'object' ? 
                      Object.values(content.engagement).reduce((a: any, b: any) => a + b, 0) : 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20" />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 