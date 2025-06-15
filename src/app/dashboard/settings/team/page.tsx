import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UsersRound, Plus, Mail, Clock, UserX } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import TeamSettingsClient from '@/components/team/team-settings-client';

export default async function TeamSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    redirect('/auth/signin');
  }

  const userId = session.user.id;

  // Fetch user's subscription plan and team data from database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      role: true,
      team: {
        include: {
          members: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
            }
          },
          invitations: {
            where: {
              status: 'pending',
              expiresAt: {
                gt: new Date()
              }
            },
            select: {
              id: true,
              email: true,
              status: true,
              createdAt: true,
              inviter: {
                select: {
                  name: true,
                  email: true,
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user) {
    redirect('/dashboard');
  }

  // Check if user has agency plan
  const isAgencyPlan = user.subscriptionPlan === 'agency';
  const isTeamOwnerOrAdmin = user.role === 'owner' || user.role === 'admin';
  const canAddMembers = isAgencyPlan && isTeamOwnerOrAdmin;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Team Members</h2>
          {user.team && (
            <div className="text-sm text-gray-500">
              {user.team.members.length} / {user.team.memberLimit} members
            </div>
          )}
        </div>
        
        {!user.team ? (
          <div className="text-center py-8">
            <UsersRound className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Yet</h3>
            <p className="text-gray-500 mb-4">
              {isAgencyPlan 
                ? "You don't have a team yet. Create one to start collaborating with team members."
                : "Team features are available on the Agency plan. Upgrade to create a team and add members."
              }
            </p>
            <TeamSettingsClient 
              userId={userId}
              hasTeam={false}
              canInvite={false}
              team={null}
              isAgencyPlan={isAgencyPlan}
              currentUserRole={user.role}
            />
          </div>
        ) : (
          <>
            <p className="text-gray-500 mb-6">
              Add team members directly to collaborate on content repurposing. Team features are available on Agency plan.
            </p>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {user.team.members.map((member) => (
                    <tr key={member.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <UsersRound className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {member.name || 'Unnamed User'}
                              {member.id === userId && ' (You)'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 capitalize">
                          {member.role || 'member'}
                          {member.role === 'owner' && ' 👑'}
                          {member.role === 'admin' && ' ⭐'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Show pending invitations if any exist */}
                  {user.team.invitations.map((invitation) => (
                    <tr key={invitation.id} className="bg-blue-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Mail className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">Pending Invitation</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{invitation.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">Member</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <TeamSettingsClient 
              userId={userId}
              hasTeam={true}
              canInvite={canAddMembers}
              team={user.team}
              isAgencyPlan={isAgencyPlan}
              currentUserRole={user.role}
            />
          </>
        )}
      </div>
      
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Team Features</h2>
        {!isAgencyPlan ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Mail className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Upgrade to Agency Plan</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Team collaboration features are available on the Agency plan. Upgrade to add team members, collaborate on content, and access team analytics.
                  </p>
                </div>
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <a 
                      href="/dashboard/settings/subscription" 
                      className="rounded-md bg-yellow-50 px-2 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50"
                    >
                      View Plans
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <UsersRound className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Agency Plan Active</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    You have access to all team collaboration features. Add up to 3 team members, collaborate on content, and access team analytics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 