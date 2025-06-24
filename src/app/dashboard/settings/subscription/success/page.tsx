import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CheckCircle, CreditCard, Calendar, Zap, Users, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Subscription Activated - AI Content Repurposer Studio',
  description: 'Your subscription has been successfully activated',
};

interface SuccessPageProps {
  searchParams: {
    session_id?: string;
    plan?: string;
  };
}

export default async function SubscriptionSuccessPage({ searchParams }: SuccessPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/signin');
  }

  // Get user subscription info
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      subscriptionPlan: true,
      subscriptionStatus: true,
      subscriptionRenewalDate: true,
      subscriptions: {
        where: { status: { in: ['active', 'trialing'] } },
        orderBy: { createdAt: 'desc' },
        take: 1,
      }
    }
  });

  if (!user) {
    redirect('/dashboard');
  }

  const planFeatures = {
    basic: [
      { icon: Zap, text: '60 content repurposes per month' },
      { icon: CreditCard, text: 'Twitter, Instagram & Facebook templates' },
      { icon: CheckCircle, text: 'Basic customer support' },
      { icon: BarChart3, text: 'Basic analytics' },
    ],
    pro: [
      { icon: Zap, text: '150 content repurposes per month' },
      { icon: CreditCard, text: 'All platforms + custom templates' },
      { icon: BarChart3, text: 'Professional analytics' },
      { icon: CheckCircle, text: 'Professional customer support' },
    ],
    agency: [
      { icon: Zap, text: '450 content repurposes per month' },
      { icon: Users, text: 'Up to 3 team members included' },
      { icon: BarChart3, text: 'Professional analytics' },
      { icon: CheckCircle, text: 'Priority support' },
      { icon: CreditCard, text: 'Team collaboration & analytics' },
    ],
  };

  const currentPlan = user.subscriptionPlan;
  const features = planFeatures[currentPlan as keyof typeof planFeatures] || [];
  const renewalDate = user.subscriptionRenewalDate ? new Date(user.subscriptionRenewalDate).toLocaleDateString() : 'N/A';

  const nextSteps = {
    basic: [
      { title: 'Create Your First Content', href: '/dashboard/new', description: 'Start repurposing with your new plan limits' },
      { title: 'View Analytics', href: '/dashboard/analytics', description: 'Track your content performance' },
      { title: 'Manage Settings', href: '/dashboard/settings', description: 'Configure your preferences' },
    ],
    pro: [
      { title: 'Create Your First Content', href: '/dashboard/new', description: 'Start repurposing with advanced AI' },
      { title: 'Explore API Access', href: '/dashboard/settings', description: 'Get your API keys for integrations' },
      { title: 'View Professional Analytics', href: '/dashboard/analytics', description: 'Access detailed insights' },
    ],
    agency: [
      { title: 'Set Up Your Team', href: '/dashboard/settings/team', description: 'Invite team members and assign roles' },
      { title: 'Agency Analytics', href: '/dashboard/analytics/agency', description: 'Access comprehensive agency insights' },
      { title: 'Create Your First Content', href: '/dashboard/new', description: 'Start with unlimited repurposing' },
    ],
  };

  const steps = nextSteps[currentPlan as keyof typeof nextSteps] || nextSteps.basic;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}!
          </h1>
          <p className="text-lg text-gray-600">
            Your subscription has been successfully activated and you now have access to all {currentPlan} plan features.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Subscription Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
              Subscription Details
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan</span>
                <span className="font-medium capitalize">{currentPlan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-medium text-green-600 capitalize">{user.subscriptionStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Next Billing</span>
                <span className="font-medium">{renewalDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Auto-renewal</span>
                <span className="font-medium text-green-600">Enabled</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Payment Confirmation</h3>
              <p className="text-sm text-blue-800">
                A receipt has been sent to your email address. You can also view all invoices in your 
                <Link href="/dashboard/settings/payment" className="underline ml-1">payment settings</Link>.
              </p>
            </div>
          </div>

          {/* Plan Features */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-purple-600" />
              Your Plan Features
            </h2>
            
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <feature.icon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{feature.text}</span>
                </li>
              ))}
            </ul>

            {currentPlan === 'agency' && (
              <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                <h3 className="font-medium text-purple-900 mb-2">🎉 Agency Exclusive</h3>
                <p className="text-sm text-purple-800">
                  You now have access to our most advanced features including team management, 
                  white-label options, and dedicated support.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
            Get Started with Your {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((step, index) => (
              <Link 
                key={index}
                href={step.href}
                className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center mb-2">
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded-full mr-2">
                    {index + 1}
                  </span>
                  <h3 className="font-medium">{step.title}</h3>
                </div>
                <p className="text-sm text-gray-600">{step.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
          >
            Start Creating Content
          </Link>
          <Link
            href="/dashboard"
            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/dashboard/settings/subscription"
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center"
          >
            Manage Subscription
          </Link>
        </div>

        {/* Support Notice */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help getting started? Contact our support team at{' '}
            <a href="mailto:support@aicontentrepurposer.com" className="text-blue-600 hover:underline">
              support@aicontentrepurposer.com
            </a>
            {currentPlan === 'agency' && (
              <span className="text-purple-600 font-medium"> (Priority Support)</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
} 