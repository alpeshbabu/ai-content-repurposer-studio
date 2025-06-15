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
  AlertTriangle,
  Copy,
  Check,
  Save,
  X,
  Plus,
  Lock
} from 'lucide-react';

interface AdminCredential {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  roleInfo: {
    name: string;
    description: string;
    color: string;
    icon: string;
  };
  status: string;
}

interface RoleDefinition {
  name: string;
  description: string;
  permissions: string[];
  color: string;
  icon: string;
}

// Default role definitions (fallback if API hasn't loaded yet)
const DEFAULT_ROLE_DEFINITIONS: Record<string, RoleDefinition> = {
  owner: {
    name: 'Owner',
    description: 'Full platform access and control',
    permissions: ['all'],
    color: 'yellow',
    icon: 'crown'
  },
  admin: {
    name: 'Administrator',
    description: 'User management, analytics, content, support',
    permissions: ['users', 'content', 'analytics', 'support', 'settings', 'team'],
    color: 'purple',
    icon: 'shield'
  },
  support: {
    name: 'Support Manager',
    description: 'Support tickets, user assistance, content review',
    permissions: ['support', 'users:read', 'analytics:support', 'content:read'],
    color: 'blue',
    icon: 'headphones'
  },
  marketing: {
    name: 'Marketing Manager',
    description: 'Analytics, content, marketing campaigns',
    permissions: ['analytics', 'content', 'marketing'],
    color: 'green',
    icon: 'megaphone'
  },
  finance: {
    name: 'Finance Manager',
    description: 'Billing, subscriptions, financial reports',
    permissions: ['billing', 'analytics:financial', 'users:read'],
    color: 'orange',
    icon: 'dollar-sign'
  },
  content_developer: {
    name: 'Content Developer',
    description: 'Content creation and management',
    permissions: ['content', 'analytics:content'],
    color: 'indigo',
    icon: 'edit'
  }
};

export default function AdminCredentialsPage() {
  const [credentials, setCredentials] = useState<AdminCredential[]>([]);
  const [roleDefinitions, setRoleDefinitions] = useState<Record<string, RoleDefinition>>(DEFAULT_ROLE_DEFINITIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<AdminCredential | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedItems, setCopiedItems] = useState<Record<string, boolean>>({});

  // Add credential form state
  const [newCredential, setNewCredential] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'support'
  });

  // Edit credential form state  
  const [editCredential, setEditCredential] = useState({
    name: '',
    email: '',
    role: '',
    isActive: true
  });

  // Password reset state
  const [passwordReset, setPasswordReset] = useState({
    newPassword: '',
    showPassword: false
  });

  useEffect(() => {
    fetchCredentials();
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

  const fetchCredentials = async () => {
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

      const response = await fetch(`/api/admin/credentials?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCredentials(data.credentials || []);
        // Update role definitions from API response, but keep defaults as fallback
        setRoleDefinitions(data.roleDefinitions || DEFAULT_ROLE_DEFINITIONS);
      } else if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
        localStorage.removeItem('admin_token');
      } else {
        setError(data.error || 'Failed to fetch admin credentials');
      }
    } catch (err) {
      console.error('Error fetching credentials:', err);
      setError('Network error occurred while fetching credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCredential.username || !newCredential.password || !newCredential.name || !newCredential.email || !newCredential.role) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newCredential.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(newCredential.username)) {
      alert('Username can only contain letters, numbers, underscore, and dash');
      return;
    }

    // Validate password strength
    if (newCredential.password.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    try {
      setActionLoading('add');
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/credentials', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCredential)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Admin credential created successfully!');
        setShowAddModal(false);
        setNewCredential({ username: '', password: '', name: '', email: '', role: 'support' });
        fetchCredentials();
      } else {
        alert(data.error || 'Failed to create admin credential');
      }
    } catch (err) {
      console.error('Error creating credential:', err);
      alert('Network error occurred while creating credential');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCredential) return;

    try {
      setActionLoading(`edit-${selectedCredential.id}`);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/credentials/${selectedCredential.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editCredential)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Admin credential updated successfully!');
        setShowEditModal(false);
        setSelectedCredential(null);
        fetchCredentials();
      } else {
        alert(data.error || 'Failed to update admin credential');
      }
    } catch (err) {
      console.error('Error updating credential:', err);
      alert('Network error occurred while updating credential');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCredential) return;

    try {
      setActionLoading(`password-${selectedCredential.id}`);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/credentials/${selectedCredential.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'reset_password',
          newPassword: passwordReset.newPassword || undefined
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPasswordReset({ ...passwordReset, newPassword: data.newPassword });
        alert(`Password reset successfully! New password: ${data.newPassword}`);
        fetchCredentials();
      } else {
        alert(data.error || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      alert('Network error occurred while resetting password');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCredential = async (credential: AdminCredential) => {
    if (credential.role === 'owner') {
      alert('Cannot delete owner accounts');
      return;
    }

    if (!confirm(`Are you sure you want to delete the admin credential for ${credential.name || credential.username}?`)) {
      return;
    }

    try {
      setActionLoading(`delete-${credential.id}`);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/credentials/${credential.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Admin credential deleted successfully!');
        fetchCredentials();
      } else {
        alert(data.error || 'Failed to delete admin credential');
      }
    } catch (err) {
      console.error('Error deleting credential:', err);
      alert('Network error occurred while deleting credential');
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (credential: AdminCredential) => {
    setSelectedCredential(credential);
    setEditCredential({
      name: credential.name || '',
      email: credential.email || '',
      role: credential.role,
      isActive: credential.isActive
    });
    setShowEditModal(true);
  };

  const openPasswordModal = (credential: AdminCredential) => {
    setSelectedCredential(credential);
    setPasswordReset({ newPassword: '', showPassword: false });
    setShowPasswordModal(true);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItems({ ...copiedItems, [key]: true });
    setTimeout(() => {
      setCopiedItems({ ...copiedItems, [key]: false });
    }, 2000);
  };

  const generateRandomPassword = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
    
    for (let i = password.length; i < 12; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const getRoleIcon = (iconName: string) => {
    const icons = {
      crown: Crown,
      shield: Shield,
      headphones: Settings,
      megaphone: Settings,
      'dollar-sign': Settings,
      edit: Edit
    };
    const Icon = icons[iconName as keyof typeof icons] || UserCheck;
    return <Icon className="h-4 w-4" />;
  };

  const getRoleColor = (color: string) => {
    const colors = {
      yellow: 'bg-yellow-100 text-yellow-800',
      purple: 'bg-purple-100 text-purple-800',
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      orange: 'bg-orange-100 text-orange-800',
      indigo: 'bg-indigo-100 text-indigo-800',
      gray: 'bg-gray-100 text-gray-800'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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

  const filteredCredentials = credentials.filter(credential => {
    const matchesSearch = searchTerm === '' || 
      credential.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credential.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credential.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || credential.role === filterRole;
    const matchesStatus = filterStatus === 'all' || credential.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Check if current user can manage credentials
  const canManage = currentUser?.role === 'owner' || currentUser?.role === 'admin';
  const canDelete = currentUser?.role === 'owner';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
        <span className="text-gray-900 font-medium">Admin Credentials</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Credentials</h1>
          <p className="text-gray-600 mt-1">Manage company member login credentials and access</p>
        </div>
        {canManage && (
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Admin Credential
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Credentials</p>
              <p className="text-2xl font-bold text-gray-900">{credentials.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {credentials.filter(c => c.isActive).length}
              </p>
            </div>
            <UserCheck className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Owners & Admins</p>
              <p className="text-2xl font-bold text-purple-600">
                {credentials.filter(c => ['owner', 'admin'].includes(c.role)).length}
              </p>
            </div>
            <Crown className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Support Staff</p>
              <p className="text-2xl font-bold text-orange-600">
                {credentials.filter(c => c.role === 'support').length}
              </p>
            </div>
            <Settings className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search credentials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
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
              {Object.entries(roleDefinitions).map(([roleId, role]) => (
                <option key={roleId} value={roleId}>{role.name}</option>
              ))}
            </select>
          </div>
          
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

      {/* Credentials Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Admin Credentials</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credential
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
                  Created
                </th>
                {canManage && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCredentials.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="px-6 py-12 text-center text-gray-500">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">No credentials found</p>
                    <p>Try adjusting your search or filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredCredentials.map((credential) => (
                  <tr key={credential.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {credential.name ? credential.name.charAt(0).toUpperCase() : 'U'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{credential.name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <span className="mr-2">@{credential.username}</span>
                            <button
                              onClick={() => copyToClipboard(credential.username, `username-${credential.id}`)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {copiedItems[`username-${credential.id}`] ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {credential.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(credential.roleInfo.color)}`}>
                        {getRoleIcon(credential.roleInfo.icon)}
                        <span className="ml-1">{credential.roleInfo.name}</span>
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {credential.permissions.length} permissions
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(credential.status)}`}>
                        {credential.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {credential.status === 'suspended' && <Ban className="h-3 w-3 mr-1" />}
                        {credential.status.charAt(0).toUpperCase() + credential.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {credential.lastLogin 
                          ? new Date(credential.lastLogin).toLocaleDateString()
                          : 'Never'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(credential.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(credential)}
                            disabled={actionLoading === `edit-${credential.id}`}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                            title="Edit credential"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => openPasswordModal(credential)}
                            disabled={actionLoading === `password-${credential.id}`}
                            className="text-yellow-600 hover:text-yellow-900 p-1 rounded transition-colors"
                            title="Reset password"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                          
                          {canDelete && credential.role !== 'owner' && (
                            <button
                              onClick={() => handleDeleteCredential(credential)}
                              disabled={actionLoading === `delete-${credential.id}`}
                              className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                              title="Delete credential"
                            >
                              {actionLoading === `delete-${credential.id}` ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Credential Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Admin Credential</h3>
              <form onSubmit={handleAddCredential} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCredential.username}
                    onChange={(e) => setNewCredential({...newCredential, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="admin_username"
                  />
                  <p className="text-xs text-gray-500 mt-1">Letters, numbers, underscore, and dash only</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={newCredential.password}
                      onChange={(e) => setNewCredential({...newCredential, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Secure password"
                    />
                    <button
                      type="button"
                      onClick={() => setNewCredential({...newCredential, password: generateRandomPassword()})}
                      className="absolute right-2 top-2 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCredential.name}
                    onChange={(e) => setNewCredential({...newCredential, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newCredential.email}
                    onChange={(e) => setNewCredential({...newCredential, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="admin@company.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    required
                    value={newCredential.role}
                    onChange={(e) => setNewCredential({...newCredential, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(roleDefinitions).map(([roleId, role]) => (
                      <option key={roleId} value={roleId}>
                        {role.name} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> The admin credential will be created with the specified role and permissions. 
                    They can login immediately using the admin panel.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === 'add'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    {actionLoading === 'add' ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Credential
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Credential Modal */}
      {showEditModal && selectedCredential && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Admin Credential</h3>
              <form onSubmit={handleEditCredential} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editCredential.name}
                    onChange={(e) => setEditCredential({...editCredential, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editCredential.email}
                    onChange={(e) => setEditCredential({...editCredential, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={editCredential.role}
                    onChange={(e) => setEditCredential({...editCredential, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    disabled={selectedCredential.role === 'owner' && currentUser?.role !== 'owner'}
                  >
                    {Object.entries(roleDefinitions).map(([roleId, role]) => (
                      <option key={roleId} value={roleId}>
                        {role.name} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editCredential.isActive}
                      onChange={(e) => setEditCredential({...editCredential, isActive: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === `edit-${selectedCredential.id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    {actionLoading === `edit-${selectedCredential.id}` ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Credential
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && selectedCredential && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reset Password for {selectedCredential.name}
              </h3>
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password (optional)
                  </label>
                  <div className="relative">
                    <input
                      type={passwordReset.showPassword ? 'text' : 'password'}
                      value={passwordReset.newPassword}
                      onChange={(e) => setPasswordReset({...passwordReset, newPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Leave empty to auto-generate"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordReset({...passwordReset, showPassword: !passwordReset.showPassword})}
                      className="absolute right-2 top-2 text-gray-400"
                    >
                      {passwordReset.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">Minimum 8 characters</p>
                    <button
                      type="button"
                      onClick={() => setPasswordReset({...passwordReset, newPassword: generateRandomPassword()})}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Generate Random
                    </button>
                  </div>
                </div>

                <div className="bg-yellow-50 p-3 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    <strong>Warning:</strong> This will immediately change the password for this admin account.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === `password-${selectedCredential.id}`}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 flex items-center"
                  >
                    {actionLoading === `password-${selectedCredential.id}` ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-2" />
                        Reset Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 