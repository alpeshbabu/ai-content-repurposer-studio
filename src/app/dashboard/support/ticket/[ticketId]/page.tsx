import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TicketDetail } from '@/components/support/ticket-detail';
import { TicketReplies } from '@/components/support/ticket-replies';
import { ReplyForm } from '@/components/support/reply-form';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Support Ticket',
  description: 'View and manage your support ticket',
};

export default async function TicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/signin');
  }

  const { ticketId } = await params;

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Link 
          href="/dashboard/support" 
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to all tickets
        </Link>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <TicketDetail ticketId={ticketId} />
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Conversation</h2>
          <TicketReplies ticketId={ticketId} />
          <ReplyForm ticketId={ticketId} />
        </div>
      </div>
    </div>
  );
} 