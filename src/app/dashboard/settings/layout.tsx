'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, CreditCard, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // Helper to check if a path is active
  const isActive = (path: string) => pathname === path;

  // Check if user has agency plan for team features
  const userSubscriptionPlan = (session?.user as any)?.subscriptionPlan;
  const hasTeamAccess = userSubscriptionPlan === 'agency';

  const menuItems = [
    {
      name: 'Brand Voice',
      path: '/dashboard/settings',
      icon: <Settings className="h-4 w-4 mr-2" />
    },
    {
      name: 'Subscription',
      path: '/dashboard/settings/subscription',
      icon: <CreditCard className="h-4 w-4 mr-2" />
    },
    // Only show team tab for agency plan users
    ...(hasTeamAccess ? [{
      name: 'Team',
      path: '/dashboard/settings/team',
      icon: <Users className="h-4 w-4 mr-2" />
    }] : []),
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="border rounded-lg overflow-hidden">
              <nav className="flex flex-col">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center px-4 py-3 text-sm hover:bg-gray-50 ${
                      isActive(item.path)
                        ? 'border-l-2 border-blue-600 bg-blue-50 font-medium text-blue-600'
                        : 'text-gray-700'
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            
            {/* Show upgrade prompt for non-agency users */}
            {!hasTeamAccess && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <Users className="h-4 w-4 text-blue-600 mr-2" />
                  <h4 className="text-sm font-medium text-blue-800">Team Features</h4>
                </div>
                <p className="text-xs text-blue-700 mb-3">
                  Collaborate with team members, manage roles, and share content projects.
                </p>
                <Link
                  href="/dashboard/settings/subscription"
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                >
                  Upgrade to Agency
                </Link>
              </div>
            )}
          </aside>
          
          {/* Main Content Area */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
} 