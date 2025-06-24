'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  Download,
  RefreshCw
} from 'lucide-react';

interface TeamMemberBillingData {
  currentBilling: {
    teamSize: number;
    includedMembers: number;
    additionalMembers: number;
    pricePerAdditionalMember: number;
    monthlyCharge: number;
    nextBillingDate: string;
  };
  stripeBilling: {
    hasAdditionalMembers: boolean;
    quantity: number;
    monthlyCharge: number;
  } | null;
  billingHistory: Array<{
    id: string;
    month: number;
    year: number;
    memberCount: number;
    additionalMembers: number;
    chargeAmount: number;
    createdAt: string;
  }>;
  teamMembers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    joinedAt: string;
  }>;
}

export function TeamMemberBilling() {
  const [data, setData] = useState<TeamMemberBillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/billing/team-members');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch billing data');
      }

      const billingData = await response.json();
      setData(billingData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getMonthName = (month: number) => {
    return new Date(2024, month - 1).toLocaleDateString('en-US', { month: 'long' });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchBillingData}
            className="ml-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No billing data available.
        </AlertDescription>
      </Alert>
    );
  }

  const { currentBilling, stripeBilling, billingHistory, teamMembers } = data;

  return (
    <div className="space-y-6">
      {/* Current Billing Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentBilling.teamSize}</div>
            <p className="text-xs text-muted-foreground">
              {currentBilling.includedMembers} included, {currentBilling.additionalMembers} additional
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Charge</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentBilling.monthlyCharge)}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentBilling.additionalMembers} × {formatCurrency(currentBilling.pricePerAdditionalMember)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Billing</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentBilling.nextBillingDate 
                ? formatDate(currentBilling.nextBillingDate)
                : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Automatic billing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stripe Billing Status */}
      {stripeBilling && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Stripe Billing Status
            </CardTitle>
            <CardDescription>
              Current billing status from Stripe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stripeBilling.hasAdditionalMembers ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {stripeBilling.quantity} additional team members
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Monthly charge: {formatCurrency(stripeBilling.monthlyCharge)}
                  </p>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">No additional charges</p>
                  <p className="text-sm text-muted-foreground">
                    All team members are included in your plan
                  </p>
                </div>
                <Badge variant="secondary">Included</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Current team members and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div>
                  <p className="font-medium">{member.name || 'Unnamed User'}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="capitalize">
                    {member.role}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    Joined {formatDate(member.joinedAt)}
                  </p>
                </div>
              </div>
            ))}
            {teamMembers.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No team members found
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>
              Past team member charges
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          {billingHistory.length > 0 ? (
            <div className="space-y-4">
              {billingHistory.map((billing) => (
                <div key={billing.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">
                      {getMonthName(billing.month)} {billing.year}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {billing.memberCount} total members ({billing.additionalMembers} additional)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(billing.chargeAmount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(billing.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No billing history available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 