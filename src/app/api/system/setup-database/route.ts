import { NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/admin-auth';
import { ensureAllTablesExist } from '@/lib/db-setup';

export async function GET(req: Request) {
  try {
    // Validate admin authentication
    const { isValid, error } = await validateAdminRequest(req);
    if (!isValid) {
      return new NextResponse(error || 'Unauthorized', { status: 401 });
    }

    // Setup database tables
    const setupResult = await ensureAllTablesExist();
    
    if (setupResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Database tables set up successfully',
        tables: {
          user: setupResult.userTable,
          content: setupResult.contentTable,
          repurposedContent: setupResult.repurposedContentTable,
          dailyUsage: setupResult.dailyUsageTable,
          overageCharge: setupResult.overageChargeTable
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Some database tables could not be set up',
        tables: {
          user: setupResult.userTable,
          content: setupResult.contentTable,
          repurposedContent: setupResult.repurposedContentTable,
          dailyUsage: setupResult.dailyUsageTable,
          overageCharge: setupResult.overageChargeTable
        }
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[DATABASE_SETUP_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 