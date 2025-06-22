'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  Mail,
  Calendar,
  CreditCard,
  Activity,
  FileText,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  X,
  RefreshCw,
  Ban,
  UserCheck,
  UserX,
  Crown,
  Shield,
  Eye,
  Download,
  MessageSquare,
  Settings,
  BarChart3,
  Clock,
  Globe,
  Phone,
  MapPin,
  Star,
  Heart,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface SubscriberData {
  id: string;
  name: string;
  email: string;
  image?: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionRenewalDate?: string;
  usageThisMonth: number;
  totalUsage: number;
  isActive: boolean;
  isBanned: boolean;
  isVerified: boolean;
  riskScore: number;
  createdAt: string;
  lastLoginAt?: string;
  notes?: string;
  tags: string[];
  
  // Billing information
  billing: {
    totalRevenue: number;
    lastPayment?: string;
    nextBilling?: string;
    paymentMethods: number;
    invoiceCount: number;
    overageCharges: number;
  };
  
  // Team information
  team?: {
    id: string;
    name: string;
    memberCount: number;
    role: string;
  };
  
  // Analytics
  analytics: {
    contentCreated: number;
    contentRepurposed: number;
    loginCount: number;
    averageSessionDuration: number;
    lastActiveDate?: string;
    topPlatforms: string[];
    engagementScore: number;
  };
  
  // Support
  support: {
    ticketCount: number;
    lastTicketDate?: string;
    satisfactionScore?: number;
    responseTime?: number;
  };
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export default function AdminSubscriberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subscriberId = params.subscriberId as string;
  
  const [subscriber, setSubscriber] = useState<SubscriberData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    subscriptionPlan: '',
    isActive: true,
    isBanned: false,
    isVerified: false,
    riskScore: 0,
    notes: '',
    tags: ''
  });

  useEffect(() => {
    if (subscriberId) {
      fetchSubscriberData();
      fetchActivities();
    }
  }, [subscriberId]);

  const fetchSubscriberData = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/subscribers/${subscriberId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();

      if (result.success) {
        setSubscriber(result.data);
        setEditForm({
          name: result.data.name || '',
          email: result.data.email || '',
          subscriptionPlan: result.data.subscriptionPlan || 'free',
          isActive: result.data.isActive ?? true,
          isBanned: result.data.isBanned ?? false,
          isVerified: result.data.isVerified ?? false,
          riskScore: result.data.riskScore || 0,
          notes: result.data.notes || '',
          tags: result.data.tags?.join(', ') || ''
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error fetching subscriber:', error);
      toast.error('Failed to load subscriber data');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/subscribers/${subscriberId}/activities`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();

      if (result.success) {
        setActivities(result.data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/subscribers/${subscriberId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...editForm,
          tags: editForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        })
      });

      const result = await response.json();

      if (result.success) {
        setSubscriber(result.data);
        setEditing(false);
        toast.success('Subscriber updated successfully');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating subscriber:', error);
      toast.error('Failed to update subscriber');
    }
  };

  const handleAction = async (action: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/subscribers/${subscriberId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        await fetchSubscriberData();
        toast.success(`Action "${action}" completed successfully`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      toast.error(`Failed to ${action} subscriber`);
    }
  };

  const exportSubscriberData = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/subscribers/${subscriberId}/export`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `subscriber-${subscriberId}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Subscriber data exported');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskBadgeColor = (riskScore: number) => {
    if (riskScore >= 8) return 'bg-red-100 text-red-800';
    if (riskScore >= 6) return 'bg-yellow-100 text-yellow-800';
    if (riskScore >= 4) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const getRiskLabel = (riskScore: number) => {
    if (riskScore >= 8) return 'High Risk';
    if (riskScore >= 6) return 'Medium Risk';
    if (riskScore >= 4) return 'Low Risk';
    return 'Safe';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login': return <User className="h-4 w-4" />;
      case 'content_created': return <FileText className="h-4 w-4" />;
      case 'payment': return <CreditCard className="h-4 w-4" />;
      case 'subscription_change': return <Crown className="h-4 w-4" />;
      case 'support_ticket': return <MessageSquare className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!subscriber) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Subscriber Not Found</h2>
          <p className="text-gray-600 mb-4">The subscriber you're looking for doesn't exist.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            ← Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscriber Details</h1>
            <p className="text-gray-600">Manage subscriber information and analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportSubscriberData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchSubscriberData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {editing ? (
            <div className="flex gap-2">
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={subscriber.image} />
                      <AvatarFallback>
                        {subscriber.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      {editing ? (
                        <div className="space-y-2">
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            placeholder="Full name"
                          />
                          <Input
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            placeholder="Email address"
                            type="email"
                          />
                        </div>
                      ) : (
                        <>
                          <h3 className="text-xl font-semibold">{subscriber.name}</h3>
                          <p className="text-gray-600">{subscriber.email}</p>
                        </>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {subscriber.subscriptionPlan === 'agency' && <Crown className="h-4 w-4 text-yellow-500" />}
                        {subscriber.isVerified && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {subscriber.isBanned && <Ban className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Subscription Plan</Label>
                      {editing ? (
                        <Select value={editForm.subscriptionPlan} onValueChange={(value) => setEditForm({ ...editForm, subscriptionPlan: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="agency">Agency</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={subscriber.subscriptionPlan === 'free' ? 'secondary' : 'default'}>
                          {subscriber.subscriptionPlan}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <Label>Status</Label>
                      <div className="flex gap-2">
                        <Badge variant={subscriber.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                          {subscriber.subscriptionStatus}
                        </Badge>
                        <Badge className={getRiskBadgeColor(subscriber.riskScore)}>
                          {getRiskLabel(subscriber.riskScore)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {editing && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <Label>Active</Label>
                        <Switch
                          checked={editForm.isActive}
                          onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Banned</Label>
                        <Switch
                          checked={editForm.isBanned}
                          onCheckedChange={(checked) => setEditForm({ ...editForm, isBanned: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Verified</Label>
                        <Switch
                          checked={editForm.isVerified}
                          onCheckedChange={(checked) => setEditForm({ ...editForm, isVerified: checked })}
                        />
                      </div>
                      <div>
                        <Label>Risk Score (0-10)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={editForm.riskScore}
                          onChange={(e) => setEditForm({ ...editForm, riskScore: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label>Tags (comma-separated)</Label>
                        <Input
                          value={editForm.tags}
                          onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                          placeholder="vip, enterprise, support"
                        />
                      </div>
                      <div>
                        <Label>Notes</Label>
                        <Textarea
                          value={editForm.notes}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          placeholder="Internal notes about this subscriber..."
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Team Information */}
              {subscriber.team && (
                <Card>
                  <CardHeader>
                    <CardTitle>Team Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{subscriber.team.name}</h4>
                        <p className="text-sm text-gray-600">
                          {subscriber.team.memberCount} members • Role: {subscriber.team.role}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        View Team
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Content Created</p>
                        <p className="text-2xl font-bold">{subscriber.analytics.contentCreated}</p>
                      </div>
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Content Repurposed</p>
                        <p className="text-2xl font-bold">{subscriber.analytics.contentRepurposed}</p>
                      </div>
                      <RefreshCw className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Login Count</p>
                        <p className="text-2xl font-bold">{subscriber.analytics.loginCount}</p>
                      </div>
                      <Activity className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Engagement Score</p>
                        <p className="text-2xl font-bold">{subscriber.analytics.engagementScore}/100</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Top Platforms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {subscriber.analytics.topPlatforms.map((platform) => (
                      <Badge key={platform} variant="outline">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold">{formatCurrency(subscriber.billing.totalRevenue)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Payment Methods</p>
                        <p className="text-2xl font-bold">{subscriber.billing.paymentMethods}</p>
                      </div>
                      <CreditCard className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Invoices</p>
                        <p className="text-2xl font-bold">{subscriber.billing.invoiceCount}</p>
                      </div>
                      <FileText className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Overage Charges</p>
                        <p className="text-2xl font-bold">{formatCurrency(subscriber.billing.overageCharges)}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Billing Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Last Payment</Label>
                      <p className="text-sm text-gray-600">
                        {subscriber.billing.lastPayment ? formatDate(subscriber.billing.lastPayment) : 'No payments'}
                      </p>
                    </div>
                    <div>
                      <Label>Next Billing</Label>
                      <p className="text-sm text-gray-600">
                        {subscriber.billing.nextBilling ? formatDate(subscriber.billing.nextBilling) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  {subscriber.subscriptionRenewalDate && (
                    <div>
                      <Label>Subscription Renewal</Label>
                      <p className="text-sm text-gray-600">
                        {formatDate(subscriber.subscriptionRenewalDate)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No recent activity</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{activity.description}</p>
                            <p className="text-sm text-gray-600">{formatDate(activity.timestamp)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Usage This Month</span>
                <span className="font-medium">{subscriber.usageThisMonth}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Usage</span>
                <span className="font-medium">{subscriber.totalUsage}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Member Since</span>
                <span className="font-medium">{new Date(subscriber.createdAt).toLocaleDateString()}</span>
              </div>
              {subscriber.lastLoginAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Login</span>
                  <span className="font-medium">{new Date(subscriber.lastLoginAt).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Support Information */}
          <Card>
            <CardHeader>
              <CardTitle>Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tickets</span>
                <span className="font-medium">{subscriber.support.ticketCount}</span>
              </div>
              {subscriber.support.satisfactionScore && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Satisfaction</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">{subscriber.support.satisfactionScore}/5</span>
                  </div>
                </div>
              )}
              {subscriber.support.responseTime && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Response</span>
                  <span className="font-medium">{subscriber.support.responseTime}h</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleAction(subscriber.isActive ? 'deactivate' : 'activate')}
              >
                {subscriber.isActive ? <UserX className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                {subscriber.isActive ? 'Deactivate' : 'Activate'}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleAction(subscriber.isBanned ? 'unban' : 'ban')}
              >
                <Ban className="h-4 w-4 mr-2" />
                {subscriber.isBanned ? 'Unban' : 'Ban'} User
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Create Ticket
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
            </CardContent>
          </Card>

          {/* Tags */}
          {subscriber.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {subscriber.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 