import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    // Simple database connectivity check
    const startTime = Date.now();
    
    // Test basic database connection
    await prisma.$queryRaw`SELECT 1`;
    
    const connectionTime = Date.now() - startTime;

    // Basic table existence check without admin validation
    let tablesExist = false;
    try {
      await prisma.user.findFirst();
      tablesExist = true;
    } catch (error) {
      // Tables might not exist yet
      tablesExist = false;
    }

    return NextResponse.json({
      success: true,
      status: tablesExist ? 'ready' : 'initializing',
      database: {
        connected: true,
        connectionTime,
        tablesReady: tablesExist
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[HEALTH_CHECK_ERROR]', error);
    
    return NextResponse.json({
      success: false,
      status: 'error',
      database: {
        connected: false,
        connectionTime: 0,
        tablesReady: false
      },
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 