'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus, Trash2, UserX } from 'lucide-react';

interface Member {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
}

interface Team {
  id: string;
  name: string;
  ownerId: string;
  memberLimit: number;
  members: Member[];
}

interface TeamManagementProps {
  team: Team;
  currentUserId: string;
  isOwner: boolean;
  isAdmin: boolean;
}

export default function TeamManagement({ 
  team, 
  currentUserId, 
  isOwner, 
  isAdmin 
}: TeamManagementProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!inviteEmail.trim()) {
      setError('Email is required');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: inviteEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to invite team member');
      }

      setSuccess('Invitation sent successfully');
      setInviteEmail('');
      
      // Refresh the page to show updated team members
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!isOwner) return;
    
    if (!window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/team', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete team');
      }

      // Refresh the page to show that the team has been deleted
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!isAdmin || memberId === currentUserId) return;
    
    if (!window.confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/team/member/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to remove team member');
      }

      // Refresh the page to show updated team members
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg p-6 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Team Details</h2>
          {isOwner && (
            <button
              onClick={handleDeleteTeam}
              disabled={loading}
              className="text-red-500 hover:text-red-700 transition-colors flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Team
            </button>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex">
            <span className="font-medium w-32">Team Name:</span>
            <span>{team.name}</span>
          </div>
          <div className="flex">
            <span className="font-medium w-32">Member Limit:</span>
            <span>{team.members.length} / {team.memberLimit}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Team Members</h2>
        
        <div className="space-y-4">
          {team.members.map((member) => (
            <div key={member.id} className="flex justify-between items-center p-3 border rounded-md">
              <div>
                <div className="font-medium">{member.name || 'Unnamed User'}</div>
                <div className="text-gray-500 text-sm">{member.email}</div>
                <div className="text-xs text-gray-400 mt-1 capitalize">
                  {member.id === team.ownerId ? 'Owner' : member.role || 'Member'}
                </div>
              </div>
              
              {isAdmin && member.id !== currentUserId && member.id !== team.ownerId && (
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  disabled={loading}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  title="Remove from team"
                >
                  <UserX className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {isAdmin && team.members.length < team.memberLimit && (
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Invite Team Member</h2>
          
          <form onSubmit={handleInvite} className="space-y-4 max-w-md">
            <div>
              <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="inviteEmail"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-500 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Inviting...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
} 