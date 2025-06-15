'use client';

import { useState } from 'react';
import { X, UserX, AlertTriangle, Loader2 } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
}

interface RemoveMemberModalProps {
  isOpen: boolean;
  member: TeamMember | null;
  currentUserRole: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RemoveMemberModal({ 
  isOpen, 
  member, 
  currentUserRole,
  onClose, 
  onSuccess 
}: RemoveMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRemove = async () => {
    if (!member) return;
    
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/team/member/${member.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove team member');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setError(null);
    onClose();
  };

  if (!isOpen || !member) return null;

  const isRemovingSelf = member.id === 'current-user'; // This would need to be passed properly
  const memberDisplayName = member.name || member.email;
  const isOwner = member.role === 'owner';
  const isAdmin = member.role === 'admin';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-red-600 flex items-center">
            <UserX className="h-5 w-5 mr-2" />
            Remove Team Member
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Are you sure you want to remove this team member?</p>
              <p>This action cannot be undone. The member will lose access to all team resources.</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-gray-900 mb-2">Member Details:</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{memberDisplayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{member.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Role:</span>
                <span className="font-medium capitalize">
                  {member.role || 'member'}
                  {isOwner && ' 👑'}
                  {isAdmin && ' ⭐'}
                </span>
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-800 font-medium">
                ⚠️ Warning: You are removing the team owner. Make sure to transfer ownership or handle team dissolution properly.
              </p>
            </div>
          )}

          {isAdmin && currentUserRole !== 'owner' && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
              <p className="text-sm text-amber-800 font-medium">
                ⚠️ Note: Only team owners can remove admin members.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Removing...
              </>
            ) : (
              <>
                <UserX className="h-4 w-4 mr-2" />
                Remove Member
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 