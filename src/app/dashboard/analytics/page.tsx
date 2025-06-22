import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AnalyticsDashboard from '@/components/dashboard/analytics-dashboard';

export const metadata: Metadata = {
  title: 'Analytics - AI Content Repurposer Studio',
  description: 'View detailed analytics and insights for your content performance',
};

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto py-6">
      <AnalyticsDashboard />
    </div>
  );
} 