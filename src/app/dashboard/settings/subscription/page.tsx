import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PricingCard } from '@/components/subscription/pricing-card';
import { SUBSCRIPTION_LIMITS, DAILY_LIMITS, OVERAGE_PRICING } from '@/lib/subscription';
import { OverageCharges } from '@/components/subscription/overage-charges';

export const metadata: Metadata = {
  title: 'Subscription Management',
  description: 'Manage your subscription plan',
};

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/signin');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: {
      subscriptionPlan: true,
      subscriptionStatus: true,
      subscriptionRenewalDate: true,
      usageThisMonth: true,
    },
  });

  if (!user) {
    redirect('/dashboard');
  }

  // Calculate remaining usage based on plan
  const usageLimit = SUBSCRIPTION_LIMITS[user.subscriptionPlan as keyof typeof SUBSCRIPTION_LIMITS] || 5;
  const dailyLimit = DAILY_LIMITS[user.subscriptionPlan as keyof typeof DAILY_LIMITS] || Infinity;
  
  const remainingUsage = usageLimit === Infinity 
    ? 'Unlimited' 
    : Math.max(0, usageLimit - user.usageThisMonth).toString();

  // Format date for display
  const renewalDate = user.subscriptionRenewalDate 
    ? new Date(user.subscriptionRenewalDate).toLocaleDateString()
    : 'N/A';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Plan:</p>
            <p className="font-medium capitalize">{user.subscriptionPlan}</p>
          </div>
          <div>
            <p className="text-gray-600">Status:</p>
            <p className="font-medium capitalize">{user.subscriptionStatus}</p>
          </div>
          <div>
            <p className="text-gray-600">Renewal Date:</p>
            <p className="font-medium">{renewalDate}</p>
          </div>
          <div>
            <p className="text-gray-600">Usage This Month:</p>
            <p className="font-medium">{user.usageThisMonth} / {usageLimit === Infinity ? 'Unlimited' : usageLimit} content repurposes</p>
          </div>
          <div>
            <p className="text-gray-600">Remaining Usage:</p>
            <p className="font-medium">{remainingUsage}</p>
          </div>
          <div>
            <p className="text-gray-600">Daily Limit:</p>
            <p className="font-medium">{dailyLimit === Infinity ? 'No daily limit' : `${dailyLimit} per day`}</p>
          </div>
          <div>
            <p className="text-gray-600">Overage Rate:</p>
            <p className="font-medium">${OVERAGE_PRICING[user.subscriptionPlan as keyof typeof OVERAGE_PRICING]} per content repurpose</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <PricingCard
            title="Free"
            price={0}
            features={[
              '5 content repurposes per month',
              'No daily limit',
              '$0.12 per additional content repurpose',
              'Basic AI model',
              'Twitter & Instagram templates',
              'No team members',
            ]}
            ctaText={user.subscriptionPlan === 'free' ? 'Current Plan' : 'Downgrade'}
            disabled={user.subscriptionPlan === 'free'}
            currentPlan={user.subscriptionPlan === 'free'}
            planId="free"
          />
          
          <PricingCard
            title="Basic"
            price={6.99}
            features={[
              '2 content repurposes per day',
              '60 content repurposes per month',
              '$0.10 per additional content repurpose',
              'Standard AI model',
              'Twitter, Instagram & Facebook templates',
              'Basic customer support',
              'Basic Analytics',
            ]}
            ctaText={user.subscriptionPlan === 'basic' ? 'Current Plan' : 'Upgrade'}
            disabled={user.subscriptionPlan === 'basic'}
            currentPlan={user.subscriptionPlan === 'basic'}
            planId="basic"
          />
          
          <PricingCard
            title="Pro"
            price={14.99}
            features={[
              '5 content repurposes per day',
              '150 content repurposes per month',
              '$0.08 per additional content repurpose',
              'Advanced AI model',
              'All major platforms + LinkedIn templates',
              'Professional customer support',
              'Professional Analytics',
            ]}
            ctaText={user.subscriptionPlan === 'pro' ? 'Current Plan' : 'Upgrade'}
            disabled={user.subscriptionPlan === 'pro'}
            currentPlan={user.subscriptionPlan === 'pro'}
            planId="pro"
            highlighted
          />
          
          <PricingCard
            title="Agency"
            price={29.99}
            features={[
              '450 content repurposes per month',
              'Up to 3 team members included',
              '$0.06 per additional content repurpose',
              'Advanced AI model',
              'All platforms + custom templates',
              'Priority Support',
              'Professional Analytics',
              'Team collaboration & analytics',
            ]}
            ctaText={user.subscriptionPlan === 'agency' ? 'Current Plan' : 'Upgrade'}
            disabled={user.subscriptionPlan === 'agency'}
            currentPlan={user.subscriptionPlan === 'agency'}
            planId="agency"
          />
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Billing</h2>
        <OverageCharges />
        
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Subscription FAQs</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">What happens when I reach my usage limit?</h4>
              <p className="text-sm text-gray-600 mt-1">
                When you reach your monthly or daily limit, you can opt to pay for additional content repurposes at your plan's overage rate, or upgrade to a higher tier.
              </p>
            </div>
            <div>
              <h4 className="font-medium">How do daily limits work?</h4>
              <p className="text-sm text-gray-600 mt-1">
                Daily limits reset at midnight UTC. Monthly limits reset on the first day of each month.
              </p>
            </div>
            <div>
              <h4 className="font-medium">When am I billed for overages?</h4>
              <p className="text-sm text-gray-600 mt-1">
                Overage charges are collected at the end of your billing period along with your regular subscription payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 