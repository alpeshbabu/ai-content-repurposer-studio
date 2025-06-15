import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminTicketDetail } from '@/components/support/admin-ticket-detail';
import { ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

interface AdminTicketPageProps {
  params: Promise<{
    ticketId: string;
  }>;
}

export const metadata: Metadata = {
  title: 'Admin Ticket Detail',
  description: 'View and respond to support ticket',
};

export default async function AdminTicketPage({ params }: AdminTicketPageProps) {
  const session = await getServerSession(authOptions);
  const { ticketId } = await params;

  if (!session || !session.user) {
    redirect('/auth/signin');
  }

  // Check if user is website owner (admin)
  const userId = session.user.id;
  const userRole = (session.user as any)?.role;

  if (userRole !== 'owner') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link 
            href="/dashboard/admin/support"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Admin Dashboard
          </Link>
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold">Admin Ticket View</h1>
          </div>
        </div>
      </div>

      {/* Ticket Detail Component */}
      <AdminTicketDetail ticketId={ticketId} />
    </div>
  );
} 