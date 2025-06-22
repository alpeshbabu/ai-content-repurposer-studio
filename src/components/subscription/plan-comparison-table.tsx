'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Crown, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  price: number;
  featureMatrix: {
    [key: string]: any;
  };
}

interface FeatureCategory {
  category: string;
  features: {
    key: string;
    label: string;
    type: 'boolean' | 'text' | 'number' | 'list';
  }[];
}

interface PlanComparisonTableProps {
  plans: Plan[];
  featureCategories: FeatureCategory[];
  currentPlan: string;
}

export function PlanComparisonTable({ 
  plans, 
  featureCategories, 
  currentPlan 
}: PlanComparisonTableProps) {
  
  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free': return null;
      case 'basic': return <Zap className="h-4 w-4 text-blue-600" />;
      case 'pro': return <Star className="h-4 w-4 text-purple-600" />;
      case 'agency': return <Crown className="h-4 w-4 text-orange-600" />;
      default: return null;
    }
  };

  const renderFeatureValue = (value: any, type: string) => {
    switch (type) {
      case 'boolean':
        return value ? (
          <Check className="h-4 w-4 text-green-600 mx-auto" />
        ) : (
          <X className="h-4 w-4 text-gray-400 mx-auto" />
        );
      
      case 'list':
        if (Array.isArray(value)) {
          return (
            <div className="text-xs">
              {value.slice(0, 2).join(', ')}
              {value.length > 2 && ` +${value.length - 2} more`}
            </div>
          );
        }
        return <span className="text-xs">{value}</span>;
      
      case 'number':
        return <span className="font-medium">{value}</span>;
      
      default:
        return <span className="text-xs">{value}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Plan Headers */}
      <div className="grid grid-cols-5 gap-4">
        <div className="font-medium text-gray-900">Features</div>
        {plans.map((plan) => (
          <div key={plan.id} className="text-center">
            <div className={cn(
              'p-3 rounded-lg border',
              plan.id === currentPlan 
                ? 'border-blue-200 bg-blue-50' 
                : 'border-gray-200'
            )}>
              <div className="flex items-center justify-center gap-2 mb-2">
                {getPlanIcon(plan.id)}
                <span className="font-semibold capitalize">{plan.name}</span>
                {plan.id === currentPlan && (
                  <Badge variant="secondary" className="text-xs">Current</Badge>
                )}
              </div>
              <div className="text-lg font-bold">
                {plan.price === 0 ? 'Free' : `$${plan.price}`}
              </div>
              {plan.price > 0 && (
                <div className="text-xs text-gray-600">per month</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Feature Categories */}
      {featureCategories.map((category) => (
        <Card key={category.category}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{category.category}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {category.features.map((feature) => (
                <div key={feature.key} className="grid grid-cols-5 gap-4 items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div className="font-medium text-sm text-gray-700">
                    {feature.label}
                  </div>
                  {plans.map((plan) => (
                    <div key={`${plan.id}-${feature.key}`} className="text-center">
                      {renderFeatureValue(
                        plan.featureMatrix[feature.key], 
                        feature.type
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Quick Comparison Summary */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">Quick Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className="text-center p-3 bg-white rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getPlanIcon(plan.id)}
                  <span className="font-semibold capitalize">{plan.name}</span>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div>
                    {plan.featureMatrix.monthlyLimit === -1 
                      ? 'Unlimited usage' 
                      : `${plan.featureMatrix.monthlyLimit}/month`}
                  </div>
                  <div>
                    {plan.featureMatrix.maxTeamMembers === 'N/A' 
                      ? 'No team features' 
                      : `${plan.featureMatrix.maxTeamMembers} team members`}
                  </div>
                  <div>{plan.featureMatrix.support} support</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Plan Recommendations */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="text-center">
            <h3 className="font-semibold text-blue-900 mb-2">
              Need help choosing a plan?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-blue-800">
                <div className="font-medium">Free Plan</div>
                <div className="text-blue-700">Perfect for trying out the service</div>
              </div>
              <div className="text-blue-800">
                <div className="font-medium">Pro Plan</div>
                <div className="text-blue-700">Most popular for content creators</div>
              </div>
              <div className="text-blue-800">
                <div className="font-medium">Agency Plan</div>
                <div className="text-blue-700">Best for teams and agencies</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 