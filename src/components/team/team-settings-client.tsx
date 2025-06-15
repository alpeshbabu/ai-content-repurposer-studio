'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users, Loader2, UserX } from 'lucide-react';
import AddMemberModal from './add-member-modal';
import RemoveMemberModal from './remove-member-modal';

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  createdAt: Date;
}

interface TeamInvitation {
  id: string;
  email: string;
  status: string;
  createdAt: Date;
  inviter: {
    name: string | null;
    email: string;
  };
}

interface Team {
  id: string;
  name: string;
  ownerId: string;
  memberLimit: number;
  members: TeamMember[];
  invitations: TeamInvitation[];
}

interface TeamSettingsClientProps {
  userId: string;
  hasTeam: boolean;
  canInvite: boolean;
  team: Team | null;
  isAgencyPlan: boolean;
  currentUserRole: string | null;
}

export default function TeamSettingsClient({ 
  userId, 
  hasTeam, 
  canInvite, 
  team, 
  isAgencyPlan,
  currentUserRole
}: TeamSettingsClientProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [newMemberCredentials, setNewMemberCredentials] = useState<{email: string; password: string; name: string} | null>(null);
  const router = useRouter();

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!teamName.trim()) {
      setError('Team name is required');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: teamName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create team');
      }

      setSuccess('Team created successfully!');
      setTeamName('');
      
      // Refresh the page to show the new team
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemberSuccess = (memberData: { email: string; password: string; name: string }) => {
    setNewMemberCredentials(memberData);
    setSuccess(`Team member ${memberData.name} added successfully! Make sure to share the credentials securely.`);
    // Refresh the page to show updated team
    setTimeout(() => {
      router.refresh();
    }, 2000);
  };

  const handleRemoveMember = (member: TeamMember) => {
    setMemberToRemove(member);
    setShowRemoveModal(true);
  };

  const handleRemoveSuccess = () => {
    setSuccess('Team member removed successfully!');
    setShowRemoveModal(false);
    setMemberToRemove(null);
    // Refresh the page to show updated team
    setTimeout(() => {
      router.refresh();
    }, 1000);
  };

  const canRemoveMember = (member: TeamMember): boolean => {
    // Only owners and admins can remove members
    if (currentUserRole !== 'owner' && currentUserRole !== 'admin') {
      return false;
    }

    // Can't remove team owner (unless it's self-removal and special handling)
    if (member.role === 'owner' && member.id !== userId) {
      return false;
    }

    // Only owners can remove admins (unless self-removal)
    if (member.role === 'admin' && currentUserRole !== 'owner' && member.id !== userId) {
      return false;
    }

    return true;
  };

  const canAddMembers = hasTeam && canInvite && team && team.members.length < team.memberLimit;
  const isTeamOwnerOrAdmin = currentUserRole === 'owner' || currentUserRole === 'admin';

  if (!hasTeam && isAgencyPlan) {
    return (
      <div className="mt-6">
        <form onSubmit={handleCreateTeam} className="max-w-md">
          <div className="mb-4">
            <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-1">
              Team Name
            </label>
            <input
              type="text"
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter team name"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-500 text-sm mb-4 bg-green-50 p-3 rounded-md">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Create Team
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  if (hasTeam) {
    return (
      <>
        <div className="mt-6 space-y-4">
          {/* Add Member Button */}
          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canAddMembers}
            title={!canAddMembers ? "Team is full or you don't have permission to add members" : "Add a team member directly"}
          >
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Add Team Member
          </button>

          {/* Team Member Actions */}
          {isTeamOwnerOrAdmin && team && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Team Management</h4>
              {team.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <span className="font-medium">{member.name || 'Unnamed User'}</span>
                    <span className="text-gray-500 ml-2">({member.email})</span>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded ml-2 capitalize">
                      {member.role || 'member'}
                      {member.role === 'owner' && ' 👑'}
                      {member.role === 'admin' && ' ⭐'}
                    </span>
                  </div>
                  {canRemoveMember(member) && (
                    <button
                      onClick={() => handleRemoveMember(member)}
                      className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                      title={`Remove ${member.name || member.email} from team`}
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Success Message with Credentials Info */}
          {success && (
            <div className="bg-green-50 p-3 rounded-md">
              <div className="text-green-500 text-sm font-medium mb-2">
                {success}
              </div>
              {newMemberCredentials && (
                <div className="text-sm text-green-700">
                  <p className="font-medium mb-1">📋 Remember to share these login details:</p>
                  <p>• Email: {newMemberCredentials.email}</p>
                  <p>• Name: {newMemberCredentials.name}</p>
                  <p className="text-xs mt-1">💡 Credentials were shown in the add member dialog</p>
                </div>
              )}
            </div>
          )}
        </div>

        <AddMemberModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddMemberSuccess}
        />

        <RemoveMemberModal
          isOpen={showRemoveModal}
          member={memberToRemove}
          currentUserRole={currentUserRole}
          onClose={() => {
            setShowRemoveModal(false);
            setMemberToRemove(null);
          }}
          onSuccess={handleRemoveSuccess}
        />
      </>
    );
  }

  return null;
} 