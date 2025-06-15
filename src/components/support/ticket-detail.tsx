'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Clock, Tag } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export function TicketDetail({ ticketId }: { ticketId: string }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/support/tickets/${ticketId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', response.status, errorText);
        throw new Error(`Failed to fetch ticket: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Ticket data:', data);
      
      // Check if we have a message from the server
      if (data.message) {
        // This isn't an error, it's an informational message
        console.log('Server message:', data.message);
        setError(data.message);
      }
      
      setTicket(data.ticket || null);
      
    } catch (error) {
      console.error('Error fetching ticket:', error);
      setError('Failed to load ticket. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket || newStatus === ticket.status) return;
    
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update ticket status');
      }
      
      setTicket(prev => prev ? { ...prev, status: newStatus } : null);
      setUpdateStatus('Ticket status updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setUpdateStatus(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error updating ticket status:', error);
      setUpdateStatus('Failed to update ticket status');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-7 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="h-20 bg-gray-200 rounded mb-4"></div>
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-1/5"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-start">
        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium">Error loading ticket</h3>
          <p className="text-sm mt-1">{error}</p>
          {error.includes('not initialized') && (
            <p className="text-sm mt-2">
              The support ticket system is being set up. Please check back later or 
              contact the administrator directly via email.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Ticket not found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-2xl font-bold">{ticket.subject}</h1>
        <div className="flex gap-2">
          {getStatusBadge(ticket.status)}
          {getPriorityBadge(ticket.priority)}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          <span>Created: {formatDate(ticket.createdAt)}</span>
        </div>
        <div className="flex items-center">
          <Tag className="h-4 w-4 mr-1" />
          <span>Category: <span className="capitalize">{ticket.category}</span></span>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-md mb-6">
        <h3 className="font-medium mb-2">Description</h3>
        <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
      </div>
      
      <div className="border-t pt-4">
        <h3 className="font-medium mb-3">Update Status</h3>
        
        {updateStatus && (
          <div className={`p-2 rounded-md mb-3 text-sm ${updateStatus.includes('Failed') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
            {updateStatus}
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusChange('open')}
            disabled={ticket.status === 'open' || isUpdating}
            className={`px-3 py-1 rounded-md text-sm ${
              ticket.status === 'open'
                ? 'bg-green-100 text-green-800'
                : 'border border-green-300 hover:bg-green-50 text-green-800'
            } disabled:opacity-50`}
          >
            Open
          </button>
          <button
            onClick={() => handleStatusChange('in-progress')}
            disabled={ticket.status === 'in-progress' || isUpdating}
            className={`px-3 py-1 rounded-md text-sm ${
              ticket.status === 'in-progress'
                ? 'bg-blue-100 text-blue-800'
                : 'border border-blue-300 hover:bg-blue-50 text-blue-800'
            } disabled:opacity-50`}
          >
            In Progress
          </button>
          <button
            onClick={() => handleStatusChange('resolved')}
            disabled={ticket.status === 'resolved' || isUpdating}
            className={`px-3 py-1 rounded-md text-sm ${
              ticket.status === 'resolved'
                ? 'bg-gray-100 text-gray-800'
                : 'border border-gray-300 hover:bg-gray-50 text-gray-800'
            } disabled:opacity-50`}
          >
            Resolved
          </button>
          <button
            onClick={() => handleStatusChange('closed')}
            disabled={ticket.status === 'closed' || isUpdating}
            className={`px-3 py-1 rounded-md text-sm ${
              ticket.status === 'closed'
                ? 'bg-gray-100 text-gray-600'
                : 'border border-gray-300 hover:bg-gray-50 text-gray-600'
            } disabled:opacity-50`}
          >
            Closed
          </button>
        </div>
      </div>
    </div>
  );
} 