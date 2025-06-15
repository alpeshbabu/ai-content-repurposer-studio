'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Crown, 
  Shield,
  Mail,
  Calendar,
  Settings,
  ChevronRight,
  Home,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Clock,
  MoreVertical,
  UserCheck,
  UserX,
  RefreshCw,
  Ban,
  Key,
  AlertTriangle
} from 'lucide-react';

interface CompanyMember {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: 'active' | 'suspended';
  permissions: string[];
  createdAt: string;
  lastLogin: string | null;
  addedBy: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  color: string;
}

const AVAILABLE_ROLES: Role[] = [
  {
    id: 'owner',
    name: 'Owner',
    description: 'Full access to all features and settings',
    permissions: ['all'],
    color: 'bg-yellow-100 text-yellow-800'
  },
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full access except billing and owner settings',
    permissions: ['users', 'content', 'analytics', 'support', 'settings'],
    color: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'support',
    name: 'Support Manager',
    description: 'Manage support tickets and user issues',
    permissions: ['support', 'users:read', 'analytics:support'],
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'marketing',
    name: 'Marketing Manager',
    description: 'Manage content and analytics',
    permissions: ['content', 'analytics:content', 'analytics:users'],
    color: 'bg-green-100 text-green-800'
  },
  {
    id: 'finance',
    name: 'Finance Manager',
    description: 'Access billing and financial data',
    permissions: ['billing', 'analytics:revenue', 'users:billing'],
    color: 'bg-orange-100 text-orange-800'
  },
  {
    id: 'content_developer',
    name: 'Content Developer',
    description: 'Create and manage content',
    permissions: ['content:write', 'content:read'],
    color: 'bg-indigo-100 text-indigo-800'
  }
];

export default function AdminCompanyMembersPage() {
  const [companyMembers, setCompanyMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CompanyMember | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Add member form state
  const [newMember, setNewMember] = useState({
    email: '',
    name: '',
    role: 'support'
  });

  // Edit member form state
  const [editMember, setEditMember] = useState({
    name: '',
    role: ''
  });

  useEffect(() => {
    fetchCompanyMembers();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchCompanyMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        setError('No admin token found. Please log in again.');
        return;
      }

      const params = new URLSearchParams({
        search: searchTerm,
        role: filterRole,
        status: filterStatus
      });

      const response = await fetch(`/api/admin/team?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCompanyMembers(data.members || []);
      } else if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
        localStorage.removeItem('admin_token');
      } else {
        setError(data.error || 'Failed to fetch company members');
        if (data.members) {
          setCompanyMembers(data.members);
        }
      }
    } catch (err) {
      console.error('Error fetching company members:', err);
      setError('Network error occurred while fetching company members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMember.email || !newMember.role) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMember.email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      setActionLoading('add');
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/team', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newMember)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Company member added successfully!');
        setShowAddModal(false);
        setNewMember({ email: '', name: '', role: 'support' });
        fetchCompanyMembers();
      } else {
        alert(data.error || 'Failed to add company member');
      }
    } catch (err) {
      console.error('Error adding company member:', err);
      alert('Network error occurred while adding company member');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMember) return;

    try {
      setActionLoading('edit');
      const token = localStorage.getItem('admin_token');
      
      // Update basic member details
      const response = await fetch('/api/admin/team', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          memberId: selectedMember.id,
          name: editMember.name,
          role: editMember.role
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // If role changed and current user is owner, also update role separately for better tracking
        if (editMember.role !== selectedMember.role && currentUser?.role === 'owner') {
          try {
            const roleResponse = await fetch(`/api/admin/team/${selectedMember.id}/role`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                role: editMember.role,
              }),
            });

            if (!roleResponse.ok) {
              const roleData = await roleResponse.json();
              console.warn('Role update API call failed:', roleData.message);
            }
          } catch (roleError) {
            console.warn('Secondary role update failed:', roleError);
          }
        }

        alert('Company member updated successfully!');
        setShowEditModal(false);
        setSelectedMember(null);
        fetchCompanyMembers();
      } else {
        alert(data.error || 'Failed to update company member');
      }
    } catch (err) {
      console.error('Error updating company member:', err);
      alert('Network error occurred while updating company member');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedMember) return;

    try {
      setActionLoading('status');
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/team', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          memberId: selectedMember.id,
          status
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Company member ${status === 'active' ? 'activated' : 'suspended'} successfully!`);
        setShowStatusModal(false);
        setSelectedMember(null);
        fetchCompanyMembers();
      } else {
        alert(data.error || 'Failed to update member status');
      }
    } catch (err) {
      console.error('Error updating member status:', err);
      alert('Network error occurred while updating member status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (member: CompanyMember) => {
    if (member.role === 'owner') {
      alert('Cannot remove the owner account');
      return;
    }

    if (!confirm(`Are you sure you want to remove ${member.name || member.email} from the company?`)) {
      return;
    }

    try {
      setActionLoading(`remove-${member.id}`);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/team?memberId=${member.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Company member removed successfully!');
        fetchCompanyMembers();
      } else {
        alert(data.error || 'Failed to remove company member');
      }
    } catch (err) {
      console.error('Error removing company member:', err);
      alert('Network error occurred while removing company member');
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (member: CompanyMember) => {
    setSelectedMember(member);
    setEditMember({
      name: member.name || '',
      role: member.role
    });
    setShowEditModal(true);
  };

  const openStatusModal = (member: CompanyMember) => {
    setSelectedMember(member);
    setShowStatusModal(true);
  };

  const getRoleInfo = (roleId: string) => {
    return AVAILABLE_ROLES.find(role => role.id === roleId) || AVAILABLE_ROLES[1];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMembers = companyMembers.filter(member => {
    const matchesSearch = !searchTerm || 
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.name && member.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Company Members</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={fetchCompanyMembers}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Retry
            </button>
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
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
        <span className="text-gray-900 font-medium">Company Management</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Members</h1>
          <p className="text-gray-600 mt-1">Add and manage company members with role-based access</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Company Member
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{companyMembers.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Members</p>
              <p className="text-2xl font-bold text-green-600">
                {companyMembers.filter(m => m.status === 'active').length}
              </p>
            </div>
            <UserCheck className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Administrators</p>
              <p className="text-2xl font-bold text-purple-600">
                {companyMembers.filter(m => ['owner', 'admin'].includes(m.role)).length}
              </p>
            </div>
            <Crown className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Last Added</p>
              <p className="text-2xl font-bold text-orange-600">Today</p>
            </div>
            <Calendar className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search members by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              {AVAILABLE_ROLES.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Settings className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Company Members Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Company Members</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member) => {
                const roleInfo = getRoleInfo(member.role);
                return (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {member.name || 'Unnamed User'}
                            {member.role === 'owner' && (
                              <Crown className="h-4 w-4 text-yellow-500 ml-2" />
                            )}
                            {member.role === 'admin' && (
                              <Shield className="h-4 w-4 text-purple-500 ml-2" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                        {roleInfo.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(member.status)}`}>
                        {member.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {member.status === 'suspended' && <Ban className="h-3 w-3 mr-1" />}
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {member.lastLogin 
                          ? new Date(member.lastLogin).toLocaleDateString()
                          : 'Never'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(member.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {member.role !== 'owner' && (
                          <>
                            <button
                              onClick={() => openEditModal(member)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit Member"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openStatusModal(member)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Change Status"
                            >
                              <Settings className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveMember(member)}
                              disabled={actionLoading === `remove-${member.id}`}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              title="Remove Member"
                            >
                              {actionLoading === `remove-${member.id}` ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </>
                        )}
                        {member.role === 'owner' && (
                          <span className="text-gray-400 text-xs">Protected</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* No Results */}
        {filteredMembers.length === 0 && (
          <div className="bg-gray-50 p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No company members found</h3>
            <p className="text-gray-600">
              {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Add your first company member to get started.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Company Member</h3>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newMember.email}
                    onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="member@company.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name (optional)
                  </label>
                  <input
                    type="text"
                    value={newMember.name}
                    onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    required
                    value={newMember.role}
                    onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {AVAILABLE_ROLES.slice(1).map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> The company member will be added directly with active status. 
                    They can login immediately using the admin panel.
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={actionLoading === 'add'}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    {actionLoading === 'add' ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    Add Member
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setNewMember({ email: '', name: '', role: 'support' });
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Company Member</h3>
              <form onSubmit={handleEditMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={selectedMember.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editMember.name}
                    onChange={(e) => setEditMember({...editMember, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={editMember.role}
                    onChange={(e) => setEditMember({...editMember, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {AVAILABLE_ROLES.slice(1).map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={actionLoading === 'edit'}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    {actionLoading === 'edit' ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Edit className="h-4 w-4 mr-2" />
                    )}
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedMember(null);
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && selectedMember && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Change Member Status</h3>
              <p className="text-sm text-gray-600 mb-6">
                Update the status for <strong>{selectedMember.name || selectedMember.email}</strong>
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleStatusChange('active')}
                  disabled={actionLoading === 'status' || selectedMember.status === 'active'}
                  className="w-full flex items-center justify-center px-4 py-3 border border-green-300 rounded-md bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Activate Member
                </button>
                
                <button
                  onClick={() => handleStatusChange('suspended')}
                  disabled={actionLoading === 'status' || selectedMember.status === 'suspended'}
                  className="w-full flex items-center justify-center px-4 py-3 border border-red-300 rounded-md bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Suspend Member
                </button>
              </div>

              <div className="flex space-x-3 pt-6">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedMember(null);
                  }}
                  className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 