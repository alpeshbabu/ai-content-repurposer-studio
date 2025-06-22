'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CreditCard,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Star,
  Shield,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  Settings,
  Bell,
  Calendar,
  DollarSign,
  AlertTriangle,
  Info,
  ChevronRight,
  Edit,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  stripePaymentMethodId: string;
  type: string;
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  isBackup: boolean;
  isActive: boolean;
  nickname?: string;
  billingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  createdAt: string;
  lastUsed?: string;
  failureCount: number;
  status: 'active' | 'expired' | 'failed' | 'requires_action';
}

interface PaymentNotification {
  id: string;
  type: 'expiring_soon' | 'expired' | 'failed' | 'updated';
  title: string;
  message: string;
  paymentMethodId?: string;
  createdAt: string;
  isRead: boolean;
}

export default function EnhancedPaymentManager() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [notifications, setNotifications] = useState<PaymentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('methods');
  
  // Form states
  const [nickname, setNickname] = useState('');
  const [autoBackup, setAutoBackup] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [expiryNotifications, setExpiryNotifications] = useState(true);

  // Edit form state
  const [editForm, setEditForm] = useState({
    nickname: '',
    isBackup: false
  });

  useEffect(() => {
    fetchPaymentMethods();
    fetchNotifications();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payment/methods/enhanced');
      const result = await response.json();

      if (result.success) {
        setPaymentMethods(result.data.paymentMethods);
        setAutoBackup(result.data.settings?.autoBackup || false);
        setEmailNotifications(result.data.settings?.emailNotifications !== false);
        setExpiryNotifications(result.data.settings?.expiryNotifications !== false);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/payment/notifications');
      const result = await response.json();

      if (result.success) {
        setNotifications(result.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      const response = await fetch(`/api/payment/methods/${paymentMethodId}/default`, {
        method: 'POST'
      });

      if (response.ok) {
        setPaymentMethods(methods =>
          methods.map(method => ({
            ...method,
            isDefault: method.id === paymentMethodId
          }))
        );
        toast.success('Default payment method updated');
      } else {
        throw new Error('Failed to set default payment method');
      }
    } catch (error) {
      console.error('Error setting default payment method:', error);
      toast.error('Failed to update default payment method');
    }
  };

  const handleSetBackup = async (paymentMethodId: string, isBackup: boolean) => {
    try {
      const response = await fetch(`/api/payment/methods/${paymentMethodId}/backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBackup })
      });

      if (response.ok) {
        setPaymentMethods(methods =>
          methods.map(method =>
            method.id === paymentMethodId
              ? { ...method, isBackup }
              : method
          )
        );
        toast.success(isBackup ? 'Backup payment method set' : 'Backup status removed');
      } else {
        throw new Error('Failed to update backup status');
      }
    } catch (error) {
      console.error('Error updating backup status:', error);
      toast.error('Failed to update backup status');
    }
  };

  const handleUpdateNickname = async (paymentMethodId: string, nickname: string) => {
    try {
      const response = await fetch(`/api/payment/methods/${paymentMethodId}/nickname`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname })
      });

      if (response.ok) {
        setPaymentMethods(methods =>
          methods.map(method =>
            method.id === paymentMethodId
              ? { ...method, nickname }
              : method
          )
        );
        setEditingMethod(null);
        toast.success('Payment method nickname updated');
      } else {
        throw new Error('Failed to update nickname');
      }
    } catch (error) {
      console.error('Error updating nickname:', error);
      toast.error('Failed to update nickname');
    }
  };

  const handleDeleteMethod = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    try {
      const response = await fetch(`/api/payment/methods/${paymentMethodId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setPaymentMethods(methods =>
          methods.filter(method => method.id !== paymentMethodId)
        );
        toast.success('Payment method deleted');
      } else {
        throw new Error('Failed to delete payment method');
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Failed to delete payment method');
    }
  };

  const handleUpdateSettings = async () => {
    try {
      const response = await fetch('/api/payment/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoBackup,
          emailNotifications,
          expiryNotifications
        })
      });

      if (response.ok) {
        toast.success('Payment settings updated');
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      await fetch(`/api/payment/notifications/${notificationId}/read`, {
        method: 'POST'
      });
      
      setNotifications(notifications =>
        notifications.map(notif =>
          notif.id === notificationId
            ? { ...notif, isRead: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'requires_action': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBrandIcon = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa': return '💳';
      case 'mastercard': return '💳';
      case 'amex': return '💳';
      case 'discover': return '💳';
      default: return '💳';
    }
  };

  const isExpiringSoon = (method: PaymentMethod) => {
    if (!method.expiryMonth || !method.expiryYear) return false;
    
    const today = new Date();
    const expiryDate = new Date(method.expiryYear, method.expiryMonth - 1);
    const monthsUntilExpiry = (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    return monthsUntilExpiry <= 2 && monthsUntilExpiry > 0;
  };

  const formatExpiryDate = (month?: number, year?: number) => {
    if (!month || !year) return 'N/A';
    return `${String(month).padStart(2, '0')}/${year}`;
  };

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-600">Manage your payment methods and billing preferences</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchPaymentMethods}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
        </div>
      </div>

      {/* Notifications Banner */}
      {unreadNotifications > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">
                    You have {unreadNotifications} payment notification{unreadNotifications !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-yellow-700">
                    Check the notifications tab to review important payment updates
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('notifications')}
              >
                View Notifications
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="methods">
            <CreditCard className="h-4 w-4 mr-2" />
            Payment Methods ({paymentMethods.length})
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            {unreadNotifications > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {unreadNotifications}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Payment Methods Tab */}
        <TabsContent value="methods" className="space-y-4">
          {paymentMethods.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No payment methods</h3>
                <p className="text-gray-600 mb-4">Add a payment method to start using premium features</p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Payment Method
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <Card key={method.id} className="relative">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">
                          {getBrandIcon(method.brand)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {editingMethod === method.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editForm.nickname}
                                  onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                                  placeholder="Payment method nickname"
                                  className="w-48"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateNickname(method.id, editForm.nickname)}
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingMethod(null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <h3 className="text-lg font-medium">
                                  {method.nickname || `${method.brand?.toUpperCase()} •••• ${method.last4}`}
                                </h3>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingMethod(method.id);
                                    setEditForm({ 
                                      nickname: method.nickname || '',
                                      isBackup: method.isBackup 
                                    });
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            
                            <div className="flex items-center gap-2">
                              {method.isDefault && (
                                <Badge className="bg-blue-100 text-blue-800">
                                  <Star className="h-3 w-3 mr-1" />
                                  Default
                                </Badge>
                              )}
                              {method.isBackup && (
                                <Badge variant="outline">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Backup
                                </Badge>
                              )}
                              <Badge className={getStatusColor(method.status)}>
                                {method.status.replace('_', ' ')}
                              </Badge>
                              {isExpiringSoon(method) && (
                                <Badge variant="destructive">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Expiring Soon
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Expires {formatExpiryDate(method.expiryMonth, method.expiryYear)}</p>
                            {method.lastUsed && (
                              <p>Last used: {new Date(method.lastUsed).toLocaleDateString()}</p>
                            )}
                            {method.failureCount > 0 && (
                              <p className="text-red-600">
                                {method.failureCount} recent failure{method.failureCount !== 1 ? 's' : ''}
                              </p>
                            )}
                            {method.billingAddress && (
                              <p>{method.billingAddress.city}, {method.billingAddress.state}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!method.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(method.id)}
                          >
                            Set as Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetBackup(method.id, !method.isBackup)}
                        >
                          {method.isBackup ? 'Remove Backup' : 'Set as Backup'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMethod(method.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-600">You'll see payment-related notifications here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`cursor-pointer transition-colors ${
                    !notification.isRead ? 'border-blue-200 bg-blue-50' : ''
                  }`}
                  onClick={() => markNotificationRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {notification.type === 'expiring_soon' && 
                            <Calendar className="h-5 w-5 text-yellow-600" />}
                          {notification.type === 'expired' && 
                            <AlertCircle className="h-5 w-5 text-red-600" />}
                          {notification.type === 'failed' && 
                            <AlertTriangle className="h-5 w-5 text-red-600" />}
                          {notification.type === 'updated' && 
                            <CheckCircle className="h-5 w-5 text-green-600" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Automatic Backup Payment</Label>
                    <p className="text-sm text-gray-600">
                      Automatically use backup payment method if primary fails
                    </p>
                  </div>
                  <Switch
                    checked={autoBackup}
                    onCheckedChange={setAutoBackup}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-gray-600">
                      Receive email alerts for payment issues and updates
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Expiry Notifications</Label>
                    <p className="text-sm text-gray-600">
                      Get notified when payment methods are about to expire
                    </p>
                  </div>
                  <Switch
                    checked={expiryNotifications}
                    onCheckedChange={setExpiryNotifications}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button onClick={handleUpdateSettings}>
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800">PCI Compliant</h4>
                  <p className="text-sm text-green-700">
                    Your payment information is encrypted and stored securely using industry standards.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">Fraud Protection</h4>
                  <p className="text-sm text-blue-700">
                    Advanced fraud detection monitors all transactions for suspicious activity.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 