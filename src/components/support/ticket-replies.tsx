'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, User, UserCog } from 'lucide-react';

interface Reply {
  id: string;
  message: string;
  isStaff: boolean;
  createdAt: string;
  attachmentUrl?: string;
  name?: string;
  email?: string;
}

export function TicketReplies({ ticketId }: { ticketId: string }) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReplies();
  }, [ticketId]);

  const fetchReplies = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/support/tickets/${ticketId}/replies`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', response.status, errorText);
        throw new Error(`Failed to fetch replies: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Replies data:', data);
      
      // Check if we have a message from the server
      if (data.message) {
        // This isn't an error, it's an informational message
        console.log('Server message:', data.message);
        setError(data.message);
      }
      
      setReplies(data.replies || []);
      
    } catch (error) {
      console.error('Error fetching replies:', error);
      setError('Failed to load replies. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && replies.length === 0) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-20 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/6"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-start">
        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium">Error loading replies</h3>
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

  if (replies.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed rounded-lg mb-6">
        <p className="text-gray-500">No replies yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-6">
      {replies.map((reply) => (
        <div 
          key={reply.id} 
          className={`flex gap-3 ${reply.isStaff ? 'border-l-4 border-blue-500 pl-3' : ''}`}
        >
          <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            reply.isStaff ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {reply.isStaff ? (
              <UserCog className="h-5 w-5" />
            ) : (
              <User className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <p className="font-medium">
                {reply.isStaff ? (
                  <span className="text-blue-800">Support Agent</span>
                ) : (
                  <span>{reply.name || 'You'}</span>
                )}
              </p>
              <p className="text-xs text-gray-500">{formatDate(reply.createdAt)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 mb-1">
              <p className="text-gray-700 whitespace-pre-wrap">{reply.message}</p>
            </div>
            {reply.attachmentUrl && (
              <a
                href={reply.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                View attachment
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 