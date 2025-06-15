'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  MessageSquare, 
  ChevronRight,
  Home,
  User,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Send,
  ArrowLeft,
  Edit,
  Flag,
  Mail
} from 'lucide-react';

interface TicketDetails {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  replies: Array<{
    id: string;
    message: string;
    createdAt: string;
    isStaff: boolean;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
}

export default function AdminTicketDetailPage() {
  const params = useParams();
  const ticketId = params.ticketId as string;
  
  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (ticketId) {
      fetchTicketDetails();
    }
  }, [ticketId]);

  const fetchTicketDetails = async () => {
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
      
      const response = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      // Handle authentication errors specifically
      if (response.status === 401) {
        // Clear invalid token and set auth error
        localStorage.removeItem('admin_token');
        setError('AUTHENTICATION_REQUIRED');
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('TICKET_NOT_FOUND');
        } else {
          setError('FETCH_ERROR');
        }
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      setTicket(data.ticket);
      
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      setError('NETWORK_ERROR');
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
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

      // Refresh ticket details
      fetchTicketDetails();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      setError('NETWORK_ERROR');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const sendReply = async () => {
    if (!replyMessage.trim()) return;

    try {
      setSendingReply(true);
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        setError('AUTHENTICATION_REQUIRED');
        return;
      }
      
      const response = await fetch(`/api/admin/support/tickets/${ticketId}/replies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: replyMessage,
          isStaff: true 
        }),
      });

      if (response.status === 401) {
        localStorage.removeItem('admin_token');
        setError('AUTHENTICATION_REQUIRED');
        return;
      }

      if (!response.ok) {
        setError('REPLY_ERROR');
        return;
      }

      setReplyMessage('');
      // Refresh ticket details to show new reply
      fetchTicketDetails();
    } catch (error) {
      console.error('Error sending reply:', error);
      setError('NETWORK_ERROR');
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      'open': { color: 'bg-green-100 text-green-800', icon: AlertTriangle },
      'in-progress': { color: 'bg-blue-100 text-blue-800', icon: Clock },
      'resolved': { color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
      'closed': { color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="h-4 w-4 mr-2" />
        {status.replace('-', ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { color: string }> = {
      'low': { color: 'bg-gray-100 text-gray-800' },
      'medium': { color: 'bg-blue-100 text-blue-800' },
      'high': { color: 'bg-orange-100 text-orange-800' },
      'urgent': { color: 'bg-red-100 text-red-800' },
    };

    const config = priorityConfig[priority] || { color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Flag className="h-4 w-4 mr-2" />
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
        title: 'Authentication Required',
        message: 'You need to be logged in as an admin to view ticket details.',
        actionText: 'Go to Admin Login',
        actionHref: '/admin',
        icon: '🔐',
        bgColor: 'bg-yellow-50 border-yellow-200 text-yellow-800'
      },
      'TICKET_NOT_FOUND': {
        title: 'Ticket Not Found',
        message: 'The requested support ticket could not be found.',
        actionText: 'Back to Tickets',
        actionHref: '/admin/support',
        icon: '❌',
        bgColor: 'bg-red-50 border-red-200 text-red-800'
      },
      'FETCH_ERROR': {
        title: 'Loading Error',
        message: 'Failed to load ticket details. Please try again.',
        actionText: 'Retry',
        actionHref: '#',
        icon: '⚠️',
        bgColor: 'bg-red-50 border-red-200 text-red-800'
      },
      'UPDATE_ERROR': {
        title: 'Update Failed',
        message: 'Failed to update ticket status. Please try again.',
        actionText: 'Retry',
        actionHref: '#',
        icon: '⚠️',
        bgColor: 'bg-red-50 border-red-200 text-red-800'
      },
      'REPLY_ERROR': {
        title: 'Reply Failed',
        message: 'Failed to send reply. Please try again.',
        actionText: 'Retry',
        actionHref: '#',
        icon: '⚠️',
        bgColor: 'bg-red-50 border-red-200 text-red-800'
      },
      'NETWORK_ERROR': {
        title: 'Network Error',
        message: 'A network error occurred. Please check your connection and try again.',
        actionText: 'Retry',
        actionHref: '#',
        icon: '🌐',
        bgColor: 'bg-red-50 border-red-200 text-red-800'
      }
    };

    const config = errorConfig[error as keyof typeof errorConfig] || errorConfig['FETCH_ERROR'];

    return (
      <div className="p-6">
        <div className={`border rounded-md p-6 ${config.bgColor}`}>
          <div className="flex items-start">
            <span className="text-2xl mr-3">{config.icon}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">{config.title}</h3>
              <p className="mb-4">{config.message}</p>
              <div className="flex space-x-2">
                {config.actionHref === '#' ? (
                  <button
                    onClick={() => {
                      setError(null);
                      fetchTicketDetails();
                    }}
                    className="px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    {config.actionText}
                  </button>
                ) : (
                  <Link
                    href={config.actionHref}
                    className="px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors inline-block"
                  >
                    {config.actionText}
                  </Link>
                )}
                <Link
                  href="/admin/support"
                  className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
                >
                  Back to Tickets
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return renderError();
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center text-sm text-gray-500 mb-2">
        <Link 
          href="/admin/dashboard" 
          className="flex items-center hover:text-gray-700 transition-colors"
        >
          <Home className="h-4 w-4 mr-1" />
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <Link 
          href="/admin/support" 
          className="hover:text-gray-700 transition-colors"
        >
          Support Tickets
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="text-gray-900 font-medium">Ticket Details</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <Link
              href="/admin/support"
              className="mr-4 p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{ticket.subject}</h1>
          </div>
          <p className="text-gray-600">Ticket ID: {ticket.id}</p>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge(ticket.status)}
          {getPriorityBadge(ticket.priority)}
        </div>
      </div>

      {/* Ticket Info Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="font-medium">{ticket.user.name || 'Unnamed User'}</p>
                  <p className="text-sm text-gray-500">{ticket.user.email}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-gray-500">{formatDate(ticket.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-gray-500">{formatDate(ticket.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Management */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Ticket Management</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={ticket.status}
                  onChange={(e) => updateTicketStatus(e.target.value)}
                  disabled={updatingStatus}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Category</p>
                <p className="text-sm text-gray-900 capitalize">{ticket.category}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Total Replies</p>
                <p className="text-sm text-gray-900">{ticket.replies.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Original Message */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Original Message</h3>
        <div className="prose max-w-none">
          <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
        </div>
      </div>

      {/* Conversation Thread */}
      {ticket.replies.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Conversation ({ticket.replies.length} replies)</h3>
          <div className="space-y-4">
            {ticket.replies.map((reply) => (
              <div
                key={reply.id}
                className={`p-4 rounded-lg ${
                  reply.isStaff 
                    ? 'bg-blue-50 border-l-4 border-blue-500 ml-8' 
                    : 'bg-gray-50 border-l-4 border-gray-300 mr-8'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      reply.isStaff ? 'bg-blue-500' : 'bg-gray-400'
                    }`}>
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-sm">
                        {reply.isStaff ? 'Staff' : (reply.user.name || 'Customer')}
                      </p>
                      <p className="text-xs text-gray-500">{reply.user.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(reply.createdAt)}
                  </span>
                </div>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reply Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Send Reply</h3>
        <div className="space-y-4">
          <textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            placeholder="Type your reply to the customer..."
            rows={4}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setReplyMessage('')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              onClick={sendReply}
              disabled={!replyMessage.trim() || sendingReply}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Send className="h-4 w-4 mr-2" />
              {sendingReply ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 