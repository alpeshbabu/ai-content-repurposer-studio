import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import InviteAcceptanceClient from '@/components/team/invite-acceptance-client';

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function InviteAcceptancePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const { token } = await params;

  // Find the invitation
  const invitation = await prisma.teamInvitation.findUnique({
    where: { token },
    include: {
      team: {
        select: {
          name: true,
          memberLimit: true,
          members: {
            select: { id: true }
          }
        }
      },
      inviter: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Invalid Invitation
          </h1>
          <p className="text-gray-600 mb-6">
            This invitation link is invalid or has expired.
          </p>
          <a
            href="/auth/signin"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  // Check if invitation is expired
  if (invitation.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Invitation Expired
          </h1>
          <p className="text-gray-600 mb-6">
            This invitation has expired. Please contact the team owner to send a new invitation.
          </p>
          <a
            href="/auth/signin"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  // Check if invitation is already accepted or declined
  if (invitation.status !== 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Invitation {invitation.status === 'accepted' ? 'Already Accepted' : 'Declined'}
          </h1>
          <p className="text-gray-600 mb-6">
            {invitation.status === 'accepted' 
              ? 'You have already joined this team.' 
              : 'This invitation has been declined.'}
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Check if team is full
  if (invitation.team.members.length >= invitation.team.memberLimit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Team Full
          </h1>
          <p className="text-gray-600 mb-6">
            This team has reached its member limit. Please contact the team owner.
          </p>
          <a
            href="/auth/signin"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Join Team
          </h1>
          <p className="text-gray-600">
            You've been invited to join <strong>{invitation.team.name}</strong>
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-sm">
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Team:</span>
              <span className="font-medium">{invitation.team.name}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Invited by:</span>
              <span className="font-medium">{invitation.inviter.name || invitation.inviter.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">For:</span>
              <span className="font-medium">{invitation.email}</span>
            </div>
          </div>
        </div>

        <InviteAcceptanceClient
          invitation={{
            id: invitation.id,
            email: invitation.email,
            teamName: invitation.team.name,
            inviterName: invitation.inviter.name || invitation.inviter.email,
            token: invitation.token
          }}
          session={session}
        />
      </div>
    </div>
  );
} 