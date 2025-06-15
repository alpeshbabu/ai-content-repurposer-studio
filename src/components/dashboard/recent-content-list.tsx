'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Calendar, Clock, ArrowUpRight, FileText, Eye, Copy, Check, ChevronDown, ChevronRight, Search, X, ChevronLeft, ChevronRight as ChevronRightNav } from 'lucide-react';
import { PlatformIcon, PlatformBadge, getPlatformConfig } from '@/lib/platform-icons';

interface RepurposedContent {
  id: string;
  platform: string;
  content: string;
  createdAt: string;
}

interface Content {
  id: string;
  title: string;
  contentType: string;
  originalContent: string;
  repurposed: RepurposedContent[];
  createdAt: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface RecentContentListProps {
  limit?: number;
  showPagination?: boolean;
}

export default function RecentContentList({ limit = 10, showPagination = true }: RecentContentListProps) {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: limit,
    pages: 0
  });

  useEffect(() => {
    fetchContents();
  }, [limit, currentPage]);

  const fetchContents = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * limit;
      const response = await fetch(`/api/content?limit=${limit}&offset=${offset}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
      
      const data = await response.json();
      
      // Check if response has pagination info or is just an array
      if (Array.isArray(data)) {
        setContents(data);
        setPagination({
          total: data.length,
          page: currentPage,
          limit: limit,
          pages: Math.ceil(data.length / limit)
        });
      } else {
        // Ensure we always set an array for contents
        const contentArray = Array.isArray(data.contents) ? data.contents : (Array.isArray(data) ? data : []);
        setContents(contentArray);
        setPagination(data.pagination || {
          total: contentArray.length,
          page: currentPage,
          limit: limit,
          pages: Math.ceil(contentArray.length / limit)
        });
      }
    } catch (err) {
      console.error('Error fetching contents:', err);
      setError('Failed to load content history');
      // Ensure contents is always an array even on error
      setContents([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter contents based on search query
  const filteredContents = useMemo(() => {
    // Ensure contents is always an array
    const safeContents = Array.isArray(contents) ? contents : [];
    
    if (!searchQuery.trim()) {
      return safeContents;
    }

    const query = searchQuery.toLowerCase().trim();
    return safeContents.filter(content => 
      content.title.toLowerCase().includes(query) ||
      content.contentType.toLowerCase().includes(query) ||
      content.originalContent.toLowerCase().includes(query) ||
      (content.repurposed && Array.isArray(content.repurposed) && content.repurposed.some(rep => 
        rep.platform.toLowerCase().includes(query) ||
        rep.content.toLowerCase().includes(query)
      ))
    );
  }, [contents, searchQuery]);

  const toggleExpanded = (contentId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(contentId)) {
      newExpanded.delete(contentId);
    } else {
      newExpanded.add(contentId);
    }
    setExpandedItems(newExpanded);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlatformColor = (platform: string) => {
    const config = getPlatformConfig(platform);
    return `${config.bgColor} ${config.textColor}`;
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  // Early return if we don't have a valid contents array yet
  if (loading || !Array.isArray(contents)) {
    return (
      <div className="space-y-4">
        {/* Loading skeleton for search box */}
        <div className="bg-white rounded-lg p-4 shadow-sm animate-pulse">
          <div className="h-10 bg-gray-200 rounded-md"></div>
        </div>
        
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-6 bg-gray-200 rounded w-16"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 mb-2">
          <FileText className="h-8 w-8 mx-auto mb-2" />
          <p className="font-medium">Unable to load content</p>
        </div>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={fetchContents}
          className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!Array.isArray(contents) || contents.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
        <p className="text-gray-600 mb-4">
          You haven't repurposed any content yet. Create your first piece to see it here.
        </p>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Create New Content
          <ArrowUpRight className="h-4 w-4 ml-2" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Box */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search content by title, type, platform, or text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          {searchQuery && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                onClick={clearSearch}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        
        {/* Search Results Info */}
        {searchQuery && (
          <div className="mt-2 text-sm text-gray-600">
            {filteredContents.length === 0 ? (
              <span>No content found matching "{searchQuery}"</span>
            ) : (
              <span>
                {filteredContents.length} of {Array.isArray(contents) ? contents.length : 0} content{filteredContents.length !== 1 ? ' items' : ' item'} matching "{searchQuery}"
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content List */}
      {searchQuery && filteredContents.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search terms or <button onClick={clearSearch} className="text-blue-600 hover:text-blue-800 font-medium">clear the search</button> to see all content.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredContents.map((content) => {
            const isExpanded = expandedItems.has(content.id);
            
            return (
              <div key={content.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Accordion Header - Always Visible */}
                <button
                  onClick={() => toggleExpanded(content.id)}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                            {content.title}
                          </h3>
                          <div className="flex items-center text-sm text-gray-500 space-x-4 mt-1">
                            <span className="inline-flex items-center">
                              <FileText className="h-3 w-3 mr-1" />
                              {content.contentType.replace('_', ' ')}
                            </span>
                            <span className="inline-flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(content.createdAt)}
                            </span>
                            <span className="text-gray-400">
                              {content.repurposed.length} platform{content.repurposed.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Platform Tags - Visible in collapsed state */}
                    <div className="flex flex-wrap gap-1 ml-4">
                      {content.repurposed.slice(0, 3).map((repurposed) => (
                        <PlatformBadge
                          key={repurposed.id}
                          platform={repurposed.platform}
                          size="sm"
                        />
                      ))}
                      {content.repurposed.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          +{content.repurposed.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Accordion Content - Expandable */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    {/* Original Content Preview */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Original Content:</h4>
                      <p className="text-sm text-gray-700">
                        {content.originalContent}
                      </p>
                    </div>

                    {/* All Platform Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {content.repurposed.map((repurposed) => (
                        <PlatformBadge
                          key={repurposed.id}
                          platform={repurposed.platform}
                          size="md"
                        />
                      ))}
                    </div>

                    {/* Repurposed Content */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Repurposed Content:</h4>
                      {content.repurposed.map((repurposed) => (
                        <div key={repurposed.id} className="border border-gray-200 rounded-md p-3">
                          <div className="flex items-center justify-between mb-2">
                            <PlatformBadge
                              platform={repurposed.platform}
                              size="sm"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(repurposed.content, repurposed.id);
                              }}
                              className="inline-flex items-center text-xs text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              {copiedId === repurposed.id ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-sm text-gray-700">
                            {repurposed.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {showPagination && pagination.pages > 1 && !searchQuery && (
        <div className="flex items-center justify-between mt-6 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center text-sm text-gray-500">
            <span>
              Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} results
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
            
            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                let pageNum;
                
                if (pagination.pages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagination.pages - 2) {
                  pageNum = pagination.pages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
              disabled={currentPage === pagination.pages}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRightNav className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 