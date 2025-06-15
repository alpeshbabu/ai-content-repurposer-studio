import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield, Users, MessageSquare, BarChart3, Settings, ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Link>
              <div className="flex items-center">
                <Shield className="h-6 w-6 text-red-600 mr-2" />
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Admin: {user.name || user.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Navigation */}
      <div className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <Link
              href="/dashboard/admin"
              className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium hover:border-gray-300 hover:text-gray-300 transition-colors py-4"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/admin/users"
              className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium hover:border-gray-300 hover:text-gray-300 transition-colors py-4"
            >
              <Users className="h-4 w-4 mr-2" />
              Users
            </Link>
            <Link
              href="/dashboard/admin/support"
              className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium hover:border-gray-300 hover:text-gray-300 transition-colors py-4"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Support
            </Link>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium hover:border-gray-300 hover:text-gray-300 transition-colors py-4"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
} 