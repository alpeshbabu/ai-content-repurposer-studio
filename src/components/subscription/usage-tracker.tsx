'use client';

import { useEffect, useState } from 'react';
import { BarChart3, AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';

interface UsageData {
  current: number;
  limit: number | 'Unlimited';
  remaining: number | 'Unlimited';
  daily?: {
    current: number;
    limit: number | 'Unlimited';
    remaining: number | 'Unlimited';
  };
}

interface SubscriptionData {
  plan: string;
  status: string;
  renewalDate: string | null;
}

export function UsageTracker() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);

  useEffect(() => {
    async function fetchUsageData() {
      try {
        setLoading(true);
        const response = await fetch('/api/subscription');
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Subscription API error:', errorText);
          throw new Error(`Failed to fetch usage data: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Subscription data:', data);
        
        // Check if we have a message from the server
        if (data.message) {
          console.log('Server message:', data.message);
          setError(data.message);
          setLoading(false);
          return; // Stop processing if there's a message
        }
        
        // Additional safety checks - ensure all required data exists
        if (!data || typeof data !== 'object') {
          console.error('Invalid response data format:', data);
          setError('Could not load usage data. Invalid response format.');
          setLoading(false);
          return;
        }
        
        // Validate usage data structure
        if (!data.usage || typeof data.usage !== 'object' || 
            !('current' in data.usage) || !('limit' in data.usage) || !('remaining' in data.usage)) {
          console.error('Invalid usage data format:', data.usage);
          setError('Could not load usage data. Please try again later.');
          setLoading(false);
          return;
        }
        
        // Validate subscription data structure
        if (!data.subscription || typeof data.subscription !== 'object' || 
            !('plan' in data.subscription) || !('status' in data.subscription)) {
          console.error('Invalid subscription data format:', data.subscription);
          setError('Could not load subscription data. Please try again later.');
          setLoading(false);
          return;
        }
        
        setUsageData(data.usage);
        setSubscriptionData(data.subscription);
      } catch (error) {
        console.error('Error fetching usage data:', error);
        setError('Could not load usage data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchUsageData();
  }, []);

  if (loading) {
    return (
      <div className="border rounded-lg p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-4 w-1/3"></div>
        <div className="h-8 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg p-6 bg-red-50 border-red-200">
        <div className="flex items-center text-red-600 mb-2">
          <AlertCircle className="h-5 w-5 mr-2" />
          <h3 className="font-semibold">Error</h3>
        </div>
        <p className="text-sm text-red-600">{error}</p>
        {error.includes('initializing') && (
          <p className="text-sm text-red-600 mt-2">
            The subscription system is being set up. All features are available during this time.
          </p>
        )}
        <div className="mt-4 text-center">
          <Link 
            href="/dashboard/settings/subscription" 
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View Subscription Details
          </Link>
        </div>
      </div>
    );
  }

  if (!usageData || !subscriptionData) {
    return null;
  }

  // Calculate monthly usage percentage
  const monthlyPercentage = usageData.limit === 'Unlimited' 
    ? 0 
    : Math.min(100, Math.round((usageData.current / (usageData.limit as number)) * 100));

  // Calculate daily usage percentage if available
  const dailyPercentage = usageData.daily && usageData.daily.limit !== 'Unlimited' && typeof usageData.daily.current === 'number' && typeof usageData.daily.limit === 'number'
    ? Math.min(100, Math.round((usageData.daily.current / (usageData.daily.limit as number)) * 100))
    : null;

  // Safe accessor function for daily usage data
  const getDailyUsageValue = (key: 'current' | 'limit' | 'remaining'): number | 'Unlimited' => {
    if (!usageData.daily || typeof usageData.daily !== 'object') {
      return key === 'current' ? 0 : 'Unlimited';
    }
    return usageData.daily[key] ?? (key === 'current' ? 0 : 'Unlimited');
  };

  // Safe accessor function for subscription data
  const getSubscriptionValue = (key: 'plan' | 'status' | 'renewalDate'): string | null => {
    if (!subscriptionData || typeof subscriptionData !== 'object') {
      return key === 'plan' ? 'free' : key === 'status' ? 'inactive' : null;
    }
    return subscriptionData[key] ?? (key === 'plan' ? 'free' : key === 'status' ? 'inactive' : null);
  };

  const getBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="border rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
          <h3 className="font-semibold">Usage Tracker</h3>
        </div>
        <span className="text-sm bg-gray-100 px-2 py-1 rounded-full capitalize">{getSubscriptionValue('plan')}</span>
      </div>

      {/* Monthly Usage */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span>Monthly Usage</span>
          <span>
            {usageData.current} / {usageData.limit === 'Unlimited' ? '∞' : usageData.limit}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full mb-1">
          {usageData.limit !== 'Unlimited' && (
            <div 
              className={`h-full rounded-full ${getBarColor(monthlyPercentage)}`} 
              style={{ width: `${monthlyPercentage}%` }}
            ></div>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {usageData.remaining === 'Unlimited' 
            ? 'Unlimited repurposes available' 
            : `${usageData.remaining} repurposes remaining this month`}
        </div>
      </div>

      {/* Daily Usage if applicable */}
      {usageData.daily && (
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span>Daily Usage</span>
            <span>
              {getDailyUsageValue('current')} / {getDailyUsageValue('limit') === 'Unlimited' ? '∞' : getDailyUsageValue('limit')}
            </span>
          </div>
          {getDailyUsageValue('limit') !== 'Unlimited' && (
            <>
              <div className="h-2 bg-gray-100 rounded-full mb-1">
                <div 
                  className={`h-full rounded-full ${getBarColor(dailyPercentage || 0)}`} 
                  style={{ width: `${dailyPercentage || 0}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500">
                {getDailyUsageValue('remaining') === 'Unlimited' 
                  ? 'No daily limit' 
                  : `${getDailyUsageValue('remaining')} repurposes remaining today`}
              </div>
            </>
          )}
        </div>
      )}

      {/* Renewal Info */}
      <div className="text-xs text-gray-500 flex items-center">
        <Info className="h-3 w-3 mr-1" />
        {getSubscriptionValue('renewalDate')
          ? (() => {
              try {
                const date = new Date(getSubscriptionValue('renewalDate') as string);
                return `Renews on ${date.toLocaleDateString()}`;
              } catch (error) {
                console.error('Invalid renewal date:', error);
                return 'No active subscription';
              }
            })()
          : 'No active subscription'}
      </div>

      <div className="mt-4 text-center">
        <Link 
          href="/dashboard/settings/subscription" 
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Manage Subscription
        </Link>
      </div>
    </div>
  );
} 