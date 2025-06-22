'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  RefreshCw,
  Activity,
  FileText,
  Edit,
  Share,
  MessageCircle,
  Layout as Template,
  Repeat
} from 'lucide-react';
import { toast } from 'sonner';

interface ActivityFeedItem {
  id: string;
  type: 'content_created' | 'content_edited' | 'content_shared' | 'comment_added' | 'template_used' | 'content_repurposed';
  userId: string;
  user: {
    name: string;
    image?: string;
  };
  contentId?: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

interface Team {
  id: string;
  name: string;
  memberCount: number;
}

export default function TeamActivityFeed() {
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchActivities();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async (force = false) => {
    if (force) setRefreshing(true);
    else if (activities.length === 0) setLoading(true);

    try {
      const response = await fetch('/api/team/activity?limit=50');
      const result = await response.json();

      if (result.success) {
        setActivities(result.data.activities);
        setTeam(result.data.team);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error fetching team activities:', error);
      if (force) {
        toast.error('Failed to refresh activities');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'content_created':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'content_edited':
        return <Edit className="h-4 w-4 text-orange-500" />;
      case 'content_shared':
        return <Share className="h-4 w-4 text-green-500" />;
      case 'comment_added':
        return <MessageCircle className="h-4 w-4 text-purple-500" />;
      case 'template_used':
        return <Template className="h-4 w-4 text-indigo-500" />;
      case 'content_repurposed':
        return <Repeat className="h-4 w-4 text-teal-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'content_created':
        return 'border-l-blue-500';
      case 'content_edited':
        return 'border-l-orange-500';
      case 'content_shared':
        return 'border-l-green-500';
      case 'comment_added':
        return 'border-l-purple-500';
      case 'template_used':
        return 'border-l-indigo-500';
      case 'content_repurposed':
        return 'border-l-teal-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return <ActivityLoadingSkeleton />;
  }

  if (!team) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Team Found</h3>
            <p className="text-muted-foreground mb-4">
              You're not part of any team yet. Join or create a team to see collaborative activities.
            </p>
            <Button>Create Team</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Team Activity</CardTitle>
            <Badge variant="secondary">{team.memberCount} members</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchActivities(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Recent activities from {team.name}
        </p>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Recent Activity</h3>
            <p className="text-muted-foreground">
              Team activities will appear here as members create and edit content.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`flex gap-3 p-3 border-l-2 ${getActivityColor(activity.type)} bg-muted/20 rounded-r-lg`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activity.user.image} />
                  <AvatarFallback>
                    {activity.user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getActivityIcon(activity.type)}
                    <span className="text-sm font-medium">
                      {activity.description}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatTimestamp(activity.timestamp)}</span>
                    {activity.contentId && (
                      <>
                        <span>•</span>
                        <span>Content ID: {activity.contentId.slice(0, 8)}...</span>
                      </>
                    )}
                  </div>
                  
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {activity.metadata.platforms && (
                        <div className="flex gap-1">
                          {activity.metadata.platforms.map((platform: string) => (
                            <Badge key={platform} variant="outline" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {activity.metadata.templateName && (
                        <Badge variant="outline" className="text-xs">
                          {activity.metadata.templateName}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityLoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-3 border-l-2 border-l-gray-200 bg-muted/20 rounded-r-lg">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 