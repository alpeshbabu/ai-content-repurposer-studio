'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { CreditCard, Loader2, Check, AlertCircle, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutFormProps {
  plan: string;
  user: any;
  returnUrl: string;
}

interface PaymentFormProps extends CheckoutFormProps {}

function PaymentForm({ plan, user, returnUrl }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [useExistingCard, setUseExistingCard] = useState(false);

  useEffect(() => {
    // Check if user has existing payment methods
    if (user.paymentMethods && user.paymentMethods.length > 0) {
      // Use the most recent payment method (first in the array due to ordering)
      const latestMethod = user.paymentMethods[0];
      setPaymentMethod(latestMethod.stripePaymentMethodId);
      setUseExistingCard(true);
    }
  }, [user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);
    setProcessingStep('Creating subscription...');

    try {
      let paymentMethodId = paymentMethod;

      // If using new card, create payment method
      if (!useExistingCard) {
        setProcessingStep('Processing card details...');
        
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('Card element not found');
        }

        // Create payment method
        const { error: pmError, paymentMethod: pm } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            name: user.name || user.email,
            email: user.email,
          },
        });

        if (pmError) {
          throw new Error(pmError.message || 'Failed to process card');
        }

        paymentMethodId = pm.id;
      }

      setProcessingStep('Creating subscription...');

      // Create subscription
      const response = await fetch('/api/payment/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          paymentMethodId,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error('Invalid response from server. Please try again.');
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Subscription creation failed');
      }

      // Handle payment confirmation if needed
      if (data.clientSecret) {
        setProcessingStep('Confirming payment...');

        const { error: confirmError } = await stripe.confirmPayment({
          clientSecret: data.clientSecret,
          confirmParams: {
            return_url: window.location.origin + returnUrl,
          },
          redirect: 'if_required',
        });

        if (confirmError) {
          throw new Error(confirmError.message || 'Payment confirmation failed');
        }
      }

      setProcessingStep('Finalizing subscription...');

      // Wait a moment for database to be updated
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify subscription status
      const verifyResponse = await fetch('/api/payment/subscription', {
        method: 'GET',
      });

      if (!verifyResponse.ok) {
        throw new Error('Unable to verify subscription. Please refresh the page.');
      }

      const verifyData = await verifyResponse.json();

      // Check if subscription was created successfully (allow both active and pending_payment)
      const isSubscriptionValid = verifyData.currentPlan === plan && 
        (verifyData.status === 'active' || verifyData.status === 'pending_payment');

      if (isSubscriptionValid) {
        // Success! Redirect to success page
        router.push(returnUrl);
      } else {
        // Log details for debugging
        console.log('Verification failed:', {
          currentPlan: verifyData.currentPlan,
          expectedPlan: plan,
          status: verifyData.status,
          subscription: verifyData.subscription
        });
        
        throw new Error(`Subscription verification failed. Current plan: ${verifyData.currentPlan}, Status: ${verifyData.status}`);
      }

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      setProcessingStep('');
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        backgroundColor: '#ffffff',
        padding: '12px',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: false,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Payment Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Existing Payment Method */}
      {user.paymentMethods && user.paymentMethods.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Payment Method</h3>
          
          <div className="space-y-3">
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment-option"
                checked={useExistingCard}
                onChange={() => setUseExistingCard(true)}
                className="mr-3"
              />
              <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                             <div className="flex-1">
                 <div className="flex items-center">
                   <span className="font-medium capitalize">
                     {user.paymentMethods[0].brand}
                   </span>
                   <span className="ml-2">•••• {user.paymentMethods[0].last4}</span>
                   <span className="ml-auto text-sm text-gray-500">
                     {user.paymentMethods[0].expiryMonth}/{user.paymentMethods[0].expiryYear}
                   </span>
                 </div>
                 <p className="text-sm text-gray-500">Saved payment method</p>
               </div>
            </label>

            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment-option"
                checked={!useExistingCard}
                onChange={() => setUseExistingCard(false)}
                className="mr-3"
              />
              <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
              <span>Use a new card</span>
            </label>
          </div>
        </div>
      )}

      {/* New Card Form */}
      {(!user.paymentMethods || user.paymentMethods.length === 0 || !useExistingCard) && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Card Information</h3>
          
          <div className="border rounded-lg p-4 bg-white">
            <CardElement options={cardElementOptions} />
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <Lock className="h-4 w-4 mr-2" />
            <span>Your payment information is encrypted and secure</span>
          </div>
        </div>
      )}

      {/* Customer Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Billing Information</h3>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={user.name || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Processing Status */}
      {loading && processingStep && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-3" />
            <span className="text-sm font-medium text-blue-900">{processingStep}</span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="h-5 w-5 mr-2" />
            Complete Subscription
          </>
        )}
      </button>

      {/* Terms */}
      <p className="text-xs text-gray-500 text-center">
        Your subscription will start immediately after payment confirmation.
        You can cancel or modify your subscription at any time.
      </p>
    </form>
  );
}

export default function CheckoutForm(props: CheckoutFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
} 