'use client';

import { useState } from 'react';
import { Crown, Shield, Headphones, Edit, DollarSign, Users, ChevronDown } from 'lucide-react';

interface QuickRoleChangerProps {
  userId: string;
  currentRole: string;
  userName: string;
  userEmail: string;
  canEdit?: boolean;
  onRoleChange?: (userId: string, newRole: string) => void;
  disabled?: boolean;
}

interface Role {
  id: string;
  name: string;
  icon: any;
  color: string;
  description: string;
}

const ROLES: Role[] = [
  {
    id: 'owner',
    name: 'Owner',
    icon: Crown,
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    description: 'Full system access'
  },
  {
    id: 'admin',
    name: 'Administrator',
    icon: Shield,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    description: 'Administrative access'
  },
  {
    id: 'support',
    name: 'Support Manager',
    icon: Headphones,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    description: 'Support and user assistance'
  },
  {
    id: 'marketing',
    name: 'Marketing Manager',
    icon: Edit,
    color: 'text-green-600 bg-green-50 border-green-200',
    description: 'Content and marketing'
  },
  {
    id: 'finance',
    name: 'Finance Manager',
    icon: DollarSign,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    description: 'Billing and finance'
  },
  {
    id: 'content_developer',
    name: 'Content Developer',
    icon: Edit,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    description: 'Content creation'
  }
];

export default function QuickRoleChanger({
  userId,
  currentRole,
  userName,
  userEmail,
  canEdit = true,
  onRoleChange,
  disabled = false
}: QuickRoleChangerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const currentRoleInfo = ROLES.find(r => r.id === currentRole) || ROLES[1];
  const CurrentIcon = currentRoleInfo.icon;

  const handleRoleChange = async (newRole: string) => {
    if (disabled || isChanging || newRole === currentRole) return;

    try {
      setIsChanging(true);
      setIsOpen(false);

      // Call parent callback if provided
      if (onRoleChange) {
        await onRoleChange(userId, newRole);
        return;
      }

      // Default API call
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/team/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update role');
      }

      const result = await response.json();
      
      // Show success message
      if (typeof window !== 'undefined') {
        // You might want to use a toast notification here instead
        alert(`${userName || userEmail} role updated to ${ROLES.find(r => r.id === newRole)?.name}`);
      }
      
      // Reload page or trigger parent refresh
      window.location.reload();

    } catch (error) {
      console.error('Error changing role:', error);
      alert(error instanceof Error ? error.message : 'Failed to change role');
    } finally {
      setIsChanging(false);
    }
  };

  if (!canEdit || disabled) {
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm border ${currentRoleInfo.color}`}>
        <CurrentIcon className="h-4 w-4 mr-2" />
        {currentRoleInfo.name}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isChanging}
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm border transition-colors hover:bg-opacity-80 ${currentRoleInfo.color} ${
          isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <CurrentIcon className="h-4 w-4 mr-2" />
        {isChanging ? 'Updating...' : currentRoleInfo.name}
        <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-3 border-b border-gray-100">
              <div className="text-sm font-medium text-gray-900">Change role for:</div>
              <div className="text-sm text-gray-600 truncate">{userName || userEmail}</div>
            </div>
            
            <div className="py-2 max-h-64 overflow-y-auto">
              {ROLES.map((role) => {
                const RoleIcon = role.icon;
                const isSelected = role.id === currentRole;
                
                return (
                  <button
                    key={role.id}
                    onClick={() => handleRoleChange(role.id)}
                    disabled={isSelected || isChanging}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start">
                      <RoleIcon className={`h-4 w-4 mt-0.5 mr-3 ${role.color.split(' ')[0]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">{role.name}</span>
                          {isSelected && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{role.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="p-3 border-t border-gray-100 text-xs text-gray-500">
              Changes take effect immediately
            </div>
          </div>
        </>
      )}
    </div>
  );
} 