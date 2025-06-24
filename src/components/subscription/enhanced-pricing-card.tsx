'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Star, Crown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedPricingCardProps {
  plan: {
    id: string;
    name: string;
    price: number;
    features: string[];
    limits: {
      monthlyLimit: number;
      overageRate: number;
      maxTeamMembers: number;
      additionalMemberPrice: number;
    };
  };
  currentPlan: string;
  onAction: (planId: string, action: 'upgrade' | 'downgrade') => void;
  buttonText: string;
  buttonVariant: any;
  disabled: boolean;
}

export function EnhancedPricingCard({
  plan,
  currentPlan,
  onAction,
  buttonText,
  buttonVariant,
  disabled
}: EnhancedPricingCardProps) {
  const isCurrentPlan = plan.id === currentPlan;
  const isUpgrade = getActionType(plan.id, currentPlan) === 'upgrade';
  const isDowngrade = getActionType(plan.id, currentPlan) === 'downgrade';
  
  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free': return null;
      case 'basic': return <Zap className="h-5 w-5 text-blue-600" />;
      case 'pro': return <Star className="h-5 w-5 text-purple-600" />;
      case 'agency': return <Crown className="h-5 w-5 text-orange-600" />;
      default: return null;
    }
  };

  const getCardStyle = () => {
    if (isCurrentPlan) {
      return 'ring-2 ring-blue-600 border-blue-200 bg-blue-50/30';
    }
    if (plan.id === 'pro') {
      return 'ring-2 ring-purple-600 border-purple-200 relative';
    }
    return 'border-gray-200 hover:border-gray-300 transition-colors';
  };

  const handleClick = () => {
    if (disabled) return;
    const action = getActionType(plan.id, currentPlan);
    if (action) {
      onAction(plan.id, action);
    }
  };

  return (
    <Card className={cn('relative flex flex-col', getCardStyle())}>
      {/* Popular badge for Pro plan */}
      {plan.id === 'pro' && !isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-purple-600 text-white px-3 py-1">
            Most Popular
          </Badge>
        </div>
      )}
      
      {/* Current plan badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-blue-600 text-white px-3 py-1">
            Current Plan
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          {getPlanIcon(plan.id)}
          <CardTitle className="text-xl font-bold capitalize">
            {plan.name}
          </CardTitle>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold">
            {plan.price === 0 ? 'Free' : `$${plan.price}`}
          </div>
          {plan.price > 0 && (
            <div className="text-sm text-gray-600">per month</div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Key metrics */}
        <div className="grid grid-cols-1 gap-2 mb-4 p-3 bg-gray-50 rounded-lg text-sm">
          <div>
            <div className="font-medium text-gray-900">Monthly Limit</div>
            <div className="text-gray-600">
              {plan.limits.monthlyLimit === -1 ? 'Unlimited' : plan.limits.monthlyLimit}
            </div>
          </div>
          {plan.limits.maxTeamMembers > 0 && (
            <>
              <div>
                <div className="font-medium text-gray-900">Team Members</div>
                <div className="text-gray-600">{plan.limits.maxTeamMembers} included</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Overage Rate</div>
                <div className="text-gray-600">${plan.limits.overageRate}/use</div>
              </div>
            </>
          )}
        </div>

        {/* Features list */}
        <div className="space-y-2 mb-6 flex-1">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
          
          {/* Show additional member pricing for Agency plan */}
          {plan.id === 'agency' && plan.limits.additionalMemberPrice > 0 && (
            <div className="flex items-start gap-2 text-sm border-t pt-2 mt-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">
                Add additional member for just <span className="font-medium">${plan.limits.additionalMemberPrice}/month</span>
              </span>
            </div>
          )}
        </div>

        {/* Action button */}
        <Button
          onClick={handleClick}
          disabled={disabled}
          variant={buttonVariant}
          className={cn(
            'w-full',
            isCurrentPlan && 'cursor-default',
            isUpgrade && 'bg-blue-600 hover:bg-blue-700 text-white',
            isDowngrade && 'border-orange-200 text-orange-700 hover:bg-orange-50'
          )}
        >
          {buttonText}
        </Button>
        
        {/* Upgrade benefit hint */}
        {isUpgrade && (
          <div className="text-xs text-center text-blue-600 mt-2">
            ✨ Instant upgrade - no waiting period
          </div>
        )}
        
        {/* Downgrade timing hint */}
        {isDowngrade && (
          <div className="text-xs text-center text-orange-600 mt-2">
            ⏰ Takes effect at next billing cycle
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getActionType(planId: string, currentPlan: string): 'upgrade' | 'downgrade' | null {
  const hierarchy = ['free', 'basic', 'pro', 'agency'];
  const currentIndex = hierarchy.indexOf(currentPlan);
  const targetIndex = hierarchy.indexOf(planId);
  
  if (targetIndex > currentIndex) return 'upgrade';
  if (targetIndex < currentIndex) return 'downgrade';
  return null;
} 