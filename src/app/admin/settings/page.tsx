'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Mail, 
  Shield, 
  Key, 
  Globe, 
  Bell, 
  Palette, 
  Database,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  Info,
  Users,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface SystemSettings {
  general: {
    siteName: string;
    siteUrl: string;
    supportEmail: string;
    timezone: string;
    language: string;
    maintenanceMode: boolean;
  };
  email: {
    provider: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    encryption: string;
  };
  security: {
    maxLoginAttempts: number;
    sessionTimeout: number;
    requireEmailVerification: boolean;
    enableTwoFactor: boolean;
    passwordMinLength: number;
    enableCaptcha: boolean;
  };
  api: {
    rateLimit: number;
    enableApiKeys: boolean;
    enableWebhooks: boolean;
    webhookSecret: string;
    corsOrigins: string;
  };
  notifications: {
    emailNotifications: boolean;
    systemAlerts: boolean;
    userRegistrations: boolean;
    paymentNotifications: boolean;
    errorNotifications: boolean;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: string;
    retentionDays: number;
    backupLocation: string;
  };
}

interface BackupItem {
  id: string;
  timestamp: string;
  type: string;
  size: string;
  status: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'email' | 'security' | 'api' | 'notifications' | 'backup'>('general');
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'backup') {
      fetchBackups();
    }
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      const response = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBackups = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      const response = await fetch('/api/admin/settings/backup', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups);
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
    }
  };

  const createManualBackup = async () => {
    try {
      setCreatingBackup(true);
      setBackupMessage(null);
      
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      const response = await fetch('/api/admin/settings/backup', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBackupMessage('Backup created successfully!');
        fetchBackups(); // Refresh backup list
      } else {
        setBackupMessage(data.error || 'Failed to create backup');
      }
    } catch (error) {
      setBackupMessage('Error creating backup');
    } finally {
      setCreatingBackup(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ settings })
      });

      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const testEmailConfiguration = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      const response = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ emailSettings: settings?.email })
      });

      const result = await response.json();
      
      if (result.success) {
        let message = result.message;
        if (result.validation?.warnings?.length > 0) {
          message += '\n\nWarnings:\n' + result.validation.warnings.join('\n');
        }
        if (result.recommendations?.length > 0) {
          message += '\n\nRecommendations:\n' + result.recommendations.join('\n');
        }
        setTestEmailResult(message);
      } else {
        let errorMessage = result.error;
        if (result.validation?.errors?.length > 0) {
          errorMessage += '\n\nErrors:\n' + result.validation.errors.join('\n');
        }
        if (result.validation?.warnings?.length > 0) {
          errorMessage += '\n\nWarnings:\n' + result.validation.warnings.join('\n');
        }
        setTestEmailResult(errorMessage);
      }
    } catch (error) {
      setTestEmailResult('Failed to send test email');
    }
  };

  const updateSettings = (section: keyof SystemSettings, field: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Settings</h3>
          <p className="text-gray-500">Unable to load system settings. Please try again.</p>
          <button
            onClick={fetchSettings}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'api', name: 'API', icon: Key },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'backup', name: 'Backup', icon: Database }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure your application settings and preferences</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchSettings}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <Save className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Role Management Quick Access */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg mr-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Role Management</h3>
                <p className="text-gray-600">View and understand role-based access control</p>
              </div>
            </div>
            <Link
              href="/admin/settings/roles"
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Manage Roles
              <ChevronRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === tab.id
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">General Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                <input
                  type="text"
                  value={settings.general.siteName}
                  onChange={(e) => updateSettings('general', 'siteName', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site URL</label>
                <input
                  type="url"
                  value={settings.general.siteUrl}
                  onChange={(e) => updateSettings('general', 'siteUrl', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
                <input
                  type="email"
                  value={settings.general.supportEmail}
                  onChange={(e) => updateSettings('general', 'supportEmail', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <select
                  value={settings.general.timezone}
                  onChange={(e) => updateSettings('general', 'timezone', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                  value={settings.general.language}
                  onChange={(e) => updateSettings('general', 'language', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.general.maintenanceMode}
                  onChange={(e) => updateSettings('general', 'maintenanceMode', e.target.checked)}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Maintenance Mode</label>
              </div>
            </div>
          </div>

          {/* System Information */}
          {(settings.general as any).totalUsers !== undefined && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{(settings.general as any).totalUsers || 0}</p>
                  <p className="text-sm text-gray-600">Total Users</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{(settings.general as any).totalContent || 0}</p>
                  <p className="text-sm text-gray-600">Total Content</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{(settings.general as any).environment || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Environment</p>
                </div>
              </div>
              {(settings.general as any).nodeVersion && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Node.js Version:</span>
                    <span className="font-medium">{(settings.general as any).nodeVersion}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Email Settings */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Email Configuration</h3>
              <button
                onClick={testEmailConfiguration}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Test Email
              </button>
            </div>
            
            {testEmailResult && (
              <div className={`mb-4 p-3 rounded-md ${testEmailResult.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {testEmailResult}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Provider</label>
                <select
                  value={settings.email.provider}
                  onChange={(e) => updateSettings('email', 'provider', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="smtp">SMTP</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="mailgun">Mailgun</option>
                  <option value="ses">Amazon SES</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                <input
                  type="text"
                  value={settings.email.smtpHost}
                  onChange={(e) => updateSettings('email', 'smtpHost', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                <input
                  type="number"
                  value={settings.email.smtpPort}
                  onChange={(e) => updateSettings('email', 'smtpPort', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Username</label>
                <input
                  type="text"
                  value={settings.email.smtpUser}
                  onChange={(e) => updateSettings('email', 'smtpUser', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Password</label>
                <div className="relative">
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={settings.email.smtpPassword}
                    onChange={(e) => updateSettings('email', 'smtpPassword', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Encryption</label>
                <select
                  value={settings.email.encryption}
                  onChange={(e) => updateSettings('email', 'encryption', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="none">None</option>
                  <option value="tls">TLS</option>
                  <option value="ssl">SSL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
                <input
                  type="email"
                  value={settings.email.fromEmail}
                  onChange={(e) => updateSettings('email', 'fromEmail', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
                <input
                  type="text"
                  value={settings.email.fromName}
                  onChange={(e) => updateSettings('email', 'fromName', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Security Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
                <input
                  type="number"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) => updateSettings('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  min="1"
                  max="10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => updateSettings('security', 'sessionTimeout', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  min="15"
                  max="1440"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password Min Length</label>
                <input
                  type="number"
                  value={settings.security.passwordMinLength}
                  onChange={(e) => updateSettings('security', 'passwordMinLength', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  min="6"
                  max="20"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.security.requireEmailVerification}
                    onChange={(e) => updateSettings('security', 'requireEmailVerification', e.target.checked)}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Require Email Verification</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.security.enableTwoFactor}
                    onChange={(e) => updateSettings('security', 'enableTwoFactor', e.target.checked)}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Enable Two-Factor Authentication</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.security.enableCaptcha}
                    onChange={(e) => updateSettings('security', 'enableCaptcha', e.target.checked)}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Enable CAPTCHA</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Settings */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">API Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rate Limit (requests/hour)</label>
                <input
                  type="number"
                  value={settings.api.rateLimit}
                  onChange={(e) => updateSettings('api', 'rateLimit', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CORS Origins</label>
                <input
                  type="text"
                  value={settings.api.corsOrigins}
                  onChange={(e) => updateSettings('api', 'corsOrigins', e.target.value)}
                  placeholder="https://example.com, https://app.example.com"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Webhook Secret</label>
                <div className="relative">
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={settings.api.webhookSecret}
                    onChange={(e) => updateSettings('api', 'webhookSecret', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.api.enableApiKeys}
                    onChange={(e) => updateSettings('api', 'enableApiKeys', e.target.checked)}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Enable API Keys</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.api.enableWebhooks}
                    onChange={(e) => updateSettings('api', 'enableWebhooks', e.target.checked)}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Enable Webhooks</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Settings */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                  <p className="text-sm text-gray-500">Receive email notifications for various events</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.emailNotifications}
                  onChange={(e) => updateSettings('notifications', 'emailNotifications', e.target.checked)}
                  className="toggle"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">System Alerts</h4>
                  <p className="text-sm text-gray-500">Get notified about system issues and errors</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.systemAlerts}
                  onChange={(e) => updateSettings('notifications', 'systemAlerts', e.target.checked)}
                  className="toggle"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">User Registrations</h4>
                  <p className="text-sm text-gray-500">Notify when new users register</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.userRegistrations}
                  onChange={(e) => updateSettings('notifications', 'userRegistrations', e.target.checked)}
                  className="toggle"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Payment Notifications</h4>
                  <p className="text-sm text-gray-500">Get alerts for payment events and failures</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.paymentNotifications}
                  onChange={(e) => updateSettings('notifications', 'paymentNotifications', e.target.checked)}
                  className="toggle"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Error Notifications</h4>
                  <p className="text-sm text-gray-500">Receive notifications about application errors</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.errorNotifications}
                  onChange={(e) => updateSettings('notifications', 'errorNotifications', e.target.checked)}
                  className="toggle"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backup Settings */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Backup Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                <select
                  value={settings.backup.backupFrequency}
                  onChange={(e) => updateSettings('backup', 'backupFrequency', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Retention (days)</label>
                <input
                  type="number"
                  value={settings.backup.retentionDays}
                  onChange={(e) => updateSettings('backup', 'retentionDays', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  min="1"
                  max="365"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Backup Location</label>
                <select
                  value={settings.backup.backupLocation}
                  onChange={(e) => updateSettings('backup', 'backupLocation', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="local">Local Storage</option>
                  <option value="s3">Amazon S3</option>
                  <option value="gcs">Google Cloud Storage</option>
                  <option value="azure">Azure Blob Storage</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.backup.autoBackup}
                  onChange={(e) => updateSettings('backup', 'autoBackup', e.target.checked)}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Enable Automatic Backups</label>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Manual Backup</h4>
                  <p className="text-sm text-gray-500">Create a backup immediately</p>
                </div>
                <button 
                  onClick={createManualBackup}
                  disabled={creatingBackup}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Database className={`h-4 w-4 mr-2 ${creatingBackup ? 'animate-spin' : ''}`} />
                  {creatingBackup ? 'Creating...' : 'Create Backup'}
                </button>
              </div>
              
              {backupMessage && (
                <div className={`mt-3 p-3 rounded-md ${
                  backupMessage.includes('successfully') 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {backupMessage}
                </div>
              )}
            </div>
          </div>

          {/* Backup History */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Backup History</h3>
                <button
                  onClick={fetchBackups}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  <RefreshCw className="h-4 w-4 inline mr-1" />
                  Refresh
                </button>
              </div>
            </div>
            <div className="p-6">
              {backups.length > 0 ? (
                <div className="space-y-4">
                  {backups.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <Database className="h-5 w-5 text-blue-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {backup.type === 'automatic' ? 'Automatic Backup' : 'Manual Backup'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(backup.timestamp).toLocaleString()}
                          </p>
                          {(backup as any).filename && (
                            <p className="text-xs text-gray-400">
                              File: {(backup as any).filename}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{backup.size}</p>
                          <div className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-xs text-green-600 capitalize">{backup.status}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                            Download
                          </button>
                          <button className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No backups found</p>
                  <p className="text-sm">Create your first backup using the button above</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 