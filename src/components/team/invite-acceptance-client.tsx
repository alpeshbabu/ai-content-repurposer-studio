'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Session } from 'next-auth';
import { Check, X, Loader2 } from 'lucide-react';

interface Invitation {
  id: string;
  email: string;
  teamName: string;
  inviterName: string;
  token: string;
}

interface InviteAcceptanceClientProps {
  invitation: Invitation;
  session: Session | null;
}

export default function InviteAcceptanceClient({ 
  invitation, 
  session 
}: InviteAcceptanceClientProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAccept = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/team/invite/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: invitation.token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to accept invitation');
      }

      // Redirect to team settings on success
      router.push('/dashboard/settings/team?invited=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/team/invite/decline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: invitation.token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to decline invitation');
      }

      // Show success message and redirect
      router.push('/dashboard?declined=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // If user is not signed in
  if (!session) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 text-center">
          You need to sign in to accept this invitation.
        </p>
        <div className="flex flex-col space-y-3">
          <a
            href={`/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign In to Accept
          </a>
          <a
            href="/auth/signup"
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Create Account
          </a>
        </div>
      </div>
    );
  }

  // If user email doesn't match invitation email
  if (session.user?.email !== invitation.email) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-sm text-yellow-800">
            <strong>Email Mismatch:</strong> This invitation was sent to{' '}
            <span className="font-medium">{invitation.email}</span>, but you're signed in as{' '}
            <span className="font-medium">{session.user?.email}</span>.
          </p>
        </div>
        <div className="flex flex-col space-y-3">
          <a
            href="/api/auth/signout?callbackUrl=/"
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Sign Out and Use Different Account
          </a>
          <button
            onClick={handleDecline}
            disabled={loading}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Declining...
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Decline Invitation
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Main acceptance UI
  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex flex-col space-y-3">
        <button
          onClick={handleAccept}
          disabled={loading}
          className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Joining Team...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Accept & Join Team
            </>
          )}
        </button>

        <button
          onClick={handleDecline}
          disabled={loading}
          className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Declining...
            </>
          ) : (
            <>
              <X className="h-4 w-4 mr-2" />
              Decline Invitation
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        By accepting, you'll become a member of {invitation.teamName} and can collaborate on content creation.
      </p>
    </div>
  );
} 