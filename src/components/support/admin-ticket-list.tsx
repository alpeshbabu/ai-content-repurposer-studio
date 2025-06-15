'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, MessageCircle, AlertCircle, RefreshCw, User, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AdminTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export function AdminTicketList() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter, pagination.page]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('admin_token');
      
      // Check if admin token exists
      if (!token) {
        setError('AUTHENTICATION_REQUIRED');
        setLoading(false);
        return;
      }
      
      let url = `/api/admin/support/tickets?page=${pagination.page}&limit=${pagination.limit}`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      if (priorityFilter) {
        url += `&priority=${priorityFilter}`;
      }
      
      console.log('Fetching admin tickets from:', url);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      // Handle authentication errors
      if (response.status === 401) {
        localStorage.removeItem('admin_token');
        setError('AUTHENTICATION_REQUIRED');
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', response.status, errorText);
        setError('FETCH_ERROR');
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log('Admin tickets data:', data);
      
      setTickets(data.tickets || []);
      setPagination(data.pagination || pagination);
      
    } catch (error) {
      console.error('Error fetching admin tickets:', error);
      setError('NETWORK_ERROR');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        setError('AUTHENTICATION_REQUIRED');
        return;
      }
      
      const response = await fetch(`/api/admin/support/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.status === 401) {
        localStorage.removeItem('admin_token');
        setError('AUTHENTICATION_REQUIRED');
        return;
      }

      if (!response.ok) {
        setError('UPDATE_ERROR');
        return;
      }

      // Refresh the ticket list
      fetchTickets();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      setError('NETWORK_ERROR');
    }
  };

  const handleRetry = () => {
    fetchTickets();
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      open: 'bg-green-100 text-green-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      resolved: 'bg-gray-100 text-gray-800',
      closed: 'bg-gray-100 text-gray-600',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100'}`}>
        {status.replace('-', ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[priority] || 'bg-gray-100'}`}>
        {priority}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Enhanced error rendering
  const renderError = () => {
    const errorConfig = {
      'AUTHENTICATION_REQUIRED': {
        title: 'Admin Login Required',
        message: 'You need to be logged in as an admin to view support tickets.',
        actionText: 'Go to Admin Login',
        actionLink: '/admin',
        icon: '🔐',
        bgColor: 'bg-yellow-50 border-yellow-200 text-yellow-800'
      },
      'FETCH_ERROR': {
        title: 'Loading Error',
        message: 'Failed to load support tickets. Please try again.',
        actionText: 'Try Again',
        actionLink: null,
        icon: '⚠️',
        bgColor: 'bg-red-50 border-red-200 text-red-800'
      },
      'UPDATE_ERROR': {
        title: 'Update Failed',
        message: 'Failed to update ticket status. The change was not saved.',
        actionText: 'Try Again',
        actionLink: null,
        icon: '⚠️',
        bgColor: 'bg-red-50 border-red-200 text-red-800'
      },
      'NETWORK_ERROR': {
        title: 'Network Error',
        message: 'A network error occurred. Please check your connection and try again.',
        actionText: 'Try Again',
        actionLink: null,
        icon: '🌐',
        bgColor: 'bg-red-50 border-red-200 text-red-800'
      }
    };

    const config = errorConfig[error as keyof typeof errorConfig] || errorConfig['FETCH_ERROR'];

    return (
      <div className={`border rounded-lg p-6 ${config.bgColor}`}>
        <div className="flex items-start">
          <span className="text-2xl mr-3 flex-shrink-0">{config.icon}</span>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">{config.title}</h3>
            <p className="mb-4">{config.message}</p>
            <div className="flex flex-wrap gap-2">
              {config.actionLink ? (
                <a
                  href={config.actionLink}
                  className="inline-flex items-center px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  {config.actionText}
                </a>
              ) : (
                <button
                  onClick={() => {
                    setError(null);
                    fetchTickets();
                  }}
                  className="inline-flex items-center px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {config.actionText}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && tickets.length === 0) {
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

  if (error && tickets.length === 0) {
    return renderError();
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg">
        <h3 className="text-lg font-medium text-gray-500 mb-2">No tickets found</h3>
        <p className="text-gray-400 mb-4">
          {statusFilter || priorityFilter
            ? `No tickets match the current filters.`
            : "No support tickets have been created yet."
          }
        </p>
        {(statusFilter || priorityFilter) && (
          <button
            onClick={() => {
              setStatusFilter(null);
              setPriorityFilter(null);
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
          value={statusFilter || ''}
          onChange={(e) => setStatusFilter(e.target.value || null)}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={priorityFilter || ''}
          onChange={(e) => setPriorityFilter(e.target.value || null)}
        >
          <option value="">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {loading && (
          <div className="flex items-center text-sm text-gray-500">
            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            Loading...
          </div>
        )}
      </div>

      {/* Tickets Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ticket
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Replies
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Update
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <Link 
                      href={`/dashboard/admin/support/ticket/${ticket.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {ticket.subject}
                    </Link>
                    <div className="text-sm text-gray-500 capitalize">
                      {ticket.category.replace('-', ' ')}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {ticket.user.name || 'Unnamed User'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {ticket.user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(ticket.status)}
                    <select
                      value={ticket.status}
                      onChange={(e) => updateTicketStatus(ticket.id, e.target.value)}
                      className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getPriorityBadge(ticket.priority)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {ticket.replyCount}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(ticket.updatedAt)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/dashboard/admin/support/ticket/${ticket.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View & Reply
                  </Link>
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
      {error && tickets.length > 0 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 text-sm">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
} 