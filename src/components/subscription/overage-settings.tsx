'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  Loader2,
  Settings as SettingsIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { getPlanConfig, PlanType } from '@/lib/pricing-config';

interface OverageSettingsProps {
  currentPlan: string;
  onSettingsChange?: () => void;
}

interface UserSettings {
  overageEnabled: boolean;
  brandVoice?: string;
  preferredPlatforms: string[];
}

export function OverageSettings({ currentPlan, onSettingsChange }: OverageSettingsProps) {
  const planConfig = getPlanConfig(currentPlan as PlanType);
  const overageRate = {
    rate: planConfig.overagePrice,
    description: `$${planConfig.overagePrice.toFixed(2)} per additional content repurpose`
  };
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      const data = await response.json();
      setSettings({
        overageEnabled: data?.overageEnabled || false,
        brandVoice: data?.brandVoice,
        preferredPlatforms: data?.preferredPlatforms || []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOverage = async (enabled: boolean) => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settings,
          overageEnabled: enabled,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const updatedSettings = await response.json();
      setSettings(prev => ({
        ...prev!,
        overageEnabled: updatedSettings.overageEnabled
      }));

      toast.success(
        enabled 
          ? 'Overage charges enabled successfully' 
          : 'Overage charges disabled successfully'
      );

      if (onSettingsChange) {
        onSettingsChange();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const getOverageInfo = () => {
    return overageRate;
  };

  const canEnableOverage = () => {
    return true; // All tiers can now enable overage charges
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Overage Settings
          </CardTitle>
          <CardDescription>Manage your overage charge preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Overage Settings
          </CardTitle>
          <CardDescription>Manage your overage charge preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const overageInfo = getOverageInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="h-5 w-5" />
          Overage Settings
        </CardTitle>
        <CardDescription>
          Control whether you want to be charged for usage beyond your plan limits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan Info */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Current Plan</h3>
            <p className="text-sm text-gray-600">
              {overageInfo.description}
            </p>
          </div>
          <Badge variant={currentPlan === 'free' ? 'secondary' : 'default'}>
            {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
          </Badge>
        </div>

        {/* Overage Toggle */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900">Enable Overage Charges</h3>
                {settings?.overageEnabled ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Allow charges for usage beyond your monthly limit
              </p>
            </div>
            <Switch
              checked={settings?.overageEnabled || false}
              onCheckedChange={handleToggleOverage}
              disabled={!canEnableOverage() || saving}
            />
          </div>

          {/* Status Display */}
          <div className="text-sm">
            {settings?.overageEnabled ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Overage charges are enabled.</strong> You will be charged {overageInfo.description.toLowerCase()} when you exceed your monthly limit.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Overage charges are disabled.</strong> Content repurposing will be blocked when you reach your monthly limit.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* How It Works */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">How Overage Charges Work</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <DollarSign className="h-4 w-4 mt-0.5 text-gray-400" />
              <span>
                When enabled, you'll be charged for each content repurpose beyond your monthly limit
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 text-gray-400" />
              <span>
                Overage charges are calculated at the end of each billing cycle
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 text-gray-400" />
              <span>
                You can disable overage charges at any time
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={fetchSettings}
            disabled={loading}
          >
            Refresh Settings
          </Button>
          <Button
            onClick={() => window.location.href = '/dashboard/settings/subscription?tab=billing'}
            variant="outline"
          >
            View Billing History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 