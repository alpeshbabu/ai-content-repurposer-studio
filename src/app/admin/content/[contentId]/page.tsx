'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  FileText, 
  ChevronRight,
  Home,
  User,
  Calendar,
  Eye,
  Star,
  MessageSquare,
  Share2,
  ArrowLeft,
  Edit,
  Flag,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';

interface ContentDetails {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    subscriptionPlan: string;
  };
  analytics: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
  };
}

export default function AdminContentDetailPage() {
  const params = useParams();
  const contentId = params.contentId as string;
  
  const [content, setContent] = useState<ContentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (contentId) {
      fetchContentDetails();
    }
  }, [contentId]);

  const fetchContentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/content/${contentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.status}`);
      }
      
      const data = await response.json();
      setContent(data.content);
      
    } catch (error) {
      console.error('Error fetching content details:', error);
      setError('Failed to load content details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const updateContentStatus = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch(`/api/admin/content/${contentId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update content status');
      }

      // Refresh content details
      fetchContentDetails();
    } catch (error) {
      console.error('Error updating content status:', error);
      setError('Failed to update content status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      'published': { color: 'bg-green-100 text-green-800', icon: Eye },
      'draft': { color: 'bg-yellow-100 text-yellow-800', icon: Edit },
      'archived': { color: 'bg-gray-100 text-gray-800', icon: Clock },
      'flagged': { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: FileText };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="h-4 w-4 mr-2" />
        {status}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      'blog': 'bg-blue-100 text-blue-800',
      'social': 'bg-purple-100 text-purple-800',
      'email': 'bg-green-100 text-green-800',
      'video': 'bg-red-100 text-red-800',
      'other': 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${typeColors[type] || typeColors.other}`}>
        {type}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error || 'Content not found'}</p>
          <div className="mt-4 flex space-x-2">
            <button
              onClick={fetchContentDetails}
              className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
            >
              Retry
            </button>
            <Link
              href="/admin/content"
              className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded hover:bg-gray-200"
            >
              Back to Content
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
        <Link 
          href="/admin/content" 
          className="hover:text-gray-700 transition-colors"
        >
          Content Management
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="text-gray-900 font-medium">Content Details</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <Link
              href="/admin/content"
              className="mr-4 p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{content.title}</h1>
          </div>
          <p className="text-gray-600">Content ID: {content.id}</p>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge(content.status)}
          {getTypeBadge(content.type)}
        </div>
      </div>

      {/* Content Info and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content Text */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Content</h3>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{content.content}</p>
            </div>
          </div>

          {/* Performance Analytics */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Analytics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{content.analytics.views.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Views</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mx-auto mb-2">
                  <Star className="h-6 w-6 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{content.analytics.likes.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Likes</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                  <Share2 className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{content.analytics.shares.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Shares</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{content.analytics.comments.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Comments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Content Management */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Content Management</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={content.status}
                  onChange={(e) => updateContentStatus(e.target.value)}
                  disabled={updatingStatus}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                  <option value="flagged">Flagged</option>
                </select>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Type</p>
                <p className="text-sm text-gray-900 capitalize">{content.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Visibility</p>
                <p className="text-sm text-gray-900 capitalize">{content.visibility}</p>
              </div>
            </div>
          </div>

          {/* Author Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Author Information</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="font-medium">{content.user.name || 'Unnamed User'}</p>
                  <p className="text-sm text-gray-500">{content.user.email}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Flag className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium">Subscription Plan</p>
                  <p className="text-sm text-gray-500 capitalize">{content.user.subscriptionPlan}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-gray-500">{formatDate(content.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-gray-500">{formatDate(content.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={fetchContentDetails}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center justify-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </button>
              <button
                onClick={() => window.open(`mailto:${content.user.email}?subject=Regarding your content: ${content.title}`)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm flex items-center justify-center"
              >
                <User className="h-4 w-4 mr-2" />
                Contact Author
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 