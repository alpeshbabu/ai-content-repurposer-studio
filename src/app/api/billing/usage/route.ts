import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { billingManager } from '@/lib/billing-manager';
import { rateLimiter } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimiter.checkLimit(session.user.id, 'billing_usage');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: rateLimitResult.resetTime },
        { status: 429 }
      );
    }

    const usage = await billingManager.getCurrentUsage(session.user.id);
    
    if (!usage) {
      return NextResponse.json({ error: 'Unable to fetch usage data' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: usage
    });

  } catch (error) {
    console.error('Error fetching billing usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing usage' },
      { status: 500 }
    );
  }
} 