'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Shield, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  LogOut, 
  Database,
  Activity,
  CreditCard,
  FileText,
  UserPlus,
  Key
} from 'lucide-react';
import { canAccessSection } from '@/lib/rbac';
import { AdminProvider, useAdmin } from '@/components/admin/AdminAccessControl';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  isOwner: boolean;
  isAdmin: boolean;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState<{ username: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Check authentication on mount and route changes
  useEffect(() => {
    console.log('AdminLayout: Checking auth for pathname:', pathname);
    checkAuth();
  }, [pathname]);

  const checkAuth = () => {
    console.log('AdminLayout: Starting auth check');
    const token = localStorage.getItem('admin_token');
    
    if (!token) {
      console.log('AdminLayout: No token found');
      // Only redirect to login if not already on login page
      if (pathname !== '/admin') {
        console.log('AdminLayout: Redirecting to /admin');
        router.push('/admin');
      }
      setLoading(false);
      setAuthError('No authentication token found');
      return;
    }

    console.log('AdminLayout: Token found, verifying...');

    try {
      // Decode token to get user info (basic validation)
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payload = JSON.parse(atob(parts[1]));
      console.log('AdminLayout: Token payload:', payload);
      
      // Check if token is expired
      if (payload.exp * 1000 < Date.now()) {
        console.log('AdminLayout: Token expired');
        localStorage.removeItem('admin_token');
        router.push('/admin');
        setLoading(false);
        setAuthError('Authentication token expired');
        return;
      }

      console.log('AdminLayout: Token valid, setting authenticated state');
      setAdminInfo({ username: payload.username });
      setIsAuthenticated(true);
      setAuthError(null);
      
      // Fetch current user details for RBAC
      fetchCurrentUser();
    } catch (error) {
      console.error('AdminLayout: Token validation error:', error);
      localStorage.removeItem('admin_token');
      setAuthError(`Token validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (pathname !== '/admin') {
        router.push('/admin');
      }
    }
    
    setLoading(false);
  };

  const fetchCurrentUser = async () => {
    console.log('AdminLayout: Fetching current user details');
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('AdminLayout: Current user response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('AdminLayout: Current user data:', data);
        setCurrentUser(data.user);
      } else {
        console.error('AdminLayout: Failed to fetch current user:', response.statusText);
      }
    } catch (error) {
      console.error('AdminLayout: Error fetching current user:', error);
    }
  };

  const handleLogout = () => {
    console.log('AdminLayout: Logging out');
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    setAdminInfo(null);
    setCurrentUser(null);
    setAuthError(null);
    router.push('/admin');
  };

  // Show loading spinner
  if (loading) {
    console.log('AdminLayout: Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    console.log('AdminLayout: Not authenticated, showing login page. Auth error:', authError);
    return (
      <div>
        {authError && (
          <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
            <strong className="font-bold">Auth Error: </strong>
            <span className="block sm:inline">{authError}</span>
          </div>
        )}
        {children}
      </div>
    );
  }

  console.log('AdminLayout: Authenticated, showing admin layout with sidebar');

  // Define all possible navigation items
  const allNavigationItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3, section: 'dashboard' },
    { name: 'Analytics', href: '/admin/analytics', icon: Activity, section: 'analytics' },
    { name: 'Subscribers', href: '/admin/subscribers', icon: Users, section: 'subscribers' },
    { name: 'Content', href: '/admin/content', icon: FileText, section: 'content' },
    { name: 'Support', href: '/admin/support', icon: MessageSquare, section: 'support' },
    { name: 'Billing', href: '/admin/billing', icon: CreditCard, section: 'billing' },
    { name: 'Company Members', href: '/admin/team', icon: UserPlus, section: 'team' },
    { name: 'Admin Credentials', href: '/admin/credentials', icon: Key, section: 'credentials' },
    { name: 'System', href: '/admin/system', icon: Database, section: 'system' },
    { name: 'Settings', href: '/admin/settings', icon: Settings, section: 'settings' },
  ];

  // Filter navigation items based on user permissions
  const navigation = currentUser 
    ? allNavigationItems.filter(item => {
        // Show credentials section only to owners and admins
        if (item.section === 'credentials') {
          return currentUser.role === 'owner' || currentUser.role === 'admin';
        }
        
        // Show system section to all admin users for now
        if (item.section === 'system') return true;
        
        // Use RBAC for other sections
        return canAccessSection(currentUser, item.section);
      })
    : allNavigationItems; // Show all if user data not loaded yet

  const isActiveRoute = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Show user role badge
  const getUserRoleBadge = () => {
    if (!currentUser) return 'Administrator';
    
    switch (currentUser.role) {
      case 'owner':
        return 'Owner';
      case 'admin':
        return 'Administrator';
      case 'support':
        return 'Support Manager';
      case 'marketing':
        return 'Marketing Manager';
      case 'finance':
        return 'Finance Manager';
      case 'content_developer':
        return 'Content Developer';
      default:
        return 'Administrator';
    }
  };

  const getUserRoleColor = () => {
    if (!currentUser) return 'text-gray-400';
    
    switch (currentUser.role) {
      case 'owner':
        return 'text-yellow-400';
      case 'admin':
        return 'text-purple-400';
      case 'support':
        return 'text-blue-400';
      case 'marketing':
        return 'text-green-400';
      case 'finance':
        return 'text-orange-400';
      case 'content_developer':
        return 'text-indigo-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-center h-16 bg-gray-800">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-red-400 mr-2" />
            <span className="text-white text-lg font-bold">Admin Panel</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActiveRoute(item.href)
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                  {/* Add badge for Company Members section to indicate admin-only */}
                  {item.section === 'team' && (
                    <span className="ml-auto text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                  {/* Add badge for Admin Credentials section to indicate owner/admin-only */}
                  {item.section === 'credentials' && (
                    <span className="ml-auto text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                      Owner
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Role-based info section */}
          {currentUser && (
            <div className="mt-8 px-4 py-3 bg-gray-800 rounded-md">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Access Level
              </div>
              <div className={`text-sm font-medium ${getUserRoleColor()}`}>
                {getUserRoleBadge()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {currentUser.permissions?.includes('all') 
                  ? 'Full Access' 
                  : `${currentUser.permissions?.length || 0} permissions`
                }
              </div>
            </div>
          )}
        </nav>

        {/* Admin Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="bg-gray-800 rounded-md p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">
                  {currentUser?.name || adminInfo?.username || 'Admin User'}
                </p>
                <p className={`text-xs ${getUserRoleColor()}`}>
                  {getUserRoleBadge()}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-white transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Top Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-900">
                Admin Dashboard
              </h1>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Logged in as: <span className="font-medium">{currentUser?.name || adminInfo?.username}</span>
                  {currentUser && (
                    <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      currentUser.role === 'owner' ? 'bg-yellow-100 text-yellow-800' :
                      currentUser.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      currentUser.role === 'support' ? 'bg-blue-100 text-blue-800' :
                      currentUser.role === 'marketing' ? 'bg-green-100 text-green-800' :
                      currentUser.role === 'finance' ? 'bg-orange-100 text-orange-800' :
                      'bg-indigo-100 text-indigo-800'
                    }`}>
                      {getUserRoleBadge()}
                    </span>
                  )}
                </div>
                <Link
                  href="/"
                  className="text-sm text-blue-600 hover:text-blue-800"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Site
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
} 