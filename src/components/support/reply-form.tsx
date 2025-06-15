'use client';

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';

export function ReplyForm({ ticketId }: { ticketId: string }) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send reply');
      }
      
      // Clear form
      setMessage('');
      
      // Refresh page to show new reply
      window.location.reload();
      
    } catch (error) {
      console.error('Error sending reply:', error);
      setError('Failed to send reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h3 className="font-medium mb-3">Add Reply</h3>
      
      {error && (
        <div className="bg-red-50 text-red-800 p-3 rounded-md mb-3 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your reply here..."
            disabled={isSubmitting}
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !message.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
  );
} 