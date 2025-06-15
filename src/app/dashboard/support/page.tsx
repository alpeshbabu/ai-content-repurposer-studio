import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TicketList } from '@/components/support/ticket-list';
import { CreateTicketButton } from '@/components/support/create-ticket-button';

export const metadata: Metadata = {
  title: 'Support',
  description: 'Get help with your account and subscription',
};

export default async function SupportPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Support</h1>
        <CreateTicketButton />
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Support Tickets</h2>
        </div>
        
        <TicketList />
      </div>
    </div>
  );
} 