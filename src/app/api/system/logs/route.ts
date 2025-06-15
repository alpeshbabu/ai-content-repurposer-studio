import { NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/admin-auth';

// Mock system logs data
const generateMockLogs = (count: number = 50) => {
  const logTypes = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
  const components = ['Database', 'Authentication', 'API', 'Cache', 'Email', 'Background Jobs'];
  const messages = [
    'Database connection established',
    'User authentication successful',
    'API request processed',
    'Cache miss for key',
    'Email sent successfully',
    'Background job completed',
    'High memory usage detected',
    'Slow query detected',
    'Rate limit exceeded',
    'Service health check passed',
    'Configuration loaded',
    'Database query executed',
    'File upload completed',
    'Session created',
    'Password reset requested'
  ];

  const logs = [];
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(Date.now() - Math.floor(Math.random() * 86400000 * 7)); // Last 7 days
    const level = logTypes[Math.floor(Math.random() * logTypes.length)];
    const component = components[Math.floor(Math.random() * components.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    logs.push({
      id: `log-${i}`,
      timestamp: timestamp.toISOString(),
      level,
      component,
      message,
      details: level === 'ERROR' ? `Error details for ${message}` : null,
      userId: Math.random() > 0.7 ? `user-${Math.floor(Math.random() * 100)}` : null
    });
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export async function GET(req: Request) {
  try {
    // Validate admin authentication
    const { isValid, error } = await validateAdminRequest(req);
    if (!isValid) {
      return new NextResponse(error || 'Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const level = searchParams.get('level');
    const component = searchParams.get('component');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');

    // Generate mock logs
    let logs = generateMockLogs(200);

    // Apply filters
    if (level) {
      logs = logs.filter(log => log.level === level.toUpperCase());
    }

    if (component) {
      logs = logs.filter(log => log.component.toLowerCase().includes(component.toLowerCase()));
    }

    if (search) {
      logs = logs.filter(log => 
        log.message.toLowerCase().includes(search.toLowerCase()) ||
        log.component.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = logs.slice(startIndex, endIndex);

    // Log statistics
    const stats = {
      total: logs.length,
      info: logs.filter(log => log.level === 'INFO').length,
      warn: logs.filter(log => log.level === 'WARN').length,
      error: logs.filter(log => log.level === 'ERROR').length,
      debug: logs.filter(log => log.level === 'DEBUG').length
    };

    return NextResponse.json({
      success: true,
      logs: paginatedLogs,
      pagination: {
        page,
        limit,
        total: logs.length,
        totalPages: Math.ceil(logs.length / limit),
        hasNext: endIndex < logs.length,
        hasPrev: page > 1
      },
      stats,
      filters: {
        level,
        component,
        search
      }
    });
  } catch (error) {
    console.error('[SYSTEM_LOGS_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    // Validate admin authentication
    const { isValid, error } = await validateAdminRequest(req);
    if (!isValid) {
      return new NextResponse(error || 'Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const olderThan = searchParams.get('olderThan'); // days
    const level = searchParams.get('level');

    // In a real application, you would implement actual log deletion logic
    // For now, we'll simulate log clearing
    await new Promise(resolve => setTimeout(resolve, 500));

    let deletedCount = Math.floor(Math.random() * 100) + 10;
    let message = `Deleted ${deletedCount} log entries`;

    if (olderThan) {
      message += ` older than ${olderThan} days`;
    }

    if (level) {
      message += ` with level ${level.toUpperCase()}`;
    }

    return NextResponse.json({
      success: true,
      message,
      deletedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[LOG_CLEAR_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 