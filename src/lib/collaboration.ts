import { prisma } from '@/lib/prisma';
import { analyticsTracker } from '@/lib/analytics-tracker';

export interface CollaborationSession {
  id: string;
  contentId: string;
  participants: CollaborationParticipant[];
  status: 'active' | 'ended';
  createdAt: Date;
  updatedAt: Date;
}

export interface CollaborationParticipant {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: Date;
  lastActivity: Date;
  cursor?: {
    position: number;
    selection?: { start: number; end: number };
  };
}

export interface ContentChange {
  id: string;
  sessionId: string;
  userId: string;
  type: 'insert' | 'delete' | 'format' | 'comment';
  position: number;
  content?: string;
  length?: number;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface Comment {
  id: string;
  contentId: string;
  userId: string;
  user: {
    name: string;
    image?: string;
  };
  text: string;
  position: number;
  resolved: boolean;
  replies: CommentReply[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentReply {
  id: string;
  userId: string;
  user: {
    name: string;
    image?: string;
  };
  text: string;
  createdAt: Date;
}

export interface ActivityFeedItem {
  id: string;
  type: 'content_created' | 'content_edited' | 'content_shared' | 'comment_added' | 'user_joined' | 'template_used';
  userId: string;
  user: {
    name: string;
    image?: string;
  };
  contentId?: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

class CollaborationService {
  private static instance: CollaborationService;
  private activeSessions: Map<string, CollaborationSession> = new Map();

  private constructor() {}

  public static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService();
    }
    return CollaborationService.instance;
  }

  // Create or join collaboration session
  async createOrJoinSession(contentId: string, userId: string, role: 'owner' | 'editor' | 'viewer' = 'editor'): Promise<CollaborationSession> {
    try {
      // Check if user has access to content
      const content = await prisma.content.findFirst({
        where: {
          id: contentId,
          OR: [
            { userId }, // Owner
            { 
              user: {
                team: {
                  members: {
                    some: { userId }
                  }
                }
              }
            } // Team member
          ]
        },
        include: {
          user: true
        }
      });

      if (!content) {
        throw new Error('Content not found or access denied');
      }

      // Get or create session
      let session = this.activeSessions.get(contentId);
      
      if (!session) {
        // Create new session
        session = {
          id: `session_${contentId}_${Date.now()}`,
          contentId,
          participants: [],
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.activeSessions.set(contentId, session);
      }

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, image: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Add or update participant
      const existingParticipantIndex = session.participants.findIndex(p => p.userId === userId);
      const participant: CollaborationParticipant = {
        userId,
        user,
        role: content.userId === userId ? 'owner' : role,
        joinedAt: existingParticipantIndex === -1 ? new Date() : session.participants[existingParticipantIndex].joinedAt,
        lastActivity: new Date()
      };

      if (existingParticipantIndex === -1) {
        session.participants.push(participant);
      } else {
        session.participants[existingParticipantIndex] = participant;
      }

      session.updatedAt = new Date();

      // Track analytics
      await analyticsTracker.trackCollaboration(userId, 'session_joined', undefined, {
        contentId,
        sessionId: session.id,
        role
      });

      return session;

    } catch (error) {
      console.error('Error creating/joining collaboration session:', error);
      throw error;
    }
  }

  // Leave collaboration session
  async leaveSession(contentId: string, userId: string): Promise<void> {
    const session = this.activeSessions.get(contentId);
    if (session) {
      session.participants = session.participants.filter(p => p.userId !== userId);
      session.updatedAt = new Date();

      // End session if no participants left
      if (session.participants.length === 0) {
        session.status = 'ended';
        this.activeSessions.delete(contentId);
      }

      await analyticsTracker.trackCollaboration(userId, 'session_left', undefined, {
        contentId,
        sessionId: session.id
      });
    }
  }

  // Update cursor position
  async updateCursor(contentId: string, userId: string, position: number, selection?: { start: number; end: number }): Promise<void> {
    const session = this.activeSessions.get(contentId);
    if (session) {
      const participant = session.participants.find(p => p.userId === userId);
      if (participant) {
        participant.cursor = { position, selection };
        participant.lastActivity = new Date();
        session.updatedAt = new Date();
      }
    }
  }

  // Apply content change
  async applyChange(contentId: string, userId: string, change: Omit<ContentChange, 'id' | 'sessionId' | 'userId' | 'timestamp'>): Promise<ContentChange> {
    const session = this.activeSessions.get(contentId);
    if (!session) {
      throw new Error('No active collaboration session');
    }

    const participant = session.participants.find(p => p.userId === userId);
    if (!participant || participant.role === 'viewer') {
      throw new Error('Insufficient permissions to edit content');
    }

    const contentChange: ContentChange = {
      id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: session.id,
      userId,
      timestamp: new Date(),
      ...change
    };

    // Update participant activity
    participant.lastActivity = new Date();
    session.updatedAt = new Date();

    // Track analytics
    await analyticsTracker.trackCollaboration(userId, 'content_edited', undefined, {
      contentId,
      sessionId: session.id,
      changeType: change.type
    });

    return contentChange;
  }

  // Add comment to content
  async addComment(contentId: string, userId: string, text: string, position: number): Promise<Comment> {
    try {
      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, image: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const comment: Comment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contentId,
        userId,
        user,
        text,
        position,
        resolved: false,
        replies: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Track analytics
      await analyticsTracker.trackCollaboration(userId, 'comment_added', undefined, {
        contentId,
        commentId: comment.id,
        position
      });

      return comment;

    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // Reply to comment
  async replyToComment(commentId: string, userId: string, text: string): Promise<CommentReply> {
    try {
      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, image: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const reply: CommentReply = {
        id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        user,
        text,
        createdAt: new Date()
      };

      // Track analytics
      await analyticsTracker.trackCollaboration(userId, 'comment_replied', undefined, {
        commentId,
        replyId: reply.id
      });

      return reply;

    } catch (error) {
      console.error('Error replying to comment:', error);
      throw error;
    }
  }

  // Resolve comment
  async resolveComment(commentId: string, userId: string): Promise<void> {
    await analyticsTracker.trackCollaboration(userId, 'comment_resolved', undefined, {
      commentId
    });
  }

  // Get active session for content
  getActiveSession(contentId: string): CollaborationSession | undefined {
    return this.activeSessions.get(contentId);
  }

  // Get team activity feed
  async getTeamActivityFeed(userId: string, limit: number = 50): Promise<ActivityFeedItem[]> {
    try {
      const userWithTeam = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          team: {
            include: {
              members: {
                include: {
                  user: {
                    select: { id: true, name: true, image: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!userWithTeam?.team) {
        return [];
      }

      const teamMemberIds = userWithTeam.team.members.map(m => m.userId);

      const activities = await prisma.auditLog.findMany({
        where: {
          userId: { in: teamMemberIds },
          action: {
            in: [
              'content_created',
              'content_edited',
              'content_shared',
              'comment_added',
              'template_used'
            ]
          }
        },
        include: {
          user: {
            select: { name: true, image: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      const feedItems: ActivityFeedItem[] = activities.map(activity => ({
        id: activity.id,
        type: activity.action as any,
        userId: activity.userId,
        user: activity.user,
        contentId: activity.resourceId,
        description: this.generateActivityDescription(activity.action, activity.user.name, activity.metadata),
        metadata: activity.metadata,
        timestamp: activity.createdAt
      }));

      return feedItems;

    } catch (error) {
      console.error('Error getting team activity feed:', error);
      return [];
    }
  }

  // Get team productivity metrics
  async getTeamProductivityMetrics(teamId: string, timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    totalContent: number;
    totalRepurposes: number;
    totalCollaborations: number;
    memberActivity: Array<{
      userId: string;
      userName: string;
      contentCreated: number;
      collaborations: number;
      lastActive: Date;
    }>;
    topPerformers: Array<{
      userId: string;
      userName: string;
      score: number;
    }>;
  }> {
    try {
      const startDate = this.getStartDate(timeframe);

      // Get team members
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true } }
            }
          }
        }
      });

      if (!team) {
        throw new Error('Team not found');
      }

      const memberIds = team.members.map(m => m.userId);

      // Get metrics
      const [contentStats, collaborationStats, memberActivities] = await Promise.all([
        // Content creation stats
        prisma.content.groupBy({
          by: ['userId'],
          where: {
            userId: { in: memberIds },
            createdAt: { gte: startDate }
          },
          _count: true
        }),

        // Collaboration stats
        prisma.auditLog.groupBy({
          by: ['userId'],
          where: {
            userId: { in: memberIds },
            action: { startsWith: 'collaboration_' },
            createdAt: { gte: startDate }
          },
          _count: true
        }),

        // Member activities
        prisma.auditLog.groupBy({
          by: ['userId'],
          where: {
            userId: { in: memberIds },
            createdAt: { gte: startDate }
          },
          _count: true,
          _max: { createdAt: true }
        })
      ]);

      // Calculate member activity
      const memberActivity = team.members.map(member => {
        const contentCount = contentStats.find(s => s.userId === member.userId)?._count || 0;
        const collaborationCount = collaborationStats.find(s => s.userId === member.userId)?._count || 0;
        const lastActivity = memberActivities.find(s => s.userId === member.userId)?._max.createdAt || new Date(0);

        return {
          userId: member.userId,
          userName: member.user.name || 'Unknown',
          contentCreated: contentCount,
          collaborations: collaborationCount,
          lastActive: lastActivity
        };
      });

      // Calculate top performers (based on content + collaborations)
      const topPerformers = memberActivity
        .map(member => ({
          userId: member.userId,
          userName: member.userName,
          score: member.contentCreated * 2 + member.collaborations
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      return {
        totalContent: contentStats.reduce((sum, stat) => sum + stat._count, 0),
        totalRepurposes: 0, // Would need to calculate from repurposed content
        totalCollaborations: collaborationStats.reduce((sum, stat) => sum + stat._count, 0),
        memberActivity,
        topPerformers
      };

    } catch (error) {
      console.error('Error getting team productivity metrics:', error);
      throw error;
    }
  }

  // Helper methods
  private getStartDate(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  private generateActivityDescription(action: string, userName: string, metadata: any): string {
    switch (action) {
      case 'content_created':
        return `${userName} created new content`;
      case 'content_edited':
        return `${userName} edited content`;
      case 'content_shared':
        return `${userName} shared content with the team`;
      case 'comment_added':
        return `${userName} added a comment`;
      case 'template_used':
        return `${userName} used a template`;
      default:
        return `${userName} performed an action`;
    }
  }
}

export const collaborationService = CollaborationService.getInstance(); 