'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export function TicketList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, pagination.page]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `/api/support/tickets?page=${pagination.page}&limit=${pagination.limit}`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      
      console.log('Fetching tickets from:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', response.status, errorText);
        throw new Error(`Failed to fetch tickets: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Tickets data:', data);
      
      // Handle server messages (not errors)
      if (data.message && data.tickets.length === 0) {
        console.log('Server message:', data.message);
        setError(data.message);
      } else {
        setError(null);
      }
      
      setTickets(data.tickets || []);
      setPagination(data.pagination || pagination);
      
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError('Failed to load tickets. Please try again later.');
      setTickets([]);
    } finally {
      setLoading(false);
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

  if (loading && tickets.length === 0) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
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
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-start">
        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium">Error loading tickets</h3>
          <p className="text-sm mt-1">{error}</p>
          {error.includes('not initialized') && (
            <p className="text-sm mt-2">
              The support ticket system is being set up. Please check back later or 
              contact the administrator directly via email.
            </p>
          )}
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

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg">
        <h3 className="text-lg font-medium text-gray-500 mb-2">No tickets found</h3>
        <p className="text-gray-400 mb-4">
          {statusFilter 
            ? `No tickets with status "${statusFilter}" found.`
            : "You haven't created any support tickets yet."
          }
        </p>
        {statusFilter && (
          <button
            onClick={() => setStatusFilter(null)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Clear filter
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
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

        {loading && (
          <div className="flex items-center text-sm text-gray-500">
            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            Loading...
          </div>
        )}
      </div>

      <div className="space-y-4">
        {tickets.map((ticket) => (
          <Link
            href={`/dashboard/support/ticket/${ticket.id}`}
            key={ticket.id}
            className="block border rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2">
              <h3 className="font-medium text-lg text-blue-600">{ticket.subject}</h3>
              <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                {getStatusBadge(ticket.status)}
                {getPriorityBadge(ticket.priority)}
              </div>
            </div>
            
            <div className="text-sm text-gray-600 mb-4 capitalize">
              Category: {ticket.category.replace('-', ' ')}
            </div>
            
            <div className="flex flex-wrap justify-between text-xs text-gray-500">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>Updated: {formatDate(ticket.updatedAt)}</span>
              </div>
              <div className="flex items-center">
                <MessageCircle className="h-3 w-3 mr-1" />
                <span>{ticket.replyCount} replies</span>
              </div>
            </div>
          </Link>
        ))}
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