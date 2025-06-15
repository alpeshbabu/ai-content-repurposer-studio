'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { CreditCard, Loader2, Check, X } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface AddPaymentMethodProps {
  onSuccess?: (paymentMethod: any) => void;
  onCancel?: () => void;
  setAsDefault?: boolean;
}

function PaymentMethodForm({ onSuccess, onCancel, setAsDefault = false }: AddPaymentMethodProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupIntentId, setSetupIntentId] = useState<string | null>(null);

  useEffect(() => {
    // Create setup intent when component mounts
    createSetupIntent();
  }, []);

  const createSetupIntent = async () => {
    try {
      const response = await fetch('/api/payment/setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (data.setupIntentId) {
        setSetupIntentId(data.setupIntentId);
      }
    } catch (err) {
      setError('Failed to initialize payment setup');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !setupIntentId) {
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Card element not found');
      setLoading(false);
      return;
    }

    // Confirm the setup intent with the card
    const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
      setupIntentId,
      {
        payment_method: {
          card: cardElement,
        },
      }
    );

    if (stripeError) {
      setError(stripeError.message || 'Payment setup failed');
      setLoading(false);
      return;
    }

    // Save the payment method to our database
    try {
      const response = await fetch('/api/payment/methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setupIntentId: setupIntent.id,
          setAsDefault,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess?.(data.paymentMethod);
      } else {
        setError('Failed to save payment method');
      }
    } catch (err) {
      setError('Failed to save payment method');
    }

    setLoading(false);
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
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: false,
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center mb-4">
        <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Add Payment Method</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className="border border-gray-300 rounded-md p-3 bg-white">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        {setAsDefault && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="setAsDefault"
              checked={setAsDefault}
              readOnly
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="setAsDefault" className="ml-2 text-sm text-gray-700">
              Set as default payment method
            </label>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center">
              <X className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={!stripe || loading}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Adding...' : 'Add Payment Method'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-4 text-xs text-gray-500">
        <p>🔒 Your payment information is securely processed by Stripe. We never store your card details.</p>
      </div>
    </div>
  );
}

export default function AddPaymentMethod(props: AddPaymentMethodProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentMethodForm {...props} />
    </Elements>
  );
} 