import { NextRequest } from 'next/server';

export interface AuditLogEntry {
  id?: string;
  userId?: string;
  sessionId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

export interface AuditContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  request?: NextRequest;
}

// In-memory audit log store (in production, use database)
const auditLogs: AuditLogEntry[] = [];
const MAX_LOGS = 10000; // Prevent memory overflow

export class AuditLogger {
  private context: AuditContext;

  constructor(context: AuditContext) {
    this.context = context;
  }

  // Core logging method
  async log(entry: Omit<AuditLogEntry, 'timestamp' | 'ipAddress' | 'userAgent' | 'userId' | 'sessionId'>): Promise<void> {
    const logEntry: AuditLogEntry = {
      ...entry,
      userId: this.context.userId,
      sessionId: this.context.sessionId,
      ipAddress: this.context.ipAddress || this.extractIpAddress(),
      userAgent: this.context.userAgent || this.extractUserAgent(),
      timestamp: new Date()
    };

    // Add to in-memory store
    auditLogs.push(logEntry);

    // Maintain max logs limit
    if (auditLogs.length > MAX_LOGS) {
      auditLogs.splice(0, auditLogs.length - MAX_LOGS);
    }

    // In production, save to database
    // await this.saveToDatabase(logEntry);

    // Log to console for development
    console.log('[AUDIT_LOG]', {
      action: logEntry.action,
      userId: logEntry.userId,
      entity: logEntry.entity,
      entityId: logEntry.entityId,
      success: logEntry.success,
      timestamp: logEntry.timestamp.toISOString()
    });
  }

  // Authentication events
  async logAuth(action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'REGISTER', metadata?: Record<string, any>): Promise<void> {
    await this.log({
      action,
      entity: 'USER',
      metadata,
      success: action !== 'LOGIN_FAILED'
    });
  }

  // Content operations
  async logContentAction(
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'REPURPOSE',
    contentId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    success: boolean = true,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action: `CONTENT_${action}`,
      entity: 'CONTENT',
      entityId: contentId,
      oldValues,
      newValues,
      metadata,
      success
    });
  }

  // Subscription operations
  async logSubscriptionAction(
    action: 'UPGRADE' | 'DOWNGRADE' | 'CANCEL' | 'RENEW' | 'PAYMENT_FAILED',
    subscriptionId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action: `SUBSCRIPTION_${action}`,
      entity: 'SUBSCRIPTION',
      entityId: subscriptionId,
      oldValues,
      newValues,
      metadata,
      success: action !== 'PAYMENT_FAILED'
    });
  }

  // Team operations
  async logTeamAction(
    action: 'INVITE' | 'JOIN' | 'LEAVE' | 'REMOVE' | 'ROLE_CHANGE',
    teamId: string,
    targetUserId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action: `TEAM_${action}`,
      entity: 'TEAM',
      entityId: teamId,
      oldValues,
      newValues,
      metadata: { ...metadata, targetUserId },
      success: true
    });
  }

  // Admin operations
  async logAdminAction(
    action: string,
    entity?: string,
    entityId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action: `ADMIN_${action}`,
      entity,
      entityId,
      oldValues,
      newValues,
      metadata,
      success: true
    });
  }

  // Security events
  async logSecurityEvent(
    event: 'RATE_LIMIT_EXCEEDED' | 'UNAUTHORIZED_ACCESS' | 'SUSPICIOUS_ACTIVITY' | 'PASSWORD_CHANGE' | 'EMAIL_CHANGE',
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action: `SECURITY_${event}`,
      entity: 'SECURITY',
      metadata,
      success: false
    });
  }

  // Bulk operations
  async logBulkAction(
    action: 'BULK_DELETE' | 'BULK_UPDATE' | 'BULK_REPURPOSE',
    entityIds: string[],
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action,
      entity: 'CONTENT',
      metadata: { ...metadata, entityIds, count: entityIds.length },
      success: true
    });
  }

  // Error logging
  async logError(
    action: string,
    error: Error | string,
    entity?: string,
    entityId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    await this.log({
      action: `ERROR_${action}`,
      entity,
      entityId,
      metadata,
      success: false,
      errorMessage
    });
  }

  // API usage logging
  async logApiUsage(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action: 'API_REQUEST',
      entity: 'API',
      metadata: {
        endpoint,
        method,
        statusCode,
        responseTime,
        ...metadata
      },
      success: statusCode < 400
    });
  }

  // Helper methods
  private extractIpAddress(): string {
    if (!this.context.request) return 'unknown';
    
    const forwarded = this.context.request.headers.get('x-forwarded-for');
    return forwarded ? forwarded.split(',')[0].trim() : 
           this.context.request.headers.get('x-real-ip') || 
           'unknown';
  }

  private extractUserAgent(): string {
    if (!this.context.request) return 'unknown';
    return this.context.request.headers.get('user-agent') || 'unknown';
  }

  // Future: Save to database
  private async saveToDatabase(entry: AuditLogEntry): Promise<void> {
    // TODO: Implement database storage
    // await prisma.auditLog.create({ data: entry });
  }
}

// Factory function to create audit logger from request
export function createAuditLogger(req: NextRequest, userId?: string, sessionId?: string): AuditLogger {
  return new AuditLogger({
    userId,
    sessionId,
    request: req
  });
}

// Utility functions for querying audit logs
export function getAuditLogs(filters?: {
  userId?: string;
  action?: string;
  entity?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): AuditLogEntry[] {
  let filtered = [...auditLogs];

  if (filters) {
    if (filters.userId) {
      filtered = filtered.filter(log => log.userId === filters.userId);
    }
    if (filters.action) {
      filtered = filtered.filter(log => log.action.includes(filters.action!));
    }
    if (filters.entity) {
      filtered = filtered.filter(log => log.entity === filters.entity);
    }
    if (filters.startDate) {
      filtered = filtered.filter(log => log.timestamp >= filters.startDate!);
    }
    if (filters.endDate) {
      filtered = filtered.filter(log => log.timestamp <= filters.endDate!);
    }
  }

  // Sort by timestamp descending
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Apply limit
  if (filters?.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}

// Get audit statistics
export function getAuditStats(): {
  totalLogs: number;
  uniqueUsers: number;
  recentActions: { action: string; count: number }[];
  errorRate: number;
} {
  const uniqueUsers = new Set(auditLogs.map(log => log.userId).filter(Boolean)).size;
  const actionCounts = new Map<string, number>();
  let errors = 0;

  // Count actions and errors from last 24 hours
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentLogs = auditLogs.filter(log => log.timestamp >= dayAgo);

  recentLogs.forEach(log => {
    actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
    if (!log.success) errors++;
  });

  const recentActions = Array.from(actionCounts.entries())
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalLogs: auditLogs.length,
    uniqueUsers,
    recentActions,
    errorRate: recentLogs.length > 0 ? (errors / recentLogs.length) * 100 : 0
  };
}

// Clear old logs (for maintenance)
export function clearOldLogs(daysOld: number = 30): number {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  const initialLength = auditLogs.length;
  
  // Remove logs older than cutoff
  const filtered = auditLogs.filter(log => log.timestamp >= cutoffDate);
  auditLogs.length = 0;
  auditLogs.push(...filtered);
  
  return initialLength - auditLogs.length;
}

// Export default audit actions for easy access
export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  REGISTER: 'REGISTER',
  
  // Content
  CONTENT_CREATE: 'CONTENT_CREATE',
  CONTENT_UPDATE: 'CONTENT_UPDATE',
  CONTENT_DELETE: 'CONTENT_DELETE',
  CONTENT_VIEW: 'CONTENT_VIEW',
  CONTENT_REPURPOSE: 'CONTENT_REPURPOSE',
  
  // Subscriptions
  SUBSCRIPTION_UPGRADE: 'SUBSCRIPTION_UPGRADE',
  SUBSCRIPTION_DOWNGRADE: 'SUBSCRIPTION_DOWNGRADE',
  SUBSCRIPTION_CANCEL: 'SUBSCRIPTION_CANCEL',
  
  // Security
  SECURITY_RATE_LIMIT_EXCEEDED: 'SECURITY_RATE_LIMIT_EXCEEDED',
  SECURITY_UNAUTHORIZED_ACCESS: 'SECURITY_UNAUTHORIZED_ACCESS',
  
  // Bulk Operations
  BULK_DELETE: 'BULK_DELETE',
  BULK_UPDATE: 'BULK_UPDATE',
  BULK_REPURPOSE: 'BULK_REPURPOSE'
} as const; 