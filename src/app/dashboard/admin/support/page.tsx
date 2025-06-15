import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminTicketList } from '@/components/support/admin-ticket-list';
import { MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Admin Support Dashboard',
  description: 'Manage and respond to customer support tickets',
};

export default async function AdminSupportPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/signin');
  }

  // Check if user is website owner (admin)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      name: true,
      email: true
    }
  });

  if (!user || user.role !== 'owner') {
    redirect('/dashboard');
  }

  // Get support ticket statistics
  const stats = await prisma.supportTicket.aggregate({
    _count: {
      id: true,
    }
  });

  const statusStats = await Promise.all([
    prisma.supportTicket.count({ where: { status: 'open' } }),
    prisma.supportTicket.count({ where: { status: 'in-progress' } }),
    prisma.supportTicket.count({ where: { status: 'resolved' } }),
    prisma.supportTicket.count({ where: { status: 'closed' } })
  ]);

  const [openCount, inProgressCount, resolvedCount, closedCount] = statusStats;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Support Management</h1>
        <p className="text-gray-600">Manage and respond to customer support tickets</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats._count.id}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Open Tickets</p>
              <p className="text-2xl font-bold text-red-600">{openCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-orange-600">{inProgressCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket List */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">All Support Tickets</h2>
          <div className="text-sm text-gray-500">
            {stats._count.id} total tickets
          </div>
        </div>
        
        <AdminTicketList />
      </div>
    </div>
  );
} 