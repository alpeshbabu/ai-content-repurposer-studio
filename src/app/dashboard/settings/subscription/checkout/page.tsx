import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import CheckoutForm from '@/components/payment/checkout-form';
import { getPlanConfig, PlanType } from '@/lib/pricing-config';

export const metadata: Metadata = {
  title: 'Checkout - AI Content Repurposer Studio',
  description: 'Complete your subscription upgrade',
};

interface CheckoutPageProps {
  searchParams: {
    plan?: string;
    return_url?: string;
  };
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/signin');
  }

  // Await searchParams in Next.js 15+
  const params = await searchParams;
  const { plan: planParam, return_url } = params;

  if (!planParam || !['basic', 'pro', 'agency'].includes(planParam)) {
    redirect('/dashboard/settings/subscription');
  }

  // Get user with current subscription info
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      stripeCustomerId: true,
      paymentMethods: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    }
  });

  if (!user) {
    redirect('/dashboard');
  }

  // Prevent downgrading through this flow
  const hierarchy = ['free', 'basic', 'pro', 'agency'];
  const currentPlanIndex = hierarchy.indexOf(user.subscriptionPlan);
  const targetPlanIndex = hierarchy.indexOf(planParam);

  if (targetPlanIndex <= currentPlanIndex && user.subscriptionStatus === 'active') {
    redirect('/dashboard/settings/subscription?error=already_subscribed');
  }

  const planDetails = getPlanConfig(planParam as PlanType);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Subscription</h1>
          <p className="text-gray-600 mt-2">
            You're upgrading to the {planDetails.name} plan
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Summary */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            <div className="border-l-4 border-blue-500 pl-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900">{planDetails.name} Plan</h3>
              <p className="text-sm text-gray-600 mt-1">
                Monthly subscription with immediate access
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan</span>
                <span className="font-medium">{planDetails.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Billing</span>
                <span className="font-medium">Monthly</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price</span>
                <span className="font-medium">${planDetails.price}/month</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Overage rate</span>
                <span className="text-gray-500">${planDetails.overagePrice.toFixed(2)} per extra repurpose</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total today</span>
                <span>${planDetails.price}.00</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Then ${planDetails.price}/month. Cancel anytime.
              </p>
            </div>

            {/* Features List */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">What's included:</h4>
              <ul className="space-y-2">
                {planDetails.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
            
            <CheckoutForm 
              plan={planParam}
              user={user}
              returnUrl={return_url || '/dashboard/settings/subscription?success=true'}
            />
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-900">Secure Payment</h3>
              <p className="text-sm text-blue-700 mt-1">
                Your payment is processed securely by Stripe. We never store your card details.
              </p>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            By subscribing, you agree to our{' '}
            <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
            Your subscription will automatically renew monthly.
          </p>
        </div>
      </div>
    </div>
  );
} 