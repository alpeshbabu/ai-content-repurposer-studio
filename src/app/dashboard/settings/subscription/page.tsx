import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { EnhancedSubscriptionManager } from '@/components/subscription/enhanced-subscription-manager';

export const metadata: Metadata = {
  title: 'Subscription Management',
  description: 'Manage your subscription plan and billing',
};

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/signin');
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-gray-600 mt-2">Manage your subscription plan, usage, and billing preferences</p>
      </div>
      
      <EnhancedSubscriptionManager />
    </div>
  );
} 