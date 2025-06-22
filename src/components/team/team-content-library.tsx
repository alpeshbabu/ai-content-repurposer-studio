'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Library,
  Template,
  Plus,
  Search,
  Filter,
  Share2,
  Copy,
  Edit,
  Trash2,
  Star,
  StarOff,
  Users,
  Eye,
  Download,
  ChevronRight,
  Heart,
  MessageCircle,
  RefreshCw,
  BookOpen,
  Folder,
  FolderOpen,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  platforms: string[];
  isShared: boolean;
  isStarred: boolean;
  createdBy: {
    id: string;
    name: string;
    image?: string;
  };
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
}

interface TeamContent {
  id: string;
  title: string;
  content: string;
  contentType: string;
  status: string;
  platforms: string[];
  tags: string[];
  isShared: boolean;
  isStarred: boolean;
  createdBy: {
    id: string;
    name: string;
    image?: string;
  };
  sharedWith: string[];
  views: number;
  likes: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
}

interface TeamFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  contentCount: number;
  isShared: boolean;
  createdBy: {
    id: string;
    name: string;
    image?: string;
  };
  members: string[];
  createdAt: string;
}

export default function TeamContentLibrary() {
  const [activeTab, setActiveTab] = useState('templates');
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [teamContent, setTeamContent] = useState<TeamContent[]>([]);
  const [folders, setFolders] = useState<TeamFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    category: '',
    tags: '',
    platforms: [] as string[],
    isShared: true
  });

  const categories = [
    'all',
    'social-media',
    'blog-posts',
    'email-marketing',
    'product-descriptions',
    'advertisements',
    'newsletters',
    'press-releases',
    'case-studies',
    'landing-pages'
  ];

  const platforms = [
    'twitter',
    'linkedin',
    'facebook',
    'instagram',
    'youtube',
    'tiktok',
    'pinterest',
    'reddit',
    'blog',
    'email'
  ];

  useEffect(() => {
    fetchTeamLibraryData();
  }, []);

  const fetchTeamLibraryData = async () => {
    setLoading(true);
    try {
      const [templatesRes, contentRes, foldersRes] = await Promise.all([
        fetch('/api/team/templates'),
        fetch('/api/team/content'),
        fetch('/api/team/folders')
      ]);

      const [templatesData, contentData, foldersData] = await Promise.all([
        templatesRes.json(),
        contentRes.json(),
        foldersRes.json()
      ]);

      if (templatesData.success) setTemplates(templatesData.data);
      if (contentData.success) setTeamContent(contentData.data);
      if (foldersData.success) setFolders(foldersData.data);

    } catch (error) {
      console.error('Error fetching team library data:', error);
      toast.error('Failed to load team library');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!formData.name || !formData.content) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const response = await fetch('/api/team/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Template created successfully');
        setTemplates([result.data, ...templates]);
        setShowCreateForm(false);
        setFormData({
          name: '',
          description: '',
          content: '',
          category: '',
          tags: '',
          platforms: [],
          isShared: true
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/team/templates/${templateId}/use`, {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Template applied successfully');
        // Navigate to content creation with template pre-filled
        window.location.href = `/dashboard/new?template=${templateId}`;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error using template:', error);
      toast.error('Failed to apply template');
    }
  };

  const handleStarTemplate = async (templateId: string, isStarred: boolean) => {
    try {
      const response = await fetch(`/api/team/templates/${templateId}/star`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !isStarred })
      });

      if (response.ok) {
        setTemplates(templates.map(template => 
          template.id === templateId 
            ? { ...template, isStarred: !isStarred }
            : template
        ));
        toast.success(isStarred ? 'Removed from favorites' : 'Added to favorites');
      }
    } catch (error) {
      console.error('Error updating template star:', error);
      toast.error('Failed to update favorite status');
    }
  };

  const handleShareContent = async (contentId: string, shareWith: string[]) => {
    try {
      const response = await fetch(`/api/team/content/${contentId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareWith })
      });

      if (response.ok) {
        toast.success('Content shared successfully');
        fetchTeamLibraryData();
      }
    } catch (error) {
      console.error('Error sharing content:', error);
      toast.error('Failed to share content');
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredContent = teamContent.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         content.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = !selectedFolder || content.tags.includes(selectedFolder);
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Library className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Content Library</h1>
            <p className="text-gray-600">Shared templates and content for your team</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => fetchTeamLibraryData()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates and content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : 
                     category.split('-').map(word => 
                       word.charAt(0).toUpperCase() + word.slice(1)
                     ).join(' ')
                    }
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex rounded-lg border">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">
            <Template className="h-4 w-4 mr-2" />
            Templates ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="content">
            <BookOpen className="h-4 w-4 mr-2" />
            Shared Content ({teamContent.length})
          </TabsTrigger>
          <TabsTrigger value="folders">
            <Folder className="h-4 w-4 mr-2" />
            Folders ({folders.length})
          </TabsTrigger>
          <TabsTrigger value="favorites">
            <Star className="h-4 w-4 mr-2" />
            Favorites
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Template className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Create your first team template to get started'
                  }
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-4'
            }>
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStarTemplate(template.id, template.isStarred)}
                      >
                        {template.isStarred ? (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        ) : (
                          <StarOff className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={template.createdBy.image} />
                        <AvatarFallback>
                          {template.createdBy.name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-600">{template.createdBy.name}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">
                        Used {template.usageCount} times
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">
                          {template.category.split('-').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </Badge>
                        {template.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {template.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{template.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {template.platforms.slice(0, 3).map(platform => (
                          <Badge key={platform} variant="outline" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                        {template.platforms.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.platforms.length - 3}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {template.content}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(template.content)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            <Share2 className="h-4 w-4 mr-1" />
                            Share
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleUseTemplate(template.id)}
                        >
                          Use Template
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Shared Content Tab */}
        <TabsContent value="content" className="space-y-4">
          {filteredContent.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No shared content</h3>
                <p className="text-gray-600">
                  Team members haven't shared any content yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredContent.map((content) => (
                <Card key={content.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium">{content.title}</h3>
                          <Badge variant={content.status === 'Generated' ? 'default' : 'secondary'}>
                            {content.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={content.createdBy.image} />
                            <AvatarFallback>
                              {content.createdBy.name?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-600">{content.createdBy.name}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-400">
                            {new Date(content.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-3 line-clamp-2">{content.content}</p>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Eye className="h-4 w-4" />
                            {content.views}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Heart className="h-4 w-4" />
                            {content.likes}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MessageCircle className="h-4 w-4" />
                            {content.comments}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Use
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Folders Tab */}
        <TabsContent value="folders" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => (
              <Card key={folder.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-${folder.color}-100`}>
                        <Folder className={`h-6 w-6 text-${folder.color}-600`} />
                      </div>
                      <div>
                        <h3 className="font-medium">{folder.name}</h3>
                        <p className="text-sm text-gray-600">{folder.contentCount} items</p>
                      </div>
                    </div>
                    <Badge variant={folder.isShared ? 'default' : 'secondary'}>
                      {folder.isShared ? 'Shared' : 'Private'}
                    </Badge>
                  </div>
                  
                  {folder.description && (
                    <p className="text-sm text-gray-600 mb-3">{folder.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={folder.createdBy.image} />
                        <AvatarFallback>
                          {folder.createdBy.name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-600">{folder.createdBy.name}</span>
                    </div>
                    <div className="flex -space-x-2">
                      {folder.members.slice(0, 3).map((member, index) => (
                        <Avatar key={index} className="h-6 w-6 border-2 border-white">
                          <AvatarFallback className="text-xs">
                            {member.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {folder.members.length > 3 && (
                        <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                          <span className="text-xs text-gray-600">+{folder.members.length - 3}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Favorites Tab */}
        <TabsContent value="favorites" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.filter(t => t.isStarred).map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  </div>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => handleUseTemplate(template.id)}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Template Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter template name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the template"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.slice(1).map(category => (
                      <SelectItem key={category} value={category}>
                        {category.split('-').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="social, marketing, promotion"
                />
              </div>

              <div>
                <Label htmlFor="content">Template Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter your template content..."
                  rows={6}
                />
              </div>

              <div>
                <Label>Target Platforms</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {platforms.map(platform => (
                    <label key={platform} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.platforms.includes(platform)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              platforms: [...formData.platforms, platform]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              platforms: formData.platforms.filter(p => p !== platform)
                            });
                          }
                        }}
                      />
                      <span className="text-sm capitalize">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isShared"
                  checked={formData.isShared}
                  onChange={(e) => setFormData({ ...formData, isShared: e.target.checked })}
                />
                <Label htmlFor="isShared">Share with team</Label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate}>
                  Create Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 