'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Filter,
  MoreHorizontal,
  Trash2,
  Archive,
  RefreshCw,
  Grid,
  List,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Eye,
  FileText,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { PlatformBadge } from '@/lib/platform-icons';

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
  status: string;
  repurposed: RepurposedContent[];
  createdAt: string;
  updatedAt: string;
  views?: number;
  engagements?: number;
}

export default function AdvancedContentLibrary() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // Show all content by default
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchContents();
  }, [statusFilter]);

  const fetchContents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try advanced endpoint first, fallback to basic
      let response;
      let endpoint;
      try {
        endpoint = `/api/content/advanced?limit=50&status=${statusFilter}`;
        response = await fetch(endpoint);
      } catch (advancedError) {
        console.log('Advanced endpoint failed, trying basic endpoint');
        endpoint = `/api/content?limit=50&status=${statusFilter}`;
        response = await fetch(endpoint);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${response.status}):`, errorText);
        throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle both advanced and basic API responses
      const contentArray = data.contents || data || [];
      console.log(`Loaded ${contentArray.length} content items with status filter: ${statusFilter}`);
      
      setContents(Array.isArray(contentArray) ? contentArray : []);
      
    } catch (err) {
      console.error('Error fetching contents:', err);
      setError(`Failed to load content library: ${err.message}`);
      setContents([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter contents based on search
  const filteredContents = useMemo(() => {
    if (!searchQuery.trim()) return contents;
    
    const query = searchQuery.toLowerCase();
    return contents.filter(content => 
      content.title.toLowerCase().includes(query) ||
      content.contentType.toLowerCase().includes(query) ||
      content.originalContent.toLowerCase().includes(query)
    );
  }, [contents, searchQuery]);

  // Bulk Operations
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0 || !confirm(`Delete ${selectedItems.size} items?`)) return;
    
    try {
      const response = await fetch('/api/content/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedItems) })
      });
      
      if (response.ok) {
        setSelectedItems(new Set());
        fetchContents();
      } else {
        throw new Error('Failed to delete items');
      }
    } catch (error) {
      console.error('Bulk delete failed:', error);
      alert('Failed to delete items. Please try again.');
    }
  };

  const handleBulkRepurpose = async () => {
    if (selectedItems.size === 0) return;
    
    // Filter to only include Generated items
    const generatedItems = Array.from(selectedItems).filter(id => {
      const content = contents.find(c => c.id === id);
      return content?.status === 'Generated';
    });
    
    if (generatedItems.length === 0) {
      alert('No Generated content selected for repurposing.');
      return;
    }
    
    try {
      const response = await fetch('/api/content/bulk-repurpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ids: generatedItems,
          platforms: ['Twitter', 'LinkedIn', 'Instagram']
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setSelectedItems(new Set());
        fetchContents();
        
        if (result.summary) {
          alert(`Bulk repurpose completed!\nSuccessful: ${result.summary.successful}\nFailed: ${result.summary.failed}\nSkipped: ${result.summary.skipped}`);
        }
      } else {
        throw new Error('Failed to repurpose items');
      }
    } catch (error) {
      console.error('Bulk repurpose failed:', error);
      alert('Failed to repurpose items. Please try again.');
    }
  };

  const handleSingleRepurpose = async (contentId: string) => {
    const content = contents.find(c => c.id === contentId);
    if (!content || content.status !== 'Generated') {
      alert('Only Generated content can be repurposed.');
      return;
    }
    
    try {
      const response = await fetch('/api/repurpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: content.title,
          content: content.originalContent,
          contentType: content.contentType,
          platforms: ['twitter', 'linkedin', 'instagram']
        })
      });
      
      if (response.ok) {
        fetchContents();
        alert('Content repurposed successfully!');
      } else {
        throw new Error('Failed to repurpose content');
      }
    } catch (error) {
      console.error('Single repurpose failed:', error);
      alert('Failed to repurpose content. Please try again.');
    }
  };

  // Utility Functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredContents.map(c => c.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (contentId: string, checked: boolean) => {
    const newSelection = new Set(selectedItems);
    if (checked) {
      newSelection.add(contentId);
    } else {
      newSelection.delete(contentId);
    }
    setSelectedItems(newSelection);
  };

  const toggleExpanded = (contentId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(contentId)) {
      newExpanded.delete(contentId);
    } else {
      newExpanded.add(contentId);
    }
    setExpandedItems(newExpanded);
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
      year: 'numeric'
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  // Loading State
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your content library...</p>
        </div>
        <div className="flex justify-between items-center">
          <div className="h-10 bg-gray-200 rounded-md w-64 animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-10 bg-gray-200 rounded-md w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded-md w-32 animate-pulse"></div>
          </div>
        </div>
        
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
              <div className="flex justify-between mb-4">
                <div>
                  <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-6 bg-gray-200 rounded w-16"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <FileText className="h-8 w-8 text-red-600 mx-auto mb-2" />
        <p className="font-medium text-red-600 mb-2">Unable to load content library</p>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <Button onClick={fetchContents} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Controls */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex-1 flex gap-4 max-w-2xl">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
                          <option value="all">All Content</option>
              <option value="Repurposed">Repurposed Only</option>
              <option value="Generated">Generated Only</option>
          </select>
          
          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* View Controls and Actions */}
        <div className="flex items-center gap-2">
          {/* View Mode */}
          <div className="flex rounded-md border overflow-hidden">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedItems.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  Actions ({selectedItems.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleBulkRepurpose}
                  disabled={!Array.from(selectedItems).some(id => {
                    const content = contents.find(c => c.id === id);
                    return content?.status === 'draft';
                  })}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Repurpose Selected Drafts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBulkDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}


        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <span>{filteredContents.length} items</span>
          {selectedItems.size > 0 && (
            <>
              <span>•</span>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedItems.size === filteredContents.length && filteredContents.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span>{selectedItems.size} selected</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content Grid/List */}
      {filteredContents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
          <p className="text-gray-600">
            {searchQuery 
              ? "Try adjusting your search to find what you're looking for."
              : "Get started by creating your first piece of content using the 'Create New Content' button above."}
          </p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        }>
          {filteredContents.map((content) => (
            <ContentCard
              key={content.id}
              content={content}
              viewMode={viewMode}
              isSelected={selectedItems.has(content.id)}
              onSelect={(checked) => handleSelectItem(content.id, checked)}
              isExpanded={expandedItems.has(content.id)}
              onToggleExpand={() => toggleExpanded(content.id)}
              onCopy={(text) => copyToClipboard(text, content.id)}
              onRepurpose={() => handleSingleRepurpose(content.id)}
              copiedId={copiedId}
              formatDate={formatDate}
              truncateContent={truncateContent}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Content Card Component
interface ContentCardProps {
  content: Content;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCopy: (text: string) => void;
  onRepurpose: () => void;
  copiedId: string | null;
  formatDate: (date: string) => string;
  truncateContent: (content: string, maxLength?: number) => string;
}

function ContentCard({
  content,
  viewMode,
  isSelected,
  onSelect,
  isExpanded,
  onToggleExpand,
  onCopy,
  onRepurpose,
  copiedId,
  formatDate,
  truncateContent
}: ContentCardProps) {
  return (
    <div className="bg-white rounded-lg border hover:shadow-sm transition-all duration-200 p-6">
      {/* Header with Selection and Title */}
      <div className="flex items-start gap-3 mb-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          className="mt-1"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate mb-1">
                {content.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Badge variant="secondary" className="text-xs">
                  {content.contentType}
                </Badge>
                <Badge 
                  variant={content.status === 'Repurposed' ? 'default' : 'outline'} 
                  className="text-xs"
                >
                  {content.status}
                </Badge>
                <span>•</span>
                <span>{formatDate(content.createdAt)}</span>
                {content.views && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {content.views}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {/* Repurpose Button - Only for Generated content */}
              {content.status === 'Generated' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRepurpose}
                  className="h-8 px-2 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Repurpose
                </Button>
              )}
              
              {/* Copy Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(content.originalContent)}
                className="h-8 w-8 p-0"
              >
                {copiedId === content.id ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Preview */}
      <div className="mb-4">
        <p className="text-gray-700 text-sm leading-relaxed">
          {truncateContent(content.originalContent, viewMode === 'grid' ? 100 : 200)}
        </p>
      </div>

      {/* Repurposed Content Section */}
      {content.repurposed && content.repurposed.length > 0 && (
        <div className="border-t pt-4">
          <button
            onClick={onToggleExpand}
            className="flex items-center justify-between w-full text-left mb-2"
          >
            <span className="text-sm font-medium text-gray-700">
              Repurposed Content ({content.repurposed.length})
            </span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {/* Platform Badges Preview */}
          <div className="flex flex-wrap gap-2 mb-2">
            {content.repurposed.slice(0, isExpanded ? undefined : 5).map((rep) => (
              <PlatformBadge key={rep.id} platform={rep.platform} />
            ))}
            {!isExpanded && content.repurposed.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{content.repurposed.length - 5} more
              </Badge>
            )}
          </div>

          {/* Expanded Repurposed Content */}
          {isExpanded && (
            <div className="space-y-3 mt-3">
              {content.repurposed.map((rep) => (
                <div key={rep.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <PlatformBadge platform={rep.platform} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCopy(rep.content)}
                      className="h-6 w-6 p-0"
                    >
                      {copiedId === rep.id ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-700">
                    {truncateContent(rep.content, 150)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 