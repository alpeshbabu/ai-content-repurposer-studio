import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resetAllUsageCounts } from '@/lib/subscription';

// This route can be triggered by a cron job service like Vercel Cron Jobs
// to reset all users' usage counts at the beginning of each month

interface User {
  id: string;
  usageThisMonth: number;
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    // Simple API key check - in production, use a more secure approach
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentYear = currentDate.getFullYear();

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        usageThisMonth: true
      }
    });

    // Store current usage in history before resetting
    await Promise.all(
      users.map(async (user: User) => {
        // Only create history if there was actual usage
        if (user.usageThisMonth > 0) {
          await prisma.usageHistory.upsert({
            where: {
              userId_month_year: {
                userId: user.id,
                month: currentMonth,
                year: currentYear
              }
            },
            update: {
              usageCount: user.usageThisMonth
            },
            create: {
              userId: user.id,
              month: currentMonth,
              year: currentYear,
              usageCount: user.usageThisMonth
            }
          });
        }
      })
    );

    // Reset all usage counts
    await resetAllUsageCounts();

    return NextResponse.json({
      success: true,
      message: `Reset usage counts for ${users.length} users`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[RESET_USAGE_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 