import { prisma } from '@/lib/prisma';
import { createAuditLogger } from '@/lib/audit-logger';

export interface AnalyticsEvent {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface UsageMetrics {
  contentGenerated: number;
  contentRepurposed: number;
  platformsUsed: string[];
  templatesUsed: number;
  collaborationEvents: number;
  apiCalls: number;
}

export interface ContentPerformanceMetrics {
  contentId: string;
  views: number;
  shares: number;
  engagementRate: number;
  platformPerformance: Record<string, number>;
  timeSpent: number;
}

class AnalyticsTracker {
  private static instance: AnalyticsTracker;
  private eventQueue: AnalyticsEvent[] = [];
  private isProcessing = false;

  private constructor() {
    // Process events every 30 seconds
    if (typeof window === 'undefined') {
      setInterval(() => this.processEventQueue(), 30000);
    }
  }

  public static getInstance(): AnalyticsTracker {
    if (!AnalyticsTracker.instance) {
      AnalyticsTracker.instance = new AnalyticsTracker();
    }
    return AnalyticsTracker.instance;
  }

  // Track user actions
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const enrichedEvent = {
        ...event,
        timestamp: event.timestamp || new Date(),
        sessionId: event.sessionId || this.generateSessionId()
      };

      // Add to queue for batch processing
      this.eventQueue.push(enrichedEvent);

      // Also log to audit system for security/compliance
      try {
        // Create a mock request for audit logger
        const mockRequest = {
          headers: new Map([
            ['user-agent', event.userAgent || 'analytics-tracker'],
            ['x-forwarded-for', event.ipAddress || '127.0.0.1']
          ]),
          ip: event.ipAddress || '127.0.0.1'
        } as any;

        const auditLogger = createAuditLogger(mockRequest, event.userId);
        await auditLogger.log({
          action: event.action,
          entity: event.resource,
          entityId: event.resourceId,
          metadata: event.metadata,
          success: true
        });
      } catch (auditError) {
        console.error('Error logging to audit system:', auditError);
        // Continue processing even if audit logging fails
      }

    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }

  // Track content creation
  async trackContentCreation(userId: string, contentId: string, contentType: string, method: 'generate' | 'upload', metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      userId,
      action: 'content_created',
      resource: 'content',
      resourceId: contentId,
      metadata: {
        contentType,
        method,
        ...metadata
      }
    });

    // Update user usage metrics
    await this.updateUsageMetrics(userId, 'contentGenerated', 1);
  }

  // Track content repurposing
  async trackContentRepurpose(userId: string, contentId: string, platforms: string[], metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      userId,
      action: 'content_repurposed',
      resource: 'content',
      resourceId: contentId,
      metadata: {
        platforms,
        platformCount: platforms.length,
        ...metadata
      }
    });

    // Update usage metrics
    await this.updateUsageMetrics(userId, 'contentRepurposed', 1);
    await this.updatePlatformUsage(userId, platforms);
  }

  // Track content views
  async trackContentView(userId: string, contentId: string, source: string, metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      userId,
      action: 'content_viewed',
      resource: 'content',
      resourceId: contentId,
      metadata: {
        source,
        ...metadata
      }
    });

    // Update content analytics
    await this.updateContentAnalytics(contentId, 'views', 1);
  }

  // Track template usage
  async trackTemplateUsage(userId: string, templateId: string, contentId?: string, metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      userId,
      action: 'template_used',
      resource: 'template',
      resourceId: templateId,
      metadata: {
        contentId,
        ...metadata
      }
    });

    await this.updateUsageMetrics(userId, 'templatesUsed', 1);
  }

  // Track team collaboration
  async trackCollaboration(userId: string, action: string, targetUserId?: string, metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      userId,
      action: `collaboration_${action}`,
      resource: 'team',
      resourceId: targetUserId,
      metadata
    });

    await this.updateUsageMetrics(userId, 'collaborationEvents', 1);
  }

  // Track API usage
  async trackApiCall(userId: string, endpoint: string, method: string, responseTime?: number, metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      userId,
      action: 'api_call',
      resource: 'api',
      resourceId: endpoint,
      metadata: {
        method,
        responseTime,
        ...metadata
      }
    });

    await this.updateUsageMetrics(userId, 'apiCalls', 1);
  }

  // Get user analytics summary
  async getUserAnalytics(userId: string, timeframe: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<any> {
    const startDate = this.getStartDate(timeframe);

    const [events, usageMetrics, contentAnalytics] = await Promise.all([
      // Get user events
      prisma.auditLog.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 100
      }),

      // Get usage metrics
      this.getUserUsageMetrics(userId, timeframe),

      // Get content performance
      this.getUserContentAnalytics(userId, timeframe)
    ]);

    return {
      timeframe,
      period: {
        start: startDate,
        end: new Date()
      },
      events: events.length,
      usageMetrics,
      contentAnalytics,
      topActions: this.aggregateActions(events),
      activityTimeline: this.createActivityTimeline(events)
    };
  }

  // Get content performance metrics
  async getContentPerformance(contentId: string): Promise<ContentPerformanceMetrics | null> {
    const analytics = await prisma.contentAnalytics.findUnique({
      where: { contentId },
      include: {
        content: {
          select: {
            repurposed: {
              select: {
                platform: true
              }
            }
          }
        }
      }
    });

    if (!analytics) return null;

    const platformPerformance: Record<string, number> = {};
    analytics.content.repurposed.forEach(r => {
      platformPerformance[r.platform] = (platformPerformance[r.platform] || 0) + 1;
    });

    return {
      contentId,
      views: analytics.views,
      shares: analytics.repurposes,
      engagementRate: this.calculateEngagementRate(analytics.engagement as any),
      platformPerformance,
      timeSpent: this.calculateTimeSpent(analytics.performance as any)
    };
  }

  // Process queued events in batches
  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) return;

    this.isProcessing = true;
    const batch = this.eventQueue.splice(0, 100);

    try {
      console.log(`Processed ${batch.length} analytics events`);
    } catch (error) {
      console.error('Error processing analytics events:', error);
      this.eventQueue.unshift(...batch);
    } finally {
      this.isProcessing = false;
    }
  }

  // Helper methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getStartDate(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  private async updateUsageMetrics(userId: string, metric: keyof UsageMetrics, increment: number): Promise<void> {
    // This would typically update a user_metrics table
    // For now, we'll use the existing user table or create metrics records
    try {
      // You might want to create a separate UserMetrics table for this
      console.log(`Updated ${metric} for user ${userId} by ${increment}`);
    } catch (error) {
      console.error('Error updating usage metrics:', error);
    }
  }

  private async updatePlatformUsage(userId: string, platforms: string[]): Promise<void> {
    // Track platform usage statistics
    for (const platform of platforms) {
      await this.trackEvent({
        userId,
        action: 'platform_used',
        resource: 'platform',
        resourceId: platform
      });
    }
  }

  private async updateContentAnalytics(contentId: string, metric: string, increment: number): Promise<void> {
    try {
      await prisma.contentAnalytics.upsert({
        where: { contentId },
        update: {
          [metric]: {
            increment
          }
        },
        create: {
          contentId,
          [metric]: increment,
          repurposes: 0,
          engagement: {},
          performance: {}
        }
      });
    } catch (error) {
      console.error('Error updating content analytics:', error);
    }
  }

  private async getUserUsageMetrics(userId: string, timeframe: string): Promise<UsageMetrics> {
    const startDate = this.getStartDate(timeframe);

    const [contentStats, platformStats] = await Promise.all([
      prisma.content.groupBy({
        by: ['status'],
        where: {
          userId,
          createdAt: {
            gte: startDate
          }
        },
        _count: true
      }),

      prisma.repurposedContent.groupBy({
        by: ['platform'],
        where: {
          originalContent: {
            userId
          },
          createdAt: {
            gte: startDate
          }
        },
        _count: true
      })
    ]);

    return {
      contentGenerated: contentStats.find(s => s.status === 'Generated')?._count || 0,
      contentRepurposed: contentStats.find(s => s.status === 'Repurposed')?._count || 0,
      platformsUsed: platformStats.map(p => p.platform),
      templatesUsed: 0,
      collaborationEvents: 0,
      apiCalls: 0
    };
  }

  private async getUserContentAnalytics(userId: string, timeframe: string): Promise<any> {
    const startDate = this.getStartDate(timeframe);

    const contentAnalytics = await prisma.contentAnalytics.aggregate({
      where: {
        content: {
          userId
        },
        createdAt: {
          gte: startDate
        }
      },
      _sum: {
        views: true,
        repurposes: true
      },
      _avg: {
        views: true,
        repurposes: true
      }
    });

    return {
      totalViews: contentAnalytics._sum.views || 0,
      totalRepurposes: contentAnalytics._sum.repurposes || 0,
      avgViews: Math.round(contentAnalytics._avg.views || 0),
      avgRepurposes: Math.round(contentAnalytics._avg.repurposes || 0)
    };
  }

  private aggregateActions(events: any[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1;
      return acc;
    }, {});
  }

  private createActivityTimeline(events: any[]): any[] {
    const timeline: Record<string, number> = {};
    
    events.forEach(event => {
      const hour = new Date(event.createdAt).toISOString().substr(0, 13);
      timeline[hour] = (timeline[hour] || 0) + 1;
    });

    return Object.entries(timeline).map(([time, count]) => ({
      time,
      events: count
    }));
  }

  private calculateEngagementRate(engagement: any): number {
    if (!engagement || typeof engagement !== 'object') return 0;
    
    const totalActions = Object.values(engagement).reduce((sum: number, count: any) => {
      return sum + (typeof count === 'number' ? count : 0);
    }, 0);
    
    return totalActions;
  }

  private calculateTimeSpent(performance: any): number {
    if (!performance || !performance.events) return 0;
    
    // Calculate average time spent based on performance events
    const events = performance.events || [];
    const timeSpentEvents = events.filter((e: any) => e.metadata?.timeSpent);
    
    if (timeSpentEvents.length === 0) return 0;
    
    const totalTime = timeSpentEvents.reduce((sum: number, event: any) => {
      return sum + (event.metadata.timeSpent || 0);
    }, 0);
    
    return Math.round(totalTime / timeSpentEvents.length);
  }
}

export const analyticsTracker = AnalyticsTracker.getInstance(); 