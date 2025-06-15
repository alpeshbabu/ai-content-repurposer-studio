'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, User, Calendar, AlertCircle, Send, Shield } from 'lucide-react';

interface TicketReply {
  id: string;
  message: string;
  isStaff: boolean;
  createdAt: string;
  attachmentUrl?: string | null;
  name: string;
  email: string;
}

interface TicketDetail {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: {
    name: string | null;
    email: string;
  };
}

interface AdminTicketDetailProps {
  ticketId: string;
}

export function AdminTicketDetail({ ticketId }: AdminTicketDetailProps) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    fetchTicketDetails();
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

      const [ticketResponse, repliesResponse] = await Promise.all([
        fetch(`/api/admin/support/tickets/${ticketId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch(`/api/admin/support/tickets/${ticketId}/replies`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      ]);

      // Handle authentication errors
      if (ticketResponse.status === 401 || repliesResponse.status === 401) {
        localStorage.removeItem('admin_token');
        setError('AUTHENTICATION_REQUIRED');
        setLoading(false);
        return;
      }

      if (!ticketResponse.ok) {
        if (ticketResponse.status === 404) {
          setError('TICKET_NOT_FOUND');
        } else {
          setError('FETCH_ERROR');
        }
        setLoading(false);
        return;
      }

      if (!repliesResponse.ok) {
        setError('REPLIES_ERROR');
        setLoading(false);
        return;
      }

      const ticketData = await ticketResponse.json();
      const repliesData = await repliesResponse.json();

      setTicket(ticketData.ticket);
      setReplies(repliesData.replies || []);

    } catch (error) {
      console.error('Error fetching ticket details:', error);
      setError('NETWORK_ERROR');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyText.trim()) {
      return;
    }

    setSubmittingReply(true);

    try {
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
          message: replyText.trim(),
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

      setReplyText('');
      // Refresh replies
      fetchTicketDetails();

    } catch (error) {
      console.error('Error submitting reply:', error);
      setError('NETWORK_ERROR');
    } finally {
      setSubmittingReply(false);
    }
  };

  const updateTicketStatus = async (newStatus: string) => {
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

      // Refresh ticket details
      fetchTicketDetails();

    } catch (error) {
      console.error('Error updating ticket status:', error);
      setError('NETWORK_ERROR');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      open: 'bg-green-100 text-green-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      resolved: 'bg-gray-100 text-gray-800',
      closed: 'bg-gray-100 text-gray-600',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || 'bg-gray-100'}`}>
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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColors[priority] || 'bg-gray-100'}`}>
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
        message: 'You need to be logged in as an admin to access this ticket.',
        actionText: 'Go to Admin Login',
        actionLink: '/admin',
        icon: '🔐',
        bgColor: 'bg-yellow-50 border-yellow-200 text-yellow-800'
      },
      'TICKET_NOT_FOUND': {
        title: 'Ticket Not Found',
        message: 'The requested support ticket could not be found.',
        actionText: 'Back to Support',
        actionLink: '/admin/support',
        icon: '❌',
        bgColor: 'bg-red-50 border-red-200 text-red-800'
      },
      'FETCH_ERROR': {
        title: 'Loading Error',
        message: 'Failed to load ticket details. Please try again.',
        actionText: 'Try Again',
        actionLink: null,
        icon: '⚠️',
        bgColor: 'bg-red-50 border-red-200 text-red-800'
      },
      'REPLIES_ERROR': {
        title: 'Replies Loading Error',
        message: 'Failed to load ticket replies. The ticket details are available but replies could not be loaded.',
        actionText: 'Try Again',
        actionLink: null,
        icon: '⚠️',
        bgColor: 'bg-orange-50 border-orange-200 text-orange-800'
      },
      'REPLY_ERROR': {
        title: 'Reply Failed',
        message: 'Failed to send your reply. Please try again.',
        actionText: 'Try Again',
        actionLink: null,
        icon: '⚠️',
        bgColor: 'bg-red-50 border-red-200 text-red-800'
      },
      'UPDATE_ERROR': {
        title: 'Update Failed',
        message: 'Failed to update ticket status. Please try again.',
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
                    fetchTicketDetails();
                  }}
                  className="inline-flex items-center px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  {config.actionText}
                </button>
              )}
              <a
                href="/admin/support"
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors text-sm"
              >
                Back to Support
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-8 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return renderError();
  }

  return (
    <div className="space-y-6">
      {/* Ticket Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{ticket.subject}</h1>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm capitalize">
                {ticket.category.replace('-', ' ')}
              </span>
            </div>
          </div>
          
          {/* Status Update Controls */}
          <div className="mt-4 md:mt-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Status
            </label>
            <select
              value={ticket.status}
              onChange={(e) => updateTicketStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Customer Info */}
        <div className="flex items-center border-t pt-4">
          <User className="h-5 w-5 text-gray-400 mr-2" />
          <div>
            <span className="font-medium">Customer: </span>
            <span>{ticket.user.name || 'Unnamed User'}</span>
            <span className="text-gray-500 ml-2">({ticket.user.email})</span>
          </div>
          <div className="ml-auto flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            Created: {formatDate(ticket.createdAt)}
          </div>
        </div>
      </div>

      {/* Ticket Description */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Original Message</h2>
        <div className="prose max-w-none">
          <p className="whitespace-pre-wrap text-gray-700">{ticket.description}</p>
        </div>
      </div>

      {/* Replies */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <MessageCircle className="h-5 w-5 mr-2" />
          Conversation ({replies.length} replies)
        </h2>

        <div className="space-y-4">
          {replies.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No replies yet. Be the first to respond!</p>
          ) : (
            replies.map((reply) => (
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
                    {reply.isStaff ? (
                      <Shield className="h-4 w-4 text-blue-600 mr-2" />
                    ) : (
                      <User className="h-4 w-4 text-gray-600 mr-2" />
                    )}
                    <span className="font-medium">
                      {reply.name || reply.email}
                      {reply.isStaff && <span className="text-blue-600 ml-1">(Staff)</span>}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(reply.createdAt)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-gray-700">{reply.message}</p>
                {reply.attachmentUrl && (
                  <div className="mt-2">
                    <a
                      href={reply.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      📎 View Attachment
                    </a>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Admin Reply Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Shield className="h-5 w-5 text-blue-600 mr-2" />
          Admin Reply
        </h2>

        <form onSubmit={handleSubmitReply} className="space-y-4">
          <div>
            <label htmlFor="reply" className="block text-sm font-medium text-gray-700 mb-2">
              Your Response
            </label>
            <textarea
              id="reply"
              rows={6}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type your response to the customer..."
              disabled={submittingReply}
            />
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              💡 Your reply will be marked as a staff response and will be visible to the customer.
            </p>
            
            <button
              type="submit"
              disabled={!replyText.trim() || submittingReply}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingReply ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Reply
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 