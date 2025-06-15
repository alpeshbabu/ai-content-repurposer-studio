'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar,
  User,
  Eye,
  Edit,
  Trash2,
  Download,
  ChevronRight,
  Home,
  RefreshCw,
  BarChart3,
  Star,
  MessageSquare,
  Clock,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  originalContent: string;
  contentType: string;
  createdAt: string;
  updatedAt?: string;
  repurposedCount?: number;
  user: {
    id: string;
    name: string | null;
    email: string;
    subscriptionPlan: string;
  };
  analytics?: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
  };
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface ContentStats {
  totalContent: number;
  totalViews: number;
  avgRating: number;
  contentByType: Record<string, number>;
  contentByStatus: Record<string, number>;
  recentContent: ContentItem[];
  topPerforming: ContentItem[];
}

export default function AdminContentPage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedContent, setSelectedContent] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list');
  const [sortBy, setSortBy] = useState('createdAt');

  useEffect(() => {
    fetchContent();
    fetchContentStats();
  }, [pagination.page, searchTerm, typeFilter, sortBy]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('admin_token');
      let url = `/api/admin/content?page=${pagination.page}&limit=${pagination.limit}`;
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      if (typeFilter !== 'all') {
        url += `&type=${typeFilter}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.status}`);
      }
      
      const data = await response.json();
      setContent(data.content || []);
      setPagination(data.pagination || pagination);
      
    } catch (error) {
      console.error('Error fetching content:', error);
      setError('Failed to load content. Please try again later.');
      setContent([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchContentStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/content/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching content stats:', error);
    }
  };



  const deleteContent = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/content/${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete content');
      }

      fetchContent();
      fetchContentStats();
    } catch (error) {
      console.error('Error deleting content:', error);
      setError('Failed to delete content');
    }
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
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[type] || typeColors.other}`}>
        {type}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleContentSelection = (contentId: string) => {
    setSelectedContent(prev => 
      prev.includes(contentId) 
        ? prev.filter(id => id !== contentId)
        : [...prev, contentId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedContent(prev => 
      prev.length === content.length ? [] : content.map(c => c.id)
    );
  };

  if (loading && content.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
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
        <span className="text-gray-900 font-medium">Content Management</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600 mt-1">Manage and moderate user-generated content</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-3 py-1 rounded text-sm ${viewMode === 'analytics' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Analytics
            </button>
          </div>
          <span className="text-sm text-gray-500">
            {pagination.total} total items
          </span>
          <button
            onClick={fetchContent}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Content Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Content</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalContent}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalViews?.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.avgRating?.toFixed(1)}/5</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.contentByStatus?.published || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {viewMode === 'analytics' && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Content by Type */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Content by Type</h3>
            <div className="space-y-3">
              {stats.contentByType && Object.entries(stats.contentByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      type === 'blog' ? 'bg-blue-500' :
                      type === 'social' ? 'bg-purple-500' :
                      type === 'email' ? 'bg-green-500' :
                      type === 'video' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}></div>
                    <span className="text-sm text-gray-600 capitalize">{type}</span>
                  </div>
                  <span className="text-sm font-medium">{count} items</span>
                </div>
              ))}
            </div>
          </div>

          {/* Content by Status */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Content by Status</h3>
            <div className="space-y-3">
              {stats.contentByStatus && Object.entries(stats.contentByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      status === 'published' ? 'bg-green-500' :
                      status === 'draft' ? 'bg-yellow-500' :
                      status === 'archived' ? 'bg-gray-500' :
                      status === 'flagged' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}></div>
                    <span className="text-sm text-gray-600 capitalize">{status}</span>
                  </div>
                  <span className="text-sm font-medium">{count} items</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <>
          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search content by title or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Type Filter */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="blog">Blog</option>
                  <option value="social">Social</option>
                  <option value="email">Email</option>
                  <option value="video">Video</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Sort Options */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BarChart3 className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="createdAt">Sort by Date</option>
                  <option value="title">Sort by Title</option>
                  <option value="contentType">Sort by Type</option>
                </select>
              </div>
            </div>
          </div>



          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-700">{error}</p>
              <button
                onClick={fetchContent}
                className="mt-2 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          )}

          {/* Content Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium">Content Items</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedContent.length === content.length && content.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Content
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Repurposed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {content.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedContent.includes(item.id)}
                          onChange={() => toggleContentSelection(item.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {item.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {item.originalContent?.substring(0, 100) || 'No content preview available'}...
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            ID: {item.id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {item.user.name || 'Unnamed User'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.user.subscriptionPlan}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(item.contentType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-900">
                            {item.repurposedCount || 0} repurposed
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.analytics ? (
                          <div className="space-y-1">
                            <div className="flex items-center text-xs">
                              <Eye className="h-3 w-3 mr-1 text-gray-400" />
                              {item.analytics.views} views
                            </div>
                            <div className="flex items-center text-xs">
                              <Star className="h-3 w-3 mr-1 text-gray-400" />
                              {item.analytics.likes} likes
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">No data</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(item.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/admin/content/${item.id}`}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => deleteContent(item.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Content"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing page {pagination.page} of {pagination.pages} ({pagination.total} total items)
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* No Results */}
          {content.length === 0 && !loading && (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
              <p className="text-gray-600">
                {searchTerm || typeFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No content has been created yet.'
                }
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
} 