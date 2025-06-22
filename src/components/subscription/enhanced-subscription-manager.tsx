'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Check, 
  AlertTriangle, 
  Clock, 
  Users, 
  BarChart3, 
  Zap,
  Crown,
  Star,
  ArrowRight,
  X,
  ChevronRight
} from 'lucide-react';
import { EnhancedPricingCard } from './enhanced-pricing-card';
import { DowngradeModal } from './downgrade-modal';
import { PlanComparisonTable } from './plan-comparison-table';
import { UsageTracker } from './usage-tracker';
import { OverageCharges } from './overage-charges';

interface CurrentSubscriptionData {
  currentPlan: string;
  status: string;
  renewalDate: string | null;
  pendingDowngrade: {
    plan: string;
    effectiveDate: string;
    planDetails: any;
  } | null;
  usage: {
    monthly: number;
    monthlyLimit: number;
    monthlyRemaining: number;
    daily: number;
    dailyLimit: number;
    dailyRemaining: number;
  };
  team: {
    memberCount: number;
    memberLimit: number;
    canAddMembers: boolean;
  } | null;
  planDetails: any;
  subscription: any;
}

interface PlansData {
  plans: any[];
  featureCategories: any[];
  hierarchy: string[];
}

export function EnhancedSubscriptionManager() {
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscriptionData | null>(null);
  const [plansData, setPlansData] = useState<PlansData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [targetDowngradePlan, setTargetDowngradePlan] = useState<string>('');
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionData();
    fetchPlansData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/subscription/current');
      if (!response.ok) throw new Error('Failed to fetch subscription data');
      const data = await response.json();
      setCurrentSubscription(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription data');
    }
  };

  const fetchPlansData = async () => {
    try {
      const response = await fetch('/api/plans/compare');
      if (!response.ok) throw new Error('Failed to fetch plans data');
      const data = await response.json();
      setPlansData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plans data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDowngrade = async () => {
    setProcessingAction('cancel-downgrade');
    try {
      const response = await fetch('/api/subscription/downgrade', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel downgrade');
      }
      
      await fetchSubscriptionData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel downgrade');
    } finally {
      setProcessingAction(null);
    }
  };

  const handlePlanAction = (planId: string, action: 'upgrade' | 'downgrade') => {
    if (action === 'upgrade') {
      // Redirect to checkout for upgrades
      window.location.href = `/dashboard/settings/subscription/checkout?plan=${planId}`;
    } else {
      // Open downgrade modal
      setTargetDowngradePlan(planId);
      setShowDowngradeModal(true);
    }
  };

  const getButtonText = (planId: string, currentPlan: string) => {
    if (planId === currentPlan) return 'Current Plan';
    
    const hierarchy = plansData?.hierarchy || [];
    const currentIndex = hierarchy.indexOf(currentPlan);
    const targetIndex = hierarchy.indexOf(planId);
    
    if (targetIndex > currentIndex) return 'Upgrade';
    if (targetIndex < currentIndex) return 'Downgrade';
    return 'Select Plan';
  };

  const getButtonVariant = (planId: string, currentPlan: string) => {
    if (planId === currentPlan) return 'secondary';
    
    const hierarchy = plansData?.hierarchy || [];
    const currentIndex = hierarchy.indexOf(currentPlan);
    const targetIndex = hierarchy.indexOf(planId);
    
    if (targetIndex > currentIndex) return 'default';
    return 'outline';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="max-w-md mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!currentSubscription || !plansData) {
    return (
      <Alert className="max-w-md mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Unable to load subscription data</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Current Plan
                <Badge variant={currentSubscription.status === 'active' ? 'default' : 'secondary'}>
                  {currentSubscription.status}
                </Badge>
              </CardTitle>
              <CardDescription>
                Your current subscription and usage details
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold capitalize">
                {currentSubscription.currentPlan}
              </div>
              <div className="text-sm text-gray-600">
                {currentSubscription.planDetails?.price === 0 
                  ? 'Free Plan' 
                  : `$${currentSubscription.planDetails?.price}/month`}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Usage Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Usage This Month</h3>
              <UsageTracker usage={currentSubscription.usage} />
            </div>

            {/* Plan Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Plan Features</h3>
              <div className="space-y-2">
                {currentSubscription.planDetails?.features?.slice(0, 3).map((feature: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {/* Billing & Team Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Account Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Renewal Date:</span>
                  <span>{currentSubscription.renewalDate ? new Date(currentSubscription.renewalDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                {currentSubscription.team && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Team Members:</span>
                    <span>{currentSubscription.team.memberCount} / {currentSubscription.team.memberLimit}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pending Downgrade Notice */}
          {currentSubscription.pendingDowngrade && (
            <Alert className="mt-6">
              <Clock className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  Your plan will downgrade to <strong>{currentSubscription.pendingDowngrade.plan}</strong> on{' '}
                  {new Date(currentSubscription.pendingDowngrade.effectiveDate).toLocaleDateString()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelDowngrade}
                  disabled={processingAction === 'cancel-downgrade'}
                >
                  {processingAction === 'cancel-downgrade' ? 'Canceling...' : 'Cancel Downgrade'}
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="plans">Available Plans</TabsTrigger>
          <TabsTrigger value="compare">Compare Features</TabsTrigger>
          <TabsTrigger value="billing">Billing & Usage</TabsTrigger>
          <TabsTrigger value="team">Team Management</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plansData.plans.map((plan) => (
              <EnhancedPricingCard
                key={plan.id}
                plan={plan}
                currentPlan={currentSubscription.currentPlan}
                onAction={handlePlanAction}
                buttonText={getButtonText(plan.id, currentSubscription.currentPlan)}
                buttonVariant={getButtonVariant(plan.id, currentSubscription.currentPlan)}
                disabled={plan.id === currentSubscription.currentPlan}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="compare" className="space-y-6">
          <PlanComparisonTable
            plans={plansData.plans}
            featureCategories={plansData.featureCategories}
            currentPlan={currentSubscription.currentPlan}
          />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage & Limits</CardTitle>
                <CardDescription>Your current usage and plan limits</CardDescription>
              </CardHeader>
              <CardContent>
                <UsageTracker usage={currentSubscription.usage} detailed />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Overage Charges</CardTitle>
                <CardDescription>Additional usage charges</CardDescription>
              </CardHeader>
              <CardContent>
                <OverageCharges />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          {currentSubscription.team ? (
            <Card>
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>Manage your team members and collaboration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Team Members</h3>
                      <p className="text-sm text-gray-600">
                        {currentSubscription.team.memberCount} of {currentSubscription.team.memberLimit} members used
                      </p>
                    </div>
                    <Button
                      disabled={!currentSubscription.team.canAddMembers}
                      onClick={() => window.location.href = '/dashboard/settings/team'}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Manage Team
                    </Button>
                  </div>
                  
                  <Progress 
                    value={(currentSubscription.team.memberCount / currentSubscription.team.memberLimit) * 100} 
                    className="w-full"
                  />
                  
                  {!currentSubscription.team.canAddMembers && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        You've reached your team member limit. Upgrade to add more members.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Team Features</CardTitle>
                <CardDescription>Upgrade to Agency plan to access team features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Team Collaboration</h3>
                  <p className="text-gray-600 mb-4">
                    Invite team members, share templates, and collaborate on content with the Agency plan.
                  </p>
                  <Button onClick={() => handlePlanAction('agency', 'upgrade')}>
                    Upgrade to Agency <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Downgrade Modal */}
      <DowngradeModal
        isOpen={showDowngradeModal}
        onClose={() => setShowDowngradeModal(false)}
        targetPlan={targetDowngradePlan}
        currentPlan={currentSubscription.currentPlan}
        onSuccess={fetchSubscriptionData}
      />
    </div>
  );
} 