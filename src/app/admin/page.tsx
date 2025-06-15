'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, Lock, User, Crown, Settings, Headphones } from 'lucide-react';

export default function AdminLoginPage() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const router = useRouter();

  // Check if already logged in
  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      router.push('/admin/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('admin_token', data.token);
        router.push('/admin/dashboard');
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-red-600 rounded-full flex items-center justify-center mb-6">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Admin Panel</h2>
          <p className="text-gray-400">Company Members Sign In</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In to Admin Panel'
              )}
            </button>
          </form>

          {/* Company Members Info */}
          <div className="mt-6">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="w-full text-sm text-gray-600 hover:text-gray-800 py-2"
            >
              {showInfo ? 'Hide' : 'Show'} Company Member Login Info
            </button>
            
            {showInfo && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Company Member Accounts</h3>
                
                <div className="space-y-3 text-xs">
                  <div className="flex items-start space-x-2">
                    <Crown className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Alpesh Patel (Owner)</div>
                      <div className="text-gray-600">Username: <code>mainboss</code></div>
                      <div className="text-gray-500">Full platform access + Owner privileges</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Settings className="h-4 w-4 text-purple-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Gayatri Patel (Administrator)</div>
                      <div className="text-gray-600">Username: <code>gayatri</code></div>
                      <div className="text-gray-500">User management, analytics, content, support</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Headphones className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Krish Patel (Support)</div>
                      <div className="text-gray-600">Username: <code>krish</code></div>
                      <div className="text-gray-500">Support tickets, user assistance, content review</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> Each role has different access levels in the admin panel. 
                    After login, you'll see navigation items based on your permissions.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-xs text-gray-400">
          <p>AI Content Repurposer Studio - Admin Panel</p>
          <p className="mt-1">Company Members Only • Secure Access</p>
        </div>
      </div>
    </div>
  );
} 