'use client';

import { useState, useEffect } from 'react';
import { User, Calendar, AlertCircle, RefreshCw, Crown, Shield } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  subscriptionPlan: string;
  subscriptionStatus: string;
  usageThisMonth: number;
  role: string | null;
  createdAt: string;
  emailVerified: string | null;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export function AdminUserList() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionFilter, setSubscriptionFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [subscriptionFilter, statusFilter, pagination.page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `/api/admin/users?page=${pagination.page}&limit=${pagination.limit}`;
      if (subscriptionFilter) {
        url += `&subscription=${subscriptionFilter}`;
      }
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      
      console.log('Fetching admin users from:', url);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', response.status, errorText);
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Admin users data:', data);
      
      setUsers(data.users || []);
      setPagination(data.pagination || pagination);
      
    } catch (error) {
      console.error('Error fetching admin users:', error);
      setError('Failed to load users. Please try again later.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateUserSubscription = async (userId: string, plan: string, status: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/users/${userId}/subscription`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan, status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user subscription');
      }

      // Refresh the user list
      fetchUsers();
    } catch (error) {
      console.error('Error updating user subscription:', error);
      setError('Failed to update subscription');
    }
  };

  const handleRetry = () => {
    fetchUsers();
  };

  const getSubscriptionBadge = (plan: string) => {
    const planColors: Record<string, string> = {
      free: 'bg-gray-100 text-gray-800',
      pro: 'bg-blue-100 text-blue-800',
      agency: 'bg-purple-100 text-purple-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${planColors[plan] || 'bg-gray-100'}`}>
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      cancelled: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-orange-100 text-orange-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  const getRoleBadge = (role: string | null) => {
    if (!role || role === 'member') return null;
    
    const roleColors: Record<string, string> = {
      owner: 'bg-yellow-100 text-yellow-800',
      admin: 'bg-blue-100 text-blue-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[role] || 'bg-gray-100'}`}>
        {role === 'owner' ? <Crown className="h-3 w-3 inline mr-1" /> : <Shield className="h-3 w-3 inline mr-1" />}
        {role}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading && users.length === 0) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/5"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-start">
        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium">Error loading users</h3>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={handleRetry}
            className="mt-3 inline-flex items-center px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 text-red-800 rounded-md transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg">
        <h3 className="text-lg font-medium text-gray-500 mb-2">No users found</h3>
        <p className="text-gray-400 mb-4">
          {subscriptionFilter || statusFilter
            ? `No users match the current filters.`
            : "No users have been registered yet."
          }
        </p>
        {(subscriptionFilter || statusFilter) && (
          <button
            onClick={() => {
              setSubscriptionFilter(null);
              setStatusFilter(null);
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <select
          className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={subscriptionFilter || ''}
          onChange={(e) => setSubscriptionFilter(e.target.value || null)}
        >
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="agency">Agency</option>
        </select>

        <select
          className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter || ''}
          onChange={(e) => setStatusFilter(e.target.value || null)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="cancelled">Cancelled</option>
          <option value="suspended">Suspended</option>
        </select>

        {loading && (
          <div className="flex items-center text-sm text-gray-500">
            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            Loading...
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subscription
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <User className="h-8 w-8 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        {user.name || 'Unnamed User'}
                        {getRoleBadge(user.role)}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {!user.emailVerified && (
                        <div className="text-xs text-red-500">Email not verified</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {getSubscriptionBadge(user.subscriptionPlan)}
                    <select
                      value={user.subscriptionPlan}
                      onChange={(e) => updateUserSubscription(user.id, e.target.value, user.subscriptionStatus)}
                      className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="agency">Agency</option>
                    </select>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(user.subscriptionStatus)}
                    <select
                      value={user.subscriptionStatus}
                      onChange={(e) => updateUserSubscription(user.id, user.subscriptionPlan, e.target.value)}
                      className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {user.usageThisMonth} units
                  </div>
                  <div className="text-xs text-gray-500">
                    this month
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(user.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      onClick={() => {/* View user details */}}
                    >
                      View
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                      onClick={() => {/* Suspend/Activate user */}}
                    >
                      {user.subscriptionStatus === 'suspended' ? 'Activate' : 'Suspend'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pagination.page === 1 || loading}
            className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          <span className="px-3 py-1 text-sm">
            Page {pagination.page} of {pagination.pages}
          </span>
          
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
            disabled={pagination.page === pagination.pages || loading}
            className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Error message for non-blocking errors */}
      {error && users.length > 0 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 text-sm">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
} 