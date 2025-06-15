'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CreditCard, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import AddPaymentMethod from '@/components/payment/add-payment-method';

interface PaymentMethod {
  id: string;
  stripePaymentMethodId: string;
  type: string;
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function PaymentMethodsPage() {
  const { data: session } = useSession();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payment/methods');
      const data = await response.json();
      
      if (response.ok) {
        setPaymentMethods(data.paymentMethods || []);
      } else {
        setError('Failed to load payment methods');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodAdded = (newPaymentMethod: PaymentMethod) => {
    setPaymentMethods(prev => [newPaymentMethod, ...prev]);
    setShowAddForm(false);
  };

  const getBrandIcon = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      default:
        return '💳';
    }
  };

  const getBrandColor = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return 'bg-blue-100 text-blue-800';
      case 'mastercard':
        return 'bg-orange-100 text-orange-800';
      case 'amex':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!session) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800">Please sign in to manage your payment methods.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-600 mt-1">Manage your saved payment methods</p>
        </div>
        
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Add Payment Method Form */}
      {showAddForm && (
        <AddPaymentMethod
          onSuccess={handlePaymentMethodAdded}
          onCancel={() => setShowAddForm(false)}
          setAsDefault={paymentMethods.length === 0}
        />
      )}

      {/* Payment Methods List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Saved Payment Methods
          </h3>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading payment methods...</p>
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No payment methods</h4>
              <p className="text-gray-600 mb-4">Add a payment method to start using premium features</p>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Payment Method
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-md"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">
                      {getBrandIcon(method.brand)}
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getBrandColor(method.brand)}`}>
                          {method.brand?.toUpperCase() || 'CARD'}
                        </span>
                        <span className="text-gray-900 font-medium">
                          •••• •••• •••• {method.last4}
                        </span>
                        {method.isDefault && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Expires {String(method.expiryMonth).padStart(2, '0')}/{method.expiryYear}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!method.isDefault && (
                      <button
                        onClick={() => {
                          // TODO: Implement set as default
                          alert('Set as default functionality would be implemented here');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Set as Default
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        // TODO: Implement delete
                        if (confirm('Are you sure you want to remove this payment method?')) {
                          alert('Delete functionality would be implemented here');
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start">
          <CheckCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-800">Secure Payment Processing</h4>
            <p className="text-sm text-blue-700 mt-1">
              Your payment information is securely processed by Stripe. We never store your credit card details on our servers. 
              All transactions are encrypted and PCI DSS compliant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 