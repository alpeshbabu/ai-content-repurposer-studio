'use client';

import { useState } from 'react';
import { Check, Loader2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface PricingCardProps {
  title: string;
  price: number;
  features: string[];
  ctaText: string;
  disabled?: boolean;
  currentPlan?: boolean;
  highlighted?: boolean;
  planId: string;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  planName: string;
  price: number;
  isDowngrade: boolean;
}

function ConfirmDialog({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  title, 
  planName, 
  price, 
  isDowngrade 
}: ConfirmDialogProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <AlertTriangle className={`h-6 w-6 mr-2 ${isDowngrade ? 'text-yellow-500' : 'text-blue-500'}`} />
          <h3 className="text-lg font-semibold">Confirm {isDowngrade ? 'Downgrade' : 'Upgrade'}</h3>
        </div>
        
        <p className="mb-4">
          Are you sure you want to {isDowngrade ? 'downgrade' : 'upgrade'} to the <strong>{planName}</strong> plan?
        </p>
        
        {isDowngrade ? (
          <div className="bg-yellow-50 border border-yellow-100 rounded p-3 mb-4 text-sm">
            <p>You may lose access to features that are only available on your current plan.</p>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-100 rounded p-3 mb-4 text-sm">
            <p>Your subscription will be upgraded immediately. You will be charged ${price} per month.</p>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md text-white ${
              isDowngrade ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Confirm {isDowngrade ? 'Downgrade' : 'Upgrade'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PricingCard({
  title,
  price,
  features,
  ctaText,
  disabled = false,
  currentPlan = false,
  highlighted = false,
  planId,
}: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  
  const isDowngrade = planId === 'free';

  const handleButtonClick = () => {
    if (disabled || currentPlan) return;
    
    // For paid plans, redirect to checkout
    if (planId !== 'free') {
      router.push(`/dashboard/settings/subscription/checkout?plan=${planId}`);
      return;
    }
    
    // For free plan (downgrade), show confirmation
    setShowConfirm(true);
  };
  
  const handleCancelConfirm = () => {
    setShowConfirm(false);
  };

  const handleSubscribe = async () => {
    setShowConfirm(false);
    
    // Only handle downgrades to free plan here
    if (planId !== 'free') {
      router.push(`/dashboard/settings/subscription/checkout?plan=${planId}`);
      return;
    }
    
    // Show pending toast for downgrade to free
    const toastId = toast.loading('Downgrading to free plan...');
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: planId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Subscription update failed' }));
        throw new Error(errorData.message || 'Subscription update failed');
      }
      
      // Show success toast
      toast.success(
        'Successfully downgraded to free plan',
        { id: toastId }
      );
      
      // Refresh the page to show updated subscription after a short delay
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error('Error updating subscription:', error);
      
      // Show error toast
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to update subscription. Please try again.',
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={`border rounded-lg p-6 ${
          highlighted
            ? 'border-blue-500 shadow-lg shadow-blue-100'
            : 'border-gray-200'
        }`}
      >
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <div className="mb-4">
          <span className="text-3xl font-bold">${price}</span>
          {price > 0 && <span className="text-gray-500">/month</span>}
        </div>
        
        <ul className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        
        <button
          onClick={handleButtonClick}
          disabled={disabled || loading}
          className={`w-full py-2 px-4 rounded-md ${
            currentPlan
              ? 'bg-gray-100 text-gray-800 cursor-default'
              : highlighted
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          ) : (
            ctaText
          )}
        </button>
        
        {currentPlan && (
          <p className="text-sm text-center mt-2 text-blue-600 font-medium">
            Your current plan
          </p>
        )}
      </div>
      
      <ConfirmDialog
        isOpen={showConfirm}
        onConfirm={handleSubscribe}
        onCancel={handleCancelConfirm}
        title={ctaText}
        planName={title}
        price={price}
        isDowngrade={isDowngrade}
      />
    </>
  );
} 