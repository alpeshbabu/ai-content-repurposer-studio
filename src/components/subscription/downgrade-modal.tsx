'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info, X, Calendar } from 'lucide-react';

interface DowngradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlan: string;
  currentPlan: string;
  onSuccess: () => void;
}

export function DowngradeModal({ 
  isOpen, 
  onClose, 
  targetPlan, 
  currentPlan,
  onSuccess 
}: DowngradeModalProps) {
  const [confirmFeatureLoss, setConfirmFeatureLoss] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDowngrade = async () => {
    if (!confirmFeatureLoss) {
      setError('Please confirm that you understand the feature limitations');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscription/downgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetPlan,
          confirmFeatureLoss: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to schedule downgrade');
      }

      onSuccess();
      onClose();
      // Reset state
      setConfirmFeatureLoss(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule downgrade');
    } finally {
      setLoading(false);
    }
  };

  const getFeatureLossWarnings = () => {
    const warnings = [];
    
    // Plan-specific warnings
    if (currentPlan === 'agency' && targetPlan !== 'agency') {
      warnings.push('You will lose team collaboration features');
      warnings.push('Team member access will be restricted');
      warnings.push('Advanced analytics will be unavailable');
    }
    
    if ((currentPlan === 'pro' || currentPlan === 'agency') && (targetPlan === 'basic' || targetPlan === 'free')) {
      warnings.push('You will lose access to LinkedIn templates');
      warnings.push('AI model will be downgraded to Standard');
    }
    
    if (currentPlan !== 'free' && targetPlan === 'free') {
      warnings.push('You will lose premium customer support');
      warnings.push('Monthly usage will be limited to 5 repurposes');
      warnings.push('Overage rates will increase');
    }
    
    if ((currentPlan === 'pro' || currentPlan === 'agency') && targetPlan === 'basic') {
      warnings.push('Monthly usage will be reduced significantly');
    }
    
    if (targetPlan === 'basic') {
      warnings.push('Monthly usage will be limited to 60 repurposes');
      warnings.push('You will have access to fewer platform templates');
    } else if (targetPlan === 'free') {
      warnings.push('Monthly usage will be limited to 5 repurposes');
      warnings.push('You will lose access to most platform templates');
      warnings.push('You will lose access to advanced AI features');
    }
    
    return warnings;
  };

  const getUsageLimitComparison = () => {
    const limits = {
      free: { monthly: 5, daily: -1 },
      basic: { monthly: 60, daily: -1 },
      pro: { monthly: 150, daily: -1 },
      agency: { monthly: 450, daily: -1 }
    };
    
    const current = limits[currentPlan as keyof typeof limits];
    const target = limits[targetPlan as keyof typeof limits];
    
    return { current, target };
  };

  const resetAndClose = () => {
    setConfirmFeatureLoss(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const featureLossWarnings = getFeatureLossWarnings();
  const { current, target } = getUsageLimitComparison();

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Confirm Plan Downgrade
          </DialogTitle>
          <DialogDescription>
            You're about to downgrade from <Badge variant="outline">{currentPlan}</Badge> to{' '}
            <Badge variant="outline">{targetPlan}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Timing Information */}
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              This downgrade will take effect at your next billing cycle. You'll continue to have access to your current plan features until then.
            </AlertDescription>
          </Alert>

          {/* Usage Limit Changes */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Usage Limit Changes</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Current ({currentPlan})</div>
                <div className="font-medium">
                  {current.monthly === -1 ? 'Unlimited' : `${current.monthly}/month`}
                </div>
                <div className="text-gray-500">
                  {current.daily === -1 ? 'No daily limit' : `${current.daily}/day`}
                </div>
              </div>
              <div>
                <div className="text-gray-600">New ({targetPlan})</div>
                <div className="font-medium">
                  {target.monthly === -1 ? 'Unlimited' : `${target.monthly}/month`}
                </div>
                <div className="text-gray-500">
                  {target.daily === -1 ? 'No daily limit' : `${target.daily}/day`}
                </div>
              </div>
            </div>
          </div>

          {/* Feature Loss Warnings */}
          {featureLossWarnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Features You'll Lose</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {featureLossWarnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Confirmation Checkbox */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="confirm-feature-loss"
              checked={confirmFeatureLoss}
              onCheckedChange={(checked) => setConfirmFeatureLoss(checked as boolean)}
            />
            <label
              htmlFor="confirm-feature-loss"
              className="text-sm text-gray-700 leading-5"
            >
              I understand that I will lose access to the features listed above and accept the reduced usage limits.
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={resetAndClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDowngrade}
            disabled={!confirmFeatureLoss || loading}
          >
            {loading ? 'Scheduling...' : `Downgrade to ${targetPlan}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 