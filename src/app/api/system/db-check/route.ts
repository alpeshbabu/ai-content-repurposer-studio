import { NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    // Validate admin authentication
    const { isValid, error } = await validateAdminRequest(req);
    if (!isValid) {
      return new NextResponse(error || 'Unauthorized', { status: 401 });
    }

    // Check database tables
    const result = await checkDatabaseTables();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[DB_CHECK_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

async function checkDatabaseTables() {
  try {
    // Check User table
    const userCount = await prisma.user.count();
    
    // Check for DailyUsage table
    let dailyUsageExists = true;
    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM "DailyUsage"`;
    } catch (error) {
      console.error('DailyUsage table error:', error);
      dailyUsageExists = false;
    }
    
    // Check for OverageCharge table
    let overageChargeExists = true;
    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM "OverageCharge"`;
    } catch (error) {
      console.error('OverageCharge table error:', error);
      overageChargeExists = false;
    }
    
    return {
      success: true,
      tables: {
        user: { exists: true, count: userCount },
        dailyUsage: { exists: dailyUsageExists },
        overageCharge: { exists: overageChargeExists }
      }
    };
  } catch (error) {
    console.error('Error checking database tables:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
} 