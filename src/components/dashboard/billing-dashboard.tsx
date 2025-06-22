'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CreditCard,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface UsageRecord {
  userId: string;
  period: string;
  contentGenerated: number;
  contentRepurposed: number;
  apiCalls: number;
  overageCharges: number;
  totalUsage: number;
  planLimits: {
    monthlyLimit: number;
    dailyLimit: number;
    overageRate: number;
  };
}

interface BillingCycle {
  id: string;
  userId: string;
  period: string;
  planType: string;
  baseAmount: number;
  usageAmount: number;
  overageAmount: number;
  totalAmount: number;
  status: 'pending' | 'processed' | 'failed';
  processedAt?: string;
  createdAt: string;
}

export default function BillingDashboard() {
  const [currentUsage, setCurrentUsage] = useState<UsageRecord | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const [usageResponse, historyResponse] = await Promise.all([
        fetch('/api/billing/usage'),
        fetch('/api/billing/history?limit=6')
      ]);

      const [usageResult, historyResult] = await Promise.all([
        usageResponse.json(),
        historyResponse.json()
      ]);

      if (usageResult.success) {
        setCurrentUsage(usageResult.data);
      }

      if (historyResult.success) {
        setBillingHistory(historyResult.data);
      }

    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const exportBillingData = async () => {
    try {
      const response = await fetch('/api/billing/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'csv' })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `billing-history-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Billing data exported successfully');
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Error exporting billing data:', error);
      toast.error('Failed to export billing data');
    }
  };

  const getUsagePercentage = () => {
    if (!currentUsage) return 0;
    return Math.min((currentUsage.totalUsage / currentUsage.planLimits.monthlyLimit) * 100, 100);
  };

  const getUsageStatus = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 100) return { color: 'destructive', text: 'Over Limit' };
    if (percentage >= 80) return { color: 'warning', text: 'Near Limit' };
    return { color: 'success', text: 'Within Limits' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100); // Convert from cents
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && !currentUsage) {
    return <BillingLoadingSkeleton />;
  }

  const usageStatus = getUsageStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Usage</h1>
          <p className="text-muted-foreground">
            Monitor your usage and manage billing information
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchBillingData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportBillingData}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Current Usage */}
      {currentUsage && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Usage</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentUsage.totalUsage} / {currentUsage.planLimits.monthlyLimit}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Progress value={getUsagePercentage()} className="flex-1" />
                <Badge variant={usageStatus.color as any} className="text-xs">
                  {usageStatus.text}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Content Generated</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentUsage.contentGenerated}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Content Repurposed</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentUsage.contentRepurposed}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overage Charges</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(currentUsage.overageCharges * 100)}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {billingHistory.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Billing History</h3>
              <p className="text-muted-foreground">
                Your billing history will appear here once you have processed billing cycles.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {billingHistory.map((cycle) => (
                <div
                  key={cycle.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      cycle.status === 'processed' ? 'bg-green-100 text-green-600' :
                      cycle.status === 'failed' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {cycle.status === 'processed' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : cycle.status === 'failed' ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{cycle.period}</p>
                      <p className="text-sm text-muted-foreground">
                        {cycle.planType.charAt(0).toUpperCase() + cycle.planType.slice(1)} Plan
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(cycle.totalAmount)}</p>
                    <p className="text-sm text-muted-foreground">
                      {cycle.processedAt ? formatDate(cycle.processedAt) : 'Pending'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BillingLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 