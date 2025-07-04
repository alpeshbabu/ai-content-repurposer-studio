'use client';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsageData {
  monthly: number;
  monthlyLimit: number;
  monthlyRemaining: number;
  usageDate?: string;
}

interface UsageTrackerProps {
  usage: UsageData;
  detailed?: boolean;
}

export function UsageTracker({ usage, detailed = false }: UsageTrackerProps) {
  const monthlyPercentage = usage.monthlyLimit > 0 
    ? Math.min((usage.monthly / usage.monthlyLimit) * 100, 100)
    : 0;

  const getUsageStatus = (used: number, limit: number) => {
    if (limit === -1) return 'unlimited';
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'critical';
    if (percentage >= 75) return 'warning';
    return 'normal';
  };

  const monthlyStatus = getUsageStatus(usage.monthly, usage.monthlyLimit);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-600';
      case 'warning': return 'text-orange-600';
      case 'unlimited': return 'text-green-600';
      default: return 'text-blue-600';
    }
  };

  if (detailed) {
    return (
      <div className="space-y-6">
        {/* Monthly Usage */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Monthly Usage</span>
              </div>
              <Badge variant={monthlyStatus === 'critical' ? 'destructive' : 
                             monthlyStatus === 'warning' ? 'secondary' : 'default'}>
                {usage.monthlyLimit === -1 ? 'Unlimited' : `${usage.monthly}/${usage.monthlyLimit}`}
              </Badge>
            </div>
            
            {usage.monthlyLimit > 0 && (
              <>
                <Progress 
                  value={monthlyPercentage} 
                  className="h-2 mb-2"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{usage.monthly} used</span>
                  <span>{usage.monthlyRemaining} remaining</span>
                </div>
              </>
            )}
            
            {monthlyStatus === 'critical' && (
              <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Monthly limit nearly reached</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{usage.monthly}</div>
          <div className="text-sm text-gray-600">This Month</div>
        </div>
      </div>
    );
  }

  // Compact view
  return (
    <div className="space-y-4">
      {/* Monthly Progress */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Monthly Usage</span>
          <span className={cn('text-sm font-medium', getStatusColor(monthlyStatus))}>
            {usage.monthlyLimit === -1 
              ? `${usage.monthly} used` 
              : `${usage.monthly}/${usage.monthlyLimit}`}
          </span>
        </div>
        
        {usage.monthlyLimit > 0 && (
          <Progress value={monthlyPercentage} className="h-2" />
        )}
        
        {usage.monthlyLimit === -1 && (
          <div className="h-2 bg-green-100 rounded-full">
            <div className="h-full bg-green-500 rounded-full w-full opacity-50"></div>
          </div>
        )}
      </div>

      {/* Status indicators */}
      <div className="flex gap-2 text-xs">
        {monthlyStatus === 'critical' && (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Monthly limit critical
          </Badge>
        )}
      </div>
    </div>
  );
} 