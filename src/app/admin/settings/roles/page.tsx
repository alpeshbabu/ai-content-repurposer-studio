'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  Users, 
  Eye, 
  Edit, 
  Key, 
  ChevronRight, 
  Home,
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Save,
  X,
  Crown,
  Settings,
  BarChart3,
  Headphones,
  DollarSign,
  FileText,
  ArrowLeft,
  RefreshCw,
  Lock,
  Unlock
} from 'lucide-react';
import { PERMISSIONS } from '@/lib/rbac';

interface RoleInfo {
  id: string;
  name: string;
  permissions: string[];
  description: string;
  canEdit: boolean;
  permissionCount: number;
  hasFullAccess: boolean;
}

interface PermissionCategory {
  permissions: string[];
  icon: string;
  color: string;
}

interface RoleData {
  roles: RoleInfo[];
  permissions: { [key: string]: string };
  permissionCategories: { [key: string]: PermissionCategory };
  userAccess: {
    canManageRoles: boolean;
    canViewRoles: boolean;
    currentRole: string;
    hasFullAccess: boolean;
  };
}

export default function RoleManagementPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [data, setData] = useState<RoleData | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<{ [key: string]: boolean }>({});
  const [selectedRole, setSelectedRole] = useState<string>('admin');

  useEffect(() => {
    loadRoleData();
  }, []);

  const loadRoleData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/settings/roles', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to load role data');
      }
      
      const roleData = await response.json();
      setData(roleData);
      
    } catch (error) {
      console.error('Error loading roles:', error);
      setError('Failed to load role information');
    } finally {
      setLoading(false);
    }
  };

  const startEditingRole = (roleId: string) => {
    if (!data) return;
    
    const role = data.roles.find(r => r.id === roleId);
    if (!role || !role.canEdit) return;

    setEditingRole(roleId);
    
    // Convert role permissions array to boolean map
    const permissionMap: { [key: string]: boolean } = {};
    Object.values(PERMISSIONS).forEach(permission => {
      permissionMap[permission] = role.permissions.includes(permission);
    });
    setRolePermissions(permissionMap);
  };

  const cancelEditing = () => {
    setEditingRole(null);
    setRolePermissions({});
    setError(null);
    setSuccess(null);
  };

  const saveRolePermissions = async () => {
    if (!editingRole || !data) return;

    try {
      setSaving(true);
      setError(null);
      
      const selectedPermissions = Object.entries(rolePermissions)
        .filter(([_, selected]) => selected)
        .map(([permission, _]) => permission);

      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/settings/roles', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleId: editingRole,
          permissions: selectedPermissions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update role' }));
        throw new Error(errorData.message || 'Failed to update role');
      }

      const result = await response.json();
      setSuccess(`Role ${editingRole} updated successfully!`);
      setEditingRole(null);
      setRolePermissions({});
      
      // Reload data to reflect changes
      await loadRoleData();
      
    } catch (error) {
      console.error('Error saving role:', error);
      setError(error instanceof Error ? error.message : 'Failed to save role permissions');
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (permission: string) => {
    setRolePermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const toggleAllInCategory = (categoryPermissions: string[], allSelected: boolean) => {
    const updates: { [key: string]: boolean } = {};
    categoryPermissions.forEach(permission => {
      updates[permission] = !allSelected;
    });
    setRolePermissions(prev => ({ ...prev, ...updates }));
  };

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      users: Users,
      edit: Edit,
      'bar-chart': BarChart3,
      headphones: Headphones,
      'dollar-sign': DollarSign,
      settings: Settings,
      crown: Crown,
    };
    return icons[iconName] || FileText;
  };

  const getColorClass = (color: string) => {
    const colors: { [key: string]: string } = {
      blue: 'bg-blue-50 border-blue-200 text-blue-900',
      green: 'bg-green-50 border-green-200 text-green-900',
      purple: 'bg-purple-50 border-purple-200 text-purple-900',
      orange: 'bg-orange-50 border-orange-200 text-orange-900',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
      gray: 'bg-gray-50 border-gray-200 text-gray-900',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-900',
      red: 'bg-red-50 border-red-200 text-red-900',
    };
    return colors[color] || colors.gray;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading role management...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">Failed to load role data</p>
          <button
            onClick={loadRoleData}
            className="mt-2 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600">
        <Link href="/admin" className="hover:text-blue-600 flex items-center">
          <Home className="h-4 w-4 mr-1" />
          Admin
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/admin/settings" className="hover:text-blue-600">Settings</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium">Role Management</span>
      </nav>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="h-8 w-8 mr-3 text-blue-600" />
            Role Management
          </h1>
          <p className="text-gray-600 mt-1">
            Configure role permissions and access control
            {!data.userAccess.canManageRoles && ' (View Only)'}
          </p>
        </div>
        <button
          onClick={loadRoleData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
          <span className="text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center">
          <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
          <span className="text-green-700">{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-500 hover:text-green-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {!data.userAccess.canManageRoles && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-center">
          <Info className="h-5 w-5 text-amber-600 mr-3" />
          <span className="text-amber-800">
            You have view-only access to role information. Only owners can modify role permissions.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Roles</h2>
            <div className="space-y-3">
              {data.roles.map((role) => (
                <div
                  key={role.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedRole === role.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 flex items-center">
                        {role.id === 'owner' && <Crown className="h-4 w-4 mr-2 text-yellow-600" />}
                        {role.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {role.permissionCount} permissions
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {role.hasFullAccess && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Full Access
                        </span>
                      )}
                      {role.canEdit && data.userAccess.canManageRoles ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditingRole(role.id);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      ) : (
                        <Lock className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Role Details/Editor */}
        <div className="lg:col-span-2">
          {editingRole ? (
            /* Permission Editor */
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Edit Permissions: {data.roles.find(r => r.id === editingRole)?.name}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={cancelEditing}
                    disabled={saving}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveRolePermissions}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {Object.entries(data.permissionCategories).map(([categoryName, category]) => {
                  const categoryPermissions = category.permissions;
                  const selectedInCategory = categoryPermissions.filter(p => rolePermissions[p]).length;
                  const allSelected = selectedInCategory === categoryPermissions.length;
                  const partiallySelected = selectedInCategory > 0 && selectedInCategory < categoryPermissions.length;
                  const IconComponent = getIconComponent(category.icon);

                  return (
                    <div key={categoryName} className={`border rounded-lg ${getColorClass(category.color)}`}>
                      <div className="p-4 border-b border-current border-opacity-20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <IconComponent className="h-5 w-5 mr-3" />
                            <h3 className="font-medium">{categoryName}</h3>
                            <span className="ml-2 text-sm opacity-75">
                              ({selectedInCategory}/{categoryPermissions.length})
                            </span>
                          </div>
                          <button
                            onClick={() => toggleAllInCategory(categoryPermissions, allSelected)}
                            className="text-sm font-medium hover:underline"
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        {categoryPermissions.map((permission) => (
                          <label key={permission} className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={rolePermissions[permission] || false}
                              onChange={() => togglePermission(permission)}
                              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <div className="font-medium text-gray-900">
                                {permission === PERMISSIONS.ALL ? 'All Permissions' : 
                                 permission.replace(/[:_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                              <div className="text-sm text-gray-600">
                                {data.permissions[permission]}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Role Details View */
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Role Details</h2>
              {(() => {
                const role = data.roles.find(r => r.id === selectedRole);
                if (!role) return <p className="text-gray-600">Select a role to view details</p>;

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        {role.id === 'owner' && <Crown className="h-5 w-5 mr-2 text-yellow-600" />}
                        {role.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {role.hasFullAccess && (
                          <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                            Full Access
                          </span>
                        )}
                        {role.canEdit && data.userAccess.canManageRoles && (
                          <button
                            onClick={() => startEditingRole(role.id)}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded hover:bg-blue-200 flex items-center"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-600">{role.description}</p>

                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Permissions ({role.permissions.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(data.permissionCategories).map(([categoryName, category]) => {
                          const hasPermissions = category.permissions.some(p => role.permissions.includes(p));
                          if (!hasPermissions) return null;

                          const IconComponent = getIconComponent(category.icon);
                          return (
                            <div key={categoryName} className={`border rounded-lg p-4 ${getColorClass(category.color)}`}>
                              <div className="flex items-center mb-2">
                                <IconComponent className="h-4 w-4 mr-2" />
                                <h5 className="font-medium">{categoryName}</h5>
                              </div>
                              <ul className="space-y-1 text-sm">
                                {category.permissions
                                  .filter(p => role.permissions.includes(p))
                                  .map(permission => (
                                    <li key={permission} className="flex items-center">
                                      <CheckCircle2 className="h-3 w-3 mr-2 text-green-600" />
                                      {permission === PERMISSIONS.ALL ? 'All Permissions' : 
                                       permission.replace(/[:_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Access Control Guide */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Permission Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <Crown className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Owner</h4>
            <p className="text-sm text-gray-600">Complete system control</p>
          </div>
          <div className="text-center">
            <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Admin</h4>
            <p className="text-sm text-gray-600">Platform management</p>
          </div>
          <div className="text-center">
            <Headphones className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Support</h4>
            <p className="text-sm text-gray-600">User assistance</p>
          </div>
          <div className="text-center">
            <Edit className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Content</h4>
            <p className="text-sm text-gray-600">Content management</p>
          </div>
        </div>
      </div>
    </div>
  );
} 