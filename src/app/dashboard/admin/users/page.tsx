import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminUserList } from '@/components/admin/admin-user-list';
import { Users, Shield } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'User Management - Admin',
  description: 'Manage platform subscribers and user accounts',
};

export default async function AdminUsersPage() {
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

  // Get user statistics
  const [totalUsers, activeUsers, freeUsers, proUsers, agencyUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { subscriptionStatus: 'active' } }),
    prisma.user.count({ where: { subscriptionPlan: 'free' } }),
    prisma.user.count({ where: { subscriptionPlan: 'pro' } }),
    prisma.user.count({ where: { subscriptionPlan: 'agency' } })
  ]);

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Shield className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-gray-600">Manage platform subscribers and accounts</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Welcome, {user.name || user.email}
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="h-4 w-4 bg-green-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
              <div className="h-4 w-4 bg-gray-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Free Plan</p>
              <p className="text-2xl font-bold text-gray-600">{freeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <div className="h-4 w-4 bg-blue-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pro Plan</p>
              <p className="text-2xl font-bold text-blue-600">{proUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
              <div className="h-4 w-4 bg-purple-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Agency Plan</p>
              <p className="text-2xl font-bold text-purple-600">{agencyUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">All Platform Users</h2>
          <div className="text-sm text-gray-500">
            {totalUsers} total users
          </div>
        </div>
        
        <AdminUserList />
      </div>
    </div>
  );
} 